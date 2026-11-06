# AGENTS.md — Panduan Kerja untuk AI Agent

> File ini WAJIB diperbarui setiap kali selesai melakukan perubahan kode
> pada proyek ini. Jangan biarkan isinya usang.

## Ringkasan Proyek

Sistem monitoring & kontrol greenhouse (I-WILL Greenhouse).
Arsitektur IoT:

```
5x ESP anak --ESP-NOW--> 1x ESP induk --MQTT--> backend --PostgreSQL--> frontend React
```

- `frontend/` — React 19 + Vite + Tailwind (utility class) + Chart.js
- `backend/` — Express 4 (CommonJS) + PostgreSQL (`pg`) + MQTT + ExcelJS

## Perintah Penting

Semua perintah backend dijalankan dari folder `backend/`:

```bash
npm install          # install dependensi
npm run dev          # jalankan server (node --watch)
npm start            # jalankan server
npm run migrate      # buat/lengkapi tabel: monitoring_sensor, actuator_log, esp_devices
npm run check-db     # cek koneksi database
```

Frontend (dari folder `frontend/`):

```bash
npm run dev          # dev server Vite (default http://localhost:5173)
npm run build        # build produksi
npm run lint
```

## Konfigurasi Environment (PENTING)

- HANYA ADA SATU file env: `backend/.env`. **Jangan** membuat/menambahkan
  `.env.example` atau file env kedua di folder yang sama.
- `backend/.env` berisi SERVER + DATABASE + MQTT sekaligus dan **tidak
  di-commit** (sudah ada di `backend/.gitignore`).
- Backend memuat env lewat `require("dotenv").config()` di `server.js`,
  `src/app.js`, `src/config/db.js`, dan `src/config/mqttClient.js`.
- `PGDATABASE` harus menunjuk ke database yang benar-benar memiliki tabel
  `monitoring_sensor`, `actuator_log`, dan `esp_devices`. Jika tabel
  `esp_devices` tidak ada, jalankan `npm run migrate`.
- `PGSSL=true` hanya untuk PostgreSQL yang mewajibkan SSL.

## Struktur Backend

```
backend/
├── server.js                     # entrypoint, guard uncaughtException, start DB+MQTT
├── migrations/
│   ├── 001_extend_schema.sql     # kolom sensor tambahan + actuator_log
│   └── 002_esp_devices.sql       # tabel esp_devices + kolom esp_name
├── scripts/
│   └── runMigration.js           # menjalankan migrasi 001 & 002 (idempotent)
└── src/
    ├── app.js                    # setup Express, CORS, routes
    ├── config/db.js              # pool PostgreSQL (mendukung PGSSL)
    ├── config/mqttClient.js      # koneksi MQTT (mqtt/mqtts)
    ├── mqtt/sensorSubscriber.js  # subscribe sensor -> INSERT DB + upsert esp_devices
    ├── mqtt/actuatorPublisher.js # publish perintah aktuator
    ├── controllers/              # sensor, actuator, esp
    ├── routes/                   # sensor, actuator, esp
    └── utils/                    # dateRange, sensorThresholds
```

## API Penting

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/health` | cek server |
| GET | `/api/sensors/latest?esp=ESP_01` | data terbaru (opsional filter ESP) |
| GET | `/api/sensors/history?range=today\|week\|month` | agregat time-series |
| GET | `/api/sensors/export?range=...` | download Excel (.xlsx, 2 sheet) |
| POST | `/api/sensors` | kirim data sensor (bisa sertakan `esp_name`) |
| GET | `/api/esp` | daftar ESP + status |
| POST | `/api/esp` | daftar/update ESP (`esp_name`, `location`) |
| GET | `/api/sensors/average-suhu?esp=ESP_01,ESP_02` | rata-rata suhu udara |
| GET | `/api/actuators/usage?range=...` | pemakaian aktuator |
| POST | `/api/actuators/log` | log ON/OFF aktuator |
| POST | `/api/actuators/:nama/set` | kirim perintah ke ESP (`kipas`, `lampu`, `pompaAir`, `pompaNutrisi`) |

Catatan: route `/api/esp` dipasang di `src/app.js`. Controller
`getAverageSuhu` berada di `esp.controller.js`, tetapi route-nya didaftarkan
di `src/routes/sensor.routes.js` agar URL-nya `/api/sensors/average-suhu`
( sesuai yang dipanggil `frontend/src/services/api.js` ).

## Payload MQTT Sensor (dari ESP induk)

```json
{
  "esp_name": "ESP_01",
  "suhuUdara": 27.3,
  "kelembapan": 68,
  "phAir": 6.5,
  "tds": 850,
  "turbidity": 600
}
```

Mapping ke kolom DB: `suhuUdara→suhu_udara`, `kelembapan→humidity`,
`phAir→ph_air`, `turbidity→ppm`. Field `suhu_air`, `water_level_percent`,
`water_level_height` belum dikirim ESP sehingga disimpan `NULL`.

## Frontend Penting

- `src/services/api.js` — semua pemanggilan API (`BASE_URL` dari `VITE_API_URL`,
  default `http://localhost:5000`).
- `src/pages/Dashboard.jsx` — polling tiap **3 menit** (`3 * 60 * 1000`),
  dropdown ESP, kartu rata-rata suhu.
- `src/pages/Statistics.jsx` — polling tiap **3 menit**, filter range,
  tombol **Unduh Excel**.
- `src/components/EspSelector.jsx` — daftar ESP dari `/api/esp`, fallback statis.
- `src/components/AverageTemperature.jsx` — menampilkan rata-rata dari API.
- `src/components/SensorCard.jsx` — badge nama ESP.

## Konvensi Kode

- Backend: CommonJS (`require`/`module.exports`), indentasi 4 spasi,
  komentar bahasa Indonesia.
- Frontend: functional component + hooks, indentasi 4 spasi.
- Jangan mengubah perilaku/fungsi yang sudah benar; lakukan perubahan minimal.
- Semua endpoint baru harus ditambahkan ke tabel API di file ini.

## Riwayat Perubahan Penting

- 2026-11-06: Perbaikan error: route `/api/sensors/average-suhu` didaftarkan
  di `sensor.routes.js` (sebelumnya hanya ada di `/api/esp/average-suhu`
  sehingga frontend mendapat 404).
- 2026-11-06: Konsolidasi env menjadi satu `backend/.env` (`.env.example` dihapus).
- 2026-11-06: `db.js` mendukung `PGSSL`; upsert `esp_devices` dipisah agar
  kegagalannya tidak menggagalkan penyimpanan data sensor.
- 2026-11-06: Migrasi `esp_devices` dijalankan di database aktif (`postgres`).
- 2026-11-05: Fitur ESP-NOW (multi-node, selector ESP, rata-rata suhu).
- 2026-11-04: Export Excel + polling 3 menit.

## Checklist Setelah Perubahan

1. Perbarui file ini (`AGENTS.md`) bila ada endpoint, env, atau alur baru.
2. Jalankan `npm run migrate` bila mengubah skema database.
3. Uji `GET /api/health` dan endpoint yang diubah.
4. Untuk frontend: `npm run build` harus sukses.
5. Pastikan `.env` tidak ikut ter-commit.
