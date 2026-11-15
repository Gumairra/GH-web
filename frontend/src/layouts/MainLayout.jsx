import { useState } from "react";
import Topbar from "../components/Topbar";
import ObjectDetectionDrawer from "../components/ObjectDetectionDrawer";
import "./MainLayout.css";

function MainLayout({ children }) {
    const [detectionOpen, setDetectionOpen] = useState(false);

    return (
        <div className="main-layout">
            <Topbar onOpenDetection={() => setDetectionOpen(true)} />

            <main className="main-content">{children}</main>

            <footer className="app-footer mx-auto w-full max-w-7xl px-5 pb-8 pt-4 sm:px-8">
                <div className="flex flex-col items-center justify-between gap-2 border-t border-line pt-4 text-[11px] text-mute sm:flex-row">
                    <p>© {new Date().getFullYear()} I-WILL Greenhouse · Sistem Monitoring IoT</p>
                    <p className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-leaf pulse-dot" />
                        ESP-NOW · MQTT · PostgreSQL
                    </p>
                </div>
            </footer>

            {detectionOpen && (
                <ObjectDetectionDrawer
                    open
                    onClose={() => setDetectionOpen(false)}
                />
            )}
        </div>
    );
}

export default MainLayout;
