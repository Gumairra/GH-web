import "./WaterLevel.css";

const MIN_PERCENT = 40;

function toneFor(percent, status) {
    if (!percent) return "neutral";
    if (status && status.startsWith("Tidak")) return "neutral";
    if (percent < 25) return "danger";
    if (percent < MIN_PERCENT) return "warning";
    return "success";
}

function WaterLevel({ percent = 0, height = 0, status = "Cukup" }) {
    const safePercent = Math.max(0, Math.min(Number(percent) || 0, 100));
    const tone = toneFor(safePercent, status);

    return (
        <article className="waterlevel-card card-surface">
            <div className="waterlevel-head">
                <div>
                    <p className="waterlevel-title">Ketinggian Air Tandon</p>
                    <p className="waterlevel-caption">Kapasitas tandon air greenhouse</p>
                </div>

                <span className={`chip chip--${tone}`}>{status}</span>
            </div>

            <div className="waterlevel-body">
                <div className="waterlevel-tank" role="img" aria-label={`Ketinggian air ${safePercent} persen`}>
                    <div
                        className={`waterlevel-fill waterlevel-fill--${tone}`}
                        style={{ height: `${safePercent}%` }}
                    />

                    {/* Penanda level minimum */}
                    <div className="waterlevel-min" style={{ bottom: `${MIN_PERCENT}%` }}>
                        <span className="waterlevel-min-label">min {MIN_PERCENT}%</span>
                    </div>

                    <span className="waterlevel-percent">{safePercent}%</span>
                </div>

                <div className="waterlevel-info">
                    <div>
                        <p className="waterlevel-label">Ketinggian</p>
                        <p className="waterlevel-value">
                            {height === null || height === undefined || Number(height) === 0
                                ? "—"
                                : `${height} cm`}
                        </p>
                    </div>

                    <div>
                        <p className="waterlevel-label">Status level</p>
                        <p className={`waterlevel-state waterlevel-state--${tone}`}>
                            {tone === "danger"
                                ? "Kritis — segera isi tandon"
                                : tone === "warning"
                                ? "Di bawah batas aman"
                                : tone === "neutral"
                                ? "Menunggu data sensor"
                                : "Level aman"}
                        </p>
                    </div>

                    <p className="waterlevel-note">
                        Batas minimum aman {MIN_PERCENT}% dari kapasitas maksimum tandon.
                    </p>
                </div>
            </div>
        </article>
    );
}

export default WaterLevel;
