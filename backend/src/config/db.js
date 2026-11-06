const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    // PGSSL=true dipakai kalau PostgreSQL mengharuskan koneksi SSL
    ssl:
        process.env.PGSSL === "true"
            ? { rejectUnauthorized: false }
            : false,
});

pool.on("error", (err) => {
    console.error("Koneksi database bermasalah:", err.message);
});

module.exports = pool;
