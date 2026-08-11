import { useState } from "react";
import Header from "../components/Header";
import LineChart from "../components/LineChart";
import "./Statistics.css";

const summaryCards = [
    { label: "Suhu Udara", value: "28.4 °C" },
    { label: "Kelembapan", value: "68 %RH" },
    { label: "pH Air", value: "6.50 pH" },
    { label: "Suhu Air", value: "24.8 °C" },
    { label: "TDS Air", value: "850 ppm" },
    { label: "Ketinggian Air", value: "62 %" },
];

const actuatorUsage = [
    { name: "Pompa Air", time: "14 min", count: "6 kali" },
    { name: "Lampu LED", time: "8 jam", count: "18 kali" },
    { name: "Exhaust Fan", time: "3 jam", count: "9 kali" },
];

function Statistics() {
    const [activeRange, setActiveRange] = useState("today");

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
                            labels={["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"]}
                            datasets={[
                                {
                                    label: "Udara",
                                    data: [27.2, 27.8, 29.1, 30.2, 29.4, 28.4],
                                    borderColor: "#C97B3E",
                                    backgroundColor: "#C97B3E22",
                                    borderWidth: 2,
                                    pointRadius: 0,
                                    tension: 0.35,
                                },
                                {
                                    label: "Air",
                                    data: [24.1, 24.4, 24.8, 25.2, 25.0, 24.8],
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
                            labels={["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"]}
                            datasets={[
                                {
                                    label: "Kelembapan",
                                    data: [72, 69, 67, 64, 70, 68],
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
                            labels={["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"]}
                            datasets={[
                                {
                                    label: "pH",
                                    data: [6.4, 6.5, 6.6, 6.5, 6.4, 6.5],
                                    borderColor: "#2F6B4F",
                                    backgroundColor: "#2F6B4F22",
                                    borderWidth: 2,
                                    pointRadius: 0,
                                    tension: 0.35,
                                },
                                {
                                    label: "TDS",
                                    data: [820, 840, 860, 890, 870, 850],
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
                            labels={["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"]}
                            datasets={[
                                {
                                    label: "Ketinggian Air",
                                    data: [70, 67, 63, 58, 60, 62],
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
                    {actuatorUsage.map((item) => (
                        <div key={item.name} className="rounded-2xl border border-line bg-white/70 p-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-ink">{item.name}</p>
                                <p className="text-xs text-mute">{item.count}</p>
                            </div>
                            <div className="h-2.5 rounded-full bg-[#E7E2D8] overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-leaf usage-bar"
                                    style={{ width: item.name === "Pompa Air" ? "72%" : item.name === "Lampu LED" ? "56%" : "38%" }}
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

export default Statistics;