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

// ---------- Palet & util ----------
  const palette = { leaf: '#2F6B4F', clay: '#C97B3E', azure: '#3E7FC9', sage: '#9BB89F', line: '#E3E0D5' };
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function genSeries(n, base, range, drift) {
    let v = base;
    const arr = [];
    for (let i = 0; i < n; i++) {
      v += rand(-drift, drift);
      v = Math.max(base - range, Math.min(base + range, v));
      arr.push(Number(v.toFixed(1)));
    }
    return arr;
  }
  function labelsFor(rangeKey) {
    if (rangeKey === 'today') return Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0') + ':00');
    if (rangeKey === 'week') return ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    return Array.from({ length: 30 }, (_, i) => 'H-' + (30 - i));
  }
  function countFor(rangeKey) { return rangeKey === 'today' ? 24 : rangeKey === 'week' ? 7 : 30; }
 
  // ---------- Konfigurasi dasar Chart.js ----------
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.font.size = 11;
  Chart.defaults.color = '#647265';
 
  function baseLineDataset(label, data, color, fill) {
    return {
      label, data, borderColor: color, backgroundColor: color + '22',
      borderWidth: 2, pointRadius: 0, tension: 0.35, fill: !!fill,
    };
  }
  const gridOpt = { color: '#E3E0D5', drawTicks: false };
  const commonScales = (extra = {}) => ({
    x: { grid: { display: false }, ticks: { maxTicksLimit: 7 } },
    y: { grid: gridOpt, ...extra },
  });
 
  let charts = {};
  function destroyCharts() { Object.values(charts).forEach(c => c && c.destroy()); charts = {}; }
 
  // ---------- Render seluruh halaman berdasarkan rentang ----------
  function setRange(rangeKey) {
    document.querySelectorAll('.range-btn').forEach(b => b.classList.toggle('active', b.dataset.range === rangeKey));
 
    const n = countFor(rangeKey);
    const labels = labelsFor(rangeKey);
 
    const suhuUdara = genSeries(n, 28, 5, 1.2);
    const suhuAir = genSeries(n, 25, 3, 0.8);
    const kelembapan = genSeries(n, 70, 12, 2.5);
    const phAir = genSeries(n, 6.5, 0.6, 0.15);
    const tds = genSeries(n, 880, 250, 40);
    const airLevel = genSeries(n, 58, 30, 6);
 
    renderSummary({ suhuUdara, suhuAir, kelembapan, phAir, tds, airLevel });
 
    destroyCharts();
 
    charts.suhu = new Chart(document.getElementById('chartSuhu'), {
      type: 'line',
      data: { labels, datasets: [baseLineDataset('Udara', suhuUdara, palette.clay), baseLineDataset('Air', suhuAir, palette.azure)] },
      options: { responsive: true, maintainAspectRatio: false, scales: commonScales(), plugins: { legend: { display: false } } },
    });
 
    charts.kelembapan = new Chart(document.getElementById('chartKelembapan'), {
      type: 'line',
      data: { labels, datasets: [baseLineDataset('Kelembapan', kelembapan, palette.leaf, true)] },
      options: { responsive: true, maintainAspectRatio: false, scales: commonScales(), plugins: { legend: { display: false } } },
    });
 
    charts.airKualitas = new Chart(document.getElementById('chartAirKualitas'), {
      type: 'line',
      data: { labels, datasets: [
        { ...baseLineDataset('pH', phAir, palette.leaf), yAxisID: 'y' },
        { ...baseLineDataset('TDS', tds, palette.azure), yAxisID: 'y1' },
      ]},
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, ticks: { maxTicksLimit: 7 } },
          y: { grid: gridOpt, position: 'left', title: { display: true, text: 'pH' } },
          y1: { grid: { display: false }, position: 'right', title: { display: true, text: 'ppm' } },
        },
        plugins: { legend: { display: false } },
      },
    });
 
    charts.airLevel = new Chart(document.getElementById('chartAirLevel'), {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Ketinggian Air', data: airLevel, backgroundColor: palette.azure + '55', borderColor: palette.azure, borderWidth: 1, borderRadius: 4 }] },
      options: { responsive: true, maintainAspectRatio: false, scales: commonScales({ suggestedMin: 0, suggestedMax: 100 }), plugins: { legend: { display: false } } },
    });
 
    renderUsage(rangeKey);
  }
 
  // ---------- Ringkasan statistik ----------
  function stat(arr) {
    const min = Math.min(...arr), max = Math.max(...arr);
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    return { min, max, avg };
  }
 
  function summaryCard(label, unit, s, decimals) {
    return `
      <article class="bg-card border border-line rounded-2xl p-4">
        <p class="text-[11px] tracking-[0.1em] text-mute uppercase font-medium mb-2">${label}</p>
        <div class="flex items-baseline gap-1 mb-2">
          <span class="font-mono text-xl font-semibold text-ink num-tick">${s.avg.toFixed(decimals)}</span>
          <span class="text-xs text-mute">${unit} rata-rata</span>
        </div>
        <div class="flex items-center justify-between text-[11px] font-mono text-mute">
          <span>min ${s.min.toFixed(decimals)}</span>
          <span>maks ${s.max.toFixed(decimals)}</span>
        </div>
      </article>`;
  }
 
  function renderSummary(d) {
    const grid = document.getElementById('summaryGrid');
    grid.innerHTML =
      summaryCard('Suhu Udara', '°C', stat(d.suhuUdara), 1) +
      summaryCard('Kelembapan', '%RH', stat(d.kelembapan), 0) +
      summaryCard('pH Air', 'pH', stat(d.phAir), 2) +
      summaryCard('Suhu Air', '°C', stat(d.suhuAir), 1) +
      summaryCard('TDS Air', 'ppm', stat(d.tds), 0) +
      summaryCard('Ketinggian Air', '%', stat(d.airLevel), 0);
  }
 
  // ---------- Pemakaian aktuator ----------
  function usageRow(name, color, hours, maxHours, count) {
    const pct = Math.min(100, (hours / maxHours) * 100);
    return `
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-sm font-medium text-ink">${name}</span>
          <span class="text-xs font-mono text-mute">${hours.toFixed(1)} jam · ${count}x menyala</span>
        </div>
        <div class="h-2 rounded-full bg-leaf-light overflow-hidden">
          <div class="usage-bar h-full rounded-full" style="width:${pct}%; background-color:${color}"></div>
        </div>
      </div>`;
  }
 
  function renderUsage(rangeKey) {
    const maxHours = rangeKey === 'today' ? 24 : rangeKey === 'week' ? 24 * 7 : 24 * 30;
    const scale = rangeKey === 'today' ? 1 : rangeKey === 'week' ? 7 : 30;
    const data = [
      { name: 'Kipas Sirkulasi', color: palette.leaf, hours: rand(3, 6) * scale * 0.6, count: Math.round(rand(4, 9) * scale * 0.6) },
      { name: 'Lampu Tumbuh', color: palette.clay, hours: rand(10, 12) * scale * 0.9, count: Math.round(rand(1, 2) * scale) },
      { name: 'Pompa Air', color: palette.azure, hours: rand(0.3, 1.2) * scale * 0.5, count: Math.round(rand(1, 3) * scale * 0.5) },
      { name: 'Pompa Nutrisi', color: palette.sage, hours: rand(0.1, 0.5) * scale * 0.4, count: Math.round(rand(1, 2) * scale * 0.4) },
    ];
    document.getElementById('usageList').innerHTML = data.map(d => usageRow(d.name, d.color, Math.min(d.hours, maxHours), maxHours, Math.max(1, d.count))).join('');
  }
 
  setRange('today');