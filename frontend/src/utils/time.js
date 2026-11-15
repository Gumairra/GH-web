// Label waktu relatif sederhana, mis. "3 menit lalu"
export function relativeFrom(date) {
    if (!date) return "—";
    const diff = Math.max(0, Date.now() - new Date(date).getTime());
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "baru saja";
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;
}

// Selisih milidetik sejak tanggal tertentu (null bila tidak valid)
export function ageMs(date) {
    if (!date) return null;
    return Math.max(0, Date.now() - new Date(date).getTime());
}

// true bila tanggal lebih tua dari batas waktu tertentu
export function isOlderThan(date, ms) {
    const age = ageMs(date);
    return age !== null && age > ms;
}

// true bila tanggal masih dalam jendela waktu tertentu
export function isWithin(date, ms) {
    const age = ageMs(date);
    return age !== null && age <= ms;
}

