/**
 * Ambang batas normal untuk tiap sensor, disamakan dengan label status
 * yang sudah di-hardcode di SensorSection.jsx, supaya backend jadi
 * satu-satunya sumber kebenaran untuk logika ini.
 */
const THRESHOLDS = {
    suhu_udara: { min: 20, max: 32, unit: "°C", label: "Suhu Udara", scaleMax: 50 },
    humidity: { min: 60, max: 80, unit: "%RH", label: "Kelembapan", scaleMax: 100 },
    ph_air: { min: 6.0, max: 7.0, unit: "pH", label: "pH Air", scaleMax: 14 },
    ppm: { min: 600, max: 1200, unit: "ppm", label: "PPM Air", scaleMax: 2000 },
    tds: { min: 650, max: 1200, unit: "ppm", label: "TDS Air", scaleMax: 2000 },
};

function statusFor(key, value) {
    const t = THRESHOLDS[key];
    if (!t || value === null || value === undefined) return "Tidak ada data";
    if (value < t.min) return `Rendah · ${t.min}-${t.max}${t.unit}`;
    if (value > t.max) return `Tinggi · ${t.min}-${t.max}${t.unit}`;
    return `Normal · ${t.min}-${t.max}${t.unit}`;
}

function progressFor(key, value) {
    const t = THRESHOLDS[key];
    if (!t || value === null || value === undefined) return 0;
    const pct = (Number(value) / t.scaleMax) * 100;
    return Math.max(6, Math.min(100, Math.round(pct)));
}

module.exports = { THRESHOLDS, statusFor, progressFor };
