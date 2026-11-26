# Spesifikasi Desain UI/UX & Animasi Versi Mobile — I-WILL Greenhouse

Dokumen ini mendefinisikan panduan spesifikasi desain UI/UX, tata letak, komponen, sistem warna, state, dan animasi untuk pengembangan aplikasi mobile **I-WILL Greenhouse** (diadaptasi secara presisi dari web aplikasi React yang ada, termasuk pembaruan integrasi cuaca BMKG dan Vision Hub).

---

## 1. Filosofi & Konsep Desain

Aplikasi mobile **I-WILL Greenhouse** mengusung konsep **Organic Agriculture & Modern Tech** (Fungsional, tenang, tidak berlebihan, dan bebas dari *AI-slop* atau efek visual yang mengganggu).

- **Prinsip Utama**:
  - **Kejernihan Informasi**: Data sensor IoT dan kondisi cuaca luar ruangan harus terbaca sekilas tanpa geseran horizontal yang tidak perlu.
  - **Umpan Balik Taktil (Tactical Feedback)**: Tombol dan elemen interaktif memberikan respons fisik instan saat ditekan (`scale(0.97)`).
  - **Efisiensi Performa**: Menghindari animasi berat (seperti shimmer berlebih atau riak air kompleks) yang menghabiskan baterai atau menyebabkan *jank* pada perangkat mobile.

---

## 2. Sistem Desain & Token Warna (Design Tokens)

### 2.1 Palet Warna
```css
:root {
  /* Warna Utama Pertanian / Greenhouse */
  --color-leaf: #2f6b4f;          /* Hijau Utama / Sukses */
  --color-leaf-light: #eaf4ee;    /* Hijau Muda Soft */
  --color-leaf-dark: #1f4a37;     /* Hijau Tua / Teks Heading */
  --color-clay: #c97b3e;          /* Aksen Terakota / Peringatan */
  --color-blue: #3e7fc9;          /* Aksen Biru / Info / Air / Cuaca */
  
  /* Status Semantik */
  --color-success: #2f6b4f;
  --color-success-soft: #eaf4ee;
  --color-warning: #b4762a;
  --color-warning-soft: #fbf1e2;
  --color-danger: #b3433b;
  --color-danger-soft: #fbebe9;
  --color-info: #3e7fc9;
  --color-info-soft: #eaf2fb;

  /* Permukaan & Latar Belakang */
  --page-bg: #f6f4ee;             /* Background utama hangat (off-white/cream) */
  --color-card: #ffffff;          /* Background kartu */
  --color-ink: #243033;           /* Teks utama (dark charcoal) */
  --color-mute: #5f6a72;          /* Teks sekunder / abu-abu */
  --color-line: #e3e0d5;          /* Garis pembatas / border */

  /* Radius & Elevasi */
  --radius-card: 16px;
  --radius-inner: 12px;
  --radius-control: 10px;
  --shadow-card: 0 1px 2px rgba(36, 48, 51, 0.04);
}
```

### 2.2 Tipografi
- **Display / Judul Utama**: Font **Fraunces** (Serif elegan, memberikan kesan natural & premium pada angka KPI atau judul besar).
- **Body / Teks Biasa**: Font **Inter** (Sans-serif bersih, sangat terbaca di layar kecil).
- **Angka Sensor (`num-tick`)**: Menggunakan `font-variant-numeric: tabular-nums` agar angka tidak bergeser-geser saat nilainya berubah secara *real-time*.

---

## 3. Arsitektur Navigasi & Struktur Layar (Mobile Navigation)

Aplikasi mobile menggunakan **Bottom Navigation Bar** dengan 3 tab utama:
1. **Dashboard** (`/dashboard`) — Monitoring sensor real-time, **Weather Widget (BMKG)**, status ESP, water level, dan kontrol aktuator.
2. **Statistik** (`/statistics`) — Grafik historis time-series, filter rentang waktu, ringkasan metrik, dan ekspor data (.xlsx).
3. **Vision Hub LIVE** (`/vision`) — Stream MJPEG kamera object detection dan deteksi hama/daun secara real-time via WebSocket.

### 3.1 Top Header (App Bar)
- **Kiri**: Judul halaman / Logo I-WILL Greenhouse + Status Koneksi ESP (indikator teks bersih, misal: "ESP_01 • Online").
- **Kanan**: Tombol Dropdown Pilih ESP Node (jika multi-node ESP-NOW aktif) dan tombol refresh manual.

---

## 4. Spesifikasi Rinci per Layar (Screen Specifications)

### Layar 1: Dashboard (Monitoring, Cuaca & Kontrol)
- **Strip KPI (Atas)**:
  - 4 Kartu ringkas horizontal / grid 2x2: Status Greenhouse (Aman/Waspada), Rata-rata Suhu, Perangkat ESP Online, Pembacaan Terakhir.
