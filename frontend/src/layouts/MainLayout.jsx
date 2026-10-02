import { useEffect, useState } from "react";
import "./MainLayout.css";
import { SensorLiveContext } from "./SensorLiveContext";
import { subscribeToSensorEvents } from "../services/api";

function MainLayout({ children }) {
    const [isOnline, setIsOnline] = useState(false);
    const [revision, setRevision] = useState(0);

    useEffect(() => {
        const source = subscribeToSensorEvents({
            onStatus: ({ online }) => setIsOnline(online),
            onReading: () => setRevision((current) => current + 1),
            onError: () => setIsOnline(false),
        });

        return () => source.close();
    }, []);

    return (
        <div className="main-layout">
            <SensorLiveContext.Provider value={{ isOnline, revision }}>
                {children}
            </SensorLiveContext.Provider>
        </div>
    );
}

export default MainLayout;