"""
Server Object Detection Python untuk I-WILL Greenhouse
Menghubungkan Kamera USB di laptop dengan frontend React via MJPEG stream + WebSocket

Endpoints:
- GET  /video_feed    : Stream MJPEG (yang dipakai <img src>)
- WS   /ws/detections : Metadata deteksi objek (JSON)

Cara pakai:
  1. Pastikan kamera USB terhubung ke laptop (index 1 untuk USB Camera)
  2. Jalankan: python main.py
  3. Frontend akan mengakses: http://localhost:8000/video_feed

Environment variables (opsional, set via OS atau .env):
  CAMERA_INDEX    : Index kamera USB (default 1 untuk USB Camera, 0 untuk Integrated)
  MODEL           : Model YOLO untuk deteksi (default 'yolov8n.pt')
  CONF_THRESHOLD  : Threshold confidence (default 0.25)
  FRAME_SKIP      : Frame yang dilewati untuk mengurangi beban CPU (default 2)
"""

import os
import cv2
import asyncio
import numpy as np
import platform
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, WebSocket
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="Object Detection Server", version="1.0.0")

# CORS untuk frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Sesuaikan dengan origin frontend bila production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Konfigurasi dari environment (Default index 1 untuk USB Camera sesuai tes sebelumnya)
CAMERA_INDEX = int(os.getenv("CAMERA_INDEX", "1"))
MODEL_PATH = os.getenv("MODEL", "yolov8n.pt")  # YOLOv8 nano (kecil & cepat)
CONF_THRESHOLD = float(os.getenv("CONF_THRESHOLD", "0.25"))
FRAME_SKIP = int(os.getenv("FRAME_SKIP", "2"))

# Global state
model: Optional[YOLO] = None
camera: Optional[cv2.VideoCapture] = None
connected_websockets: List[WebSocket] = []


def load_model():
    """Load YOLO model sekali saja"""
    global model
    if model is None:
        logger.info(f"Memuat model: {MODEL_PATH}")
        try:
            model = YOLO(MODEL_PATH)
            logger.info("Model berhasil dimuat")
        except Exception as e:
            logger.error(f"Gagal memuat model: {e}")
            raise


def init_system_camera(index: int):
    """Inisialisasi kamera dengan backend yang sesuai OS (DirectShow untuk Windows, V4L2 untuk Linux)"""
    sys_name = platform.system()
    cam = None
    
    logger.info(f"Membuka kamera index {index} pada OS: {sys_name}")
    
    if sys_name == "Windows":
        # DirectShow (paling stabil untuk USB Camera di Windows)
        cam = cv2.VideoCapture(index, cv2.CAP_DSHOW)
        if not cam.isOpened():
            # Coba Media Foundation
            cam = cv2.VideoCapture(index, cv2.CAP_MSMF)
    elif sys_name == "Linux":
        cam = cv2.VideoCapture(index, cv2.CAP_V4L2)
        
    if cam is None or not cam.isOpened():
        # Fallback ke default backend OpenCV
        cam = cv2.VideoCapture(index)
        
    return cam


def init_camera():
    """Inisialisasi kamera USB yang terhubung ke laptop"""
    global camera
    if camera is None:
        logger.info(f"Mencoba membuka kamera USB dengan index: {CAMERA_INDEX}")
        camera = init_system_camera(CAMERA_INDEX)
        
        if not camera or not camera.isOpened():
            raise RuntimeError(
                f"Tidak bisa membuka kamera USB dengan index {CAMERA_INDEX}. "
                f"Pastikan kamera USB terhubung dan tidak sedang digunakan aplikasi lain (Zoom, OBS, dll)."
            )
        
        # Set resolusi optimal untuk deteksi
        camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        camera.set(cv2.CAP_PROP_FPS, 30)
        
        # Log info kamera
        width = camera.get(cv2.CAP_PROP_FRAME_WIDTH)
        height = camera.get(cv2.CAP_PROP_FRAME_HEIGHT)
        fps = camera.get(cv2.CAP_PROP_FPS)
        
        logger.info(f"Kamera USB (Index {CAMERA_INDEX}) berhasil terbuka - Resolusi: {int(width)}x{int(height)}, FPS: {int(fps)}")


async def close_camera():
    """Tutup kamera USB secara bersih"""
    global camera
    if camera is not None:
        camera.release()
        camera = None
        logger.info("Kamera USB ditutup")


def encode_frame_jpeg(frame: np.ndarray) -> bytes:
    """Encode frame ke JPEG untuk MJPEG stream"""
    encode_success, buffer = cv2.imencode('.jpg', frame)
    if not encode_success:
        raise ValueError("Gagal encode frame ke JPEG")
    return buffer.tobytes()


