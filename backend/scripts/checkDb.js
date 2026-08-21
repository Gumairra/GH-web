require("dotenv").config();
const { Pool } = require("pg");

// =====================================================
// CEK KONEKSI POSTGRESQL
// Jalankan: node scripts/checkDb.js
// =====================================================

console.log("Mencoba konek ke PostgreSQL dengan konfigurasi berikut:");
console.log({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    // password sengaja tidak ditampilkan
    ssl: process.env.PGSSL === "true",
});
console.log("----------------------------------------\n");

const pool = new Pool({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT) || 5432,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 5000,
});

async function cekKoneksi() {
    try {
        const client = await pool.connect();

        const waktu = await client.query("SELECT NOW() AS waktu_server");
        const versi = await client.query("SELECT version()");

        console.log("✅ BERHASIL terhubung ke PostgreSQL!");
        console.log("Waktu server DB :", waktu.rows[0].waktu_server);
        console.log("Versi PostgreSQL:", versi.rows[0].version.split(",")[0]);

        // Cek apakah tabel monitoring_sensor ada
        const tabel = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'monitoring_sensor'
            ORDER BY ordinal_position
        `);

        if (tabel.rows.length === 0) {
            console.log(
                "\n⚠️  Tabel 'monitoring_sensor' TIDAK ditemukan di schema public."
            );
            console.log(
                "   Pastikan sudah restore db_greenersfix.sql dan jalankan migrations/001_extend_schema.sql"
            );
        } else {
            console.log(
                `\n✅ Tabel 'monitoring_sensor' ditemukan, ${tabel.rows.length} kolom:`
            );
            tabel.rows.forEach((r) =>
                console.log(`   - ${r.column_name} (${r.data_type})`)
            );
        }

        client.release();
        process.exit(0);
    } catch (err) {
        console.error("❌ GAGAL terhubung ke PostgreSQL");
        console.error("Pesan error:", err.message);

        // Bantu diagnosa berdasarkan kode error umum
        if (err.code === "ECONNREFUSED") {
            console.error(
                "\n👉 Kemungkinan: service PostgreSQL belum jalan, atau PGHOST/PGPORT salah."
            );
        } else if (err.code === "28P01") {
            console.error(
                "\n👉 Kemungkinan: PGUSER atau PGPASSWORD salah (password authentication failed)."
            );
        } else if (err.code === "3D000") {
            console.error(
                `\n👉 Kemungkinan: database "${process.env.PGDATABASE}" belum dibuat di PostgreSQL Anda.`
            );
        } else if (err.code === "ENOTFOUND") {
            console.error(
                "\n👉 Kemungkinan: PGHOST salah/typo, atau tidak bisa resolve hostname."
            );
        }

        process.exit(1);
    }
}

cekKoneksi();