const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
class Element {
  constructor() { this.children = []; this.value = 'T2M'; this.listeners = {}; this.classList = { add() {}, remove() {} }; }
  replaceChildren(...nodes) { this.children = nodes; }
  setAttribute() {}
  addEventListener(name, callback) { this.listeners[name] = callback; }
}
const elements = {};
const document = { getElementById: id => elements[id] ||= new Element(), createElement: () => new Element() };
const plots = [];
let handler;
const window = { Plotly: { purge() {}, Plots: { resize() {} }, newPlot: async (node, traces, layout, config) => plots.push({node, traces, layout, config}) } };
const context = vm.createContext({window, document, URL, URLSearchParams, AbortController, setTimeout, clearTimeout,
  ResizeObserver: class { observe() {} }, fetch: (...args) => handler(...args)});
vm.runInContext(fs.readFileSync('static/terrain.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('static/charts.js', 'utf8'), context);
const grid = { latitudes: Array.from({length:7}, (_,i) => -23.56+i*0.02),
  longitudes: Array.from({length:7}, (_,i) => -69.96+i*0.02),
  z: Array.from({length:7}, (_,i) => Array.from({length:7}, (_,j) => 2000+i*10+j)), source:'Copernicus · Open-Meteo', stale:false };
assert.equal(window.PlanetaryTerrain.build(grid).traces[0].type, 'surface');
assert.equal(window.PlanetaryTerrain.build(grid).traces[0].z[3][3], 2033);
assert.throws(() => window.PlanetaryTerrain.build({...grid,z:[[null]]}), /49 altitudes/);
(async () => {
  handler = async (url) => { assert.ok(url.startsWith('/api/terrain?')); return {ok:true,json:async()=>grid}; };
  window.PlanetaryCharts.init();
  await window.PlanetaryCharts.update(-23.5,-69.9,'terrain');
  assert.equal(plots[0].traces[0].type,'surface');
  assert.equal(plots[0].config.toImageButtonOptions.format,'png');
  assert.equal(elements.chartVariable.disabled,true);
  assert.ok(elements.toolkitStatus.textContent.includes('7×7'));
  let resolveOld;
  handler = () => new Promise(resolve => { resolveOld = resolve; });
  const pending = window.PlanetaryCharts.update(1,2,'terrain');
  window.PlanetaryCharts.clear();
  resolveOld({ok:true,json:async()=>grid});
  await pending;
  assert.equal(plots.length,1);
  assert.equal(elements.nasaFrame.children.length,0);
  handler = async () => ({ok:false,json:async()=>({detail:'Open-Meteo no disponible'})});
  await window.PlanetaryCharts.update(10,20,'terrain');
  assert.ok(elements.toolkitStatus.textContent.includes('Open-Meteo no disponible'));
  assert.equal(elements.retryChart.hidden,false);
  console.log('OK: superficie 7×7, ejes, PNG, errores y cancelación del relieve.');
})().catch(error => { console.error(error); process.exitCode=1; });
