import SensorCard from "./SensorCard";
import { relativeFrom } from "../utils/time";
import "./SensorSection.css";

// Ikon garis sederhana per sensor, memakai currentColor agar ikut tema
const ICONS = {
    "Suhu Udara": (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 13V5a2 2 0 1 1 4 0v8a4 4 0 1 1-4 0z" />
            <path d="M12 9v5" />
        </svg>
    ),
    Kelembapan: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3s6 6.3 6 10a6 6 0 1 1-12 0c0-3.7 6-10 6-10z" />
        </svg>
    ),
    "pH Air": (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 3h6" />
            <path d="M10 3v6.2L5.6 17a3 3 0 0 0 2.6 4.5h7.6a3 3 0 0 0 2.6-4.5L14 9.2V3" />
            <path d="M7.5 15h9" />
        </svg>
    ),
    "PPM Air": (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 8c2 0 2.5-1.5 5-1.5S9.5 8 12 8s2.5-1.5 5-1.5S20.5 8 22 8" />
            <path d="M2 13c2 0 2.5-1.5 5-1.5S9.5 13 12 13s2.5-1.5 5-1.5S20.5 13 22 13" />
            <path d="M2 18c2 0 2.5-1.5 5-1.5S9.5 18 12 18s2.5-1.5 5-1.5S20.5 18 22 18" />
        </svg>
    ),
    "TDS Air": (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 21a8 8 0 1 0-8-8" />
            <path d="M12 17a4 4 0 1 0-4-4" />
            <path d="M12 13h.01" />
            <path d="M4 3v4h4" />
        </svg>
    ),
};

function SensorSection({ sensors = [], loading = false, updatedAt = null }) {
    const skeletons = [0, 1, 2, 3, 4];

    return (
        <section className="sensor-section mb-8">
            <div className="sensor-section-header">
                <div>
                    <p className="sensor-section-eyebrow">Kondisi Lingkungan</p>
                    <h2 className="font-display sensor-section-title">Data sensor greenhouse</h2>
                </div>
                <p className="sensor-section-meta">
                    {loading
                        ? "Memuat data sensor…"
                        : updatedAt
                        ? `Pembacaan ${relativeFrom(updatedAt)}`
                        : "Belum ada pembacaan"}
                </p>
            </div>

            <div className="sensor-section-grid">
                {loading &&
                    skeletons.map((i) => (
                        <article key={`skeleton-${i}`} className="sensor-skeleton">
                            <div className="flex items-start justify-between">
                                <div className="skeleton h-3 w-24" />
                                <div className="skeleton h-11 w-11 rounded-2xl" />
                            </div>
                            <div className="skeleton mt-5 h-8 w-28" />
                            <div className="skeleton mt-5 h-1.5 w-full" />
                            <div className="skeleton mt-2.5 h-2.5 w-32" />
                        </article>
                    ))}

                {!loading && sensors.length === 0 && (
                    <div className="sensor-empty">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M3 3v18h18" />
                            <path d="M7 14l3-4 3 3 4-6" />
                        </svg>
                        <p className="font-semibold text-ink">Belum ada data sensor</p>
                        <p className="text-xs text-mute">
                            Data akan muncul setelah ESP induk mengirim pembacaan melalui MQTT.
                        </p>
                    </div>
                )}

                {!loading &&
                    sensors.map((s) => (
                        <SensorCard
                            key={s.title}
                            title={s.title}
                            sensors={s.sensors}
                            icon={ICONS[s.title]}
                            value={
                                s.value === null || s.value === undefined
                                    ? "-"
                                    : Math.round(s.value * 100) / 100
                            }
                            unit={s.unit}
                            status={s.status}
                            esp_name={s.esp_name}
                            progress={s.progress}
                        />
                    ))}
            </div>
        </section>
    );
}

export default SensorSection;
