const mqtt = require("mqtt");
require("dotenv").config();

// =====================================================
// KONEKSI MQTT
// Broker & port HARUS sama dengan ESP_penerima.ino
// (default: broker.emqx.io : 1883)
// =====================================================

const brokerUrl = `${process.env.MQTT_PROTOCOL || "mqtt"}://${
    process.env.MQTT_HOST || "broker.emqx.io"
}:${process.env.MQTT_PORT || 1883}`;

const mqttClient = mqtt.connect(brokerUrl, {
    clientId:
        (process.env.MQTT_CLIENT_ID || "greenrss-backend") +
        "-" +
        Math.random().toString(16).slice(2, 8),
    username: process.env.MQTT_USERNAME || undefined,
    password: process.env.MQTT_PASSWORD || undefined,
    reconnectPeriod: 5000,
});

mqttClient.on("connect", () => {
    console.log(`[MQTT] Terhubung ke broker: ${brokerUrl}`);
});

mqttClient.on("reconnect", () => {
    console.log("[MQTT] Mencoba menyambung ulang...");
});

mqttClient.on("error", (err) => {
    console.error("[MQTT] Error:", err.message);
});

module.exports = mqttClient;
