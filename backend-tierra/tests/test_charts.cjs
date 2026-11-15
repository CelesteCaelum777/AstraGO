const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
class Element {
 constructor() { this.children = []; this.value = 'T2M'; this.classList = { add() {}, remove() {} }; this.attrs = {}; }
 replaceChildren(...nodes) { this.children = nodes; }
 setAttribute(k, v) { this.attrs[k] = v; }
 addEventListener() {}
}
const elements = {};
const document = { getElementById: id => elements[id] ||= new Element(), createElement: () => new Element() };
let plots = [];
let fetchCount = 0;
let handler;
const window = { Plotly: { purge() {}, Plots: {resize(){}}, newPlot: async (node, traces, layout) => { plots.push({node, traces, layout}); } } };
const source = fs.readFileSync('static/charts.js', 'utf8').replace('window.PlanetaryCharts = { clear, update, init };', 'window.PlanetaryCharts = { clear, update, init, buildChart, rowsFromJSON };');
vm.runInNewContext(source, { window, document, URL, URLSearchParams, AbortController, Map, Set, ResizeObserver: class { observe() {} }, setTimeout, clearTimeout,
 fetch: async (...args) => { fetchCount++; return handler(...args); } });
const api = window.PlanetaryCharts;
const parameters = {};
for (const key of ['T2M', 'T2M_MIN', 'ALLSKY_SFC_SW_DWN', 'WS10M', 'PRECTOTCORR', 'RH2M']) {
 parameters[key] = {};
 for (let year = 2015; year <= 2025; year++) for (let month = 1; month <= 12; month++) parameters[key][`${year}${String(month).padStart(2,'0')}`] = (year-2015)*2+month;
 parameters[key]['201513'] = 99999;
}
const data = { header: {fill_value: -999}, properties: {parameter: parameters} };
const chart = type => api.buildChart(data, 'T2M', type);
assert.equal(chart('heatmaps').traces[0].z.length, 11);
assert.equal(chart('heatmaps').traces[0].z[0].length, 12);
assert.equal(chart('variables').traces[0].x.length, 132);
assert.equal(chart('trend').traces.length, 2);
assert.ok(chart('trend').traces[1].name.includes('2.000'));
assert.equal(chart('trend').traces[0].y[0], 6.5);
assert.ok(Math.abs(chart('anomalies').traces[0].y.reduce((a,b) => a+b,0)) < 1e-8);
assert.equal(chart('cycles').traces.length, 11);
assert.equal(chart('histograms').traces[0].type, 'histogram');
assert.equal(chart('psychrometric').traces[0].x.length, 132);
parameters.T2M['201501'] = -999;
assert.equal(chart('heatmaps').traces[0].z[0][0], null);
assert.equal(chart('variables').traces[0].y[0], null);
assert.equal(chart('trend').traces[0].x.length, 10);
assert.equal(chart('psychrometric').traces[0].x.length, 131);
const real = data;
(async () => {
 handler = async url => {
  assert.equal(url.searchParams.get('start'), '2015');
  assert.equal(url.searchParams.get('end'), '2025');
  return { ok: true, json: async () => real };
 };
 await api.update(-23.5, -69.9, 'heatmaps');
 await api.update(-23.5, -69.9, 'trend');
 assert.equal(fetchCount, 1);
 assert.equal(plots.length, 2);
 let resolveOld;
 handler = url => url.searchParams.get('latitude') === '10' ? new Promise(resolve => { resolveOld = resolve; }) : Promise.resolve({ok:true,json:async()=>real});
 const old = api.update(10, 20, 'variables');
 await api.update(11, 21, 'histograms');
 const count = plots.length;
 resolveOld({ok:true,json:async()=>real});
 await old;
 assert.equal(plots.length, count);
 assert.ok(elements.toolkitStatus.textContent.includes('11.00, 21.00'));
 handler = async () => { throw new Error('Connection failure'); };
 await api.update(30, 40, 'variables');
 assert.equal(elements.retryChart.hidden, false);
 assert.equal(elements.nasaFrame.attrs['aria-busy'], 'false');
 api.clear();
 assert.equal(elements.nasaFrame.children.length, 0);
 console.log('OK: datos faltantes, regresión, caché, errores y selección concurrente.');
})().catch(error => { console.error(error); process.exitCode=1; });
