const pool = require("../config/db");

// GET /api/esp - daftar semua ESP
async function getEsps(req, res) {
    try {
        const { rows } = await pool.query(
            `SELECT id, esp_name, location, last_seen, is_online
             FROM esp_devices ORDER BY esp_name`
        );
        res.json({ data: rows });
    } catch (err) {
        res.status(500).json({ message: "Gagal mengambil daftar ESP" });
    }
}

// POST /api/esp - tambah atau update ESP
async function upsertEsp(req, res) {
    const { esp_name, location } = req.body;
    if (!esp_name) {
        return res.status(400).json({ message: "esp_name wajib diisi" });
    }
    try {
        const { rows } = await pool.query(
            `INSERT INTO esp_devices (esp_name, location, last_seen, is_online)
             VALUES ($1, $2, NOW(), TRUE)
             ON CONFLICT (esp_name) 
             DO UPDATE SET last_seen = NOW(), is_online = TRUE
             RETURNING *`,
            [esp_name, location || ""]
        );
        res.status(201).json({ data: rows[0] });
    } catch (err) {
        res.status(500).json({ message: "Gagal mendaftarkan ESP" });
    }
}

// GET /api/sensors/average-suhu?esp=ESP_01,ESP_02 ...
// Rata-rata suhu udara dari ESP terpilih (default: semua ESP online terbaru)
async function getAverageSuhu(req, res) {
    try {
        const espParam = req.query.esp;
        let espList = null;

        if (espParam) {
            espList = espParam.split(",").map((s) => s.trim()).filter(Boolean);
        }

        let query = `
            SELECT COALESCE(AVG(suhu_udara), 0) AS avg_suhu
            FROM monitoring_sensor
            WHERE suhu_udara IS NOT NULL
        `;

        const params = [];
        if (espList && espList.length > 0) {
            query += ` AND esp_name = ANY($1::text[])`;
            params.push(espList);
        } else {
            // Hanya gunakan data terbaru per ESP (maks 1 baris tiap ESP dalam jendela waktu)
            query += ` AND created_at >= NOW() - INTERVAL '2 hours'
                       AND id IN (
                           SELECT MAX(id)
                           FROM monitoring_sensor
                           WHERE suhu_udara IS NOT NULL
                           GROUP BY esp_name
                       )`;
        }

        const { rows } = await pool.query(query, params);
        const avg = Number(rows[0]?.avg_suhu || 0);
        res.json({
            data: {
                average_suhu: avg > 0 ? Math.round(avg * 10) / 10 : null,
                source: espList || "all online",
            },
        });
    } catch (err) {
        res.status(500).json({ message: "Gagal mengambil rata-rata suhu" });
    }
}

module.exports = { getEsps, upsertEsp, getAverageSuhu };