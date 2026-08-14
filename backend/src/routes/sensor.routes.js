const express = require("express");
const router = express.Router();
const { getLatest, getHistory, createReading } = require("../controllers/sensor.controller");

router.get("/latest", getLatest);
router.get("/history", getHistory);
router.post("/", createReading);

module.exports = router;
