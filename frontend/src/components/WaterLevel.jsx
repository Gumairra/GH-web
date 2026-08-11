import "./WaterLevel.css";

function WaterLevel({
    percent = 62,
    height = 22.8,
    status = "Cukup",
    }) {
    return (
        <article className="waterlevel-card p-6">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <p className="waterlevel-title text-sm font-semibold text-ink">Ketinggian Air Tandon</p>
                    <p className="waterlevel-caption mt-0.5 text-xs text-mute">Kapasitas tandon air</p>
                </div>

                <span className="waterlevel-badge rounded-full bg-leaf-light px-2.5 py-1 text-[11px] font-semibold text-leaf-dark">
                    {status}
                </span>
            </div>

            <div className="flex items-center gap-6">
                <div className="waterlevel-tank relative h-48 w-24 overflow-hidden rounded-[32px] border-2 border-line bg-white/90 shadow-inner">
                    <div
                        className="waterlevel-fill absolute bottom-0 left-0 right-0 bg-azure transition-all duration-700"
                        style={{ height: `${percent}%` }}
                    />

                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="waterlevel-percent font-mono text-2xl font-semibold text-ink">{percent}%</span>
                    </div>
                </div>

                <div>
                    <p className="waterlevel-label text-[11px] uppercase tracking-[0.2em] text-mute">Ketinggian</p>
                    <p className="waterlevel-value mt-1 font-mono text-[28px] font-semibold text-ink">{height} cm</p>
                    <p className="waterlevel-note mt-2 text-xs text-mute">dari kapasitas maksimum</p>
                </div>
            </div>
        </article>
    );
}

export default WaterLevel;