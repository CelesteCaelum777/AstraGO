(function() {
  const translations = {
    en: {
      // Intro
      "intro.desc": "Explore the confines of the solar system through scientific data, 3D visualizations, and comparative analysis of Mars and the Moon.",
      "intro.scroll": "Scroll",

      // Selector
      "selector.back": "← Back",
      "selector.select": "SELECT MISSION TARGET",
      "selector.mars.title": "Astra Mars",
      "selector.mars.desc": "The red planet. Analysis of atmosphere, geology, and potential habitability.",
      "selector.moon.title": "Astra Moon",
      "selector.moon.desc": "Our natural satellite. Study of craters, regolith, and resources.",
      "selector.explore": "Explore",
      "selector.distance": "Distance from Earth",
      "selector.gravity": "Gravity",

      // Journal
      "journal.title": "Science Journal",
      "journal.subtitle": "Comparative analysis · Mars vs Moon",
      "journal.atm.title": "Atmosphere",
      "journal.atm.sub": "Gaseous composition",
      "journal.atm.text": "Mars has a thin CO₂ atmosphere, while the Moon lacks one.",
      "journal.geo.title": "Geology",
      "journal.geo.sub": "Surface structure",
      "journal.geo.text": "Mars shows extinct volcanism; the Moon preserves ancient craters.",

      // Explorer
      "explorer.back": "← Back",
      "explorer.mission": "CURRENT MISSION",
      "explorer.search": "Search locations...",
      "explorer.lat": "Latitude",
      "explorer.lon": "Longitude",
      "explorer.desc": "Description"
    },

    es: {
      // Intro
      "intro.desc": "Explora los confines del sistema solar a través de datos científicos, visualizaciones 3D y análisis comparativos de Marte y la Luna.",
      "intro.scroll": "Scroll",

      // Selector
      "selector.back": "← Volver",
      "selector.select": "SELECCIONAR OBJETIVO",
      "selector.mars.title": "Astra Mars",
      "selector.mars.desc": "El planeta rojo. Análisis de atmósfera, geología y potencial habitabilidad.",
      "selector.moon.title": "Astra Moon",
      "selector.moon.desc": "Nuestro satélite natural. Estudio de cráteres, regolito y recursos.",
      "selector.explore": "Explorar",
      "selector.distance": "Distancia de la Tierra",
      "selector.gravity": "Gravedad",

      // Journal
      "journal.title": "Science Journal",
      "journal.subtitle": "Análisis comparativo · Marte vs Luna",
      "journal.atm.title": "Atmósfera",
      "journal.atm.sub": "Composición gaseosa",
      "journal.atm.text": "Marte posee una atmósfera tenue de CO₂, mientras la Luna carece de ella.",
      "journal.geo.title": "Geología",
      "journal.geo.sub": "Estructura superficial",
      "journal.geo.text": "Marte muestra vulcanismo extinto; la Luna conserva cráteres antiguos.",

      // Explorer
      "explorer.back": "← Volver",
      "explorer.mission": "MISIÓN ACTUAL",
      "explorer.search": "Buscar ubicaciones...",
      "explorer.lat": "Latitud",
      "explorer.lon": "Longitud",
      "explorer.desc": "Descripción"
    }
  };

  // Inglés es el idioma dominante por defecto
  let currentLang = localStorage.getItem('astra-lang') || 'en';

  function applyLang(lang) {
    currentLang = lang;
    localStorage.setItem('astra-lang', lang);
    document.documentElement.lang = lang;

    // Actualiza todos los elementos con data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = translations[lang][key];
      if (text) el.textContent = text;
    });

    // Actualiza placeholders (data-i18n-placeholder)
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const text = translations[lang][key];
      if (text) el.placeholder = text;
    });

    // Actualiza el botón de idioma
    const btn = document.getElementById('lang-toggle');
    if (btn) btn.textContent = lang === 'en' ? 'ES' : 'EN';
  }

  // Botón toggle EN/ES
  window.addEventListener('DOMContentLoaded', () => {
    applyLang(currentLang);

    document.getElementById('lang-toggle')?.addEventListener('click', () => {
      applyLang(currentLang === 'en' ? 'es' : 'en');
    });
  });

  // Exponer para uso externo (ej: explorer.js al crear paneles dinámicos)
  window.ASTRA_I18N = {
    t: (key) => translations[currentLang][key] || key,
    apply: applyLang,
    get lang() { return currentLang; }
  };
})();