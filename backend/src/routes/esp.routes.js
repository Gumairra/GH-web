const express = require("express");
const router = express.Router();
const { getEsps, upsertEsp } = require("../controllers/esp.controller");

router.get("/", getEsps);
router.post("/", upsertEsp);

module.exports = router;