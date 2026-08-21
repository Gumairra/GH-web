import { useEffect, useState } from "react";
import Header from "../components/Header";
import SensorSection from "../components/SensorSection";
import WaterLevel from "../components/WaterLevel";
import { getLatestSensor } from "../services/api";
import "./Dashboard.css";

function Dashboard() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const load = () => {
            getLatestSensor()
                .then((res) => {
                    if (isMounted) {
                        setData(res.data);
                        setError(null);
                    }
                })
                .catch((err) => {
                    if (isMounted) setError(err.message);
                });
        };

        load();
        // Polling setiap 5 detik, samakan dengan interval publish ESP32
        const intervalId = setInterval(load, 5000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []);

    return (
        <div className="dashboard-page max-w-7xl mx-auto px-5 sm:px-8 py-8">
            <Header />

            {error && (
                <p className="text-xs text-red-600 mb-4">
                    Gagal memuat data dari server: {error}
                </p>
            )}

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
