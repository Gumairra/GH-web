const pool = require("../config/db");
const ExcelJS = require("exceljs");
const { resolveRange } = require("../utils/dateRange");
const { statusFor, progressFor } = require("../utils/sensorThresholds");

// GET /api/sensors/latest?esp=ESP_01
// Dipakai oleh: SensorSection.jsx (5 SensorCard) + WaterLevel.jsx di Dashboard
async function getLatest(req, res) {
    try {
        const esp = req.query.esp || null;
        let rows;
        if (esp) {
            const { rows: r } = await pool.query(
                `SELECT id, esp_name, ph_air, suhu_udara, suhu_air, humidity, tds, ppm,
                        water_level_percent, water_level_height, created_at
                 FROM monitoring_sensor
                 WHERE esp_name = $1
                 ORDER BY created_at DESC
                 LIMIT 1`,
                [esp]
            );
            rows = r;
        } else {
            const { rows: r } = await pool.query(
                `SELECT id, esp_name, ph_air, suhu_udara, suhu_air, humidity, tds, ppm,
                        water_level_percent, water_level_height, created_at
                 FROM monitoring_sensor
                 ORDER BY created_at DESC
                 LIMIT 1`
            );
            rows = r;
        }

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
            esp_name: row.esp_name || null,
        }));

        res.json({
            data: {
                sensors,
                waterLevel: {
                    percent: row.water_level_percent === null ? null : Number(row.water_level_percent),
                    height: row.water_level_height === null ? null : Number(row.water_level_height),
                    status: row.water_level_percent >= 40 ? "Cukup" : "Rendah",
                },
                esp_name: row.esp_name || null,
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
            esp_name,
        } = req.body;

        if (
            [ph_air, suhu_udara, humidity].every((v) => v === undefined || v === null)
        ) {
            return res.status(400).json({ message: "Payload sensor kosong atau tidak valid" });
        }

        const { rows } = await pool.query(
            `INSERT INTO monitoring_sensor
                (esp_name, ph_air, suhu_udara, suhu_air, humidity, tds, ppm, water_level_percent, water_level_height)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
             RETURNING id, created_at`,
            [
                esp_name ?? null,
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

        // Upsert status ESP jika esp_name tersedia
        if (esp_name) {
            try {
                await pool.query(
                    `INSERT INTO esp_devices (esp_name, last_seen, is_online)
                     VALUES ($1, NOW(), TRUE)
                     ON CONFLICT (esp_name) 
                     DO UPDATE SET last_seen = NOW(), is_online = TRUE`,
                    [esp_name]
                );
            } catch (e) {
                console.error("Gagal update esp_devices:", e.message);
            }
        }

        res.status(201).json({ data: rows[0], message: "Data sensor tersimpan" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Gagal menyimpan data sensor" });
    }
}

// GET /api/sensors/export?range=today|week|month
// Mengunduh seluruh data sensor + ringkasan pemakaian aktuator
// pada rentang terpilih sebagai file Excel (.xlsx), 2 sheet:
//   1. "Data Sensor"     -> semua baris mentah monitoring_sensor
//   2. "Pemakaian Aktuator" -> agregat actuator_log (jumlah nyala + durasi)
async function exportReading(req, res) {
    try {
        const { interval } = resolveRange(req.query.range);

        // ---- Sheet 1: data sensor mentah ----
        const { rows } = await pool.query(
            `SELECT esp_name, created_at, ph_air, suhu_udara, suhu_air, humidity,
                    tds, ppm, water_level_percent, water_level_height
             FROM monitoring_sensor
             WHERE created_at >= NOW() - $1::interval
             ORDER BY created_at ASC`,
            [interval]
        );

        // ---- Sheet 2: agregat pemakaian aktuator ----
        const { rows: actuatorRows } = await pool.query(
            `SELECT
                actuator_name,
                COUNT(*) FILTER (WHERE status = 'ON') AS on_count,
                COALESCE(SUM(duration_seconds), 0) AS total_seconds
             FROM actuator_log
             WHERE started_at >= NOW() - $1::interval
             GROUP BY actuator_name
             ORDER BY actuator_name ASC`,
            [interval]
        );

        const workbook = new ExcelJS.Workbook();
        workbook.creator = "I-WILL Greenhouse API";
        workbook.created = new Date();

        const sheetSensor = workbook.addWorksheet("Data Sensor");
        sheetSensor.columns = [
            { header: "ESP", key: "esp_name", width: 12 },
            { header: "Waktu", key: "created_at", width: 22 },
            { header: "pH Air", key: "ph_air", width: 10 },
            { header: "Suhu Udara (°C)", key: "suhu_udara", width: 16 },
            { header: "Suhu Air (°C)", key: "suhu_air", width: 15 },
            { header: "Kelembapan (%RH)", key: "humidity", width: 17 },
            { header: "TDS (ppm)", key: "tds", width: 12 },
            { header: "PPM Air (ppm)", key: "ppm", width: 14 },
            { header: "Ketinggian Air (%)", key: "water_level_percent", width: 19 },
            { header: "Tinggi Air (cm)", key: "water_level_height", width: 16 },
        ];

        for (const row of rows) {
            sheetSensor.addRow({
                esp_name: row.esp_name || "",
                created_at: row.created_at
                    ? new Date(row.created_at).toLocaleString("id-ID", { hour12: false })
                    : "",
                ph_air: row.ph_air,
                suhu_udara: row.suhu_udara,
                suhu_air: row.suhu_air,
                humidity: row.humidity,
                tds: row.tds,
                ppm: row.ppm,
                water_level_percent: row.water_level_percent,
                water_level_height: row.water_level_height,
            });
        }

        // Header tebal + abu-abu muda supaya mudah dibaca
        sheetSensor.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFEEF5EF" },
            };
        });
        sheetSensor.views = [{ state: "frozen", ySplit: 1 }];

        const sheetAktuator = workbook.addWorksheet("Pemakaian Aktuator");
        sheetAktuator.columns = [
            { header: "Aktuator", key: "actuator_name", width: 20 },
            { header: "Jumlah Nyala", key: "on_count", width: 15 },
            { header: "Total Durasi (detik)", key: "total_seconds", width: 21 },
        ];

        const NAMA = { pompa_air: "Pompa Air", lampu_led: "Lampu LED", exhaust_fan: "Exhaust Fan" };
        for (const row of actuatorRows) {
            sheetAktuator.addRow({
                actuator_name: NAMA[row.actuator_name] || row.actuator_name,
                on_count: Number(row.on_count),
                total_seconds: Number(row.total_seconds),
            });
        }
        if (actuatorRows.length === 0) {
            sheetAktuator.addRow({ actuator_name: "-", on_count: 0, total_seconds: 0 });
        }

        sheetAktuator.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFEEF5EF" },
            };
        });
        sheetAktuator.views = [{ state: "frozen", ySplit: 1 }];

        const buffer = await workbook.xlsx.writeBuffer();
        const tanggal = new Date().toISOString().slice(0, 10);

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="data-greenhouse-${req.query.range || "today"}-${tanggal}.xlsx"`
        );
        res.send(Buffer.from(buffer));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Gagal membuat file Excel" });
    }
}

module.exports = { getLatest, getHistory, createReading, exportReading };
