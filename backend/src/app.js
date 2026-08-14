const express = require("express");
const cors = require("cors");
require("dotenv").config();

const sensorRoutes = require("./routes/sensor.routes");
const actuatorRoutes = require("./routes/actuator.routes");

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "I-WILL Greenhouse API" });
});

app.use("/api/sensors", sensorRoutes);
app.use("/api/actuators", actuatorRoutes);

app.use((req, res) => {
    res.status(404).json({ message: "Endpoint tidak ditemukan" });
});

module.exports = app;
