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
    ├── controllers/              # sensor, actuator, esp, weather
    ├── routes/                   # sensor, actuator, esp, weather
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
| GET | `/api/weather?adm4=32.73.14.1002` | prakiraan cuaca BMKG (Cikutra, Bandung) dengan in-memory cache |

Catatan: route `/api/esp` dipasang di `src/app.js`. Controller
`getAverageSuhu` berada di `esp.controller.js`, tetapi route-nya didaftarkan
di `src/routes/sensor.routes.js` agar URL-nya `/api/sensors/average-suhu`
(sesuai yang dipanggil `frontend/src/services/api.js`).

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
- `src/layouts/MainLayout.jsx` — shell aplikasi: `Topbar` + `<main>` + footer +
  `ObjectDetectionDrawer` (drawer hanya di-mount saat dibuka).
- `src/components/Topbar.jsx` — satu-satunya navigasi (Monitoring, Statistik,
  Object Detection), status ESP online berbasis teks (tanpa badge LIVE palsu),
  jam, dan menu mobile.
- `src/components/WeatherWidget.jsx` — widget prakiraan cuaca luar ruangan BMKG (Cikutra, Bandung) dengan ikon SVG dinamis, suhu, kelembapan, kecepatan angin, dan perbandingan suhu luar vs dalam greenhouse (`insideTemp`).
- `src/components/ObjectDetectionDrawer.jsx` — panel deteksi objek real-time
  (stream MJPEG + metadata WebSocket). Status live/offline hanya ditampilkan
  di drawer berdasarkan koneksi sebenarnya. Dialog mengunci scroll, menjebak
  Tab, dan mengembalikan fokus ke tombol pemicu saat ditutup.
- `src/pages/Dashboard.jsx` — polling tiap **3 menit**, strip KPI (status
  greenhouse, rata-rata suhu, ESP online, pembacaan terakhir), WeatherWidget,
  skeleton saat memuat, banner error yang bisa ditutup, tombol **Perbarui**,
  chip data basi (> 15 menit), dropdown ESP.
- `src/pages/Statistics.jsx` — polling tiap **3 menit**, toolbar sticky
  (filter range + **Unduh Excel** dengan status loading), skeleton, empty state,
  kartu ringkasan, dan bar pemakaian aktuator.
- `src/components/EspSelector.jsx` — daftar ESP dari `/api/esp`, fallback statis.
- `src/components/SensorSection.jsx` — grid kartu sensor responsif (`auto-fit`),
  ikon per sensor, skeleton, dan empty state.
- `src/components/SensorCard.jsx` — kartu sensor flat dengan chip status berwarna
  (hijau normal, kuning di luar ambang, abu-abu tanpa data).
- `src/components/WaterLevel.jsx` — tangki air dengan penanda level minimum 40%.
- `src/components/LineChart.jsx` — Chart.js dengan tooltip/grid bertema.
- `src/utils/time.js` — `relativeFrom`, `ageMs`, `isOlderThan`, `isWithin`.
- `src/index.css` — token warna/tipografi, `.card-surface`, `.chip--*`,
  `.skeleton`, `focus-visible`, dan `prefers-reduced-motion`. Style khusus
  dashboard (`.kpi-card`) berada di `src/pages/Dashboard.css`.
- Font `Fraunces` (display) + `Inter` (body) dimuat dari Google Fonts di
  `frontend/index.html`.

## Object Detection (server Python di laptop)

Frontend hanya mengonsumsi dua endpoint dari server Python (belum bagian dari
backend Express):

| Endpoint | Keterangan |
|---|---|
| `GET {DETECTION_URL}/video_feed` | stream MJPEG untuk `<img src>` |
| `WS {DETECTION_URL}/ws/detections` | metadata JSON (opsional) |

### Struktur Server Python

```
backend/
├── server.js              # entrypoint Express (backend utama)
├── object_detection/      # PYTHON SERVER (uvicorn)
│   ├── main.py            # FastAPI server: video_feed + ws/detections
│   ├── requirements.txt   # dependencies Python
│   ├── start.bat          # script start server
│   └── README.md          # dokumentasi setup
└── src/                   # folder source Express lainnya
```

### Cara Menjalankan Server Python

```bash
cd backend/object_detection
pip install -r requirements.txt
python main.py
```

### Konfigurasi Environment Python

