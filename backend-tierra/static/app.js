
      // Presentation metadata belongs only to the lateral parameter form.
      const PARAMS = [
        { key: 'T2M', label: 'Temperatura Promedio', unit: '°C', min: -55, max: 45, step: 0.1 },
        { key: 'T2M_MIN', label: 'Temperatura Mínima', unit: '°C', min: -70, max: 35, step: 0.1 },
        { key: 'ALLSKY_SFC_SW_DWN', label: 'Radiación Solar', unit: 'kW-hr/m²/day', helpUnit: 'kW-hr/m²/día', min: 0.5, max: 8.5, step: 0.1 },
        { key: 'WS10M', label: 'Velocidad del Viento', unit: 'm/s', min: 0.5, max: 20, step: 0.1 },
        { key: 'PRECTOTCORR', label: 'Precipitación Diaria', unit: 'mm/day', helpUnit: 'mm/día', min: 0, max: 30, step: 0.1 },
        { key: 'RH2M', label: 'Humedad Relativa', unit: '%', min: 5, max: 100, step: 1 },
        { key: 'ELEVATION', label: 'Elevación / Altitud del Terreno', unit: 'm', min: 0, max: 6000, step: 10 }
      ];
      const ADDITIONAL_PARAMS = [
        { key: 'PS', label: 'Presión Atmosférica', unit: 'kPa', min: 50, max: 103, step: 0.1, value: 65, weight: 5 },
        { key: 'TS', label: 'Temperatura del Suelo', unit: '°C', min: -60, max: 55, step: 0.1, value: -25, weight: 6 },
        { key: 'GWETTOP', label: 'Humedad Superficial del Suelo', unit: '0-1', min: 0, max: 1, step: 0.01, value: 0.05, weight: 5 }
      ];
      const defaultTargets = {
        T2M: -60, T2M_MIN: -80, ALLSKY_SFC_SW_DWN: 6.5,
        WS10M: 5, PRECTOTCORR: 0, RH2M: 10, ELEVATION: 2500
      };
      const defaultWeights = {
        T2M: 9, T2M_MIN: 9, ALLSKY_SFC_SW_DWN: 8,
        WS10M: 5, PRECTOTCORR: 4, RH2M: 7, ELEVATION: 6
      };

      const state = {
        selectedId: null,
        results: [],
        parameters: [...PARAMS],
        selectedViz: 'heatmaps',
        globe: null,
        markers: [],
        searchInFlight: false,
        toolkitTemplates: {},
        viewerGeneration: 0,
      };

      const parameterRoot = document.getElementById('parameters');
      const searchButton = document.getElementById('searchButton');
      const searchStatus = document.getElementById('searchStatus');
      const minSimilarityInput = document.getElementById('minSimilarity');
      const minSimilarityValue = document.getElementById('minSimilarityValue');
      const resultsTableBody = document.getElementById('resultsTableBody');
      const resultCountBadge = document.getElementById('resultCountBadge');
      const vizSelector = document.getElementById('vizSelector');
      const iframeLoading = document.getElementById('iframeLoading');
      const nasaFrame = document.getElementById('nasaFrame');
      const selectedMetrics = document.getElementById('selectedMetrics');

      function renderParameterControls() {
        function createControl(param, optional = false) {
          const key = param.key;
          const row = document.createElement('section');
          row.className = 'parameter-block';
          const heading = document.createElement('label');
          heading.className = 'parameter-heading';
          heading.htmlFor = `target-${key}`;
          const descriptive = document.createElement('span');
          descriptive.className = 'form-descriptive';
          descriptive.textContent = `${param.label} (${key}) · ${param.unit}`;
          const technical = document.createElement('span');
          technical.className = 'form-technical';
          technical.textContent = `${key} (${param.unit})`;
          heading.append(descriptive, technical);
          const help = document.createElement('p');
          help.className = 'parameter-help form-descriptive';
          help.id = `range-${key}`;
          help.textContent = `Rango terrestre: ${param.min} a ${param.max} ${param.helpUnit || param.unit}`;
          const controls = document.createElement('div');
          controls.className = 'parameter-controls';
          const targetWrap = document.createElement('div');
          const targetLabel = document.createElement('label');
          targetLabel.className = 'parameter-control-label form-descriptive';
          targetLabel.htmlFor = `target-${key}`;
          targetLabel.textContent = 'Valor objetivo:';
          const input = document.createElement('input');
          input.type = 'number';
          input.id = `target-${key}`;
          input.name = key;
          input.required = true;
          input.min = param.min;
          input.max = param.max;
          input.step = param.step;
          input.value = optional ? param.value : defaultTargets[key];
          input.setAttribute('aria-label', `Valor objetivo de ${param.label} (${key}), ${param.unit}`);
          input.setAttribute('aria-describedby', `range-${key} note-${key}`);
          input.dataset.param = key;
          input.dataset.type = optional ? 'optional-target' : 'target';
          targetWrap.append(targetLabel, input);
          const weightWrap = document.createElement('div');
          const weightLabel = document.createElement('label');
          weightLabel.className = 'parameter-control-label form-descriptive';
          weightLabel.htmlFor = `weight-${key}`;
          weightLabel.textContent = 'Ponderación / Importancia (1-10):';
          const weightBox = document.createElement('div');
          weightBox.className = 'weight-box';
          const weightInput = document.createElement('input');
          weightInput.type = 'range';
          weightInput.id = `weight-${key}`;
          weightInput.name = `weight-${key}`;
          weightInput.setAttribute('aria-label', `Importancia de ${key}`);
          weightInput.min = '1';
          weightInput.max = '10';
          weightInput.step = '1';
          weightInput.value = optional ? param.weight : defaultWeights[key];
          weightInput.dataset.param = key;
          weightInput.dataset.type = optional ? 'optional-weight' : 'weight';
          const weightValue = document.createElement('output');
          weightValue.className = 'weight-value';
          weightValue.htmlFor = weightInput.id;
          weightValue.textContent = weightInput.value;
          weightInput.addEventListener('input', () => { weightValue.textContent = weightInput.value; });
          weightBox.append(weightInput, weightValue);
          weightWrap.append(weightLabel, weightBox);
          controls.append(targetWrap, weightWrap);
          const note = document.createElement('p');
          note.id = `note-${key}`;
          note.className = 'parameter-note form-descriptive';
          const updateRangeNote = () => {
            const outside = input.value !== '' && (Number(input.value) < param.min || Number(input.value) > param.max);
            note.textContent = outside ? 'Objetivo fuera del rango terrestre; se conserva como referencia planetaria.' : '';
          };
          input.addEventListener('input', updateRangeNote);
          updateRangeNote();
          row.append(heading, help, controls, note);
          if (key === 'ELEVATION') {
            const elevationLabel = document.createElement('label');
            elevationLabel.className = 'parameter-activation';
            const includeElevation = document.createElement('input');
            includeElevation.type = 'checkbox';
            includeElevation.id = 'include-ELEVATION';
            includeElevation.checked = true;
            includeElevation.addEventListener('change', () => {
              input.disabled = !includeElevation.checked;
              weightInput.disabled = !includeElevation.checked;
            });
            elevationLabel.append(includeElevation, document.createTextNode('Incluir elevación en la similitud · Open-Meteo'));
            row.prepend(elevationLabel);
          }
          if (optional) {
            const activationLabel = document.createElement('label');
            activationLabel.className = 'parameter-activation';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `include-${key}`;
            checkbox.name = key;
            checkbox.disabled = true;
            checkbox.setAttribute('aria-describedby', 'additionalParametersNotice');
            activationLabel.append(checkbox, document.createTextNode('Incluir en el cálculo · requiere soporte del motor'));
            input.disabled = true;
            weightInput.disabled = true;
            row.prepend(activationLabel);
          }
          return row;
        }
        parameterRoot.replaceChildren(...PARAMS.map(param => createControl(param)));
        document.getElementById('additionalParameters').replaceChildren(...ADDITIONAL_PARAMS.map(param => createControl(param, true)));
        const displayMode = document.getElementById('parameterDisplayMode');
        const updateDisplayMode = () => {
          // Only change presentation: keep the existing input nodes and their values.
          document.querySelector('.left-panel').dataset.parameterMode = displayMode.value;
        };
        displayMode.addEventListener('change', updateDisplayMode);
        updateDisplayMode();
      }

      function getCurrentFormValues() {
        const targets = {};
        const weights = {};

        document.querySelectorAll('input[data-type="target"]').forEach((element) => {
          if (element.disabled) return;
          const key = element.dataset.param;
          // Earth ranges are guidance; planetary targets may intentionally exceed them.
          if (element.value.trim() === '' || !Number.isFinite(Number(element.value)) || (key === 'ELEVATION' && !element.reportValidity())) {
            element.focus();
            throw new Error('Complete los objetivos con valores numéricos válidos.');
          }
          targets[key] = Number(element.value);
        });

        document.querySelectorAll('input[data-type="weight"]').forEach((element) => {
          if (element.disabled) return;
          const key = element.dataset.param;
          weights[key] = Number(element.value);
        });

        return { targets, weights, minSimilarity: Number(minSimilarityInput.value) };
      }

      function setSearchStatus(message, loading = false) {
        searchStatus.innerHTML = '';
        if (loading) {
          const spinner = document.createElement('span');
          spinner.className = 'dot-spinner';
          searchStatus.appendChild(spinner);
        }
        const text = document.createElement('span');
        text.textContent = message;
        searchStatus.appendChild(text);
      }

      function formatNumber(value, digits = 1) {
        if (value === null || value === undefined || Number.isNaN(value)) return '—';
        return Number(value).toFixed(digits);
      }

      function renderResultsTable(results) {
        resultsTableBody.innerHTML = '';

        if (!results.length) {
          const row = document.createElement('tr');
          row.innerHTML = '<td colspan="8" class="muted">No se encontraron ubicaciones con el umbral actual.</td>';
          resultsTableBody.appendChild(row);
          resultCountBadge.textContent = '0';
          return;
        }

        resultCountBadge.textContent = String(results.length);

        results.forEach((entry) => {
          const row = document.createElement('tr');
          row.tabIndex = 0;
          row.setAttribute('aria-selected', String(state.selectedId === `${entry.lat},${entry.lon}`));
          row.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); row.click(); } });
          row.dataset.id = `${entry.lat},${entry.lon}`;
          if (state.selectedId === `${entry.lat},${entry.lon}`) {
            row.classList.add('selected');
          }

          row.innerHTML = `
            <td>
              <div class="coord-cell">
                <div>
                  <div class="badge" style="background: rgba(251, 191, 36, 0.12); color: #fbbf24; border-color: rgba(251, 191, 36, 0.25);">${entry.similarity.toFixed(1)}%</div>
                </div>
                <div class="coord-text">
                  <strong>${entry.name}</strong><br><small>${entry.source}</small><br>
                  <span class="muted">${entry.lat.toFixed(2)}, ${entry.lon.toFixed(2)}</span>
                </div>
              </div>
            </td>
            <td>${formatNumber(entry.values.T2M, 1)}</td>
            <td>${formatNumber(entry.values.T2M_MIN, 1)}</td>
            <td>${formatNumber(entry.values.ALLSKY_SFC_SW_DWN, 2)}</td>
            <td>${formatNumber(entry.values.WS10M, 1)}</td>
            <td>${formatNumber(entry.values.PRECTOTCORR, 2)}</td>
            <td>${formatNumber(entry.values.RH2M, 0)}</td>
            <td title="${entry.elevation_source || 'Elevación no consultada'}${entry.elevation_stale ? ' · caché vencida' : ''}">${formatNumber(entry.values.ELEVATION, 0)}</td>
          `;

          row.addEventListener('click', () => {
            state.selectedId = `${entry.lat},${entry.lon}`;
            renderResultsTable(state.results);
            highlightSelectedMarker(entry);
            focusOnLocation(entry.lat, entry.lon);
            updateNASAViewer(entry.lat, entry.lon, state.selectedViz);
            updateSelectedMetrics(entry);
          });

          resultsTableBody.appendChild(row);
        });
      }

      function colorScale(similarity) {
        if (similarity >= 90) return '#4ade80';
        if (similarity >= 80) return '#22c55e';
        if (similarity >= 70) return '#fbbf24';
        if (similarity >= 60) return '#f97316';
        return '#ef4444';
      }

      function buildGlobe() {
        const globeEl = document.getElementById('globeViz');
        const globe = Globe()(globeEl)
          .backgroundColor('#00000000')
          .showAtmosphere(true)
          .atmosphereColor('#7dd3fc')
          .atmosphereAltitude(0.22)
          .pointOfView({ lat: 15, lng: 18, altitude: 2.0 });

        globe
          .polygonsData([])
          .polygonCapColor(() => 'rgba(124,198,255,0.24)')
          .polygonSideColor(() => 'rgba(255,255,255,0.06)')
          .polygonLabel(() => '');

        globe.controls().autoRotate = true;
        globe.controls().autoRotateSpeed = 0.4;

        globe.globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
        state.globe = globe;
        new ResizeObserver(() => { globe.width(globeEl.clientWidth).height(globeEl.clientHeight); }).observe(globeEl);
      }

      function updateMarkers(results) {
        if (!state.globe) return;

        const points = results.map((entry) => ({
          lat: entry.lat,
          lng: entry.lon,
          color: colorScale(entry.similarity),
          similarity: entry.similarity,
          name: entry.name,
          id: `${entry.lat},${entry.lon}`
        }));

        state.globe.htmlElementsData(points)
          .htmlElement((d) => {
            const el = document.createElement('div');
            el.className = 'marker';
            el.style.width = d.id === state.selectedId ? '18px' : '10px';
            el.setAttribute('role', 'button');
            el.tabIndex = 0;
            el.setAttribute('aria-label', `${d.name}: ${d.similarity}%`);
            el.style.pointerEvents = 'auto';
            el.addEventListener('keydown', e => { if (e.key === 'Enter') el.click(); });
            el.style.height = '10px';
            el.style.borderRadius = '50%';
            el.style.background = d.color;
            el.style.border = '2px solid rgba(255,255,255,0.9)';
            el.style.boxShadow = '0 0 12px rgba(255,255,255,0.65)';
            el.style.cursor = 'pointer';
            el.addEventListener('click', () => {
              const found = state.results.find(item => `${item.lat},${item.lon}` === d.id);
              if (found) {
                state.selectedId = d.id;
                renderResultsTable(state.results);
                resultsTableBody.querySelector('tr.selected')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                highlightSelectedMarker(found);
                focusOnLocation(found.lat, found.lon);
                updateNASAViewer(found.lat, found.lon, state.selectedViz);
                updateSelectedMetrics(found);
              }
            });
            return el;
          });

        state.markers = points;
      }

      function highlightSelectedMarker(entry) {
        if (!state.globe) return;
        const full = state.markers.map((marker) => ({
          ...marker,
          color: marker.id === `${entry.lat},${entry.lon}` ? '#5eead4' : marker.color,
          radius: marker.id === `${entry.lat},${entry.lon}` ? 3 : 1
        }));
        state.globe.htmlElementsData(full);
      }

      function focusOnLocation(lat, lon) {
        if (!state.globe) return;
        state.globe.controls().autoRotate = false;
        state.globe.pointOfView({ lat, lng: lon, altitude: 0.8 }, 1000);
      }

      function updateSelectedMetrics(entry) {
        const values = [
          { label: 'T2M', value: entry.values.T2M },
          { label: 'T2M_MIN', value: entry.values.T2M_MIN },
          { label: 'SW_DWN', value: entry.values.ALLSKY_SFC_SW_DWN },
          { label: 'WS10M', value: entry.values.WS10M },
          { label: 'PRECTOTCORR', value: entry.values.PRECTOTCORR },
          { label: 'RH2M', value: entry.values.RH2M }
        ];

        selectedMetrics.innerHTML = values.map((metric) => `
          <span class="metric-tag">${metric.label}: ${formatNumber(metric.value, metric.label.includes('T2M') ? 1 : 2)}</span>
        `).join('');
      }

      // Keep the existing selection callbacks; rendering is isolated in the right panel.
      function clearViewer() {
        window.PlanetaryCharts.clear();
        selectedMetrics.textContent = '';
      }

      function updateNASAViewer(lat, lon, vizType) {
        window.PlanetaryCharts.update(lat, lon, vizType);
      }

      function loadToolkitConfig() {
        window.PlanetaryCharts.init();
      }

      async function searchAnalogSites() {
        if (state.searchInFlight) return;
        state.searchInFlight = true;
        searchButton.disabled = true;
        setSearchStatus('Consultando análogos con NASA POWER…', true);

        try {
          const { targets, weights, minSimilarity } = getCurrentFormValues();
          const response = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targets, weights, min_similarity: minSimilarity, mode: document.getElementById('dataMode').value })
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(typeof error.detail === 'string' ? error.detail : 'No se pudo completar la búsqueda.');
          }

          const payload = await response.json();
          state.results = payload.results || [];
          renderResultsTable(state.results);
          updateMarkers(state.results);

          if (state.results.length) {
            state.selectedId = `${state.results[0].lat},${state.results[0].lon}`;
            renderResultsTable(state.results);
            highlightSelectedMarker(state.results[0]);
            focusOnLocation(state.results[0].lat, state.results[0].lon);
            updateNASAViewer(state.results[0].lat, state.results[0].lon, state.selectedViz);
            updateSelectedMetrics(state.results[0]);
            setSearchStatus(`${state.results.length} coincidencias de ${payload.evaluated_count} regiones. ${payload.demo_count ? `${payload.demo_count} regiones usan datos de demostración.` : 'Datos NASA POWER verificados.'}`, false);
          } else {
            state.selectedId = null;
            clearViewer();
            setSearchStatus(`Sin coincidencias. ${payload.demo_count} regiones evaluadas con datos de demostración. Pruebe reducir el umbral.`, false);
          }
        } catch (error) {
          console.error(error);
          setSearchStatus(error.message || 'Error de conexión. Reintente la búsqueda.', false);
        } finally {
          state.searchInFlight = false;
          searchButton.disabled = false;
        }
      }

      minSimilarityInput.addEventListener('input', (event) => {
        minSimilarityValue.textContent = `${event.target.value}%`;
      });

      vizSelector.addEventListener('change', (event) => {
        state.selectedViz = event.target.value;
        if (state.results.length) {
          const selected = state.results.find((entry) => `${entry.lat},${entry.lon}` === state.selectedId) || state.results[0];
          updateNASAViewer(selected.lat, selected.lon, state.selectedViz);
          updateSelectedMetrics(selected);
        }
      });

      document.getElementById('searchButton').addEventListener('click', searchAnalogSites);

      renderParameterControls();
      minSimilarityValue.textContent = `${minSimilarityInput.value}%`;
      try { buildGlobe(); } catch {
        document.getElementById('globeViz').textContent = 'No se pudo cargar el globo 3D. Puede explorar las ubicaciones en la tabla.';
      }
      clearViewer();
      loadToolkitConfig();
      setSearchStatus('Listo. Se evaluarán siete regiones conocidas; no es una búsqueda global.', false);
