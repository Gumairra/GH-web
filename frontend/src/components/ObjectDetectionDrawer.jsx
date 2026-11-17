import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./ObjectDetectionDrawer.css";

// =====================================================
// KONFIGURASI SERVER PYTHON (object detection)
// Bisa dioverride lewat frontend/.env:
//   VITE_DETECTION_URL=http://localhost:8000
//   VITE_DETECTION_STREAM_URL=http://localhost:8000/video_feed
//   VITE_DETECTION_WS_URL=ws://localhost:8000/ws/detections
// =====================================================
const DETECTION_BASE =
    import.meta.env.VITE_DETECTION_URL || "http://localhost:8000";
const STREAM_URL =
    import.meta.env.VITE_DETECTION_STREAM_URL || `${DETECTION_BASE}/video_feed`;
const WS_URL =
    import.meta.env.VITE_DETECTION_WS_URL ||
    `${DETECTION_BASE.replace(/^http/, "ws")}/ws/detections`;

function normalizeObjects(message) {
    if (!message) return [];
    const list = Array.isArray(message)
        ? message
        : message.objects || message.detections || [];
    if (!Array.isArray(list)) return [];
    return list.map((o) => ({
        label: o.label || o.class || o.name || "objek",
        confidence:
            typeof o.confidence === "number"
                ? o.confidence
                : typeof o.score === "number"
                ? o.score
                : null,
        box: Array.isArray(o.box)
            ? o.box
            : Array.isArray(o.bbox)
            ? o.bbox
            : null,
    }));
}