- **Widget Cuaca Luar Ruangan (`WeatherWidget.jsx`)**:
  - Mengambil data dari endpoint `/api/weather` (Prakiraan cuaca BMKG untuk wilayah Cikutra, Bandung / `adm4: 32.73.14.1002`).
  - Menampilkan:
    - Ikon cuaca SVG dinamis dari BMKG.
    - Suhu luar ruangan (`°C`) dengan font display dan deskripsi cuaca (misal: Cerah Berawan).
    - Chip lokasi ("Cikutra, Bandung").
    - Rincian tambahan: Kelembapan luar (`%`), kecepatan & arah angin (`m/s`).
    - **Perbandingan Suhu**: Membandingkan suhu luar dengan suhu rata-rata di dalam greenhouse (`insideTemp`), dengan indikator selisih positif/negatif (`+X.X°C` hijau atau `-X.X°C` merah).
  - State: Skeleton statis saat memuat, banner fallback/offline jika gagal terhubung ke BMKG.
- **Banner Peringatan / Error**:
  - Muncul jika gagal memuat data atau jika data sensor sudah basi (> 15 menit, disertai chip data basi). Dapat ditutup (dismissible).
- **Grid Kartu Sensor (Bento / Auto-fit Grid)**:
  - Suhu Udara (`suhuUdara`), Kelembapan (`kelembapan`), pH Air (`phAir`), TDS/PPM (`tds`), Kekeruhan Air (`turbidity`).
  - Setiap kartu sensor memiliki ikon, nilai angka `tabular-nums`, chip status warna (Hijau/Kuning/Abu-abu), dan bar progress berukuran 4px.
- **Widget Tangki Air (`WaterLevel`)**:
  - Visualisasi tabung air interaktif dengan persentase isi dan garis penanda batas minimum kritis **40%**.
- **Panel Kontrol Aktuator**:
  - Tombol aksi cepat untuk perangkat: **Kipas**, **Lampu**, **Pompa Air**, **Pompa Nutrisi** (Status ON/OFF dengan tombol sakelar sentuh responsif).

### Layar 2: Statistik & Analitik (`Statistics.jsx`)
- **Sticky Toolbar**:
  - Filter Rentang Waktu: **Hari Ini (Today)**, **Minggu Ini (Week)**, **Bulan Ini (Month)**.
  - Tombol **Unduh Excel (.xlsx)** dengan ikon unduh dan status loading saat file `.xlsx` 2-sheet diproses backend.
- **Ringkasan Kartu Metrik**:
  - Menampilkan nilai minimum, maksimum, dan rata-rata dari parameter sensor.
- **Bar Pemakaian Aktuator**:
  - Grafik batang horizontal yang menunjukkan durasi/frekuensi aktif masing-masing aktuator (`usage-bar` dengan transisi halus 180ms–280ms).
- **Grafik Time-Series (Chart.js / Native Chart)**:
  - Grafik garis bersumbu waktu dengan tooltip interaktif saat ditekan, grid garis halus, dan warna garis yang merujuk pada token CSS (`--color-leaf`, `--color-blue`, `--color-clay`).

### Layar 3: Vision Hub LIVE (Object Detection)
- **Tampilan Stream Kamera**:
  - Menampilkan video stream MJPEG (`/video_feed`) secara *real-time* dari server AI (Python).
- **Metadata Overlay**:
  - FPS counter dan kotak pembatas (*bounding boxes*) transparan bernormalisasi (0–1) di atas objek terdeteksi (daun, hama, dll) beserta label kelas dan confidence.
- **Indikator Koneksi Vision**:
  - Status **Live** (Hijau) atau **Terputus** (Merah) beserta URL server deteksi, konfigurasi port, dan tombol **Coba lagi**.

---

## 5. Standar Interaksi, State & Animasi

### 5.1 Umpan Balik Interaksi (Touch Feedback)
- Semua tombol, kartu interaktif, dan item menu menggunakan efek skala aktif:
  ```css
  button:active, .card-interactive:active {
      transform: scale(0.97);
      transition: transform 100ms ease;
  }
  ```

### 5.2 Transisi Navigasi & Drawer
- **Drawer / Modal (seperti Vision Hub atau Detail)**:
  - Muncul dari bawah atau dari sisi kanan layar dengan durasi `250ms cubic-bezier(0.2, 0, 0, 1)`.
- **Menu Dropdown / Popup**:
  - Tumbuh dari titik pemicunya dalam `120ms`.

### 5.3 State Handling (Kosong, Loading, Error)
- **Loading State (Skeleton)**:
  - Menggunakan placeholder statis berwarna abu-abu hangat (`#efebe1`, `border-radius: 10px`) tanpa animasi *shimmer* bergeser untuk menjaga performa CPU mobile tetap ringan.
- **Empty State**:
  - Ilustrasi minimalis atau ikon besar dengan teks penjelas ("Belum ada data sensor untuk rentang waktu ini") dan tombol tindakan ulang.
- **Error State**:
  - Banner merah lembut (`--color-danger-soft`) di bagian atas layar dengan pesan error deskriptif dan tombol **Muat Ulang**.

### 5.4 Aksesibilitas & Performa
- **Dukungan Reduced Motion**:
  - Jika pengguna mengaktifkan pengaturan *Reduce Motion* di perangkat mobile, seluruh animasi dinonaktifkan (`duration: 0.01ms`).
- **Target Sentuh Minimum**:
  - Semua tombol interaktif memiliki ukuran minimal tinggi/lebar **40px – 44px** agar nyaman ditekan oleh jari.
