const express = require("express");
const router = express.Router();
const { getEsps, upsertEsp, getAverageSuhu } = require("../controllers/esp.controller");

router.get("/", getEsps);
router.post("/", upsertEsp);
router.get("/average-suhu", getAverageSuhu);

module.exports = router;