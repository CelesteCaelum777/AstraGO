/* Independent local-relief adapter. Sampling/caching lives in elevation_service.py. */
(() => {
  'use strict';
  async function load(lat, lon, signal) {
    const response = await fetch(`/api/terrain?${new URLSearchParams({lat: String(lat), lon: String(lon)})}`, { signal });
    const data = await response.json();
    if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'No se pudo consultar Open-Meteo.');
    return data;
  }
  function build(data) {
    if (!Array.isArray(data.latitudes) || data.latitudes.length !== 7 ||
        !Array.isArray(data.longitudes) || data.longitudes.length !== 7 ||
        !Array.isArray(data.z) || data.z.length !== 7 ||
        data.z.some(row => !Array.isArray(row) || row.length !== 7 || row.some(value => !Number.isFinite(value)))) {
      throw new Error('La grilla topográfica debe contener 49 altitudes válidas.');
    }
    return {
      traces: [{ type: 'surface', x: data.longitudes, y: data.latitudes, z: data.z,
        colorscale: 'Earth', colorbar: { title: { text: 'Altitud (m)' }, thickness: 12 },
        hovertemplate: 'Latitud: %{y:.4f}°<br>Longitud: %{x:.4f}°<br>Elevación: %{z:.1f} m<extra></extra>' }],
      layout: {
        title: { text: 'Topografía del Terreno 3D · Relieve Local', font: { size: 13 }, x: 0.03 },
        paper_bgcolor: '#08121c', font: { color: '#cbd5e1', size: 11 }, autosize: true,
        margin: { l: 0, r: 35, t: 55, b: 10 },
        scene: {
          xaxis: { title: { text: 'Longitud (°)' }, tickformat: '.3f' },
          yaxis: { title: { text: 'Latitud (°)' }, tickformat: '.3f' },
          zaxis: { title: { text: 'Elevación (m)' } },
          // Deliberate vertical exaggeration for exploration; degrees are not meters.
          aspectmode: 'manual', aspectratio: { x: 1, y: 1, z: 0.55 },
          camera: { eye: { x: 1.5, y: -1.5, z: 1.1 } }, bgcolor: '#08121c'
        }
      },
      status: `${data.source} · grilla 7×7 · paso 0,02° · centro: ${data.z[3][3].toFixed(0)} m${data.stale ? ' · caché vencida' : ''}. Relieve interpolado con exageración vertical; escala horizontal en grados.`
    };
  }
  window.PlanetaryTerrain = { load, build };
})();
