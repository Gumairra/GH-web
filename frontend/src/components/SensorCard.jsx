import "./SensorCard.css";

function SensorCard({
    title,
    value,
    unit,
    status,
    icon,
    sensors,
    progress = 0,
}) {
    return (
        <article className="sensor-card flex min-h-[180px] flex-col justify-between px-5 py-5">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <p className="sensor-card-title text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f7882]">
                        {title}
                    </p>
                    <p className="sensor-card-sensors text-[11px] font-medium text-[#6f7882]">
                        {sensors}
                    </p>

                    <div className="flex items-end gap-1">
                        <span className="sensor-card-value font-mono text-[30px] font-semibold leading-none text-[#243033]">
                            {value}
                        </span>
                        <span className="sensor-card-unit pb-[2px] text-[12px] text-[#6f7882]">{unit}</span>
                    </div>
                </div>

                <div className="sensor-card-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef5ef] text-[#2f6b4f]">
                    {icon}
                </div>
            </div>

            <div className="mt-4">
                <div className="h-1.5 overflow-hidden rounded-full bg-[#f1eee6]">
                    <div
                        className="h-full rounded-full bg-[#2f6b4f] transition-all duration-500"
                        style={{ width: `${Math.max(6, Math.min(progress, 100))}%` }}
                    />
                </div>

                <p className="sensor-card-status mt-2 text-[11px] font-medium text-[#1f4a37]">{status}</p>
            </div>
        </article>
    );
}

export default SensorCard;
