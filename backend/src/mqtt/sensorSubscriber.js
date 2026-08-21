const mqttClient = require("../config/mqttClient");
const pool = require("../config/db");

const TOPIC_SENSOR = process.env.MQTT_TOPIC_SENSOR || "greenhouse/sensors";

// Cache di memori supaya GET /api/sensors/latest bisa cepat
// merespons tanpa menunggu round-trip ke DB (dipakai sebagai
// fallback opsional oleh controller kalau dibutuhkan nanti).
let dataSensorTerakhir = null;

function getDataSensorTerakhir() {
    return dataSensorTerakhir;
}

function initSensorSubscriber() {
    mqttClient.on("connect", () => {
        // QoS 1 supaya broker WAJIB memberi konfirmasi izin subscribe.
        // Kalau kredensial tidak diizinkan akses topic ini, granted[0].qos
        // akan bernilai 128 (bukan error biasa) — makanya kita cek manual.
        mqttClient.subscribe(TOPIC_SENSOR, { qos: 1 }, (err, granted) => {
            if (err) {
                console.error(
                    `[MQTT] Gagal subscribe topic ${TOPIC_SENSOR}:`,
                    err.message
                );
                return;
            }

            const ditolak = granted?.some((g) => g.qos === 128);
            if (ditolak) {
                console.error(
                    `[MQTT] ⚠️ Subscribe ke "${TOPIC_SENSOR}" DITOLAK broker (izin/ACL kredensial MQTT tidak mengizinkan). Cek Access Management di HiveMQ Cloud.`
                );
            } else {
                console.log(
                    `[MQTT] Subscribe topic: ${TOPIC_SENSOR} (granted:`,
                    granted,
                    ")"
                );
            }
        });
    });

    mqttClient.on("message", async (topic, messageBuffer) => {
        if (topic !== TOPIC_SENSOR) return;

        const messageString = messageBuffer.toString();

        let payload;
        try {
            payload = JSON.parse(messageString);
        } catch (err) {
            console.error("[MQTT] Payload sensor bukan JSON valid:", messageString);
            return;
        }

        // Payload dari ESP_penerima.ino:
        // { suhuUdara, kelembapan, phAir, tds, turbidity,
        //   statusTurbidity, teganganTurbidity }
        // Kolom suhu_air, water_level_percent, water_level_height
        // belum dikirim oleh ESP32 saat ini sehingga disimpan NULL.
        const ph_air = payload.phAir ?? null;
        const suhu_udara = payload.suhuUdara ?? null;
        const humidity = payload.kelembapan ?? null;
        const tds = payload.tds ?? null;
        const ppm = payload.turbidity ?? null; // "PPM Air" di frontend = estimasi NTU turbidity

        try {
            const { rows } = await pool.query(
                `INSERT INTO monitoring_sensor
                    (ph_air, suhu_udara, humidity, tds, ppm)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id, created_at`,
                [ph_air, suhu_udara, humidity, tds, ppm]
            );

            dataSensorTerakhir = {
                id: rows[0].id,
                ph_air,
                suhu_udara,
                humidity,
                tds,
                ppm,
                created_at: rows[0].created_at,
            };

            console.log(
                `[MQTT->DB] Data sensor tersimpan (id=${rows[0].id}, ph_air=${ph_air}, suhu_udara=${suhu_udara}, humidity=${humidity})`
            );
        } catch (err) {
            console.error("[DB] Gagal menyimpan data sensor dari MQTT:", err.message);
        }
    });
}

module.exports = { initSensorSubscriber, getDataSensorTerakhir };