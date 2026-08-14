const express = require('express');
const cors = require('cors');
const sensorRoutes = require('./routes/sensor.routes'); // Menyesuaikan dengan struktur folder backend Anda
const actuatorRoutes = require('./routes/actuator.routes');

const app = express();

// Middleware CORS agar frontend bisa mengakses backend
app.use(cors());
app.use(express.json());

// Daftarkan rute API
app.use('/api/sensors', sensorRoutes);
app.use('/api/actuators', actuatorRoutes);

// Endpoint dasar untuk pengecekan
app.get('/', (req, res) => {
    res.json({ message: 'Backend greenhouse siap terhubung dengan frontend!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server backend berjalan di http://localhost:${PORT}`);
});