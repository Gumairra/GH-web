/**
 * Menerjemahkan query ?range=today|week|month (dipakai tombol filter
 * di halaman Statistics.jsx) menjadi interval SQL dan lebar bucket
 * untuk agregasi time-series.
 */
function resolveRange(range) {
    switch (range) {
        case "week":
            return { interval: "7 days", bucket: "hour", labelFormat: "DD Mon HH24:00" };
        case "month":
            return { interval: "30 days", bucket: "day", labelFormat: "DD Mon" };
        case "today":
        default:
            return { interval: "24 hours", bucket: "hour", labelFormat: "HH24:00" };
    }
}

module.exports = { resolveRange };
