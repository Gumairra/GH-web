# I-WILL Greenhouse — Backend API

Backend Express + PostgreSQL untuk frontend `GH-web/frontend` (React + Vite).

## 0. Alur data MQTT (ESP32 <-> Backend)

Backend ini otomatis **subscribe** ke topic `greenhouse/sensors` di broker
`broker.emqx.io` (harus sama persis dengan `ESP_penerima.ino`). Setiap ESP32
publish data sensor, backend langsung menyimpannya ke tabel
`monitoring_sensor` — tidak perlu request HTTP manual apapun.

Untuk kontrol aktuator dari web ke ESP32 (menyalakan/mematikan kipas, lampu,
pompa air, pompa nutrisi), backend **publish** ke topic yang di-subscribe
ESP32:

```bash
curl -X POST http://localhost:4000/api/actuators/kipas/set \
  -H "Content-Type: application/json" \
  -d '{ "nyala": true }'
```

`:nama` = `kipas`, `lampu`, `pompaAir`, atau `pompaNutrisi` (persis nama
topic di `ESP_penerima.ino`). Endpoint ini terpisah dari `/api/actuators/log`
& `/api/actuators/usage` di bawah, yang dipakai untuk mencatat statistik
pemakaian (Pompa Air/Lampu LED/Exhaust Fan) di halaman Statistics.

Endpoint `POST /api/sensors` (lihat bagian 5) tetap ada sebagai jalur
alternatif kalau suatu saat ada perangkat yang kirim data lewat HTTP,
bukan MQTT.

## 1. Kenapa ada file migration?

Skema asli `db_greenersfix.sql` cuma punya tabel `monitoring_sensor` dengan
kolom `ph_air`, `suhu_udara`, `humidity`. Sementara UI frontend butuh data
lain yang belum ada di database: suhu air, TDS, PPM (turbidity), ketinggian
air tandon, dan riwayat ON/OFF aktuator (Pompa Air, Lampu LED, Exhaust Fan).

Jalankan urutan ini di database `greenersfix`:

```bash
psql -U postgres -d greenersfix -f db_greenersfix.sql
psql -U postgres -d greenersfix -f migrations/001_extend_schema.sql
```

## 2. Instalasi & Menjalankan

```bash
cd backend
npm install
cp .env.example .env   # sesuaikan kredensial database Anda
npm run dev             # atau: npm start
```

Server berjalan di `http://localhost:4000`. Cek `GET /api/health` untuk
memastikan API dan koneksi DB hidup.

## 3. Daftar Endpoint

| Method | Endpoint                          | Dipakai oleh (frontend)                          |
|--------|------------------------------------|---------------------------------------------------|
| GET    | `/api/sensors/latest`              | `SensorSection.jsx`, `WaterLevel.jsx` (Dashboard)  |
| GET    | `/api/sensors/history?range=today\|week\|month` | `LineChart.jsx` + kartu ringkasan di `Statistics.jsx` |
| POST   | `/api/sensors`                     | Perangkat IoT (ESP32) mengirim pembacaan baru      |
| GET    | `/api/actuators/usage?range=...`   | Bagian "Pemakaian Aktuator" di `Statistics.jsx`    |
| POST   | `/api/actuators/log`               | Sistem kontrol relay mencatat event ON/OFF         |
| POST   | `/api/actuators/:nama/set`         | Kirim perintah ON/OFF ke ESP32 lewat MQTT (`:nama` = `kipas`\|`lampu`\|`pompaAir`\|`pompaNutrisi`) |

### Contoh response `GET /api/sensors/latest`

```json
{
  "data": {
    "sensors": [
      { "title": "Suhu Udara", "sensors": "DHT22", "value": 28.4, "unit": "°C",
        "status": "Normal · 20-32°C", "progress": 57 },
      ...
    ],
    "waterLevel": { "percent": 62, "height": 22.8, "status": "Cukup" },
    "updatedAt": "2026-08-13T09:15:00.000Z"
  }
}
```

## 4. Cara memasang ke frontend (contoh)

### `SensorSection.jsx` + `WaterLevel.jsx` (Dashboard.jsx)

```jsx
import { useEffect, useState } from "react";

function Dashboard() {
    const [data, setData] = useState(null);

    useEffect(() => {
        const load = () =>
            fetch("http://localhost:4000/api/sensors/latest")
                .then((r) => r.json())
                .then((res) => setData(res.data));

        load();
        const id = setInterval(load, 5000); // polling tiap 5 detik
        return () => clearInterval(id);
    }, []);

    if (!data) return null;

    return (
        <div className="dashboard-page max-w-7xl mx-auto px-5 sm:px-8 py-8">
            <Header />
            <SensorSection sensors={data.sensors} />
            <WaterLevel {...data.waterLevel} />
        </div>
    );
}
```

Lalu di `SensorSection.jsx`, ganti data statis dengan `props.sensors.map(...)`
memakai `<SensorCard {...s} />` untuk tiap item.

### `Statistics.jsx`

```jsx
useEffect(() => {
    fetch(`http://localhost:4000/api/sensors/history?range=${activeRange}`)
        .then((r) => r.json())
        .then((res) => setHistory(res.data));

    fetch(`http://localhost:4000/api/actuators/usage?range=${activeRange}`)
        .then((r) => r.json())
        .then((res) => setActuatorUsage(res.data));
}, [activeRange]);
```

`res.data.labels` dan `res.data.suhu_udara` / `suhu_air` / `humidity` /
`ph_air` / `tds` / `water_level_percent` tinggal dioper langsung ke prop
`labels` dan `datasets[].data` di `<LineChart />`.

## 5. Contoh payload dari perangkat IoT

```bash
curl -X POST http://localhost:4000/api/sensors \
  -H "Content-Type: application/json" \
  -d '{
    "ph_air": 6.5, "suhu_udara": 28.4, "suhu_air": 24.8,
    "humidity": 68, "tds": 850, "ppm": 600,
    "water_level_percent": 62, "water_level_height": 22.8
  }'
```
