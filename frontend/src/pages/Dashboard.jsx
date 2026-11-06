import { useEffect, useState } from "react";
import Header from "../components/Header";
import SensorSection from "../components/SensorSection";
import WaterLevel from "../components/WaterLevel";
import { getLatestSensor, getEsps, getAverageSuhu } from "../services/api";
import EspSelector from "../components/EspSelector";
import AverageTemperature from "../components/AverageTemperature";
import "./Dashboard.css";

function Dashboard() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [esps, setEsps] = useState([]);
    const [selectedEsp, setSelectedEsp] = useState("");
    const [avgSuhu, setAvgSuhu] = useState(null);

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

    // Ambil data sensor terbaru + rata-rata suhu sesuai ESP terpilih
    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            try {
                const latest = await getLatestSensor(selectedEsp || undefined);
                if (isMounted) setData(latest?.data || null);

                const target = selectedEsp ? [selectedEsp] : esps.map((e) => e.esp_name).filter(Boolean);
                const avg = await getAverageSuhu(target);
                if (isMounted) setAvgSuhu(avg?.data?.average_suhu ?? null);

                setError(null);
            } catch (err) {
                if (isMounted) setError(err.message);
            }
        };

        load();
        // Pengambilan data otomatis setiap 3 menit (180.000 ms)
        const intervalId = setInterval(load, 3 * 60 * 1000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [selectedEsp, esps]);

    return (
        <div className="dashboard-page max-w-7xl mx-auto px-5 sm:px-8 py-8">
            <Header />

            {error && (
                <p className="text-xs text-red-600 mb-4">
                    Gagal memuat data dari server: {error}
                </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-ink">Pilih ESP / Node:</p>
                    <EspSelector value={selectedEsp} onChange={setSelectedEsp} esps={esps} />
                </div>

                <AverageTemperature
                    average={avgSuhu}
                    espLabel={selectedEsp || "Semua ESP"}
                />
            </div>

            <SensorSection sensors={data?.sensors || []} />

            <WaterLevel
                percent={data?.waterLevel?.percent ?? 0}
                height={data?.waterLevel?.height ?? 0}
                status={data?.waterLevel?.status ?? "Tidak ada data"}
            />
        </div>
    );
}

export default Dashboard;
