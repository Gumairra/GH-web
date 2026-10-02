const express = require("express");
const router = express.Router();
const { getLatest, getHistory, createReading } = require("../controllers/sensor.controller");
const { getSensorStatus, sensorEvents } = require("../mqtt/sensorSubscriber");

router.get("/events", (req, res) => {
	res.set({
		"Content-Type": "text/event-stream",
		"Cache-Control": "no-cache",
		Connection: "keep-alive",
	});
	res.flushHeaders();

	const sendStatus = () => {
		res.write(`event: status\ndata: ${JSON.stringify(getSensorStatus())}\n\n`);
	};
	const sendReading = () => {
		res.write("event: reading\ndata: {}\n\n");
	};

	sendStatus();
	sensorEvents.on("reading", sendReading);
	const statusInterval = setInterval(sendStatus, 2000);

	req.on("close", () => {
		clearInterval(statusInterval);
		sensorEvents.off("reading", sendReading);
	});
});

router.get("/latest", getLatest);
router.get("/history", getHistory);
router.post("/", createReading);

module.exports = router;
