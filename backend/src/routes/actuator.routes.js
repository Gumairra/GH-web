const express = require("express");
const router = express.Router();
const { getUsage, logEvent } = require("../controllers/actuator.controller");

router.get("/usage", getUsage);
router.post("/log", logEvent);

module.exports = router;