def generate_mjpeg_stream():
    """Generator untuk MJPEG stream"""
    logger.info("Mulai generate MJPEG stream")
    
    while True:
        if camera is None or not camera.isOpened():
            logger.warning("Camera tidak tersedia")
            break
        
        ret, frame = camera.read()
        if not ret or frame is None:
            logger.warning("Gagal membaca frame dari camera USB. Mencoba membaca ulang...")
            asyncio.sleep(0.1)
            continue
        
        # Object detection
        try:
            results = model(frame, conf=CONF_THRESHOLD, verbose=False)
            annotated_frame = results[0].plot() if results else frame
        except Exception as e:
            logger.error(f"Error object detection: {e}")
            annotated_frame = frame
        
        # Encode ke JPEG
        try:
            jpeg_data = encode_frame_jpeg(annotated_frame)
        except ValueError as e:
            logger.error(f"Error encode JPEG: {e}")
            continue
        
        # Format MJPEG boundary
        yield (
            b'--frame\r\n'
            b'Content-Type: image/jpeg\r\n\r\n' + jpeg_data + b'\r\n'
        )


@app.on_event("startup")
async def startup_event():
    """Inisialisasi saat server start"""
    try:
        load_model()
        init_camera()
    except Exception as e:
        logger.error(f"Gagal inisialisasi: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Buang resources saat server stop"""
    await close_camera()
    logger.info("Server shutdown selesai")


@app.get("/health")
async def health_check():
    """Endpoint health check lengkap"""
    camera_status = None
    if camera is not None:
        camera_status = {
            "opened": camera.isOpened(),
            "width": int(camera.get(cv2.CAP_PROP_FRAME_WIDTH)) if camera.isOpened() else 0,
            "height": int(camera.get(cv2.CAP_PROP_FRAME_HEIGHT)) if camera.isOpened() else 0,
            "fps": int(camera.get(cv2.CAP_PROP_FPS)) if camera.isOpened() else 0,
        }
    return {
        "status": "healthy",
        "camera_index": CAMERA_INDEX,
        "model": MODEL_PATH,
        "confidence_threshold": CONF_THRESHOLD,
        "camera": camera_status,
        "connected_websockets": len(connected_websockets)
    }


@app.get("/video_feed")
async def video_feed():
    """
    MJPEG stream endpoint
    Dipakai frontend untuk menampilkan video live
    """
    logger.info("Client terhubung ke video_feed")
    return StreamingResponse(
        generate_mjpeg_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@app.websocket("/ws/detections")
async def websocket_detections(websocket: WebSocket):
    """
    WebSocket endpoint untuk metadata deteksi objek
    Mengirim JSON dengan daftar objek yang terdeteksi + FPS
    """
    await websocket.accept()
    logger.info(f"WebSocket client terhubung: {websocket.client}")
    connected_websockets.append(websocket)
    
    fps = 0
    frame_count = 0
    import time
    start_time = time.time()
    
    try:
        while True:
            if camera is None or not camera.isOpened():
                await asyncio.sleep(0.1)
                continue
            
            # Baca frame
            ret, frame = camera.read()
            if not ret or frame is None:
                await asyncio.sleep(0.05)
                continue
            
            # Object detection
            try:
                results = model(frame, conf=CONF_THRESHOLD, verbose=False)
                detections = []
                
                if results and len(results) > 0:
                    for box in results[0].boxes:
                        if box.conf.item() < CONF_THRESHOLD:
                            continue
                        
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        conf = box.conf.item()
                        cls_id = int(box.cls[0].cpu().numpy())
                        label = results[0].names[cls_id] if hasattr(results[0], 'names') else str(cls_id)
                        
                        h, w = frame.shape[:2]
                        bbox = [
                            float((x1 + x2) / 2 / w),
                            float((y1 + y2) / 2 / h),
                            float((x2 - x1) / w),
                            float((y2 - y1) / h),
                        ]
                        
                        detections.append({
                            "label": label,
                            "confidence": conf,
                            "box": bbox,
                        })
            except Exception as e:
                logger.error(f"Error detection: {e}")
                detections = []
            
            # Hitung FPS
            frame_count += 1
            elapsed = time.time() - start_time
            if elapsed > 0:
                fps = frame_count / elapsed
            
            # Kirim hasil deteksi ke semua client
            payload = {
                "detections": detections,
                "fps": round(fps, 2),
                "timestamp": time.time(),
            }
            
            try:
                await websocket.send_json(payload)
            except:
                break
            
            # Frame skip untuk mengurangi beban
            await asyncio.sleep(0.05 / FRAME_SKIP)
    
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    
    finally:
        if websocket in connected_websockets:
            connected_websockets.remove(websocket)
        await websocket.close()
        logger.info(f"WebSocket client putus: {websocket.client}")


if __name__ == "__main__":
    import uvicorn
    logger.info("Menjalankan server FastAPI dengan python main.py...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
