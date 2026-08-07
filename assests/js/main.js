tailwind.config = {
    theme: {
        extend: {
            colors: {
                soil: '#F6F4EE',
                card: '#FFFFFF',
                leaf: { DEFAULT: '#2F6B4F', dark: '#234F3B', light: '#E7F0E9' },
                sage: '#9BB89F',
                clay: '#C97B3E',
                ink: '#1C2B22',
                mute: '#647265',
                line: '#E3E0D5',
                blue: '#3E7FC9',
            },
            fontFamily: {
                display: ['Fraunces', 'serif'],
                body: ['Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
        },
    },
};

// ---------- Jam & tanggal ----------
function updateClock() {
    const now = new Date();
    document.getElementById('clock').textContent = now.toLocaleTimeString('id-ID', { hour12: false });
    document.getElementById('dateLabel').textContent = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
updateClock();
setInterval(updateClock, 1000);

// ---------- Status aktuator ----------
const actuatorState = { kipas: false, lampu: false, pompaAir: false, pompaNutrisi: false };

function toggleActuator(name) {
    actuatorState[name] = !actuatorState[name];
    const isOn = actuatorState[name];
    const btn = document.getElementById(name + 'Toggle');
    const knob = btn.querySelector('.toggle-knob');
    const statusText = document.getElementById(name + 'StatusText');
    const iconWrap = document.getElementById(name + 'IconWrap');

    btn.setAttribute('aria-pressed', isOn);
    btn.classList.toggle('bg-leaf', isOn);
    btn.classList.toggle('bg-line', !isOn);
    knob.style.transform = isOn ? 'translateX(20px)' : 'translateX(0)';
    statusText.textContent = isOn ? 'Aktif' : 'Nonaktif';
    statusText.classList.toggle('text-leaf', isOn);
    statusText.classList.toggle('text-mute', !isOn);
    iconWrap.classList.toggle('bg-leaf', isOn);
    iconWrap.classList.toggle('bg-leaf-light', !isOn);
    iconWrap.querySelector('svg').setAttribute('stroke', isOn ? '#FFFFFF' : '#2F6B4F');

    if (name === 'kipas') {
        const icon = document.getElementById('kipasIcon');
        icon.style.animation = isOn ? 'spin 0.9s linear infinite' : 'none';
    }

    addLog(actuatorLabel[name] + (isOn ? ' diaktifkan' : ' dinonaktifkan') + ' secara manual');
}

const actuatorLabel = {
    kipas: 'Kipas sirkulasi',
    lampu: 'Lampu tumbuh',
    pompaAir: 'Pompa air',
    pompaNutrisi: 'Pompa nutrisi',
};

const spinKeyframes = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
const styleTag = document.createElement('style');
styleTag.textContent = spinKeyframes;
document.head.appendChild(styleTag);

// ---------- Log aktivitas ----------
function addLog(message) {
    const list = document.getElementById('logList');
    const time = new Date().toLocaleTimeString('id-ID', { hour12: false });
    const li = document.createElement('li');
    li.className = 'flex gap-2';
    li.innerHTML = `<span class="text-ink/40">${time}</span><span class="text-mute">${message}</span>`;
    list.appendChild(li);
    while (list.children.length > 20) list.removeChild(list.firstChild);
    list.scrollTop = list.scrollHeight;
}
addLog('Sistem dimulai, seluruh sensor terhubung');

// ---------- Simulasi pembacaan sensor ----------
function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
function jitter(value, range, min, max) { return clamp(value + (Math.random() - 0.5) * range, min, max); }

let readings = { suhuUdara: 28.4, kelembapan: 68, phAir: 6.5, suhuAir: 24.8, tds: 850, airLevel: 62 };

function setStatus(el, text, ok) {
    el.textContent = text;
    el.classList.toggle('text-leaf', ok);
    el.classList.toggle('text-clay', !ok);
}

function renderSensors() {
    readings.suhuUdara = jitter(readings.suhuUdara, 0.6, 18, 36);
    readings.kelembapan = jitter(readings.kelembapan, 1.2, 40, 95);
    readings.phAir = jitter(readings.phAir, 0.08, 4.5, 8.5);
    readings.suhuAir = jitter(readings.suhuAir, 0.3, 18, 32);
    readings.tds = jitter(readings.tds, 15, 100, 2000);
    readings.airLevel = jitter(readings.airLevel, 0.8, 5, 98);

    document.getElementById('suhuUdara').textContent = readings.suhuUdara.toFixed(1);
    document.getElementById('suhuUdaraBar').style.width = clamp((readings.suhuUdara / 40) * 100, 4, 100) + '%';
    setStatus(document.getElementById('suhuUdaraStatus'), readings.suhuUdara <= 32 ? 'Normal · 20-32°C' : 'Tinggi · di atas 32°C', readings.suhuUdara <= 32);

    document.getElementById('kelembapan').textContent = readings.kelembapan.toFixed(0);
    document.getElementById('kelembapanBar').style.width = readings.kelembapan + '%';
    setStatus(document.getElementById('kelembapanStatus'), (readings.kelembapan >= 60 && readings.kelembapan <= 80) ? 'Normal · 60-80%' : 'Perlu perhatian', readings.kelembapan >= 60 && readings.kelembapan <= 80);

    document.getElementById('phAir').textContent = readings.phAir.toFixed(1);
    document.getElementById('phAirBar').style.width = clamp((readings.phAir / 9) * 100, 4, 100) + '%';
    setStatus(document.getElementById('phAirStatus'), (readings.phAir >= 6.0 && readings.phAir <= 7.0) ? 'Normal · 6.0-7.0' : 'Di luar rentang ideal', readings.phAir >= 6.0 && readings.phAir <= 7.0);

    document.getElementById('suhuAir').textContent = readings.suhuAir.toFixed(1);
    document.getElementById('suhuAirBar').style.width = clamp((readings.suhuAir / 35) * 100, 4, 100) + '%';
    setStatus(document.getElementById('suhuAirStatus'), (readings.suhuAir >= 22 && readings.suhuAir <= 28) ? 'Normal · 22-28°C' : 'Di luar rentang ideal', readings.suhuAir >= 22 && readings.suhuAir <= 28);

    document.getElementById('tdsAir').textContent = readings.tds.toFixed(0);
    document.getElementById('tdsAirBar').style.width = clamp((readings.tds / 2000) * 100, 4, 100) + '%';
    setStatus(document.getElementById('tdsAirStatus'), (readings.tds >= 650 && readings.tds <= 1200) ? 'Normal · 650-1200 ppm' : 'Di luar rentang ideal', readings.tds >= 650 && readings.tds <= 1200);

    const pct = readings.airLevel;
    document.getElementById('waterFill').style.height = pct + '%';
    document.getElementById('airLevelPercent').textContent = pct.toFixed(0);
    document.getElementById('airLevelCm').textContent = (60 - (pct / 100) * 60).toFixed(1);
    const tag = document.getElementById('airLevelTag');
    let label = 'Cukup', cls = 'bg-leaf-light text-leaf-dark';
    if (pct < 20) { label = 'Rendah'; cls = 'bg-clay/15 text-clay'; }
    else if (pct > 90) { label = 'Penuh'; cls = 'bg-leaf-light text-leaf-dark'; }
    tag.textContent = label;
    tag.className = 'text-[11px] font-medium px-2.5 py-1 rounded-full ' + cls;

    document.getElementById('lastSync').textContent = new Date().toLocaleTimeString('id-ID', { hour12: false });
}

renderSensors();
setInterval(renderSensors, 4000);


