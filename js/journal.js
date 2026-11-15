(function() {
  // Animación de entrada de las tarjetas del journal
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // ⚠️ OPTIMIZACIÓN: dejamos de observar una vez visible para liberar recursos
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.j-card').forEach(card => observer.observe(card));
})();