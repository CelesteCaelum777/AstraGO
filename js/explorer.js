(function() {
  let scene, camera, renderer, controls;
  let isActive = false;

  function initThree() {
    const container = document.getElementById('canvas-container');
    if (!container || renderer) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);

    const geo = new THREE.SphereGeometry(1.5, 64, 64);
    const mat = new THREE.MeshStandardMaterial({ color: 0xcc4400, roughness: 0.9 });
    const sphere = new THREE.Mesh(geo, mat);
    sphere.name = 'planet';
    scene.add(sphere);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
  }

  function animate() {
    requestAnimationFrame(animate);
    controls?.update();
    renderer?.render(scene, camera);
  }

  function setPlanetColor(target) {
    const planet = scene?.getObjectByName('planet');
    if (!planet) return;
    planet.material.color.setHex(target === 'mars' ? 0xcc4400 : 0xaaaaaa);
  }

  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');

  const SAMPLE_LOCATIONS = {
    mars: [
      { name: 'Olympus Mons', desc: 'Largest volcano in the solar system', desc_es: 'Volcán más grande del sistema solar', coords: '18.65°N, 226.2°E' },
      { name: 'Valles Marineris', desc: '4000 km long canyon', desc_es: 'Cañón de 4000 km de longitud', coords: '13.9°S, 59.2°W' },
      { name: 'Gale Crater', desc: 'Curiosity landing site', desc_es: 'Sitio de aterrizaje del Curiosity', coords: '5.4°S, 137.8°E' }
    ],
    moon: [
      { name: 'Mare Tranquillitatis', desc: 'Apollo 11 landing site', desc_es: 'Sitio del Apolo 11', coords: '8.5°N, 31.4°E' },
      { name: 'Tycho Crater', desc: 'Prominent impact crater', desc_es: 'Cráter de impacto prominente', coords: '43.3°S, 11.2°W' },
      { name: 'South Pole', desc: 'Water ice region', desc_es: 'Región con hielo de agua', coords: '89.9°S, 0°' }
    ]
  };

  function renderSearchResults(query) {
    if (!searchResults) return;
    const target = window.ASTRA.currentTarget;
    const locations = SAMPLE_LOCATIONS[target] || [];
    const filtered = query
      ? locations.filter(l => l.name.toLowerCase().includes(query.toLowerCase()))
      : locations;

    if (filtered.length === 0) {
      searchResults.classList.remove('show');
      return;
    }

    searchResults.innerHTML = filtered.map(loc => `
      <div class="search-item" data-name="${loc.name}">
        <div>
          <h4>${loc.name}</h4>
          <p>${loc.coords}</p>
        </div>
        <span class="arrow">→</span>
      </div>
    `).join('');

    searchResults.classList.add('show');

    searchResults.querySelectorAll('.search-item').forEach(item => {
      item.addEventListener('click', () => {
        showInfoPanel(loc);
        searchResults.classList.remove('show');
        searchInput.value = '';
      });
    });
  }

  function showInfoPanel(loc) {
    const panel = document.getElementById('info-panel');
    const body = document.getElementById('info-body');
    if (!panel || !body) return;

    const isMars = window.ASTRA.currentTarget === 'mars';
    const techClass = isMars ? 'mars-color' : '';
    const t = window.ASTRA_I18N?.t || ((k) => k);
    const lang = window.ASTRA_I18N?.lang || 'en';
    const desc = lang === 'es' && loc.desc_es ? loc.desc_es : loc.desc;

    body.innerHTML = `
      <h2>${loc.name}</h2>
      <span class="coords">${loc.coords}</span>
      <div class="data-grid-3">
        <div class="data-box"><span>${t('explorer.lat')}</span><b>${loc.coords.split(',')[0]}</b></div>
        <div class="data-box"><span>${t('explorer.lon')}</span><b>${loc.coords.split(',')[1] || '--'}</b></div>
      </div>
      <div class="tech-section">
        <div class="tech-title ${techClass}">${t('explorer.desc')}</div>
        <p class="tech-text">${desc}</p>
      </div>
    `;

    panel.classList.add('show');
  }

  searchInput?.addEventListener('input', (e) => {
    renderSearchResults(e.target.value);
  });

  document.querySelector('.btn-close-panel')?.addEventListener('click', () => {
    document.getElementById('info-panel')?.classList.remove('show');
  });

  document.querySelector('#view-explorer .btn-back')?.addEventListener('click', () => {
    window.ASTRA?.goToVariables(window.ASTRA.currentTarget);
  });

  window.addEventListener('astra:explorer', (e) => {
    const target = e.detail.target;
    initThree();
    setPlanetColor(target);
    if (!isActive) {
      isActive = true;
    }
  });

  setInterval(() => {
    if (window.ASTRA?.currentView !== 'explorer') return;
    const lat = document.getElementById('tel-lat');
    const lon = document.getElementById('tel-lon');
    const alt = document.getElementById('tel-alt');
    if (lat) lat.textContent = (Math.random() * 90 - 45).toFixed(2) + '°';
    if (lon) lon.textContent = (Math.random() * 180 - 90).toFixed(2) + '°';
    if (alt) alt.textContent = (Math.random() * 1000 + 300).toFixed(0) + ' km';
  }, 1200);
})();