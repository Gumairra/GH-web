-- Migration: tambah tabel esp_devices & kolom esp_name
CREATE TABLE IF NOT EXISTS public.esp_devices (
    id SERIAL PRIMARY KEY,
    esp_name VARCHAR(50) NOT NULL UNIQUE,
    location VARCHAR(100),
    last_seen TIMESTAMP,
    is_online BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.monitoring_sensor
    ADD COLUMN IF NOT EXISTS esp_name VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_esp_devices_esp_name ON esp_devices(esp_name);
CREATE INDEX IF NOT EXISTS idx_monitoring_sensor_esp_name ON monitoring_sensor(esp_name);