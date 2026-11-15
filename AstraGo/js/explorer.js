let scene, camera, renderer, controls;
let isExplorerInitialized = false;

function initExplorer() {
  const backBtn = document.getElementById('btn-back-explorer');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      showView('view-variables');
    });
  }

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }
}

function handleSearch(e) {
  const query = e.target.value.toLowerCase().trim();
  const resultsContainer = document.getElementById('search-results');
  if (!resultsContainer) return;

  if (query.length < 2) {
    resultsContainer.classList.remove('show');
    return;
  }

  const locations = [
    { name: 'Olympus Mons', type: 'Volcán', coords: '18.65°N, 226.2°E' },
    { name: 'Valles Marineris', type: 'Cañón', coords: '13.9°S, 59.2°W' },
    { name: 'Cráter Gale', type: 'Cráter', coords: '5.4°S, 137.8°E' },
    { name: 'Mar de la Tranquilidad', type: 'Mar lunar', coords: '8.5°N, 31.4°E' },
  ];

  const filtered = locations.filter(loc =>
    loc.name.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    resultsContainer.innerHTML = '<div class="search-item"><p>No se encontraron resultados</p></div>';
  } else {
    resultsContainer.innerHTML = filtered.map(loc => `
      <div class="search-item" onclick="focusLocation('${loc.name}')">
        <div>
          <h4>${loc.name}</h4>
          <p>${loc.type} · ${loc.coords}</p>
        </div>
        <span class="arrow">→</span>
      </div>
    `).join('');
  }

  resultsContainer.classList.add('show');
}

function focusLocation(name) {
  console.log('Enfocando:', name);
  document.getElementById('search-results').classList.remove('show');
}