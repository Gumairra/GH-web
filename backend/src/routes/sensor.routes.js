const express = require("express");
const router = express.Router();
const { getLatest, getHistory, createReading, exportReading } = require("../controllers/sensor.controller");

router.get("/latest", getLatest);
router.get("/history", getHistory);
router.get("/export", exportReading);
router.post("/", createReading);

module.exports = router;
