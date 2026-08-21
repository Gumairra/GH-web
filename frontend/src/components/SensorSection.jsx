import SensorCard from "./SensorCard";
import "./SensorSection.css";

function SensorSection({ sensors = [] }) {
    return (
        <section className="sensor-section mb-8">
            <div className="sensor-section-header mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <p className="sensor-section-eyebrow text-[11px] tracking-[0.2em] text-mute uppercase font-semibold">
                        Kondisi Lingkungan
                    </p>
                    <p className="sensor-section-title mt-1 text-sm font-medium text-ink">
                        Data sensor greenhouse secara real-time
                    </p>
                </div>
                <p className="sensor-section-meta text-xs text-mute">Update terbaru setiap saat</p>
            </div>

            <div className="sensor-section-grid grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {sensors.length === 0 && (
                    <p className="text-sm text-mute col-span-full">Belum ada data sensor.</p>
                )}

                {sensors.map((s) => (
                    <SensorCard
                        key={s.title}
                        title={s.title}
                        sensors={s.sensors}
                        value={
                            s.value === null || s.value === undefined
                                ? "-"
                                : Math.round(s.value * 100) / 100
                        }
                        unit={s.unit}
                        status={s.status}
                        progress={s.progress}
                    />
                ))}
            </div>
        </section>
    );
}

export default SensorSection;
