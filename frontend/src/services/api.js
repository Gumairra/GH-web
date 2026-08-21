const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function handleResponse(res) {
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Request gagal (${res.status})`);
    }
    return res.json();
}

// GET /api/sensors/latest
export function getLatestSensor() {
    return fetch(`${BASE_URL}/api/sensors/latest`).then(handleResponse);
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

// POST /api/actuators/:nama/set  { nyala: boolean }
export function setActuator(nama, nyala) {
    return fetch(`${BASE_URL}/api/actuators/${nama}/set`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nyala }),
    }).then(handleResponse);
}
