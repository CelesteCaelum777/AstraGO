/* Right-panel NASA JSON client and Plotly rendering. No search-engine dependencies. */
(() => {
  'use strict';
  const START = 2015;
  const END = 2025;
  const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const UNITS = { T2M: '°C', T2M_MIN: '°C', ALLSKY_SFC_SW_DWN: 'kW-hr/m²/day', WS10M: 'm/s', PRECTOTCORR: 'mm/day', RH2M: '%' };
  const cache = new Map();
  const root = document.getElementById('nasaFrame');
  const loading = document.getElementById('iframeLoading');
  const status = document.getElementById('toolkitStatus');
  const variable = document.getElementById('chartVariable');
  const retry = document.getElementById('retryChart');
  let location = null;
  let generation = 0;
  let controller = null;
  let currentChart = null;
  let initialized = false;

  function rowsFromJSON(data, parameter) {
    const values = data?.properties?.parameter?.[parameter];
    if (!values || typeof values !== 'object') throw new Error(`NASA no devolvió la variable ${parameter}.`);
    const fill = data.header?.fill_value ?? -999;
    return Object.entries(values).filter(([key, value]) =>
      /^\d{6}$/.test(key) && Number(key.slice(0, 4)) >= START && Number(key.slice(0, 4)) <= END &&
      Number(key.slice(4)) >= 1 && Number(key.slice(4)) <= 12 &&
      typeof value === 'number' && Number.isFinite(value) && value !== fill && value !== -999
    ).map(([key, value]) => ({ key, year: Number(key.slice(0, 4)), month: Number(key.slice(4)), value }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }

  const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;

  function buildChart(data, parameter, type) {
    const rows = rowsFromJSON(data, parameter);
    if (!rows.length) throw new Error(`No hay datos mensuales válidos para ${parameter}.`);
    const unit = data.parameters?.[parameter]?.units || UNITS[parameter];
    const label = `${parameter} (${unit})`;
    const dates = rows.map(row => `${row.key.slice(0, 4)}-${row.key.slice(4)}-01`);
    const values = rows.map(row => row.value);
    let traces;
    let chartCount = rows.length;
    let xTitle = 'Fecha';
    let yTitle = label;
    let title;
    const line = { color: '#5eead4', width: 2 };
    if (type === 'heatmaps') {
      const years = Array.from({ length: END - START + 1 }, (_, i) => START + i);
      const lookup = new Map(rows.map(row => [row.key, row.value]));
      traces = [{ type: 'heatmap', x: MONTHS, y: years,
        z: years.map(year => MONTHS.map((_, month) => lookup.get(`${year}${String(month + 1).padStart(2, '0')}`) ?? null)),
        colorscale: 'Viridis', colorbar: { title: { text: unit }, thickness: 12 }, hoverongaps: false,
        hovertemplate: '%{x} %{y}<br>%{z:.2f}<extra></extra>' }];
      xTitle = 'Mes'; yTitle = 'Año'; title = `Mapa de calor · ${parameter}`;
    } else if (type === 'trend') {
      const annual = Array.from({ length: END - START + 1 }, (_, i) => START + i)
        .map(year => ({ year, values: rows.filter(row => row.year === year).map(row => row.value) }))
        .filter(row => row.values.length === 12)
        .map(row => ({ year: row.year, value: mean(row.values) }));
      if (annual.length < 2) throw new Error('La tendencia requiere al menos dos años con doce meses válidos.');
      const years = annual.map(row => row.year);
      const averages = annual.map(row => row.value);
      const xMean = mean(years); const yMean = mean(averages);
      const slope = years.reduce((sum, year, i) => sum + (year - xMean) * (averages[i] - yMean), 0) /
        years.reduce((sum, year) => sum + (year - xMean) ** 2, 0);
      traces = [
        { type: 'scatter', mode: 'lines+markers', x: years, y: averages, name: 'Promedio anual', line },
        { type: 'scatter', mode: 'lines', x: years, y: years.map(year => yMean + slope * (year - xMean)),
          name: `Regresión: ${slope.toFixed(3)} ${unit}/año`, line: { color: '#fbbf24', dash: 'dash' } }
      ];
      xTitle = 'Año (12 meses válidos)'; title = `Tendencia histórica · ${parameter}`;
    } else if (type === 'anomalies') {
      const baseline = mean(values);
      const deviations = values.map(value => value - baseline);
      traces = [{ type: 'bar', x: dates, y: deviations,
        marker: { color: deviations.map(value => value >= 0 ? '#f87171' : '#60a5fa') },
        hovertemplate: '%{x|%Y-%m}<br>Desviación: %{y:.2f}<extra></extra>' }];
      yTitle = `Desviación (${unit})`; title = `Anomalías · media de la serie: ${baseline.toFixed(2)} ${unit}`;
    } else if (type === 'cycles') {
      traces = [...new Set(rows.map(row => row.year))].map(year => {
        const lookup = new Map(rows.filter(row => row.year === year).map(row => [row.month, row.value]));
        return { type: 'scatter', mode: 'lines+markers', x: MONTHS,
          y: MONTHS.map((_, month) => lookup.get(month + 1) ?? null), name: String(year), connectgaps: false };
      });
      xTitle = 'Mes'; title = `Ciclos estacionales · ${parameter}`;
    } else if (type === 'histograms') {
      traces = [{ type: 'histogram', x: values, marker: { color: '#5eead4' }, name: parameter }];
      xTitle = label; yTitle = 'Frecuencia (meses)'; title = `Distribución · ${parameter}`;
    } else if (type === 'psychrometric') {
      const temperatures = rowsFromJSON(data, 'T2M');
      const humidity = new Map(rowsFromJSON(data, 'RH2M').map(row => [row.key, row.value]));
      const paired = temperatures.filter(row => humidity.has(row.key));
      if (!paired.length) throw new Error('No hay meses coincidentes de temperatura y humedad.');
      chartCount = paired.length;
      traces = [{ type: 'scatter', mode: 'markers', x: paired.map(row => row.value),
        y: paired.map(row => humidity.get(row.key)), text: paired.map(row => `${row.year}-${String(row.month).padStart(2, '0')}`),
        marker: { color: paired.map(row => row.month), colorscale: 'Viridis', size: 7 },
        hovertemplate: '%{text}<br>T2M: %{x:.2f} °C<br>RH2M: %{y:.1f}%<extra></extra>' }];
      xTitle = 'Temperatura · T2M (°C)'; yTitle = 'Humedad relativa · RH2M (%)'; title = 'Temperatura vs. humedad';
    } else if (type === 'variables') {
      traces = [{ type: 'scatter', mode: 'lines', x: dates, y: values, line, name: parameter, connectgaps: false }];
      // Explicit nulls preserve gaps instead of connecting missing months.
      const lookup = new Map(rows.map(row => [row.key, row.value]));
      traces[0].x = []; traces[0].y = [];
      for (let year = START; year <= END; year++) for (let month = 1; month <= 12; month++) {
        const suffix = String(month).padStart(2, '0');
        traces[0].x.push(`${year}-${suffix}-01`);
        traces[0].y.push(lookup.get(`${year}${suffix}`) ?? null);
      }
      title = `Serie mensual · ${parameter}`;
    } else {
      throw new Error('Visualización no compatible.');
    }
    return { traces, count: chartCount, layout: {
      title: { text: title, font: { size: 13 }, x: 0.03 },
      paper_bgcolor: '#08121c', plot_bgcolor: '#08121c', font: { color: '#cbd5e1', size: 11 },
      margin: { l: 64, r: type === 'heatmaps' ? 65 : 24, t: 65, b: 65 },
      xaxis: { title: { text: xTitle }, gridcolor: '#213346', zerolinecolor: '#456' },
      yaxis: { title: { text: yTitle }, gridcolor: '#213346', zerolinecolor: '#456' },
      legend: { orientation: 'h', y: -0.3 }, autosize: true,
      ...(type === 'heatmaps' ? { yaxis: { title: { text: yTitle }, dtick: 1 } } : {})
    } };
  }

  function clear() {
    generation++;
    controller?.abort(); controller = null;
    if (currentChart && window.Plotly) window.Plotly.purge(currentChart);
    currentChart = null;
    root.replaceChildren();
    loading.classList.add('hidden');
    root.setAttribute('aria-busy', 'false');
    retry.hidden = true;
    location = null;
    variable.disabled = false;
    status.textContent = 'Seleccione una ubicación para cargar datos mensuales de NASA POWER.';
  }

  async function update(lat, lon, type) {
    clear();
    location = { lat, lon, type };
    const version = generation;
    const selectedVariable = variable.value;
    variable.disabled = type === 'psychrometric' || type === 'terrain';
    document.getElementById('retryChart').textContent = type === 'terrain' ? 'Reintentar consulta topográfica' : 'Reintentar consulta NASA';
    document.getElementById('chartLoadingMessage').textContent = type === 'terrain' ? 'Descargando relieve de Open-Meteo…' : 'Descargando datos JSON de NASA POWER…';
    root.setAttribute('aria-busy', 'true');
    loading.classList.remove('hidden');
    status.textContent = type === 'terrain' ? `Consultando relieve de Open-Meteo · ${lat.toFixed(2)}, ${lon.toFixed(2)}…` : `Consultando NASA POWER · ${lat.toFixed(2)}, ${lon.toFixed(2)} · ${START}–${END}…`;
    const activeController = new AbortController();
    controller = activeController;
    const timer = setTimeout(() => activeController.abort(), 60000);
    try {
      if (!window.Plotly) throw new Error('No se pudo cargar Plotly desde el CDN. Revise la conexión y recargue la página.');
      const key = `${type === 'terrain' ? 'terrain:' : ''}${lat},${lon}`;
      let data = cache.get(key);
      if (!data) {
        if (type === 'terrain') {
          data = await window.PlanetaryTerrain.load(lat, lon, activeController.signal);
        } else {
        const url = new URL('https://power.larc.nasa.gov/api/temporal/monthly/point');
        url.search = new URLSearchParams({ parameters: Object.keys(UNITS).join(','), community: 'AG',
          latitude: String(lat), longitude: String(lon), start: String(START), end: String(END), format: 'JSON' });
        const response = await fetch(url, { signal: activeController.signal });
        if (!response.ok) throw new Error(`NASA POWER respondió con error HTTP ${response.status}.`);
        data = await response.json();
        if (version !== generation) return;
        if (!data?.properties?.parameter) throw new Error('La respuesta de NASA no contiene series mensuales.');
        }
        if (version !== generation) return;
        cache.set(key, data);
        if (cache.size > 20) cache.delete(cache.keys().next().value);
      }
      if (version !== generation) return;
      const chart = type === 'terrain' ? window.PlanetaryTerrain.build(data) : buildChart(data, selectedVariable, type);
      // A new DOM node prevents an earlier Plotly render from overwriting a newer selection.
      const node = document.createElement('div');
      node.className = 'plotly-chart';
      root.replaceChildren(node);
      currentChart = node;
      await window.Plotly.newPlot(node, chart.traces, chart.layout, {
        responsive: true, displaylogo: false, toImageButtonOptions: { filename: `${type === 'terrain' ? 'TOPOGRAPHY' : 'NASA_POWER'}_${lat}_${lon}_${type}`, format: 'png' }
      });
      if (version !== generation) return;
      status.textContent = type === 'terrain' ? chart.status : `NASA POWER · ${lat.toFixed(2)}, ${lon.toFixed(2)} · ${START}–${END} · ${chart.count}/132 meses válidos (${type === 'psychrometric' ? 'T2M vs. RH2M' : selectedVariable}).`;
    } catch (error) {
      if (version !== generation) return;
      root.replaceChildren();
      status.textContent = error.name === 'AbortError' ? 'El servicio de datos no respondió en 60 segundos. Reintente la consulta.' :
        `${error.message || 'No se pudieron descargar los datos.'} Si el navegador bloquea la consulta o no hay conexión, use el visor oficial o reintente.`;
      retry.hidden = false;
    } finally {
      clearTimeout(timer);
      if (version === generation) {
        controller = null;
        loading.classList.add('hidden');
        root.setAttribute('aria-busy', 'false');
      }
    }
  }

  function init() {
    if (initialized) return;
    initialized = true;
    variable.addEventListener('change', () => { if (location) update(location.lat, location.lon, location.type); });
    retry.addEventListener('click', () => {
      if (!location) return;
      cache.delete(`${location.type === 'terrain' ? 'terrain:' : ''}${location.lat},${location.lon}`);
      update(location.lat, location.lon, location.type);
    });
    new ResizeObserver(() => { if (currentChart && window.Plotly) window.Plotly.Plots.resize(currentChart); }).observe(root);
  }
  window.PlanetaryCharts = { clear, update, init };
})();
