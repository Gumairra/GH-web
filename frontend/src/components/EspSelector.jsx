import { useEffect } from "react";

function EspSelector({ value, onChange, esps = [] }) {
    // Daftar ESP dari database, fallback ke nama statis kalau database kosong
    const daftar =
        esps.length > 0
            ? esps.map((e) => e.esp_name || e)
            : ["ESP_01", "ESP_02", "ESP_03", "ESP_04", "ESP_05"];

    useEffect(() => {
        // Reset jika nilai terpilih sudah tidak ada di daftar
        if (value && !daftar.includes(value)) {
            onChange("");
        }
    }, [esps]);

    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="rounded-full border border-line bg-white px-3 py-1.5 text-sm focus:ring-2 focus:ring-leaf"
        >
            <option value="">-- Semua ESP (rata-rata) --</option>
            {daftar.map((esp) => (
                <option key={esp} value={esp}>
                    {esp}
                </option>
            ))}
        </select>
    );
}

export default EspSelector;
