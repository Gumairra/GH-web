function AverageTemperature({ average, espLabel }) {
    return (
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-ink">
                Rata-rata Suhu Udara {espLabel ? `(${espLabel})` : "Semua ESP"}
            </p>
            <p className="mt-1 text-2xl font-bold text-[#243033]">
                {average !== null && average !== undefined ? `${average} °C` : "-"}
            </p>
        </div>
    );
}

export default AverageTemperature;
