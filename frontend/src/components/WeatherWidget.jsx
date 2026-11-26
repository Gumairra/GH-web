import { useEffect, useState } from "react";
import { getWeather } from "../services/api";
import "./WeatherWidget.css";

export default function WeatherWidget({ insideTemp }) {
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        getWeather()
            .then((res) => {
                if (isMounted) {
                    setWeatherData(res.data || null);
                    setError(null);
                }
            })
            .catch((err) => {
                if (isMounted) {
                    setError(err.message);
                }
            })
            .finally(() => {
                if (isMounted) {
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    if (loading) {
        return (
            <div className="weather-card card-surface p-4 sm:p-5 mb-6">
                <div className="flex items-center gap-4">
                    <div className="skeleton w-12 h-12 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="skeleton h-4 w-40" />
                        <div className="skeleton h-3 w-28" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !weatherData || !weatherData.cuaca) {
        return (
            <div className="weather-card card-surface p-4 sm:p-5 mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className="kpi-icon bg-warning-soft text-warning">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="9" />
                            <path d="M12 8v4" />
                            <path d="M12 16h.01" />
                        </svg>
                    </span>
                    <div>
                        <p className="text-xs font-semibold text-ink">Cuaca Luar Ruangan ({weatherData?.lokasi?.display || "Cikutra, Bandung"})</p>
                        <p className="text-xs text-mute">Gagal memuat data cuaca BMKG: {error || "Data kosong"}</p>
                    </div>
                </div>
                <span className="chip chip--neutral">Offline</span>
            </div>
        );
    }

    const { lokasi, cuaca } = weatherData;
    const outdoorTemp = cuaca.suhu;
    const tempDiff = insideTemp !== null && insideTemp !== undefined ? Number(insideTemp - outdoorTemp).toFixed(1) : null;

    return (
        <article className="weather-card card-surface p-4 sm:p-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Bagian Kiri: Lokasi & Deskripsi Cuaca */}
                <div className="flex items-start sm:items-center gap-3.5">
                    {cuaca.icon ? (
                        <img src={cuaca.icon} alt={cuaca.cuaca_desc} className="weather-icon flex-shrink-0" width="48" height="48" />
                    ) : (
                        <span className="kpi-icon flex-shrink-0">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z" />
                            </svg>
                        </span>
                    )}

                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-xs font-semibold uppercase tracking-wider text-mute">Cuaca Luar Ruangan</h2>
                            <span className="chip chip--success">{lokasi.display || "Cikutra, Bandung"}</span>
                        </div>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-xl sm:text-2xl font-bold num-tick text-ink font-display">
                                {outdoorTemp}°C
                            </span>
                            <span className="text-sm font-medium text-ink">{cuaca.cuaca_desc}</span>
                        </div>
                    </div>
                </div>

                {/* Bagian Kanan: Detail & Perbandingan */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-line text-xs">
                    <div className="bg-leaf-light px-3 py-2 rounded-xl">
                        <p className="text-mute font-medium">Kelembapan Luar</p>
                        <p className="font-bold text-leaf-dark num-tick text-sm">{cuaca.kelembapan}%</p>
                    </div>

                    <div className="bg-leaf-light px-3 py-2 rounded-xl">
                        <p className="text-mute font-medium">Angin</p>
                        <p className="font-bold text-leaf-dark num-tick text-sm">{cuaca.kecepatan_angin} m/s ({cuaca.arah_angin})</p>
                    </div>

                    {insideTemp !== null && insideTemp !== undefined && (
                        <div className="bg-[#f6f4ee] border border-line px-3 py-2 rounded-xl">
                            <p className="text-mute font-medium">Suhu vs Greenhouse</p>
                            <p className="font-bold text-ink num-tick text-sm">
                                Dalam {Number(insideTemp).toFixed(1)}°C{" "}
                                <span className={`font-semibold ${tempDiff >= 0 ? "text-leaf" : "text-danger"}`}>
                                    ({tempDiff >= 0 ? `+${tempDiff}°C` : `${tempDiff}°C`})
                                </span>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}
