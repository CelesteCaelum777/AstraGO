(function() {
  const intro = document.getElementById('view-intro');
  const scrollHint = document.querySelector('.scroll-hint');

  function start() {
    window.ASTRA?.goToSelector();
  }

  scrollHint?.addEventListener('click', start);

  // Scroll con rueda en la intro
  window.addEventListener('wheel', (e) => {
    if (window.ASTRA?.currentView === 'intro' && e.deltaY > 30) {
      start();
    }
  }, { passive: true });
})();