function ObjectDetectionDrawer({ open, onClose }) {
    const [status, setStatus] = useState("connecting"); // connecting | live | offline
    const [objects, setObjects] = useState([]);
    const [fps, setFps] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [wsConnected, setWsConnected] = useState(false);
    const [streamKey, setStreamKey] = useState(0);
    const wsRef = useRef(null);
    const panelRef = useRef(null);

    // Catatan: komponen ini di-mount ulang setiap panel dibuka (lihat MainLayout),
    // sehingga state di atas otomatis kembali ke kondisi awal.

    // Kunci scroll body saat panel terbuka
    useEffect(() => {
        if (!open) {
            document.body.style.removeProperty("overflow");
            return;
        }
        document.body.style.overflow = "hidden";
        return () => document.body.style.removeProperty("overflow");
    }, [open]);

    // Escape menutup panel
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    // WebSocket metadata deteksi (opsional; stream tetap jalan tanpanya)
    useEffect(() => {
        if (!open) return;
        let retry = null;
        let closed = false;

        const connect = () => {
            if (closed) return;
            try {
                const ws = new WebSocket(WS_URL);
                wsRef.current = ws;

                ws.onopen = () => setWsConnected(true);

                ws.onmessage = (event) => {
                    try {
                        const payload = JSON.parse(event.data);
                        setObjects(normalizeObjects(payload));
                        if (typeof payload.fps === "number") setFps(payload.fps);
                        setLastUpdate(new Date());
                    } catch {
                        // Abaikan pesan non-JSON
                    }
                };

                ws.onclose = () => {
                    setWsConnected(false);
                    if (!closed) retry = window.setTimeout(connect, 4000);
                };

                ws.onerror = () => ws.close();
            } catch {
                setWsConnected(false);
            }
        };

        connect();

        return () => {
            closed = true;
            if (retry) window.clearTimeout(retry);
            if (wsRef.current) {
                try {
                    wsRef.current.close();
                } catch {
                    /* noop */
                }
            }
        };
    }, [open]);

    const handleImgLoad = useCallback(() => setStatus("live"), []);
    const handleImgError = useCallback(() => setStatus("offline"), []);
    const retry = useCallback(() => {
        setStatus("connecting");
        setStreamKey((k) => k + 1);
    }, []);

    const statusMeta = useMemo(() => {
        switch (status) {
            case "live":
                return { label: "Live", chip: "chip--success" };
            case "connecting":
                return { label: "Menghubungkan…", chip: "chip--warning" };
            case "offline":
                return { label: "Terputus", chip: "chip--danger" };
            default:
                return { label: "Siaga", chip: "chip--neutral" };
        }
    }, [status]);

    if (!open) return null;

    return (
        <div className="detection-root" role="dialog" aria-modal="true" aria-label="Object detection real-time">
            <button
                type="button"
                className="detection-backdrop"
                aria-label="Tutup panel object detection"
                onClick={onClose}
            />

            <aside className="detection-panel" ref={panelRef}>
                <header className="detection-header">
                    <h2 className="font-display text-xl font-semibold text-ink">
                        Object Detection
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className={`chip ${statusMeta.chip}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {statusMeta.label}
                        </span>
                        <button
                            type="button"
                            onClick={onClose}
                            className="detection-close"
                            aria-label="Tutup"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M18 6L6 18" />
                                <path d="M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </header>

                <div className="detection-body">
                    <div className="detection-stage">
                        {status !== "offline" && (
                            <img
                                key={streamKey}
                                src={STREAM_URL}
                                alt="Live feed kamera greenhouse"
                                className="detection-video"
                                onLoad={handleImgLoad}
                                onError={handleImgError}
                            />
                        )}

                        {status === "connecting" && (
                            <div className="detection-overlay-msg">
                                <span className="detection-spinner" />
                                <p>Menghubungkan ke server deteksi…</p>
                                <code className="detection-code">{STREAM_URL}</code>
                            </div>
                        )}

                        {status === "offline" && (
                            <div className="detection-overlay-msg">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                    <path d="M23 7l-7 5 7 5V7z" />
                                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                    <path d="M2 2l20 20" />
                                </svg>
                                <p className="font-semibold text-ink">Server deteksi belum terhubung</p>
                                <p className="max-w-sm text-center text-xs text-mute">
                                    Jalankan server Python Anda, pastikan endpoint stream bisa diakses,
                                    lalu sesuaikan URL di <code>frontend/.env</code> bila perlu.
                                </p>
                                <code className="detection-code">{STREAM_URL}</code>
                                <button type="button" className="detection-retry" onClick={retry}>
                                    Coba lagi
                                </button>
                            </div>
                        )}

                        {/* Overlay bounding box (koordinat ternormalisasi 0-1) */}
                        {status === "live" &&
                            objects.map((o, i) => {
                                if (!o.box || o.box.length < 4) return null;
                                const [x, y, w, h] = o.box;
                                if ([x, y, w, h].some((v) => typeof v !== "number")) return null;
                                if (x > 1.5 || y > 1.5 || w > 1.5 || h > 1.5) return null;
                                return (
                                    <div
                                        key={`${o.label}-${i}`}
                                        className="detection-box"
                                        style={{
                                            left: `${x * 100}%`,
                                            top: `${y * 100}%`,
                                            width: `${w * 100}%`,
                                            height: `${h * 100}%`,
                                        }}
                                    >
                                        <span className="detection-box-label">
                                            {o.label}
                                            {o.confidence !== null
                                                ? ` · ${Math.round(o.confidence * 100)}%`
                                                : ""}
                                        </span>
                                    </div>
                                );
                            })}
                    </div>

                    <div className="detection-stats">
                        <div className="detection-stat">
                            <p className="detection-stat-label">Objek</p>
                            <p className="detection-stat-value">{objects.length}</p>
                        </div>
                        <div className="detection-stat">
                            <p className="detection-stat-label">FPS</p>
                            <p className="detection-stat-value">{fps ?? "—"}</p>
                        </div>
                        <div className="detection-stat">
                            <p className="detection-stat-label">Metadata</p>
                            <p className="detection-stat-value text-[13px]">
                                {wsConnected ? "Terhubung" : "—"}
                            </p>
                        </div>
                        <div className="detection-stat">
                            <p className="detection-stat-label">Pembaruan</p>
                            <p className="detection-stat-value text-[13px] num-tick">
                                {lastUpdate
                                    ? lastUpdate.toLocaleTimeString("id-ID", { hour12: false })
                                    : "—"}
                            </p>
                        </div>
                    </div>

                    <div>
                        <p className="mb-2 text-[11px] font-semibold text-ink">
                            Terdeteksi
                        </p>
                        {objects.length === 0 ? (
                            <p className="text-xs text-mute">
                                Belum ada objek terdeteksi. Pastikan server Python mengirim data
                                metadata ke <code>WS_URL</code>.
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-1.5">
                                {objects.map((o, i) => (
                                    <span key={`${o.label}-chip-${i}`} className="chip chip--info">
                                        {o.label}
                                        {o.confidence !== null
                                            ? ` · ${Math.round(o.confidence * 100)}%`
                                            : ""}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <details className="detection-help">
                        <summary>Konfigurasi server Python</summary>
                        <div className="detection-help-body">
                            <p>
                                Stream MJPEG: <code>{STREAM_URL}</code>
                            </p>
                            <p>
                                Metadata WebSocket: <code>{WS_URL}</code>
                            </p>
                            <p className="text-mute">
                                Atur lewat <code>VITE_DETECTION_URL</code> /{" "}
                                <code>VITE_DETECTION_STREAM_URL</code> /{" "}
                                <code>VITE_DETECTION_WS_URL</code> di <code>frontend/.env</code>,
                                lalu restart <code>npm run dev</code>.
                            </p>
                        </div>
                    </details>
                </div>
            </aside>
        </div>
    );
}

export default ObjectDetectionDrawer;
