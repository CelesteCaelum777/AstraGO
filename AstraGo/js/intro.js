function initIntro() {
  const intro = document.getElementById('view-intro');
  const scrollHint = document.getElementById('scroll-hint');

  if (!intro) return;

  function scrollToSelector() {
    if (AppState.isTransitioning) return;
    AppState.isTransitioning = true;

    intro.classList.add('blurred');

    setTimeout(() => {
      document.getElementById('view-selector').classList.add('visible');
      window.scrollTo({
        top: window.innerHeight,
        behavior: 'smooth'
      });
      AppState.isTransitioning = false;
    }, 400);
  }

  if (scrollHint) scrollHint.addEventListener('click', scrollToSelector);

  // Detectar scroll para transición automática
  let lastScrollTop = 0;
  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > 50 && AppState.currentView === 'intro' && !AppState.isTransitioning) {
      intro.classList.add('blurred');
      document.getElementById('view-selector').classList.add('visible');
    }
  });
}