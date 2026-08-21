require("dotenv").config();
const mqtt = require("mqtt");

// =====================================================
// SIMULASI ESP32 MENGIRIM DATA SENSOR
// Pakai: node scripts/testPublish.js
//
// Tujuan: memastikan jalur MQTT -> backend -> database
// -> frontend benar-benar berfungsi, TANPA butuh
// perangkat ESP32 fisik yang menyala.
//
// Kalau setelah menjalankan ini data muncul di dashboard,
// berarti kode backend/frontend sudah benar — masalahnya
// ada di ESP32 (belum nyala, salah topic, atau salah
// kredensial broker).
// =====================================================

const brokerUrl = `${process.env.MQTT_PROTOCOL || "mqtt"}://${
    process.env.MQTT_HOST || "broker.emqx.io"
}:${process.env.MQTT_PORT || 1883}`;

const TOPIC_SENSOR = process.env.MQTT_TOPIC_SENSOR || "greenhouse/sensors";

console.log("Menghubungkan ke broker:", brokerUrl);
console.log("Akan publish ke topic  :", TOPIC_SENSOR);

const client = mqtt.connect(brokerUrl, {
    clientId: "test-publisher-" + Math.random().toString(16).slice(2, 8),
    username: process.env.MQTT_USERNAME || undefined,
    password: process.env.MQTT_PASSWORD || undefined,
});

client.on("connect", () => {
    console.log("✅ Terhubung ke broker MQTT");

    const payloadPalsu = {
        suhuUdara: (25 + Math.random() * 5).toFixed(1) * 1,
        kelembapan: (60 + Math.random() * 15).toFixed(1) * 1,
        phAir: (6 + Math.random()).toFixed(2) * 1,
        tds: (400 + Math.random() * 200).toFixed(0) * 1,
        turbidity: (10 + Math.random() * 5).toFixed(1) * 1,
    };

    const pesan = JSON.stringify(payloadPalsu);

    // QoS 1 supaya broker WAJIB kirim PUBACK — kalau kredensial ini
    // tidak diizinkan publish ke topic ini, publish akan gagal jelas
    // (bukan diam-diam hilang seperti kalau pakai QoS 0).
    client.publish(TOPIC_SENSOR, pesan, { qos: 1 }, (err) => {
        if (err) {
            console.error("❌ Gagal publish (kemungkinan izin/ACL ditolak broker):", err.message);
        } else {
            console.log("✅ Data terkirim & dikonfirmasi broker (PUBACK diterima):", pesan);
            console.log(
                "\nSekarang cek log backend (npm run dev) — harus muncul baris:"
            );
            console.log("  [MQTT->DB] Data sensor tersimpan (id=..., ...)");
            console.log(
                "\nLalu refresh dashboard di browser untuk lihat datanya."
            );
        }
        client.end();
        process.exit(err ? 1 : 0);
    });
});

client.on("error", (err) => {
    console.error("❌ Koneksi MQTT gagal:", err.message);
    process.exit(1);
});