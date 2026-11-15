(function() {
  const marsBtn = document.querySelector('.panel.mars .panel-action');
  const moonBtn = document.querySelector('.panel.moon .panel-action');

  marsBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    window.ASTRA?.goToVariables('mars');
  });

  moonBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    window.ASTRA?.goToVariables('moon');
  });

  // Volver desde el selector
  document.querySelectorAll('.btn-back-nav').forEach(btn => {
    btn.addEventListener('click', () => window.ASTRA?.goToIntro());
  });
})();