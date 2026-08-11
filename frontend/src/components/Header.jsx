import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Header.css";

function Header() {
    const location = useLocation();
    const isStatistics = location.pathname === "/statistics";
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const updateClock = () => setCurrentTime(new Date());

        updateClock();
        const intervalId = window.setInterval(updateClock, 1000);

        return () => window.clearInterval(intervalId);
    }, []);

    const formattedTime = currentTime.toLocaleTimeString("id-ID", { hour12: false });
    const formattedDate = currentTime.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return (
        <header className="header-shell mb-10 flex flex-col gap-4 px-0 py-0 sm:flex-row sm:items-end sm:justify-between">
            <div className="header-brand flex items-center gap-3">
                <div className="header-brand-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-leaf shadow-sm">
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M12 22c0-8-5-13-9-13 0 7 4 13 9 13z" />
                        <path d="M12 22c0-9 5-15 9-15 0 8-4 15-9 15z" />
                        <path d="M12 22V10" />
                    </svg>
                </div>

                <div>
                    <p className="header-eyebrow text-[11px] tracking-[0.2em] text-mute uppercase font-semibold">
                        Sistem Monitoring IoT
                    </p>

                    <h1 className="header-title font-display text-[28px] sm:text-[32px] leading-[1.05] text-ink -mt-0.5">
                        I-WILL · Greenhouse
                    </h1>
                </div>
            </div>

            <div className="header-toolbar flex flex-wrap items-center gap-3 bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur-sm">
                <nav className="header-nav flex items-center gap-1 bg-white p-1 ">
                    <Link
                        to="/"
                        className={`header-nav-link ${!isStatistics ? "header-nav-link--active" : ""}`}
                    >
                        Monitoring
                    </Link>

                    <Link
                        to="/statistics"
                        className={`header-nav-link ${isStatistics ? "header-nav-link--active" : ""}`}
                    >
                        Statistik
                    </Link>
                </nav>

                <div className="header-action-pill flex items-center gap-2 rounded-full bg-transparent px-3 py-1.5">
                    <button className="header-action-btn rounded-full px-2 py-1 text-xs font-semibold text-mute transition-colors hover:text-ink">
                        Import Excel
                    </button>
                </div>

                <div className="header-status-pill flex items-center gap-2 rounded-full bg-transparent pl-2.5 pr-3.5 py-1.5">
                    <span className="header-status-dot h-2 w-2 rounded-full bg-leaf pulse-dot"></span>
                    <span className="text-xs font-semibold text-ink">Perangkat Online</span>
                </div>

                <div className="header-clock hidden text-right sm:block" id="clockContainer">
                    <p id="clock" className="header-clock-time font-mono text-sm font-semibold text-ink num-tick">
                        {formattedTime}
                    </p>
                    <p id="dateLabel" className="header-clock-date text-[11px] text-mute">
                        {formattedDate}
                    </p>
                </div>
            </div>
        </header>
    );
}

export default Header;