function initSelector() {
  const panels = document.querySelectorAll('.panel');

  panels.forEach(panel => {
    panel.addEventListener('click', () => {
      const planet = panel.dataset.planet;
      if (!planet) return;

      AppState.currentPlanet = planet;

      // Transición a variables
      const glow = document.getElementById('vars-bg-glow');
      if (glow) {
        glow.style.background = planet === 'mars'
          ? 'radial-gradient(circle, rgba(255,77,0,0.4) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(0,229,255,0.4) 0%, transparent 70%)';
      }

      document.getElementById('view-selector').classList.remove('visible');
      showView('view-variables');
      document.body.style.overflow = 'hidden';
    });
  });
}