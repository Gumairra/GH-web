import "./SensorCard.css";

// Tentukan nada warna kartu dari label status yang dikirim backend
function toneFor(status) {
    if (!status) return "neutral";
    if (status.startsWith("Normal")) return "success";
    if (status.startsWith("Rendah") || status.startsWith("Tinggi")) return "warning";
    if (status.startsWith("Tidak")) return "neutral";
    return "info";
}

function SensorCard({
    title,
    value,
    unit,
    status,
    icon,
    sensors,
    esp_name,
    progress = 0,
}) {
    const tone = toneFor(status);
    const width = `${Math.max(6, Math.min(progress, 100))}%`;

    return (
        <article className="sensor-card card-surface card-surface--hover">
            <div className="sensor-card-head">
                <div className="min-w-0">
                    <p className="sensor-card-title">{title}</p>
                    <p className="sensor-card-sensors">
                        {sensors}
                        {esp_name ? ` · ${esp_name}` : ""}
                    </p>
                </div>

                <div className={`sensor-card-icon sensor-card-icon--${tone}`}>
                    {icon}
                </div>
            </div>

            <div className="sensor-card-value-row">
                <span className="sensor-card-value">{value}</span>
                <span className="sensor-card-unit">{unit}</span>
            </div>

            <div className="sensor-card-foot">
                <div className="sensor-card-bar">
                    <span
                        className={`sensor-card-bar-fill sensor-card-bar-fill--${tone}`}
                        style={{ width }}
                    />
                </div>
                <span className={`chip chip--${tone} sensor-card-status`}>{status}</span>
            </div>
        </article>
    );
}

export default SensorCard;
