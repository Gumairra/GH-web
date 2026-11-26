import { useCallback, useEffect, useMemo, useState } from "react";
import LineChart from "../components/LineChart";
import {
    getSensorHistory,
    getActuatorUsage,
    exportSensorExcel,
} from "../services/api";
import { relativeFrom } from "../utils/time";
import "./Statistics.css";

const POLL_MS = 3 * 60 * 1000;

const RANGES = [
    { key: "today", label: "Hari Ini" },
    { key: "week", label: "7 Hari" },
    { key: "month", label: "30 Hari" },
];

// Ambil warna grafik dari design token agar tidak ada hex liar di JSX.
function readToken(name, fallback) {
    if (typeof window === "undefined") return fallback;
    const value = getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
    return value || fallback;
}

function readChartColors() {
    return {
        clay: readToken("--color-clay", "#c97b3e"),
        blue: readToken("--color-blue", "#3e7fc9"),
        leaf: readToken("--color-leaf", "#2f6b4f"),
    };
}

const withAlpha = (hex, suffix) => `${hex}${suffix}`;

function Statistics() {
    const [activeRange, setActiveRange] = useState("today");
    const [history, setHistory] = useState(null);
    const [actuatorUsage, setActuatorUsage] = useState([]);
    const [error, setError] = useState(null);
    const [errorDismissed, setErrorDismissed] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const colors = useMemo(() => readChartColors(), []);

    useEffect(() => {
        let isMounted = true;

        const load = () => {
            Promise.all([getSensorHistory(activeRange), getActuatorUsage(activeRange)])
                .then(([historyRes, usageRes]) => {
                    if (!isMounted) return;
                    setHistory(historyRes.data);
                    setActuatorUsage(usageRes.data || []);
                    setError(null);
                    setErrorDismissed(false);
                    setLastUpdated(new Date());
                })
                .catch((err) => {
                    if (isMounted) setError(err.message);
                })
                .finally(() => {
                    if (isMounted) setLoading(false);
                });
        };

        load();
        // Pengambilan data otomatis setiap 3 menit (180.000 ms),
        // sesuai interval yang diminta agar tidak membebani server.
        const intervalId = setInterval(load, POLL_MS);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [activeRange]);

    const handleExport = useCallback(async () => {
        setExporting(true);
        try {
            await exportSensorExcel(activeRange);
            setError(null);
        } catch (err) {
            setError(`Gagal mengunduh Excel: ${err.message}`);
            setErrorDismissed(false);
        } finally {
            setExporting(false);
        }
    }, [activeRange]);

    const summary = history?.summary || {};
    const labels = history?.labels || [];
    const hasData = labels.length > 0;
    const maxUsage = Math.max(1, ...actuatorUsage.map((a) => a.percent || 0));
    const showError = error && !errorDismissed;

    const summaryCards = [
        { label: "Suhu Udara", value: fmt(summary.suhu_udara, "°C") },
        { label: "Kelembapan", value: fmt(summary.humidity, "%RH") },
        { label: "pH Air", value: fmt(summary.ph_air, "pH") },
        { label: "Suhu Air", value: fmt(summary.suhu_air, "°C") },
        { label: "TDS Air", value: fmt(summary.tds, "ppm") },
        { label: "Ketinggian Air", value: fmt(summary.water_level_percent, "%") },
    ];

    return (
        <div className="statistics-page mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
            <header className="statistics-head">
                <div>
                    <h1 className="font-display statistics-title">Riwayat &amp; Analisis</h1>
                    <p className="statistics-sub">
                        Tren pembacaan sensor dan pemakaian aktuator pada rentang terpilih.
                    </p>
                </div>
            </header>

            {/* Toolbar lengket: filter rentang + unduh */}
            <div className="statistics-toolbar">
                <div className="statistics-range-group" role="group" aria-label="Rentang waktu">
                    {RANGES.map((range) => (
                        <button
                            key={range.key}
                            type="button"
                            onClick={() => {
                                if (range.key !== activeRange) {
                                    setLoading(true);
                                    setActiveRange(range.key);
                                }
                            }}
                            className={`statistics-range-button ${
                                activeRange === range.key ? "statistics-range-button--active" : ""
                            }`}
                            aria-pressed={activeRange === range.key}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>

                <div className="statistics-toolbar-right">
                    <span className="statistics-updated">
                        Diperbarui <span className="num-tick">{relativeFrom(lastUpdated)}</span>
                    </span>

                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={exporting}
                        className="statistics-export"
                        title="Unduh data sensor & pemakaian aktuator sebagai file Excel"
                    >
                        {exporting ? (
                            <span className="statistics-export-spinner" aria-hidden="true" />
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M12 3v12" />
                                <path d="M7 11l5 5 5-5" />
                                <path d="M4 20h16" />
                            </svg>
                        )}
                        {exporting ? "Menyiapkan…" : "Unduh Excel"}
                    </button>
                </div>
            </div>

            {showError && (
                <div className="statistics-alert" role="alert">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 8v4" />
                        <path d="M12 16h.01" />
                    </svg>
                    <p>Gagal memuat data dari server: {error}</p>
                    <button type="button" onClick={() => setErrorDismissed(true)} aria-label="Tutup notifikasi">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M18 6L6 18" />
                            <path d="M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Ringkasan */}
            <section className="statistics-summary-grid" aria-label="Ringkasan nilai terakhir">
                {loading && !history
                    ? [0, 1, 2, 3, 4, 5].map((i) => (
                          <div key={`sum-skeleton-${i}`} className="statistics-summary-card statistics-summary-card--skeleton">
                              <div className="skeleton h-2.5 w-20" />
                              <div className="skeleton mt-3 h-6 w-24" />
                          </div>
                      ))
                    : summaryCards.map((card) => (
                          <div key={card.label} className="statistics-summary-card">
                              <p className="statistics-summary-label">{card.label}</p>
                              <p className="statistics-summary-value">{card.value}</p>
                          </div>
                      ))}
            </section>

            {!loading && !hasData ? (
                <section className="statistics-empty card-surface">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 3v18h18" />
                        <path d="M7 14l3-4 3 3 4-6" />
                    </svg>
                    <p className="font-semibold text-ink">Belum ada data pada rentang ini</p>
                    <p className="text-xs text-mute">
                        Coba pilih rentang lain atau tunggu ESP mengirim pembacaan baru.
                    </p>
                </section>
            ) : (
                <section className="statistics-chart-grid">
                    <article className="statistics-chart-card card-surface">
                        <div className="statistics-chart-head">
                            <div>
                                <p className="statistics-chart-title">Suhu Udara &amp; Suhu Air</p>
                                <p className="statistics-chart-sub">Satuan °C</p>
                            </div>
                            <div className="statistics-legend">
                                <span><i className="statistics-dot" style={{ background: colors.clay }} />Udara</span>
                                <span><i className="statistics-dot" style={{ background: colors.blue }} />Air</span>
                            </div>
                        </div>
                        <div className="statistics-chart-body">
                            <LineChart
                                labels={labels}
                                datasets={[
                                    {
                                        label: "Udara",
                                        data: history?.suhu_udara || [],
                                        borderColor: colors.clay,
                                        backgroundColor: withAlpha(colors.clay, "22"),
                                        borderWidth: 2,
                                        pointRadius: 0,
                                        tension: 0.35,
                                    },
                                    {
                                        label: "Air",
                                        data: history?.suhu_air || [],
                                        borderColor: colors.blue,
                                        backgroundColor: withAlpha(colors.blue, "22"),
                                        borderWidth: 2,
                                        pointRadius: 0,
                                        tension: 0.35,
                                    },
                                ]}
                            />
                        </div>
                    </article>

                    <article className="statistics-chart-card card-surface">
                        <div className="statistics-chart-head">
                            <div>
                                <p className="statistics-chart-title">Kelembapan Udara</p>
                                <p className="statistics-chart-sub">Target ideal 60–80 %RH</p>
                            </div>
                            <div className="statistics-legend">
                                <span><i className="statistics-dot" style={{ background: colors.leaf }} />%RH</span>
                            </div>
                        </div>
                        <div className="statistics-chart-body">
                            <LineChart
                                labels={labels}
                                datasets={[
                                    {
                                        label: "Kelembapan",
                                        data: history?.humidity || [],
                                        borderColor: colors.leaf,
                                        backgroundColor: withAlpha(colors.leaf, "1f"),
                                        borderWidth: 2,
                                        pointRadius: 0,
                                        tension: 0.35,
                                        fill: true,
                                    },
                                ]}
                            />
                        </div>
                    </article>

                    <article className="statistics-chart-card card-surface">
                        <div className="statistics-chart-head">
                            <div>
                                <p className="statistics-chart-title">pH Air &amp; TDS</p>
                                <p className="statistics-chart-sub">Dua sumbu berbeda skala</p>
                            </div>
                            <div className="statistics-legend">
                                <span><i className="statistics-dot" style={{ background: colors.leaf }} />pH</span>
                                <span><i className="statistics-dot" style={{ background: colors.blue }} />TDS (ppm)</span>
                            </div>
                        </div>
                        <div className="statistics-chart-body">
                            <LineChart
                                labels={labels}
                                datasets={[
                                    {
                                        label: "pH",
                                        data: history?.ph_air || [],
                                        borderColor: colors.leaf,
                                        backgroundColor: withAlpha(colors.leaf, "22"),
                                        borderWidth: 2,
                                        pointRadius: 0,
                                        tension: 0.35,
                                    },
                                    {
                                        label: "TDS",
                                        data: history?.tds || [],
                                        borderColor: colors.blue,
                                        backgroundColor: withAlpha(colors.blue, "22"),
                                        borderWidth: 2,
                                        pointRadius: 0,
                                        tension: 0.35,
                                    },
                                ]}
                            />
                        </div>
                    </article>

                    <article className="statistics-chart-card card-surface">
                        <div className="statistics-chart-head">
                            <div>
                                <p className="statistics-chart-title">Ketinggian Air Tandon</p>
                                <p className="statistics-chart-sub">
                                    Turun menandakan konsumsi, naik menandakan pengisian
                                </p>
                            </div>
                            <div className="statistics-legend">
                                <span><i className="statistics-dot" style={{ background: colors.blue }} />%</span>
                            </div>
                        </div>
                        <div className="statistics-chart-body">
                            <LineChart
                                type="bar"
                                labels={labels}
                                datasets={[
                                    {
                                        label: "Ketinggian Air",
                                        data: history?.water_level_percent || [],
                                        backgroundColor: withAlpha(colors.blue, "55"),
                                        borderColor: colors.blue,
                                        borderWidth: 1,
                                        borderRadius: 4,
                                    },
                                ]}
                            />
                        </div>
                    </article>
                </section>
            )}

            {/* Pemakaian aktuator */}
            <section className="statistics-actuator card-surface">
                <div className="statistics-chart-head">
                    <div>
                        <p className="statistics-chart-title">Pemakaian Aktuator</p>
                        <p className="statistics-chart-sub">
                            Total durasi aktif dan jumlah penyalaan pada rentang terpilih
                        </p>
                    </div>
                </div>

                {actuatorUsage.length === 0 ? (
                    <p className="statistics-actuator-empty">Belum ada data pemakaian aktuator.</p>
                ) : (
                    <div className="statistics-actuator-list">
                        {actuatorUsage.map((item) => (
                            <div key={item.name} className="statistics-actuator-row">
                                <div className="statistics-actuator-top">
                                    <p className="statistics-actuator-name">{item.name}</p>
                                    <span className="chip chip--neutral">{item.count}×</span>
                                </div>
                                <div className="statistics-actuator-bar">
                                    <span
                                        className="statistics-actuator-fill usage-bar"
                                        style={{ width: `${Math.max(4, (item.percent / maxUsage) * 100)}%` }}
                                    />
                                </div>
                                <p className="statistics-actuator-note">Durasi aktif: {item.time}</p>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

function fmt(value, unit) {
    if (value === null || value === undefined) return "—";
    return `${Number(value)} ${unit}`;
}

export default Statistics;
