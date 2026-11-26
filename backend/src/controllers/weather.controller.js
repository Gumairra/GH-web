/**
 * Controller untuk mengambil data prakiraan cuaca dari BMKG
 * dan menyimpannya di in-memory cache untuk menghemat request.
 */

const DEFAULT_ADM4 = process.env.BMKG_KODE_WILAYAH || "32.73.14.1002"; // Cikutra, Cibeunying Kidul, Bandung
const CACHE_TTL_MS = Number(process.env.BMKG_CACHE_TTL_MS) || 60 * 60 * 1000; // 1 jam

let weatherCache = {
    data: null,
    fetchedAt: 0,
};

/**
 * Mencari item prakiraan cuaca yang paling dekat dengan waktu saat ini
 */
function findClosestForecast(cuacaArrays) {
    if (!Array.isArray(cuacaArrays) || !cuacaArrays.length) return null;

    const allForecasts = cuacaArrays.flat();
    if (!allForecasts.length) return null;

    const now = Date.now();
    let closest = allForecasts[0];
    let minDiff = Math.abs(new Date(closest.datetime).getTime() - now);

    for (let i = 1; i < allForecasts.length; i++) {
        const item = allForecasts[i];
        const diff = Math.abs(new Date(item.datetime).getTime() - now);
        if (diff < minDiff) {
            minDiff = diff;
            closest = item;
        }
    }

    return closest;
}

/**
 * GET /api/weather
 * Mengambil data prakiraan cuaca lokasi greenhouse
 */
async function getWeather(req, res) {
    const adm4 = req.query.adm4 || DEFAULT_ADM4;
    const now = Date.now();

    // Gunakan cache jika masih valid
    if (weatherCache.data && now - weatherCache.fetchedAt < CACHE_TTL_MS) {
        const closest = findClosestForecast(weatherCache.rawCuaca);
        return res.json({
            status: "success",
            cached: true,
            fetchedAt: new Date(weatherCache.fetchedAt).toISOString(),
            data: {
                lokasi: weatherCache.lokasi,
                cuaca: closest
                    ? {
                          datetime: closest.datetime,
                          local_datetime: closest.local_datetime,
                          suhu: closest.t,
                          kelembapan: closest.hu,
                          cuaca_desc: closest.weather_desc,
                          cuaca_desc_en: closest.weather_desc_en,
                          icon: closest.image,
                          kecepatan_angin: closest.ws,
                          arah_angin: closest.wd,
                      }
                    : null,
            },
        });
    }

    try {
        const url = `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${encodeURIComponent(adm4)}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Gagal mengambil data dari BMKG (${response.status})`);
        }

        const json = await response.json();
        const firstData = json?.data?.[0];

        if (!firstData || !firstData.lokasi) {
            throw new Error("Format respons BMKG tidak sesuai");
        }

        const lokasiObj = firstData.lokasi;
        const lokasiFormatted = {
            desa: lokasiObj.desa || "",
            kecamatan: lokasiObj.kecamatan || "",
            kotkab: lokasiObj.kotkab || "",
            provinsi: lokasiObj.provinsi || "",
            display: [lokasiObj.desa, lokasiObj.kecamatan, lokasiObj.kotkab]
                .filter(Boolean)
                .join(", "),
        };

        weatherCache = {
            data: json,
            rawCuaca: firstData.cuaca || [],
            lokasi: lokasiFormatted,
            fetchedAt: now,
        };

        const closest = findClosestForecast(firstData.cuaca);

        return res.json({
            status: "success",
            cached: false,
            fetchedAt: new Date(now).toISOString(),
            data: {
                lokasi: lokasiFormatted,
                cuaca: closest
                    ? {
                          datetime: closest.datetime,
                          local_datetime: closest.local_datetime,
                          suhu: closest.t,
                          kelembapan: closest.hu,
                          cuaca_desc: closest.weather_desc,
                          cuaca_desc_en: closest.weather_desc_en,
                          icon: closest.image,
                          kecepatan_angin: closest.ws,
                          arah_angin: closest.wd,
                      }
                    : null,
            },
        });
    } catch (err) {
        // Jika API error tapi kita punya data lama di cache, berikan cache lama sebagai fallback
        if (weatherCache.data) {
            const closest = findClosestForecast(weatherCache.rawCuaca);
            return res.json({
                status: "success",
                cached: true,
                stale: true,
                fetchedAt: new Date(weatherCache.fetchedAt).toISOString(),
                warning: "Gagal memperbarui data baru BMKG, menggunakan data tersimpan.",
                data: {
                    lokasi: weatherCache.lokasi,
                    cuaca: closest
                        ? {
                              datetime: closest.datetime,
                              local_datetime: closest.local_datetime,
                              suhu: closest.t,
                              kelembapan: closest.hu,
                              cuaca_desc: closest.weather_desc,
                              cuaca_desc_en: closest.weather_desc_en,
                              icon: closest.image,
                              kecepatan_angin: closest.ws,
                              arah_angin: closest.wd,
                          }
                        : null,
                },
            });
        }

        return res.status(502).json({
            status: "error",
            message: `Gagal memuat data cuaca dari BMKG: ${err.message}`,
        });
    }
}

module.exports = {
    getWeather,
};
