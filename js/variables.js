const VARIABLES_DATA = {
  mars: [
    {
      title: 'Atmósfera',
      count: 6,
      desc: 'Composición y dinámica de la atmósfera marciana.',
      img: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=800&auto=format&fit=crop',
    },
    {
      title: 'Geología',
      count: 8,
      desc: 'Estructuras geológicas, cráteres y volcanes.',
      img: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=800&auto=format&fit=crop',
    },
    {
      title: 'Clima',
      count: 4,
      desc: 'Temperaturas, tormentas de polvo y estaciones.',
      img: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=800&auto=format&fit=crop',
    },
    {
      title: 'Habitabilidad',
      count: 5,
      desc: 'Potencial de vida y recursos in situ.',
      img: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=800&auto=format&fit=crop',
    },
  ],
  moon: [
    {
      title: 'Superficie',
      count: 7,
      desc: 'Regolito, craterización y basalto lunar.',
      img: 'https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?q=80&w=800&auto=format&fit=crop',
    },
    {
      title: 'Geología',
      count: 5,
      desc: 'Mares lunares, tierras altas y tectónica.',
      img: 'https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?q=80&w=800&auto=format&fit=crop',
    },
    {
      title: 'Exploración',
      count: 9,
      desc: 'Misiones históricas y futuras bases lunares.',
      img: 'https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?q=80&w=800&auto=format&fit=crop',
    },
    {
      title: 'Recursos',
      count: 3,
      desc: 'Helio-3, agua helada y minerales.',
      img: 'https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?q=80&w=800&auto=format&fit=crop',
    },
  ],
};

function initVariables() {
  renderVariables(AppState.currentPlanet || 'moon');
}

function renderVariables(planet) {
  const grid = document.getElementById('vars-grid');
  if (!grid) return;

  const data = VARIABLES_DATA[planet] || VARIABLES_DATA.moon;
  const isMars = planet === 'mars';

  grid.innerHTML = data.map((item, i) => `
    <div class="var-card ${isMars ? 'mars-theme' : ''}" data-index="${i}">
      <div class="var-card-inner">
        <div class="var-image-col">
          <img src="${item.img}" alt="${item.title}">
        </div>
        <div class="var-text-col">
          <h3 class="var-title">${item.title}</h3>
          <div class="var-count"><span></span> ${item.count} variables</div>
          <p class="var-desc">${item.desc}</p>
        </div>
      </div>
      <div class="var-footer">
        <button class="btn-primary-action">
          Explorar
          <svg viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
        </button>
        <div class="sources-container">
          <button class="btn-source-action" onclick="event.stopPropagation(); this.parentElement.classList.toggle('open')">
            Fuentes <b>${item.count}</b>
          </button>
          <div class="sources-dropdown">
            <a href="#" class="source-link" onclick="event.preventDefault();">
              <svg viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
              NASA Planetary Data System
            </a>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  // Cerrar dropdowns al hacer clic fuera
  document.addEventListener('click', () => {
    document.querySelectorAll('.sources-container.open').forEach(c => c.classList.remove('open'));
  });

  // Click en tarjeta → explorador 3D
  grid.querySelectorAll('.var-card').forEach(card => {
    card.addEventListener('click', () => {
      showView('view-explorer');
      document.body.style.overflow = 'hidden';
      const missionBadge = document.getElementById('mission-badge');
      if (missionBadge) {
        missionBadge.textContent = `MISIÓN: ${isMars ? 'MARTE' : 'LUNA'}`;
      }
    });
  });
}