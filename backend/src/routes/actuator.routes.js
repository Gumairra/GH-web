const express = require("express");
const router = express.Router();
const { getUsage, logEvent, setActuator } = require("../controllers/actuator.controller");

router.get("/usage", getUsage);
router.post("/log", logEvent);

// Kontrol langsung ke ESP32 via MQTT: kipas, lampu, pompaAir, pompaNutrisi
router.post("/:nama/set", setActuator);

module.exports = router;
