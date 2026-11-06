const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function handleResponse(res) {
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Request gagal (${res.status})`);
    }
    return res.json();
}

// GET /api/sensors/latest?esp=ESP_01
export function getLatestSensor(esp) {
    const qs = esp ? `?esp=${encodeURIComponent(esp)}` : "";
    return fetch(`${BASE_URL}/api/sensors/latest${qs}`).then(handleResponse);
}

// GET /api/sensors/history?range=today|week|month
export function getSensorHistory(range = "today") {
    return fetch(`${BASE_URL}/api/sensors/history?range=${range}`).then(
        handleResponse
    );
}

// GET /api/actuators/usage?range=today|week|month
export function getActuatorUsage(range = "today") {
    return fetch(`${BASE_URL}/api/actuators/usage?range=${range}`).then(
        handleResponse
    );
}

// GET /api/sensors/export?range=today|week|month
// Mengunduh data sensor dalam format Excel (.xlsx) sebagai file
export async function exportSensorExcel(range = "today") {
    const res = await fetch(`${BASE_URL}/api/sensors/export?range=${range}`);

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Request gagal (${res.status})`);
    }

    // Ubah response menjadi blob lalu paksa browser mengunduhnya
    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename="?([^";]+)"?/);
    const filename = match ? match[1] : `data-greenhouse-${range}.xlsx`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

// POST /api/actuators/:nama/set  { nyala: boolean }
export function setActuator(nama, nyala) {
    return fetch(`${BASE_URL}/api/actuators/${nama}/set`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nyala }),
    }).then(handleResponse);
}
export function getEsps() {
    return fetch(`${BASE_URL}/api/esp`).then(handleResponse);
}

export function registerEsp(esp_name, location) {
    return fetch(`${BASE_URL}/api/esp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ esp_name, location }),
    }).then(handleResponse);
}

export function getAverageSuhu(espList) {
    const qs = Array.isArray(espList) && espList.length ? `?esp=${espList.join(",")}` : "";
    return fetch(`${BASE_URL}/api/sensors/average-suhu${qs}`).then(handleResponse);
}