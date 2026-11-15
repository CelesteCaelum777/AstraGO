// Estado global compartido
window.ASTRA = {
  currentView: 'intro',
  currentTarget: 'mars', // 'mars' | 'moon'
  varsData: {
    mars: [],
    moon: []
  }
};

// Navegación entre vistas
window.ASTRA.goToIntro = () => {
  document.getElementById('view-selector')?.classList.remove('visible');
  document.getElementById('view-intro')?.classList.remove('blurred');
  document.getElementById('view-variables')?.classList.remove('active');
  document.getElementById('view-explorer')?.classList.remove('active');
  window.ASTRA.currentView = 'intro';
  // Scroll instantáneo para evitar demora
  window.scrollTo({ top: 0, behavior: 'auto' });
};

window.ASTRA.goToSelector = () => {
  document.getElementById('view-intro')?.classList.add('blurred');
  document.getElementById('view-selector')?.classList.add('visible');
  document.getElementById('view-variables')?.classList.remove('active');
  document.getElementById('view-explorer')?.classList.remove('active');
  window.ASTRA.currentView = 'selector';
  
  // ⚠️ OPTIMIZACIÓN: esperamos a que la transición de opacidad (0.6s) avance
  // y luego hacemos scroll suave controlado, sin bloquear el hilo principal
  requestAnimationFrame(() => {
    setTimeout(() => {
      document.getElementById('view-selector')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  });
};

window.ASTRA.goToVariables = (target = 'mars') => {
  window.ASTRA.currentTarget = target;
  document.getElementById('view-selector')?.classList.remove('visible');
  document.getElementById('view-intro')?.classList.add('blurred');
  document.getElementById('view-variables')?.classList.add('active');
  document.getElementById('view-explorer')?.classList.remove('active');
  window.ASTRA.currentView = 'variables';
  
  const glow = document.getElementById('vars-bg-glow');
  if (glow) {
    glow.style.background = target === 'mars' 
      ? 'radial-gradient(circle, #ff4d00, transparent 70%)'
      : 'radial-gradient(circle, #00e5ff, transparent 70%)';
  }
  
  window.dispatchEvent(new CustomEvent('astra:variables', { detail: { target } }));
};

window.ASTRA.goToExplorer = (target = 'mars') => {
  window.ASTRA.currentTarget = target;
  document.getElementById('view-variables')?.classList.remove('active');
  document.getElementById('view-explorer')?.classList.add('active');
  window.ASTRA.currentView = 'explorer';
  
  const missionEl = document.getElementById('mission-name');
  if (missionEl) missionEl.textContent = target === 'mars' ? 'Marte' : 'Luna';
  
  window.dispatchEvent(new CustomEvent('astra:explorer', { detail: { target } }));
};