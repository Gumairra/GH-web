import { useCallback, useEffect, useState } from "react";
import SensorSection from "../components/SensorSection";
import WaterLevel from "../components/WaterLevel";
import EspSelector from "../components/EspSelector";
import { getLatestSensor, getEsps, getAverageSuhu } from "../services/api";
import { relativeFrom, isOlderThan, isWithin } from "../utils/time";
import "./Dashboard.css";

const POLL_MS = 3 * 60 * 1000;          // data sensor diambil tiap 3 menit
const ONLINE_WINDOW_MS = 10 * 60 * 1000; // ESP dianggap online bila < 10 menit
const STALE_MS = 15 * 60 * 1000;         // data dianggap basi bila > 15 menit

function Dashboard() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [errorDismissed, setErrorDismissed] = useState(false);
    const [esps, setEsps] = useState([]);
    const [selectedEsp, setSelectedEsp] = useState("");
    const [avgSuhu, setAvgSuhu] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);

    // Picu render ulang tiap 30 detik agar label waktu relatif tetap akurat
    const [, setTick] = useState(0);
    useEffect(() => {
        const id = window.setInterval(() => setTick((t) => t + 1), 30000);
        return () => window.clearInterval(id);
    }, []);

    // Ambil daftar ESP terdaftar dari database
    useEffect(() => {
        let isMounted = true;
        getEsps()
            .then((res) => {
                if (isMounted) setEsps(res.data || []);
            })
            .catch(() => {
                // Kalau gagal ambil daftar ESP, dropdown pakai daftar statis
            });
        return () => {
            isMounted = false;
        };
    }, []);

    const load = useCallback(
        async (manual = false) => {
            if (manual) setRefreshing(true);
            try {
                const latest = await getLatestSensor(selectedEsp || undefined);
                setData(latest?.data || null);

                const target = selectedEsp
                    ? [selectedEsp]
                    : esps.map((e) => e.esp_name).filter(Boolean);
                const avg = await getAverageSuhu(target);
                setAvgSuhu(avg?.data?.average_suhu ?? null);

                setError(null);
                setErrorDismissed(false);
                setLastUpdated(new Date());
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
                if (manual) setRefreshing(false);
            }
        },
        [selectedEsp, esps]
    );

    // Ambil data sensor terbaru + rata-rata suhu sesuai ESP terpilih
    useEffect(() => {
        let isMounted = true;

        const run = async () => {
            if (isMounted) await load();
        };

        run();
        const intervalId = setInterval(run, POLL_MS);
        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [load]);

    const sensors = data?.sensors || [];
    const hasData = Boolean(data && sensors.length);
    const abnormal = sensors.filter(
        (s) => s.value !== null && s.value !== undefined && !String(s.status).startsWith("Normal")
    ).length;

    const onlineCount = esps.filter((e) => isWithin(e.last_seen, ONLINE_WINDOW_MS)).length;
    const isStale = isOlderThan(data?.updatedAt, STALE_MS);

    const statusChip = !hasData
        ? { label: "Menunggu data", tone: "chip--neutral" }
        : abnormal > 0
        ? { label: "Perlu perhatian", tone: "chip--warning" }
        : { label: "Normal", tone: "chip--success" };

    const showError = error && !errorDismissed;

    return (
        <div className="dashboard-page mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
            {/* Kepala halaman */}
            <header className="dashboard-head">
                <div>
                    <p className="dashboard-eyebrow">Monitoring</p>
                    <h1 className="font-display dashboard-title">Kondisi Greenhouse</h1>
                    <p className="dashboard-sub">
                        Pemantauan suhu, kelembapan, pH, dan nutrisi air secara langsung.
                    </p>
                </div>

                <div className="dashboard-actions">
                    <button
                        type="button"
                        className="dashboard-refresh"
                        onClick={() => load(true)}
                        disabled={refreshing}
                    >
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            className={refreshing ? "dashboard-refresh-icon is-spinning" : "dashboard-refresh-icon"}
                            aria-hidden="true"
                        >
                            <path d="M21 12a9 9 0 1 1-3.5-7.1" />
                            <path d="M21 3v6h-6" />
                        </svg>
                        {refreshing ? "Memuat…" : "Perbarui"}
                    </button>
                    <p className="dashboard-updated">
                        Diperbarui <span className="num-tick">{relativeFrom(lastUpdated)}</span>
                    </p>
                </div>
            </header>

            {/* Notifikasi error yang bisa ditutup */}
            {showError && (
                <div className="dashboard-alert animate-fade-up" role="alert">
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

            {/* Strip KPI */}
            <section className="dashboard-kpi-grid" aria-label="Ringkasan kondisi greenhouse">
                <article className="kpi-card">
                    <div className="kpi-top">
                        <p className="kpi-label">Status Greenhouse</p>
                        <span className="kpi-icon">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M12 22c0-8-5-13-9-13 0 7 4 13 9 13z" />
                                <path d="M12 22c0-9 5-15 9-15 0 8-4 15-9 15z" />
                                <path d="M12 22V10" />
                            </svg>
                        </span>
                    </div>
                    <p className="kpi-value">
                        <span className={`chip ${statusChip.tone}`}>{statusChip.label}</span>
                    </p>
                    <p className="kpi-foot">
                        {hasData
                            ? abnormal > 0
                                ? `${abnormal} dari ${sensors.length} sensor di luar ambang ideal`
                                : `${sensors.length} sensor dalam ambang ideal`
                            : "Belum ada pembacaan sensor"}
                    </p>
                </article>

                <article className="kpi-card">
                    <div className="kpi-top">
                        <p className="kpi-label">Rata-rata Suhu Udara</p>
                        <span className="kpi-icon">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M10 13V5a2 2 0 1 1 4 0v8a4 4 0 1 1-4 0z" />
                                <path d="M12 9v5" />
                            </svg>
                        </span>
                    </div>
                    <p className="kpi-value num-tick">
                        {avgSuhu !== null && avgSuhu !== undefined ? Number(avgSuhu).toFixed(1) : "—"}
                        <span className="kpi-unit">{avgSuhu !== null && avgSuhu !== undefined ? "°C" : ""}</span>
                    </p>
                    <p className="kpi-foot">{selectedEsp || "Semua ESP"}</p>
                </article>

                <article className="kpi-card">
                    <div className="kpi-top">
                        <p className="kpi-label">ESP Online</p>
                        <span className="kpi-icon">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <rect x="3" y="4" width="18" height="12" rx="2" />
                                <path d="M8 20h8" />
                                <path d="M12 16v4" />
                            </svg>
                        </span>
                    </div>
                    <p className="kpi-value num-tick">
                        {onlineCount}
                        <span className="kpi-unit">/ {esps.length || 0}</span>
                    </p>
                    <p className="kpi-foot">Aktif dalam 10 menit terakhir</p>
                </article>

                <article className="kpi-card">
                    <div className="kpi-top">
                        <p className="kpi-label">Pembacaan Terakhir</p>
                        <span className="kpi-icon">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <circle cx="12" cy="12" r="9" />
                                <path d="M12 7v5l3 2" />
                            </svg>
                        </span>
                    </div>
                    <p className="kpi-value kpi-value--sm num-tick">
                        {data?.updatedAt ? relativeFrom(data.updatedAt) : "—"}
                    </p>
                    <p className="kpi-foot">
                        {data?.esp_name ? `Sumber ${data.esp_name}` : "Belum ada sumber data"}
                    </p>
                </article>
            </section>

            {/* Toolbar pemilih node */}
            <div className="dashboard-toolbar">
                <div className="flex items-center gap-2">
                    <span className="dashboard-toolbar-label">Pilih ESP / Node</span>
                    <EspSelector value={selectedEsp} onChange={setSelectedEsp} esps={esps} />
                </div>

                <div className="flex items-center gap-2">
                    {isStale && (
                        <span className="chip chip--warning">
                            Data {relativeFrom(data.updatedAt)}
                        </span>
                    )}
                    {data?.esp_name && <span className="chip chip--neutral">{data.esp_name}</span>}
                </div>
            </div>

            <SensorSection sensors={sensors} loading={loading} updatedAt={data?.updatedAt} />

            <WaterLevel
                percent={data?.waterLevel?.percent ?? 0}
                height={data?.waterLevel?.height ?? 0}
                status={data?.waterLevel?.status ?? "Tidak ada data"}
            />
        </div>
    );
}

export default Dashboard;
