// Estado global de la aplicación
const AppState = {
  currentPlanet: null,
  currentView: 'intro',
  isTransitioning: false,
};

// Navegación entre vistas
function showView(viewId) {
  const views = ['view-intro', 'view-selector', 'view-variables', 'view-explorer'];
  views.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.toggle('active', id === viewId);
      if (id === 'view-selector') el.classList.toggle('visible', id === viewId);
      if (id === 'view-intro' && viewId !== id) el.classList.add('blurred');
      else if (id === 'view-intro') el.classList.remove('blurred');
    }
  });
  AppState.currentView = viewId;
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  console.log('ASTRA GO · Science Journal iniciado');
  initIntro();
  initSelector();
  initJournal();
  initVariables();
  initExplorer();
});