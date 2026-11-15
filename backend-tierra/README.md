# Backend Tierra · AstraGO

API FastAPI e interfaz de referencia para encontrar análogos terrestres mediante seis variables climáticas y, opcionalmente, elevación.

La [documentación principal](../README.md) contiene **todos los endpoints**, el cuerpo de búsqueda, ejemplos JavaScript, códigos de error, CORS e instrucciones de red.

## Ejecutar desde esta carpeta

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Abrir `http://localhost:8000` para la interfaz y `/docs` para probar la API. Los recursos WebGL, Globe.gl y Plotly requieren un navegador compatible y acceso a sus CDN. Los gráficos NASA se dibujan localmente con Plotly consultando JSON mensual directamente a NASA; el relieve usa `/api/terrain` del backend.

## Organización

- `main.py`: rutas, validación, CORS y publicación de `static/`.
- `analog_service.py`: catálogo de siete regiones, NASA POWER, caché y score climático original.
- `elevation_service.py`: Open-Meteo, altitudes, grilla 7×7 y combinación ponderada de elevación con clima.
- `index.html`, `static/app.js`, `static/styles.css`: interfaz de referencia.
- `static/charts.js`: series, heatmap, tendencia, anomalías, ciclos, histograma y temperatura/humedad.
- `static/terrain.js`: superficie Plotly 3D, ejes geográficos y exportación PNG.
- `tests/`: pruebas del score, validación, proveedores, caché, relieve y gráficos.

## Datos y similitud

La búsqueda evalúa Atacama, McMurdo, Mojave, Sahara, Río Tinto, Islandia y Altiplano. No recorre una malla mundial.

Para cada variable, `D = min(1, abs(valor_real - objetivo) / (máximo - mínimo))`. El porcentaje es `100 × (1 − Σ(peso × D) / Σpesos)`. El umbral y el orden se aplican al score final. La elevación es aditiva: las solicitudes sin ELEVATION mantienen el cálculo climático previo.

| Código | Unidad | Rango de normalización del motor |
| --- | --- | --- |
| T2M | °C | −90 a 60 |
| T2M_MIN | °C | −100 a 40 |
| ALLSKY_SFC_SW_DWN | kWh/m²/día | 0 a 12 |
| WS10M | m/s | 0 a 25 |
| PRECTOTCORR | mm/día | 0 a 25 |
| RH2M | % | 0 a 100 |
| ELEVATION | m | 0 a 6000 |

Estos rangos son decisiones de normalización; no son los rangos orientativos terrestres mostrados en el formulario. T2M_MIN es climatología de temperaturas mínimas, no el récord mínimo absoluto. Los pesos van de 1 a 10. PS, TS y GWETTOP se muestran como catálogo deshabilitado y no están admitidas por el cálculo.

NASA se consulta mediante `/api/temporal/climatology/point` con comunidad AG. Se usa `ANN` o, si falta, se requieren los doce meses válidos. No se transforma el valor faltante −999 en cero. El período climatológico lo define NASA y se conserva cuando está disponible. Los gráficos consultan por separado `/api/temporal/monthly/point` para 2015–2025; se excluyen agregados anuales de los datos mensuales, y la tendencia requiere años con doce meses válidos.

La caché SQLite dura 30 días para climatología y 90 días para elevación. En una falla se permite caché vencida identificada. Sin caché NASA puede recurrir a valores ilustrativos identificados; Open-Meteo devuelve un error en lugar de inventar altitudes. Se realizan como máximo tres consultas climáticas concurrentes. Las consultas de elevación agrupan coordenadas en una petición.

El relieve tiene filas de latitud y columnas de longitud. `z[3][3]` corresponde al centro. Una grilla sin caché completa consulta 49 coordenadas en un solo GET de Open-Meteo. Paso 0,02°, extensión ±0,06° (aproximadamente ±6,7 km en latitud; menor distancia longitudinal en latitudes altas). Plotly interpola la superficie y exagera verticalmente el relieve: no es una reconstrucción fotográfica ni una escala métrica uniforme. En los polos se recortan latitudes a ±90°; en el antimeridiano se normalizan coordenadas para consultar y se conserva la continuidad del eje visual.

Fuente y atribución del relieve: [Open-Meteo Elevation API](https://open-meteo.com/en/docs/elevation-api) y [Copernicus DEM GLO-90](https://doi.org/10.5270/ESA-c5d3d65). La resolución del DEM fuente es 90 m; el muestreo del visor está espaciado 0,02°.

## Configuración opcional del Toolkit antiguo

El visor actual no utiliza iframes. La ruta `/api/toolkit-config` se conserva por compatibilidad. `POWER_TOOLKIT_CONFIG_URL` permite consultar un endpoint JSON oficial y `POWER_TOOLKIT_URLS` acepta un objeto JSON de plantillas HTML. Solo se admiten URLs HTTPS de `power.larc.nasa.gov`; sin configuración el estado es `unconfigured`. No se proporcionan URLs HTML inventadas.

## Pruebas

Python utiliza las dependencias de `requirements.txt`. Las pruebas de JavaScript requieren Node.js y no instalan paquetes adicionales.

```bash
python -m unittest discover -s tests -v
node tests/test_charts.cjs
node tests/test_terrain.cjs
node --check static/app.js
node --check static/charts.js
node --check static/terrain.js
```

No se incluyen entornos virtuales, cachés, credenciales ni datos del equipo de desarrollo.