| Variable | Deskripsi | Default |
|----------|-----------|---------|
| `CAMERA_INDEX` | Index kamera USB (1 untuk USB Camera, 0 untuk Integrated) | 1 |
| `MODEL` | Model YOLO path/nama | yolov8n.pt |
| `CONF_THRESHOLD` | Confidence threshold | 0.25 |
| `FRAME_SKIP` | Frame yang dilewati | 2 |

> **Catatan:** Untuk menemukan index kamera USB di Windows, gunakan script Python:
> ```python
> import cv2
> for i in range(10):
>     cap = cv2.VideoCapture(i)
>     if cap.isOpened():
>         print(f"Kamera ditemukan di index: {i}")
>         cap.release()
> ```

### Frontend Konfigurasi

Frontend mengakses Python server lewat environment:

```bash
# frontend/.env
VITE_DETECTION_URL=http://localhost:8000
VITE_DETECTION_STREAM_URL=http://localhost:8000/video_feed
VITE_DETECTION_WS_URL=ws://localhost:8000/ws/detections
```

## Konvensi Kode

- Backend: CommonJS (`require`/`module.exports`), indentasi 4 spasi,
  komentar bahasa Indonesia.
- Frontend: functional component + hooks, indentasi 4 spasi.
- Jangan mengubah perilaku/fungsi yang sudah benar; lakukan perubahan minimal.
- Semua endpoint baru harus ditambahkan ke tabel API di file ini.

## Riwayat Perubahan Penting

- 2026-11-20: Implementasi **Weather Widget** (Opsi C) untuk menampilkan prakiraan cuaca BMKG di Cikutra, Bandung (`adm4: 32.73.14.1002`). Menambahkan endpoint backend `/api/weather` dengan in-memory cache (TTL 1 jam) dan komponen frontend `WeatherWidget.jsx` yang menampilkan ikon cuaca SVG dari BMKG, suhu, kelembapan, angin, serta perbandingan suhu luar vs dalam greenhouse.
- 2026-11-18: Review `emil-design-eng` + `remove-animations`: menghapus riak air tandon, shimmer skeleton (kini placeholder statis), `scroll-behavior: smooth` global, dan animasi masuk banner error. Drawer kini masuk dari tepi layar (bukan fade bergoyang 24px), menu mobile tumbuh dari pemicunya (120ms). Menambah state `:active` pada tombol, membatasi semua `:hover` dengan `@media (hover: hover) and (pointer: fine)`, menghapus `backdrop-filter` di atas stream MJPEG, menambah focus trap + pemulihan fokus pada drawer dan tombol Escape pada menu mobile, memperbaiki chip KPI yang mewarisi font monospace, menaikkan target sentuh tombol menjadi 40/44px, memendekkan transisi bar data ke 180–280ms, serta menambah token `--radius-inner` dan `role="progressbar"` pada bar sensor.
- 2026-11-17: Pembersihan UI "anti AI-slop": menghapus badge LIVE palsu & dot berdenyut di navbar, menghapus shimmer/gradient hover, menghapus dua tombol Object Detection yang duplikat di desktop, menghapus ~120 baris CSS mati (`.bento-card*`, `.dashboard-bento-grid`, `.kpi-sparkline`, `.water-level-section`), menyatukan `.kpi-card` (sebelumnya dobel di `index.css` + `Dashboard.css`), mengganti Bento `nth-child` dengan grid `auto-fit`, menghapus latar blob radial, dan mengganti label uppercase ber-tracking dengan label normal. Warna grafik kini dibaca dari token CSS; konfigurasi env server deteksi dipindah ke `<details>`.
- 2026-11-16: Modernisasi UI Dashboard (Bento Grid) & Navbar.
- 2026-11-15: Modernisasi UI Fase 1, Panel Object Detection, Dashboard KPI, Statistik.
- 2026-11-06: Perbaikan error route `/api/sensors/average-suhu`, konsolidasi env `.env`, dukungan `PGSSL`.
- 2026-11-05: Fitur ESP-NOW (multi-node, selector ESP, rata-rata suhu).
- 2026-11-04: Export Excel + polling 3 menit.

## Checklist Setelah Perubahan

1. Perbarui file ini (`AGENTS.md`) bila ada endpoint, env, atau alur baru.
2. Jalankan `npm run migrate` bila mengubah skema database.
3. Uji `GET /api/health` dan endpoint yang diubah.
4. Untuk frontend: `npm run build` dan `npm run lint` harus sukses.
5. Pastikan `.env` tidak ikut ter-commit.
