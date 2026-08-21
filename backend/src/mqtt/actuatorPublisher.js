const mqttClient = require("../config/mqttClient");

// =====================================================
// Peta nama aktuator -> topic MQTT, mengikuti PERSIS
// topic yang di-subscribe oleh ESP_penerima.ino
// (bukan nama "pompa_air/lampu_led/exhaust_fan" yang
// dipakai di actuator_log untuk statistik pemakaian)
// =====================================================
const TOPIC_AKTUATOR = {
    kipas: process.env.MQTT_TOPIC_KIPAS || "greenhouse/actuators/kipas/set",
    lampu: process.env.MQTT_TOPIC_LAMPU || "greenhouse/actuators/lampu/set",
    pompaAir:
        process.env.MQTT_TOPIC_POMPA_AIR ||
        "greenhouse/actuators/pompaAir/set",
    pompaNutrisi:
        process.env.MQTT_TOPIC_POMPA_NUTRISI ||
        "greenhouse/actuators/pompaNutrisi/set",
};

// nama: "kipas" | "lampu" | "pompaAir" | "pompaNutrisi"
// nyala: boolean
function kirimPerintahAktuator(nama, nyala) {
    const topic = TOPIC_AKTUATOR[nama];

    if (!topic) {
        return Promise.reject(new Error(`Aktuator "${nama}" tidak dikenal`));
    }

    const pesan = nyala ? "1" : "0";

    return new Promise((resolve, reject) => {
        mqttClient.publish(topic, pesan, { qos: 1 }, (err) => {
            if (err) return reject(err);
            console.log(`[MQTT] Publish "${pesan}" ke ${topic}`);
            resolve({ topic, pesan });
        });
    });
}

const daftarAktuator = Object.keys(TOPIC_AKTUATOR);

module.exports = { kirimPerintahAktuator, daftarAktuator };
