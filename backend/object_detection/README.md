# Object Detection Server (Python)

Server Python untuk deteksi objek real-time dengan kamera USB.

## Fitur

- MJPEG stream untuk video live (`GET /video_feed`)
- WebSocket untuk metadata deteksi objek (`WS /ws/detections`)
- Dukungan YOLOv8 (ultralytics)
- OS-aware camera backend (DirectShow untuk Windows, V4L2 untuk Linux)
- CORS enabled untuk akses dari frontend

## Prerequisites

1. Python 3.8+
2. Kamera USB yang terhubung ke laptop
3. GPU opsional (CPU juga didukung)

## Instalasi

```bash
cd backend/object_detection
pip install -r requirements.txt
```

## Cara Menjalankan Server

Cukup jalankan dengan perintah:

```bash
python main.py
```

Atau menggunakan Uvicorn secara manual:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Opsi Environment Variables

| Variable | Deskripsi | Default |
|----------|-----------|---------|
| `CAMERA_INDEX` | Index kamera USB (1 untuk USB Camera, 0 untuk Integrated) | 1 |
| `MODEL` | Model YOLO path/nama | yolov8n.pt |
| `CONF_THRESHOLD` | Confidence threshold | 0.25 |
| `FRAME_SKIP` | Frame yang dilewati | 2 |

Contoh menjalankan dengan kamera index lain:
```bash
CAMERA_INDEX=0 python main.py
```

## Frontend Integration

Frontend React mengakses Python server lewat `frontend/.env`:

```bash
VITE_DETECTION_URL=http://localhost:8000
VITE_DETECTION_STREAM_URL=http://localhost:8000/video_feed
VITE_DETECTION_WS_URL=ws://localhost:8000/ws/detections
```
