(function() {
  const translations = {
    en: {
      // Intro
      "intro.title": "Planetary Analogue Similarity Index (APSI)",
      "intro.desc": "AstraGo is a direct response to one of the most complex and costly challenges of modern space exploration: the validation and prior testing of technologies, rovers, and habitats destined for extreme planetary surfaces such as the Moon and Mars.",
      "intro.desc2": "The core of the system is the Planetary Analogue Similarity Index (APSI), a mathematical model designed to evaluate, compare, and rate the degree of physical correspondence between any geographic coordinate on Earth and the real conditions of celestial bodies.",
      "intro.desc3": "AstraGo represents a convergence between geospatial data science, edge hardware engineering, and international space exploration, providing researchers with a quantitative standard to select the best test sites on the planet.",
      "intro.scroll": "Scroll",

      // Selector
      "selector.back": "← Back",
      "selector.select": "SELECT MISSION TARGET",
      "selector.mars.title": "Astra Mars",
      "selector.mars.desc": "The red planet. Analysis of atmosphere, geology, and potential habitability.",
      "selector.moon.title": "Astra Moon",
      "selector.moon.desc": "Our natural satellite. Study of subsurface ice, radiation, and soil.",
      "selector.explore": "Explore",
      "selector.distance": "Distance from Earth",
      "selector.gravity": "Gravity",

      // Journal
      "journal.title": "Science Journal",
      "journal.subtitle": "Comparative analysis · Mars vs Moon",
      
      "journal.v1.title": "Lithological and Basaltic Composition",
      "journal.v1.sub": "Mineralogical Analysis",
      "journal.v1.text": "This variable evaluates the type and mineralogical nature of the rock formations that outcrop on the surface, focusing on the identification of igneous, mafic, and volcanic rocks of basaltic type. Its analysis is executed by processing short-wave infrared (SWIR) spectral reflectance signatures using high-resolution Sentinel-2 satellite data through platforms such as Microsoft Planetary Computer, cross-referenced with USGS global geologic units. Knowing this parameter is fundamental because the lunar maria and Martian volcanic plains are dominated by basalts; therefore, finding terrestrial analogues with similar mineralogical compositions allows for a realistic simulation of the abrasion, terrain hardness, and physical behavior that drilling tools and rover wheels will face.",
      
      "journal.v2.title": "Hydration Index",
      "journal.v2.sub": "Presence of Structural Water",
      "journal.v2.text": "The hydration index quantifies the presence of structurally bound water in the crystal lattice of clay minerals, phyllosilicates, or hydrated oxides, as well as the extreme dryness in the first few centimeters of the terrain. It is calculated by combining Sentinel-2 SWIR spectral bands and surface moisture monitoring through open meteorological and hydrological models. Its relevance lies in the fact that in the hyper-arid planetary environments of Mars and the exposed surface of the Moon, free liquid water does not exist, being found only retained in the form of chemically altered minerals; validating this index on Earth guarantees that the test site replicates the true aridity and surface geochemical state of celestial bodies.",
      
      "journal.v3.title": "Granulometry and Regolith Distribution",
      "journal.v3.sub": "Surface Soil Composition",
      "journal.v3.text": "This variable measures the percentage proportion of sand, silt, clay, coarse fragments, and gravel, as well as the apparent density of the surface soil in the first few centimeters. It is processed automatically by extracting global geospatial data from the ISRIC SoilGrids v2.0 soil database along with synthetic aperture radar (Sentinel-1) readings. Its study is critical for planetary mobility engineering, as particle size distribution directly determines the coefficient of friction, load-bearing capacity, wheel sinkage, and the generation of electrostatic dust clouds during the movement of exploration vehicles.",
      
      "journal.v4.title": "Presence of Subsurface Ice",
      "journal.v4.sub": "Permafrost and Cryosphere",
      "journal.v4.text": "This parameter analyzes the existence of permafrost mantles, stable cryosols, or frozen water accumulations at shallow depths. It is evaluated by consulting soil temperatures at different depths through the Open-Meteo API and detecting cryogenic anomalies and snow and frost indices (NDSI). This knowledge is of vital strategic importance for ISRU (In-Situ Resource Utilization) missions, both for the design of permanent habitats at the lunar South Pole—where the aim is to exploit permanently shadowed craters—and for planning excavations and studying the cryogenic thermal dynamics of the Martian subsoil.",
      
      "journal.v5.title": "Diurnal Soil Thermal Amplitude (Day/Night)",
      "journal.v5.sub": "Thermal Oscillation",
      "journal.v5.text": "This variable calculates the extreme temperature oscillation experienced by both the surface atmosphere and the direct soil interface between diurnal maximum peaks and nocturnal minimums. It is processed through time series from the Open-Meteo weather API, extracting surface thermal records. It is a critical engineering design factor because the lack of a dense atmosphere on the Moon and the extreme thinness of the atmosphere on Mars cause brutal thermal fluctuations exceeding tens of degrees in a few hours, inducing severe thermal fatigue, material contraction, and mechanical failures in seals, joints, and exposed electronic components.",
      
      "journal.v6.title": "Atmospheric Pressure and Air Density",
      "journal.v6.sub": "Barometric Conditions",
      "journal.v6.text": "This component measures the actual surface barometric pressure and the consequent air mass density, calculated from meteorological and topographic data from Open-Meteo and elevation models. Its physical relevance is indisputable: in high mountain terrestrial regions (such as high plateaus and high deserts), pressure drops drastically, simulating the hypobaric stress conditions of the thin carbon dioxide atmosphere of Mars. This directly affects aerodynamic efficiency, the performance of convective thermal dissipation systems, and the behavior of parachutes or assisted landing systems.",
      
      "journal.v7.title": "Relative Soil Moisture and Evapotranspiration",
      "journal.v7.sub": "Surface Water Content",
      "journal.v7.text": "This variable evaluates the surface volumetric water content and the rate at which soil water is returned to the atmosphere by reference evaporation. It is obtained directly from Open-Meteo's specialized endpoints. Its control is necessary to certify the extreme aridity condition of the terrestrial analogue; a test site cannot be considered valid for simulating planetary environments if its soil retains significant liquid moisture or presents evapotranspiration rates typical of agricultural or temperate ecosystems alien to Martian or lunar reality.",
      
      "journal.v8.title": "Freeze-Thaw Cycles",
      "journal.v8.sub": "Geotechnical Stability",
      "journal.v8.text": "This indicator quantifies the frequency with which soil temperature repeatedly crosses the critical freezing threshold (0ºC or 273.15 K) in daily or seasonal cycles. It is processed by analyzing hourly time curves of soil temperature provided by Open-Meteo. It is fundamental for determining the long-term geotechnical stability of foundations, equipment anchors, and surface habitat structures, as the continuous cycle of freezing and expansion of interstitial water deeply weakens the mechanical cohesion of the regolith and fractures materials.",
      
      "journal.v9.title": "Extreme Ultraviolet Radiation (Local UV)",
      "journal.v9.sub": "High-Energy Photon Flux",
      "journal.v9.text": "This variable measures the high-energy photon flux in the UV-A and UV-B bands and the maximum UV index incident on the surface. It is processed by integrating the Open-Meteo air quality API and NASA POWER geospatial irradiance records. Its study is a priority because the absence of a dense ozone layer on Mars and the total lack of atmosphere on the Moon expose equipment to relentless ultraviolet radiation that rapidly degrades polymers, rubber seals, spacesuit fabrics, and optical coatings of scientific instruments.",
      
      "journal.v10.title": "Aerosols/Suspended Dust",
      "journal.v10.sub": "Air Quality and Opacity",
      "journal.v10.text": "This parameter quantifies the mass concentration of fine mineral particles in atmospheric suspension and the aerosol optical depth (AOD). It is extracted by consulting the CAMS air quality and mineral dust databases through Open-Meteo and NASA POWER historical models. Knowing this factor allows simulating the constant atmospheric opacity that characterizes Mars (where suspended dust affects visibility and drastically reduces the electrical generation efficiency of photovoltaic solar panels), validating the resistance of equipment to optical contamination.",
      
      "journal.v11.title": "Wind Abrasion Vector",
      "journal.v11.sub": "Sandblasting Wear",
      "journal.v11.text": "This variable represents a composite physical index that crosses the speed and direction of maximum winds and gusts with the availability of loose sand and mineral dust particles on the surface. It is calculated by combining Open-Meteo wind series with soil granulometry data. Its importance lies in calculating the mechanical wear accumulated by wind erosion (sandblasting effect), a severe erosive phenomenon that polishes, corrodes, and damages solar panels, navigation camera lenses, and exposed rover joints during dust storms.",
      
      "journal.v12.title": "Logistical Distance",
      "journal.v12.sub": "Accessibility and Transport",
      "journal.v12.text": "This parameter measures the real accessibility by routes, dirt tracks, or geodesic distances from the analogue test site to the nearest urban centers, transport nodes, or logistical support bases. It is processed through automated queries to OpenStreetMap using routing engines such as OSRM. Its evaluation is a key project engineering requirement, as it determines the economic and operational viability of moving scientific personnel, heavy drilling equipment, habitat modules, and replacement components during the deployment of field missions.",
      
      "journal.v13.title": "Communications Isolation",
      "journal.v13.sub": "Coverage and Line of Sight",
      "journal.v13.text": "This variable evaluates the density of terrestrial telecommunications infrastructure and the existence of topographic barriers that generate shadow zones or lack of cellular and network coverage in the area. It is processed by cross-referencing telephone antenna databases with line-of-sight analysis based on digital elevation models. Its simulation is vital for testing rover autonomy systems and telemetry delay and autonomous communication protocols that mimic the real conditions of space delay and loss of direct link with ground control.",

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
      "intro.title": "Un Índice de Similitud de Análogos Planetarios (APSI)",
      "intro.desc": "AstraGo nace como una respuesta directa a uno de los desafíos más complejos y costosos de la exploración espacial moderna: la validación y prueba previa de tecnologías, rovers y hábitats destinados a superficies planetarias extremas como la Luna y Marte.",
      "intro.desc2": "El núcleo conceptual del sistema se denomina Planetary Analogue Similarity Index (APSI), un modelo matemático estructurado para evaluar, comparar y calificar el grado de correspondencia física entre cualquier coordenada geográfica de la Tierra y las condiciones reales de cuerpos celestes.",
      "intro.desc3": "AstraGo representa una herramienta de convergencia entre la ciencia de datos geoespaciales, la ingeniería de hardware de borde y la exploración espacial internacional, dotando a los investigadores de un estándar cuantitativo para seleccionar los mejores sitios de prueba del planeta.",
      "intro.scroll": "Scroll",

      // Selector
      "selector.back": "← Volver",
      "selector.select": "SELECCIONAR OBJETIVO",
      "selector.mars.title": "Astra Mars",
      "selector.mars.desc": "El planeta rojo. Análisis de atmósfera, geología y potencial habitabilidad.",
      "selector.moon.title": "Astra Moon",
      "selector.moon.desc": "Nuestro satélite natural. Estudio de hielo subsuperficial, radiación y suelo.",
      "selector.explore": "Explorar",
      "selector.distance": "Distancia de la Tierra",
      "selector.gravity": "Gravedad",

      // Journal
      "journal.title": "Science Journal",
      "journal.subtitle": "Análisis comparativo · Marte vs Luna",

      "journal.v1.title": "Composición Litológica y Basáltica",
      "journal.v1.sub": "Análisis Mineralógico",
      "journal.v1.text": "Esta variable evalúa el tipo y la naturaleza mineralógica de las formaciones rocosas que afloran en la superficie, enfocándose en la identificación de rocas ígneas, máficas y volcánicas de tipo basáltico. Su análisis se ejecuta mediante el procesamiento de firmas de reflectancia espectral en el infrarrojo de onda corta (SWIR) utilizando datos satelitales de alta resolución de Sentinel-2 a través de plataformas como Microsoft Planetary Computer, cruzados con las unidades geológicas globales del USGS. Conocer este parámetro es fundamental porque los mares lunares y las llanuras volcánicas de Marte están dominados por basaltos; por lo tanto, encontrar análogos terrestres con composiciones mineralógicas similares permite simular de forma realista la abrasión, la dureza del terreno y el comportamiento físico al que se enfrentarán las herramientas de perforación y las ruedas de los rovers.",
      
      "journal.v2.title": "Índice de Hidratación",
      "journal.v2.sub": "Presencia de Agua Estructural",
      "journal.v2.text": "El índice de hidratación cuantifica la presencia de agua ligada estructuralmente en la red cristalina de minerales arcillosos, filosilicatos u óxidos hidratados, así como la sequedad extrema en los primeros centímetros del terreno. Se calcula mediante la combinación de bandas espectrales SWIR de Sentinel-2 y el monitoreo de la humedad superficial a través de modelos meteorológicos e hidrológicos abiertos. Su relevancia radica en que en los entornos planetarios hiperáridos de Marte y en la superficie expuesta de la Luna, el agua libre líquida no existe, encontrándose únicamente retenida en forma de minerales alterados químicamente; validar este índice en la Tierra garantiza que el sitio de prueba replique la verdadera aridez y el estado geoquímico superficial de los cuerpos celestes.",
      
      "journal.v3.title": "Granulometría y Distribución del Regolito",
      "journal.v3.sub": "Composición del Suelo Superficial",
      "journal.v3.text": "Esta variable mide la proporción porcentual de arena, limo, arcilla, fragmentos gruesos y grava, además de la densidad aparente del suelo superficial en los primeros centímetros. Se procesa de manera automatizada extrayendo los datos geoespaciales globales de la base de datos edáfica ISRIC SoilGrids v2.0 junto con lecturas de radar de apertura sintética (Sentinel-1). Su estudio es crítico para la ingeniería de movilidad planetaria, ya que la distribución del tamaño de partícula determina directamente el coeficiente de fricción, la capacidad de soporte de carga, el hundimiento de las ruedas y la generación de nubes de polvo electrostático durante el desplazamiento de vehículos de exploración.",
      
      "journal.v4.title": "Presencia de Hielo Subsuperficial",
      "journal.v4.sub": "Permafrost y Criósfera",
      "journal.v4.text": "Este parámetro analiza la existencia de mantos de permafrost, criosuelos estables o acumulaciones de agua congelada a poca profundidad del terreno. Se evalúa consultando las temperaturas del suelo a distintas profundidades mediante la API de Open-Meteo y detectando anomalías criogénicas e índices de nieve y escarcha (NDSI). Su conocimiento es de vital importancia estratégica para las misiones ISRU (In-Situ Resource Utilization), tanto para el diseño de hábitats permanentes en el Polo Sur lunar —donde se busca explotar los cráteres en sombra permanente— como para la planificación de excavaciones y el estudio de la dinámica térmica criogénica del subsuelo marciano.",
      
      "journal.v5.title": "Amplitud Térmica Diurna del Suelo (Día/Noche)",
      "journal.v5.sub": "Oscilación Térmica",
      "journal.v5.text": "Esta variable calcula la oscilación extrema de temperatura experimentada tanto por la atmósfera superficial como por la interfaz directa del suelo entre los picos máximos diurnos y las mínimas nocturnas. Se procesa mediante series temporales de la API meteorológica de Open-Meteo, extrayendo los registros térmicos de superficie. Es un factor crítico de diseño ingenieril porque la falta de una atmósfera densa en la Luna y la extrema delgadez de la atmósfera en Marte provocan fluctuaciones térmicas brutales que superan los decenas de grados en pocas horas, induciendo fatiga térmica severa, contracción de materiales y fallas mecánicas en sellos, uniones y componentes electrónicos expuestos.",
      
      "journal.v6.title": "Presión Atmosférica y Densidad del Aire",
      "journal.v6.sub": "Condiciones Barométricas",
      "journal.v6.text": "Este componente mide la presión barométrica real de superficie y la consecuente densidad de la masa de aire, calculada a partir de los datos meteorológicos y topográficos de Open-Meteo y modelos de elevación. Su relevancia física es indiscutible: en regiones terrestres de alta montaña (como los altiplanos y desiertos de altura), la presión desciende de forma drástica, simulando las condiciones de estrés hipobárico de la delgada atmósfera de dióxido de carbono de Marte. Esto afecta directamente la eficiencia aerodinámica, el rendimiento de los sistemas de disipación térmica por convección y el comportamiento de los paracaídas o sistemas de aterrizaje asistido.",
      
      "journal.v7.title": "Humedad Relativa del Suelo y Evapotranspiración",
      "journal.v7.sub": "Contenido Hídrico Superficial",
      "journal.v7.text": "Esta variable evalúa el contenido hídrico volumétrico superficial y la tasa a la cual el agua del terreno es devuelta a la atmósfera por evaporación de referencia. Se obtiene directamente de los endpoints especializados de Open-Meteo. Su control es necesario para certificar la condición de aridez extrema del análogo terrestre; un sitio de pruebas no puede considerarse válido para la simulación de ambientes planetarios si su suelo retiene humedad líquida significativa o presenta tasas de evapotranspiración propias de ecosistemas agrícolas o templados ajenos a la realidad marciana o lunar.",
      
      "journal.v8.title": "Ciclos de Congelación-Descongelación",
      "journal.v8.sub": "Estabilidad Geotécnica",
      "journal.v8.text": "Este indicador cuantifica la frecuencia con la que la temperatura del suelo cruza de forma repetida el umbral crítico de congelación (0ºC o 273.15 K) en ciclos diarios o estacionales. Se procesa analizando las curvas temporales horarias de la temperatura del suelo provistas por Open-Meteo. Es fundamental para determinar la estabilidad geotécnica a largo plazo de cimentaciones, anclajes de equipos y estructuras de hábitats superficiales, ya que el ciclo continuo de congelamiento y expansión del agua intersticial debilita profundamente la cohesión mecánica del regolito y fractura los materiales.",
      
      "journal.v9.title": "Radiación Ultravioleta Extrema (UV Local)",
      "journal.v9.sub": "Flujo Fotónico de Alta Energía",
      "journal.v9.text": "Esta variable mide el flujo fotónico de alta energía en las bandas UV-A y UV-B y el índice UV máximo que incide sobre la superficie. Se procesa mediante la integración de la API de calidad del aire de Open-Meteo y los registros geoespaciales de irradiancia de la NASA POWER. Su estudio es prioritario debido a que la ausencia de una capa de ozono densa en Marte y la total carencia de atmósfera en la Luna exponen los equipos a una radiación ultravioleta implacable que degrada rápidamente los polímeros, los sellos de goma, los tejidos de los trajes espaciales y los recubrimientos ópticos de los instrumentos científicos.",
      
      "journal.v10.title": "Aerosoles/Polvo Suspendido",
      "journal.v10.sub": "Calidad del Aire y Opacidad",
      "journal.v10.text": "Este parámetro cuantifica la concentración masiva de partículas minerales finas en suspensión atmosférica y la profundidad óptica de aerosoles (AOD). Se extrae consultando las bases de datos de calidad del aire y polvo mineral de CAMS a través de Open-Meteo y los modelos históricos de la NASA POWER. Conocer este factor permite simular la opacidad atmosférica constante que caracteriza a Marte (donde el polvo en suspensión afecta la visibilidad y reduce drásticamente la eficiencia de generación eléctrica de los paneles solares fotovoltaicos), validando la resistencia de los equipos ante la contaminación óptica.",
      
      "journal.v11.title": "Vector de Abrasión Eólica",
      "journal.v11.sub": "Desgaste por Sandblasting",
      "journal.v11.text": "Esta variable representa un índice físico compuesto que cruza la velocidad y dirección de los vientos máximos y ráfagas con la disponibilidad de partículas sueltas de arena y polvo mineral en la superficie. Se calcula combinando las series de viento de Open-Meteo con los datos de granulometría del suelo. Su importancia radica en el cálculo del desgaste mecánico acumulado por erosión eólica (efecto de arenado o sandblasting), un fenómeno erosivo severo que pule, corroe y daña los paneles solares, las lentes de las cámaras de navegación y las articulaciones expuestas de los rovers durante las tormentas de polvo.",
      
      "journal.v12.title": "Distancia Logística",
      "journal.v12.sub": "Accesibilidad y Transporte",
      "journal.v12.text": "Este parámetro mide la accesibilidad real por rutas, caminos de huella o distancias geodésicas desde el sitio de pruebas análogo hasta los centros urbanos, nodos de transporte o bases logísticas de apoyo más cercanos. Se procesa mediante consultas automatizadas a OpenStreetMap utilizando motores de enrutamiento como OSRM. Su evaluación es un requisito clave de ingeniería de proyectos, ya que determina la viabilidad económica y operativa para trasladar personal científico, equipos pesados de perforación, módulos habitacionales y componentes de reemplazo durante el despliegue de misiones de campo.",
      
      "journal.v13.title": "Aislamiento de Comunicaciones",
      "journal.v13.sub": "Cobertura y Línea de Vista",
      "journal.v13.text": "Esta variable evalúa la densidad de infraestructura de telecomunicaciones terrestres y la existencia de barreras topográficas que generan zonas de sombra o falta de cobertura celular y de red en el área. Se procesa cruzando bases de datos de antenas de telefonía con análisis de línea de vista (Line of Sight) basados en modelos de elevación digital. Su simulación es vital para probar los sistemas de autonomía de los rovers y los protocolos de retardo de telemetría y comunicación autónoma que imitan las condiciones reales de retraso espacial y pérdida de enlace directo con el control terrestre.",

      // Explorer
      "explorer.back": "← Volver",
      "explorer.mission": "MISIÓN ACTUAL",
      "explorer.search": "Buscar ubicaciones...",
      "explorer.lat": "Latitud",
      "explorer.lon": "Longitud",
      "explorer.desc": "Descripción"
    }
  };

  let currentLang = localStorage.getItem('astra-lang') || 'en';

  function applyLang(lang) {
    currentLang = lang;
    localStorage.setItem('astra-lang', lang);
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = translations[lang][key];
      if (text) el.textContent = text;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const text = translations[lang][key];
      if (text) el.placeholder = text;
    });

    const btn = document.getElementById('lang-toggle');
    if (btn) btn.textContent = lang === 'en' ? 'ES' : 'EN';
  }

  window.addEventListener('DOMContentLoaded', () => {
    applyLang(currentLang);
    document.getElementById('lang-toggle')?.addEventListener('click', () => {
      applyLang(currentLang === 'en' ? 'es' : 'en');
    });
  });

  window.ASTRA_I18N = {
    t: (key) => translations[currentLang][key] || key,
    apply: applyLang,
    get lang() { return currentLang; }
  };
})();