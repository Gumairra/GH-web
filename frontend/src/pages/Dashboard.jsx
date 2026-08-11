import Header from "../components/Header";
import SensorSection from "../components/SensorSection";
import WaterLevel from "../components/WaterLevel";
import "./Dashboard.css";

function Dashboard() {
    return (
        <div className="dashboard-page max-w-7xl mx-auto px-5 sm:px-8 py-8">
        <Header />

        <SensorSection />

        <WaterLevel
            percent={62}
            height={22.8}
            status="Cukup"
        />
        </div>
    );
}

export default Dashboard;