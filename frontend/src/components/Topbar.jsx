import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { getEsps } from "../services/api";
import "./Topbar.css";

const ONLINE_WINDOW_MS = 10 * 60 * 1000; // ESP dianggap online bila kirim data < 10 menit

function Topbar({ onOpenDetection }) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [menuOpen, setMenuOpen] = useState(false);
    const [deviceState, setDeviceState] = useState({
        total: 0,
        online: 0,
        apiOnline: true,
    });
    const menuRef = useRef(null);

    // Jam berjalan
    useEffect(() => {
        const id = window.setInterval(() => setCurrentTime(new Date()), 1000);
        return () => window.clearInterval(id);
    }, []);

    // Status ESP (dihitung dari last_seen)
    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                const res = await getEsps();
                if (!mounted) return;
                const list = res?.data || [];
                const now = Date.now();
                const online = list.filter((e) => {
                    if (!e.last_seen) return false;
                    return now - new Date(e.last_seen).getTime() < ONLINE_WINDOW_MS;
                }).length;
                setDeviceState({ total: list.length, online, apiOnline: true });
            } catch {
                if (mounted) {
                    setDeviceState((s) => ({ ...s, apiOnline: false }));
                }
            }
        };

        load();
        const id = window.setInterval(load, 3 * 60 * 1000);
        return () => {
            mounted = false;
            window.clearInterval(id);
        };
    }, []);

    // Tutup menu mobile saat klik di luar
    useEffect(() => {
        if (!menuOpen) return;
        const onClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [menuOpen]);

    const formattedTime = currentTime.toLocaleTimeString("id-ID", { hour12: false });
    const formattedDate = currentTime.toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
    });

    const navLinkClass = ({ isActive }) =>
        `topbar-link ${isActive ? "topbar-link--active" : ""}`;

    const handleDetection = () => {
        setMenuOpen(false);
        onOpenDetection();
    };

    return (
        <header className="topbar" ref={menuRef}>
            <div className="topbar-inner mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-5 sm:px-8">
                {/* Brand */}
                <NavLink to="/" className="topbar-brand flex items-center gap-2.5">
                    <span className="topbar-logo flex h-9 w-9 items-center justify-center rounded-xl">
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M12 22c0-8-5-13-9-13 0 7 4 13 9 13z" />
                            <path d="M12 22c0-9 5-15 9-15 0 8-4 15-9 15z" />
                            <path d="M12 22V10" />
                        </svg>
                    </span>
                    <span className="hidden leading-tight sm:block">
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-mute">
                            I-WILL · Greenhouse
                        </span>
                        <span className="font-display block text-[15px] font-semibold text-ink">
                            Smart Monitoring
                        </span>
                    </span>
                </NavLink>

                {/* Navigasi desktop */}
                <nav className="topbar-nav hidden items-center gap-1 lg:flex" aria-label="Navigasi utama">
                    <NavLink to="/" end className={navLinkClass}>
                        Monitoring
                    </NavLink>
                    <NavLink to="/statistics" className={navLinkClass}>
                        Statistik
                    </NavLink>
                    <button type="button" onClick={handleDetection} className="topbar-link topbar-link--detect">
                        <span className="topbar-detect-dot" />
                        Object Detection
                    </button>
                </nav>

                {/* Aksi kanan */}
                <div className="flex items-center gap-2">
                    <div className="topbar-status hidden items-center gap-2 sm:flex" title="Status perangkat ESP">
                        <span
                            className={`h-2 w-2 rounded-full ${
                                deviceState.apiOnline ? "bg-leaf pulse-dot" : "bg-[#b3433b]"
                            }`}
                        />
                        <span className="text-[11px] font-semibold text-ink">
                            {deviceState.apiOnline
                                ? `${deviceState.online}/${deviceState.total || 0} ESP online`
                                : "API offline"}
                        </span>
                    </div>

                    <div className="topbar-clock hidden text-right md:block">
                        <p className="num-tick text-[12px] font-semibold leading-tight text-ink">
                            {formattedTime}
                        </p>
                        <p className="text-[10px] leading-tight text-mute">{formattedDate}</p>
                    </div>

                    <button
                        type="button"
                        className="topbar-detect-btn hidden items-center gap-2 rounded-full px-3.5 py-2 text-[11px] font-semibold sm:flex"
                        onClick={handleDetection}
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path d="M23 7l-7 5 7 5V7z" />
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                        </svg>
                        Deteksi
                    </button>

                    {/* Hamburger mobile */}
                    <button
                        type="button"
                        className="topbar-burger flex h-9 w-9 items-center justify-center rounded-xl lg:hidden"
                        aria-label="Buka menu navigasi"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((v) => !v)}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                            {menuOpen ? (
                                <>
                                    <path d="M18 6L6 18" />
                                    <path d="M6 6l12 12" />
                                </>
                            ) : (
                                <>
                                    <path d="M3 6h18" />
                                    <path d="M3 12h18" />
                                    <path d="M3 18h18" />
                                </>
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Menu mobile */}
            {menuOpen && (
                <div className="topbar-mobile animate-fade-up lg:hidden">
                    <NavLink to="/" end className={navLinkClass} onClick={() => setMenuOpen(false)}>
                        Monitoring
                    </NavLink>
                    <NavLink to="/statistics" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                        Statistik
                    </NavLink>
                    <button type="button" onClick={handleDetection} className="topbar-link topbar-link--detect justify-start">
                        <span className="topbar-detect-dot" />
                        Object Detection
                    </button>
                    <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-[11px] text-mute">
                        <span>
                            {deviceState.apiOnline
                                ? `${deviceState.online}/${deviceState.total || 0} ESP online`
                                : "API offline"}
                        </span>
                        <span className="num-tick">{formattedTime}</span>
                    </div>
                </div>
            )}
        </header>
    );
}

export default Topbar;
