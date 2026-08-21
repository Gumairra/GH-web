const pool = require("../config/db");
const { resolveRange } = require("../utils/dateRange");
const {
    kirimPerintahAktuator,
    daftarAktuator,
} = require("../mqtt/actuatorPublisher");

const NAME_LABEL = {
    pompa_air: "Pompa Air",
    lampu_led: "Lampu LED",
    exhaust_fan: "Exhaust Fan",
};

function formatDuration(totalSeconds) {
    const s = Number(totalSeconds) || 0;
    if (s >= 3600) return `${(s / 3600).toFixed(1)} jam`;
    if (s >= 60) return `${Math.round(s / 60)} min`;
    return `${s} detik`;
}

// GET /api/actuators/usage?range=today|week|month
// Dipakai oleh: bagian "Pemakaian Aktuator" di Statistics.jsx
async function getUsage(req, res) {
    try {
        const { interval } = resolveRange(req.query.range);

        const { rows } = await pool.query(
            `SELECT
                actuator_name,
                COUNT(*) FILTER (WHERE status = 'ON') AS on_count,
                COALESCE(SUM(duration_seconds), 0) AS total_seconds
             FROM actuator_log
             WHERE started_at >= NOW() - $1::interval
             GROUP BY actuator_name`,
            [interval]
        );

        const byName = Object.fromEntries(rows.map((r) => [r.actuator_name, r]));
        const maxSeconds = Math.max(1, ...rows.map((r) => Number(r.total_seconds)));

        const usage = Object.keys(NAME_LABEL).map((key) => {
            const r = byName[key];
            const totalSeconds = r ? Number(r.total_seconds) : 0;
            return {
                name: NAME_LABEL[key],
                key,
                time: formatDuration(totalSeconds),
                count: `${r ? r.on_count : 0} kali`,
                percent: Math.round((totalSeconds / maxSeconds) * 100),
            };
        });

        res.json({ data: usage });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Gagal mengambil data pemakaian aktuator" });
    }
}

// POST /api/actuators/log
// Dipakai oleh: sistem kontrol aktuator (mis. ESP32 relay) tiap kali status ON/OFF berubah
async function logEvent(req, res) {
    try {
        const { actuator_name, status, duration_seconds } = req.body;

        if (!Object.keys(NAME_LABEL).includes(actuator_name)) {
            return res.status(400).json({ message: "actuator_name tidak dikenal" });
        }
        if (!["ON", "OFF"].includes(status)) {
            return res.status(400).json({ message: "status harus ON atau OFF" });
        }

        const { rows } = await pool.query(
            `INSERT INTO actuator_log (actuator_name, status, duration_seconds, ended_at)
             VALUES ($1, $2, $3, CASE WHEN $2 = 'OFF' THEN CURRENT_TIMESTAMP ELSE NULL END)
             RETURNING id, started_at`,
            [actuator_name, status, duration_seconds ?? null]
        );

        res.status(201).json({ data: rows[0], message: "Log aktuator tersimpan" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Gagal menyimpan log aktuator" });
    }
}

// POST /api/actuators/:nama/set  body: { nyala: true|false }
// Mengirim perintah langsung ke ESP32 lewat MQTT.
// nama: "kipas" | "lampu" | "pompaAir" | "pompaNutrisi"
// (nama topic MQTT asli di ESP_penerima.ino, beda dengan
// nama di actuator_log yang dipakai untuk statistik pemakaian)
async function setActuator(req, res) {
    const { nama } = req.params;
    const { nyala } = req.body;

    if (!daftarAktuator.includes(nama)) {
        return res.status(400).json({
            message: `Aktuator tidak dikenal. Pilihan: ${daftarAktuator.join(", ")}`,
        });
    }

    try {
        const hasil = await kirimPerintahAktuator(nama, Boolean(nyala));
        res.json({ message: "Perintah terkirim ke ESP32", ...hasil });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Gagal mengirim perintah ke MQTT" });
    }
}

module.exports = { getUsage, logEvent, setActuator };
