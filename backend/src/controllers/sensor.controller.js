const pool = require("../config/db");
const { resolveRange } = require("../utils/dateRange");
const { statusFor, progressFor } = require("../utils/sensorThresholds");

// GET /api/sensors/latest
// Dipakai oleh: SensorSection.jsx (5 SensorCard) + WaterLevel.jsx di Dashboard
async function getLatest(req, res) {
    try {
        const { rows } = await pool.query(
            `SELECT id, ph_air, suhu_udara, suhu_air, humidity, tds, ppm,
                    water_level_percent, water_level_height, created_at
             FROM monitoring_sensor
             ORDER BY created_at DESC
             LIMIT 1`
        );

        if (rows.length === 0) {
            return res.status(200).json({ data: null, message: "Belum ada data sensor" });
        }

        const row = rows[0];

        const sensors = [
            { key: "suhu_udara", title: "Suhu Udara", sensor: "DHT22", unit: "°C" },
            { key: "humidity", title: "Kelembapan", sensor: "DHT22", unit: "%RH" },
            { key: "ph_air", title: "pH Air", sensor: "ph", unit: "pH" },
            { key: "ppm", title: "PPM Air", sensor: "turbidity", unit: "ppm" },
            { key: "tds", title: "TDS Air", sensor: "tds", unit: "ppm" },
        ].map((s) => ({
            title: s.title,
            sensors: s.sensor,
            value: row[s.key] === null ? null : Number(row[s.key]),
            unit: s.unit,
            status: statusFor(s.key, row[s.key]),
            progress: progressFor(s.key, row[s.key]),
        }));

        res.json({
            data: {
                sensors,
                waterLevel: {
                    percent: row.water_level_percent === null ? null : Number(row.water_level_percent),
                    height: row.water_level_height === null ? null : Number(row.water_level_height),
                    status: row.water_level_percent >= 40 ? "Cukup" : "Rendah",
                },
                updatedAt: row.created_at,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Gagal mengambil data sensor terbaru" });
    }
}

// GET /api/sensors/history?range=today|week|month
// Dipakai oleh: LineChart.jsx di Statistics.jsx (4 grafik) + 6 kartu ringkasan
async function getHistory(req, res) {
    try {
        const { interval, bucket, labelFormat } = resolveRange(req.query.range);

        const { rows } = await pool.query(
            `SELECT
                to_char(date_trunc($1, created_at), $2) AS label,
                date_trunc($1, created_at) AS bucket_time,
                AVG(suhu_udara)::numeric(5,2) AS suhu_udara,
                AVG(suhu_air)::numeric(5,2) AS suhu_air,
                AVG(humidity)::numeric(5,2) AS humidity,
                AVG(ph_air)::numeric(4,3) AS ph_air,
                AVG(tds)::numeric(6,2) AS tds,
                AVG(ppm)::numeric(6,2) AS ppm,
                AVG(water_level_percent)::numeric(5,2) AS water_level_percent
             FROM monitoring_sensor
             WHERE created_at >= NOW() - $3::interval
             GROUP BY date_trunc($1, created_at)
             ORDER BY bucket_time ASC`,
            [bucket, labelFormat, interval]
        );

        const toSeries = (col) => rows.map((r) => (r[col] === null ? null : Number(r[col])));

        // Kartu ringkasan pakai nilai dari titik data paling akhir
        const last = rows[rows.length - 1] || {};

        res.json({
            data: {
                labels: rows.map((r) => r.label),
                suhu_udara: toSeries("suhu_udara"),
                suhu_air: toSeries("suhu_air"),
                humidity: toSeries("humidity"),
                ph_air: toSeries("ph_air"),
                tds: toSeries("tds"),
                ppm: toSeries("ppm"),
                water_level_percent: toSeries("water_level_percent"),
                summary: {
                    suhu_udara: last.suhu_udara ?? null,
                    humidity: last.humidity ?? null,
                    ph_air: last.ph_air ?? null,
                    suhu_air: last.suhu_air ?? null,
                    tds: last.tds ?? null,
                    water_level_percent: last.water_level_percent ?? null,
                },
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Gagal mengambil riwayat data sensor" });
    }
}

// POST /api/sensors
// Dipakai oleh: perangkat IoT (ESP32/NodeMCU) untuk mengirim pembacaan baru
async function createReading(req, res) {
    try {
        const {
            ph_air,
            suhu_udara,
            suhu_air,
            humidity,
            tds,
            ppm,
            water_level_percent,
            water_level_height,
        } = req.body;

        if (
            [ph_air, suhu_udara, humidity].every((v) => v === undefined || v === null)
        ) {
            return res.status(400).json({ message: "Payload sensor kosong atau tidak valid" });
        }

        const { rows } = await pool.query(
            `INSERT INTO monitoring_sensor
                (ph_air, suhu_udara, suhu_air, humidity, tds, ppm, water_level_percent, water_level_height)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
             RETURNING id, created_at`,
            [
                ph_air ?? null,
                suhu_udara ?? null,
                suhu_air ?? null,
                humidity ?? null,
                tds ?? null,
                ppm ?? null,
                water_level_percent ?? null,
                water_level_height ?? null,
            ]
        );

        res.status(201).json({ data: rows[0], message: "Data sensor tersimpan" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Gagal menyimpan data sensor" });
    }
}

module.exports = { getLatest, getHistory, createReading };
