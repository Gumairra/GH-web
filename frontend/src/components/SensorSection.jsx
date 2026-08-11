import SensorCard from "./SensorCard";
import "./SensorSection.css";

function SensorSection() {
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

            <SensorCard
            title="Suhu Udara"
            sensors="DHT22"
            value="28.4"
            unit="°C"
            status="Normal · 20-32°C"
            progress={71}
            />

            <SensorCard
            title="Kelembapan"
            sensors="DHT22"
            value="68"
            unit="%RH"
            status="Normal · 60-80%"
            progress={68}
            />

            <SensorCard
            title="pH Air"
            sensors="ph"
            value="6.5"
            unit="pH"
            status="Normal · 6.0-7.0"
            progress={72}
            />

            <SensorCard
            title="PPM Air"
            sensors="turbidity"
            value="600"
            unit="ppm"
            status="Normal · 600-1200 ppm"
            progress={71}
            />

            <SensorCard
            title="TDS Air"
            sensors="tds"
            value="850"
            unit="ppm"
            status="Normal · 650-1200 ppm"
            progress={43}
            />

        </div>
        </section>
    );
}

export default SensorSection;