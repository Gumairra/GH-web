require("dotenv").config();

// =====================================================
// PENGAMAN GLOBAL
// Supaya server TIDAK mati diam-diam kalau ada error tak
// terduga (uncaught exception / unhandled promise rejection).
// Error tetap dicetak lengkap ke console agar mudah didiagnosis,
// tapi proses server tetap hidup.
// =====================================================
process.on("uncaughtException", (err) => {
    console.error("\n🔴 [FATAL] Uncaught Exception:");
    console.error(err);
});

process.on("unhandledRejection", (reason) => {
    console.error("\n🔴 [FATAL] Unhandled Promise Rejection:");
    console.error(reason);
});

const app = require("./src/app");
const pool = require("./src/config/db");
const { initSensorSubscriber } = require("./src/mqtt/sensorSubscriber");
require("./src/config/mqttClient"); // memulai koneksi MQTT

const PORT = process.env.PORT || 4000;

async function start() {
    // Pastikan koneksi database benar sebelum server jalan
    await pool.query("SELECT NOW()");
    console.log("[DB] Terhubung ke PostgreSQL");

    // Mulai dengarkan data sensor dari MQTT -> simpan ke DB
    initSensorSubscriber();

    app.listen(PORT, () => {
        console.log(`[SERVER] I-WILL Greenhouse API berjalan di port ${PORT}`);
        console.log(`[SERVER] http://localhost:${PORT}/api/health`);
    });
}

start().catch((err) => {
    console.error("[SERVER] Gagal start:", err.message);
    console.error(err);
    process.exit(1);
});