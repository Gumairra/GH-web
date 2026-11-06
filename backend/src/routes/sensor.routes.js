const express = require("express");
const router = express.Router();
const { getLatest, getHistory, createReading, exportReading } = require("../controllers/sensor.controller");
const { getAverageSuhu } = require("../controllers/esp.controller");

router.get("/latest", getLatest);
router.get("/history", getHistory);
router.get("/export", exportReading);
// Rata-rata suhu udara semua ESP (dipakai Dashboard.jsx)
router.get("/average-suhu", getAverageSuhu);
router.post("/", createReading);

module.exports = router;
