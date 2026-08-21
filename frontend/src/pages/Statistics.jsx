import { useEffect, useState } from "react";
import Header from "../components/Header";
import LineChart from "../components/LineChart";
import { getSensorHistory, getActuatorUsage } from "../services/api";
import "./Statistics.css";

function Statistics() {
    const [activeRange, setActiveRange] = useState("today");
    const [history, setHistory] = useState(null);
    const [actuatorUsage, setActuatorUsage] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const load = () => {
            Promise.all([
                getSensorHistory(activeRange),
                getActuatorUsage(activeRange),
            ])
                .then(([historyRes, usageRes]) => {
                    if (!isMounted) return;
                    setHistory(historyRes.data);
                    setActuatorUsage(usageRes.data);
                    setError(null);
                })
                .catch((err) => {
                    if (isMounted) setError(err.message);
                });
        };

        load();
        // Auto-refresh biar data terbaru dari ESP32 langsung kelihatan
        // tanpa perlu reload manual. 15 detik dipilih karena endpoint
        // ini menghitung agregat (AVG per jam/hari), jadi tidak perlu
        // sesering polling data terbaru (5 detik) di halaman Monitoring.
        const intervalId = setInterval(load, 15000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [activeRange]);

    const summary = history?.summary || {};

    const summaryCards = [
        { label: "Suhu Udara", value: fmt(summary.suhu_udara, "°C") },
        { label: "Kelembapan", value: fmt(summary.humidity, "%RH") },
        { label: "pH Air", value: fmt(summary.ph_air, "pH") },
        { label: "Suhu Air", value: fmt(summary.suhu_air, "°C") },
        { label: "TDS Air", value: fmt(summary.tds, "ppm") },
        { label: "Ketinggian Air", value: fmt(summary.water_level_percent, "%") },
    ];

    const labels = history?.labels || [];
    const maxUsage = Math.max(1, ...actuatorUsage.map((a) => a.percent || 0));

    return (
        <div className="statistics-page mx-auto max-w-7xl px-5 py-8 sm:px-8">
            <Header />

            <div className="statistics-intro flex items-center justify-between flex-wrap gap-3 mb-6">
                <p className="text-sm text-mute">
                    Menampilkan riwayat data sensor dan pemakaian aktuator
                </p>
                <div className="statistics-range-group flex items-center gap-1 rounded-full border border-line bg-white/90 p-1 shadow-sm">
                    {[
                        { key: "today", label: "Hari Ini" },
                        { key: "week", label: "7 Hari" },
                        { key: "month", label: "30 Hari" },
                    ].map((range) => (
                        <button
                            key={range.key}
                            type="button"
                            onClick={() => setActiveRange(range.key)}
                            className={`statistics-range-button text-xs font-medium px-3.5 py-1.5 rounded-full transition-colors ${
                                activeRange === range.key
                                    ? "statistics-range-button--active"
                                    : ""
                            }`}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <p className="text-xs text-red-600 mb-4">
                    Gagal memuat data dari server: {error}
                </p>
            )}

            <section id="summaryGrid" className="statistics-summary-grid grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                {summaryCards.map((card) => (
                    <div key={card.label} className="statistics-summary-card p-4">
                        <p className="statistics-summary-label text-[11px] tracking-[0.16em] text-mute uppercase font-semibold">
                            {card.label}
                        </p>
                        <p className="statistics-summary-value mt-2 font-mono text-xl font-semibold text-ink">{card.value}</p>
                    </div>
                ))}
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <article className="bg-card border border-line rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-ink">Suhu Udara & Suhu Air</p>
                        <div className="flex items-center gap-3 text-[11px] text-mute">
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-clay inline-block"></span>
                                Udara
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-blue inline-block"></span>
                                Air
                            </span>
                        </div>
                    </div>
                    <p className="text-xs text-mute mb-3">Satuan °C</p>
                    <div className="h-56">
                        <LineChart
                            labels={labels}
                            datasets={[
                                {
                                    label: "Udara",
                                    data: history?.suhu_udara || [],
                                    borderColor: "#C97B3E",
                                    backgroundColor: "#C97B3E22",
                                    borderWidth: 2,
                                    pointRadius: 0,
                                    tension: 0.35,
                                },
                                {
                                    label: "Air",
                                    data: history?.suhu_air || [],
                                    borderColor: "#3E7FC9",
                                    backgroundColor: "#3E7FC922",
                                    borderWidth: 2,
                                    pointRadius: 0,
                                    tension: 0.35,
                                },
                            ]}
                        />
                    </div>
                </article>

                <article className="bg-card border border-line rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-ink">Kelembapan Udara</p>
                        <span className="text-[11px] text-mute flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-leaf inline-block"></span>
                            %RH
                        </span>
                    </div>
                    <p className="text-xs text-mute mb-3">Target ideal 60–80%</p>
                    <div className="h-56">
                        <LineChart
                            labels={labels}
                            datasets={[
                                {
                                    label: "Kelembapan",
                                    data: history?.humidity || [],
                                    borderColor: "#2F6B4F",
                                    backgroundColor: "#2F6B4F22",
                                    borderWidth: 2,
                                    pointRadius: 0,
                                    tension: 0.35,
                                    fill: true,
                                },
                            ]}
                        />
                    </div>
                </article>

                <article className="bg-card border border-line rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-ink">pH Air & TDS</p>
                        <div className="flex items-center gap-3 text-[11px] text-mute">
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-leaf inline-block"></span>
                                pH
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-blue inline-block"></span>
                                TDS (ppm)
                            </span>
                        </div>
                    </div>
                    <p className="text-xs text-mute mb-3">Dua sumbu berbeda skala</p>
                    <div className="h-56">
                        <LineChart
                            labels={labels}
                            datasets={[
                                {
                                    label: "pH",
                                    data: history?.ph_air || [],
                                    borderColor: "#2F6B4F",
                                    backgroundColor: "#2F6B4F22",
                                    borderWidth: 2,
                                    pointRadius: 0,
                                    tension: 0.35,
                                },
                                {
                                    label: "TDS",
                                    data: history?.tds || [],
                                    borderColor: "#3E7FC9",
                                    backgroundColor: "#3E7FC922",
                                    borderWidth: 2,
                                    pointRadius: 0,
                                    tension: 0.35,
                                },
                            ]}
                        />
                    </div>
                </article>

                <article className="bg-card border border-line rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-ink">Ketinggian Air Tandon</p>
                        <span className="text-[11px] text-mute flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-blue inline-block"></span>
                            %
                        </span>
                    </div>
                    <p className="text-xs text-mute mb-3">
                        Penurunan menandakan konsumsi, lonjakan menandakan pengisian pompa
                    </p>
                    <div className="h-56">
                        <LineChart
                            type="bar"
                            labels={labels}
                            datasets={[
                                {
                                    label: "Ketinggian Air",
                                    data: history?.water_level_percent || [],
                                    backgroundColor: "#3E7FC955",
                                    borderColor: "#3E7FC9",
                                    borderWidth: 1,
                                    borderRadius: 4,
                                },
                            ]}
                        />
                    </div>
                </article>
            </section>

            <section className="bg-card border border-line rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <p className="text-sm font-medium text-ink">Pemakaian Aktuator</p>
                        <p className="text-xs text-mute mt-0.5">
                            Total durasi aktif dan jumlah penyalaan pada rentang terpilih
                        </p>
                    </div>
                </div>
                <div className="space-y-4">
                    {actuatorUsage.length === 0 && (
                        <p className="text-sm text-mute">Belum ada data pemakaian aktuator.</p>
                    )}

                    {actuatorUsage.map((item) => (
                        <div key={item.name} className="rounded-2xl border border-line bg-white/70 p-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-ink">{item.name}</p>
                                <p className="text-xs text-mute">{item.count}</p>
                            </div>
                            <div className="h-2.5 rounded-full bg-[#E7E2D8] overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-leaf usage-bar"
                                    style={{ width: `${Math.max(4, (item.percent / maxUsage) * 100)}%` }}
                                />
                            </div>
                            <p className="text-xs text-mute mt-2">Durasi aktif: {item.time}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

function fmt(value, unit) {
    if (value === null || value === undefined) return "-";
    return `${Number(value)} ${unit}`;
}

export default Statistics;
