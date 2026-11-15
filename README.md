# AstraGO

Exploración planetaria y búsqueda de análogos climáticos terrestres.

- [`AstraGo/`](AstraGo/): frontend planetario existente.
- [`backend-tierra/`](backend-tierra/): API FastAPI para comparar siete regiones terrestres con objetivos climáticos y de elevación. Incluye una interfaz de referencia con globo 3D, gráficos NASA y relieve local.

## Iniciar el backend Tierra

Requisitos: Python 3.10 o superior. Desde la raíz del repositorio:

```bash
cd backend-tierra
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

En Windows, activar el entorno con `.venv\Scripts\activate` y usar `python` en lugar de `python3` para crearlo.

- Interfaz y servidor local: `http://localhost:8000`.
- Documentación interactiva: `http://localhost:8000/docs`.
- Contrato OpenAPI: `http://localhost:8000/openapi.json`.

Desde otra computadora de la misma red usar `http://IP_DEL_SERVIDOR:8000`, con el puerto TCP 8000 permitido por el firewall para esa red. La IP `192.168.1.254` usada durante el desarrollo es un ejemplo local, no una dirección pública ni fija. Subir este código a GitHub **no despliega ni mantiene encendido el backend**; debe ejecutarse en una computadora o servicio de alojamiento.

## Endpoints para conectar otros frontends

Todas las rutas se agregan a la URL base del backend. `/backend-tierra` es una carpeta del repositorio, no un prefijo de la API.

| Método | Ruta | Uso y respuesta |
| --- | --- | --- |
| GET | `/health` | Estado del servidor: `status` y `service`. |
| GET | `/api/config` | Variables, unidades, rangos de normalización, valores iniciales, restricciones, modos, cobertura y rutas. Incluye `ELEVATION` en `optional_parameters`. |
| GET | `/api/regions` | Catálogo de las siete regiones y valores climáticos ilustrativos, identificados como tales. |
| POST | `/api/search` | Búsqueda ponderada y filtrada; cuerpo JSON descrito debajo. |
| GET | `/api/power-point?lat=-23.5&lon=-69.9` | Climatología NASA POWER del punto: `lat`, `lon`, `values` y `source`, con metadatos cuando están disponibles. No devuelve una serie mensual histórica. |
| GET | `/api/elevation?lat=-23.5&lon=-69.9` | Altitud real: `lat`, `lon`, `elevation` (arreglo de un valor en metros), `source` y `stale`. |
| GET | `/api/terrain?lat=-23.5&lon=-69.9` | Relieve 7×7: `latitudes`, `longitudes`, matriz `z` en metros, centro, paso de 0,02°, procedencia y estado de caché. |
| GET | `/api/toolkit-config` | Configuración opcional del antiguo Toolkit HTML; sin configuración devuelve `unconfigured`. Los gráficos locales Plotly no dependen de este servicio. |
| GET | `/docs` | Swagger UI para consultar y probar la API. |
| GET | `/redoc` | Documentación de referencia. |
| GET | `/openapi.json` | Especificación completa de la API. |

### Solicitud de búsqueda

```json
{
  "targets": {
    "T2M": -60,
    "T2M_MIN": -80,
    "ALLSKY_SFC_SW_DWN": 6.5,
    "WS10M": 5,
    "PRECTOTCORR": 0,
    "RH2M": 10,
    "ELEVATION": 2500
  },
  "weights": {
    "T2M": 9,
    "T2M_MIN": 9,
    "ALLSKY_SFC_SW_DWN": 8,
    "WS10M": 5,
    "PRECTOTCORR": 4,
    "RH2M": 7,
    "ELEVATION": 6
  },
  "min_similarity": 0,
  "mode": "live"
}
```

`targets` y `weights` deben contener exactamente las seis variables climáticas, con la posibilidad de añadir `ELEVATION` a **ambos** objetos. Para una búsqueda solo climática, eliminar `ELEVATION` de los dos. Pesos enteros de 1 a 10; umbral de 0 a 100; objetivo ELEVATION de 0 a 6000 m. Las demás variables aceptan objetivos finitos, incluidos objetivos planetarios fuera de los rangos terrestres orientativos.

`mode: "live"` consulta NASA con caché; si falla puede usar climatología ilustrativa identificada como demostración. `mode: "demo"` utiliza valores climáticos ilustrativos. Si se incluye ELEVATION, la altitud siempre procede de Open-Meteo o su caché, incluso en modo demo. Para probar completamente sin red y sin caché, usar demo y omitir ELEVATION.

La respuesta de búsqueda contiene:

- `results`: resultados ordenados por similitud descendente, cada uno con `id`, `name`, `country`, `lat`, `lon`, `values`, `similarity`, `source` y `demo`.
- `demo_count`: cantidad de regiones evaluadas con valores climáticos ilustrativos, antes del filtro.
- `evaluated_count`: cantidad total de regiones evaluadas.
- `targets`, `weights`, `min_similarity`: parámetros de la solicitud.

Si se incluye elevación, cada resultado agrega `values.ELEVATION`, `elevation_source`, `elevation_stale` y `climate_similarity`. `results` puede ser un arreglo vacío si ninguna región cumple el umbral. La cobertura actual es de **siete regiones conocidas**, no una malla mundial.

Errores: HTTP **422** para entradas inválidas y **502** cuando no se pueden obtener datos válidos de los proveedores en las rutas de consulta. En esos casos `detail` describe el problema. Los errores de validación usan un arreglo en `detail`.

### Ejemplo JavaScript / React / Vue

```javascript
// En otra computadora usar la IP del servidor; en producción usar su URL HTTPS.
const API_BASE = 'http://localhost:8000';

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const data = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(data.detail ?? data));
  return data;
}

const config = await api('/api/config');
const request = {
  ...config.defaults,
  mode: 'demo',
  min_similarity: 0
};

// Opcional: activar elevación real (requiere Open-Meteo o caché disponible).
// request.targets = {...request.targets, ELEVATION: 2500};
// request.weights = {...request.weights, ELEVATION: 6};

const matches = await api('/api/search', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify(request)
});
console.log(matches.results);

const terrain = await api('/api/terrain?lat=-23.5&lon=-69.9');
// Plotly: {type: 'surface', x: terrain.longitudes, y: terrain.latitudes, z: terrain.z}
console.log(terrain.z);
```

Los valores de `config.defaults` son los del backend y pueden diferir de los valores iniciales de la interfaz de referencia; enviar los objetivos explícitos cuando sea necesario. La elevación real puede superar 6000 m o ser negativa: no se recorta la medición, solo la diferencia normalizada usada en el score.

### CORS y configuración

Por defecto se permiten orígenes de otros frontends para GET/POST sin credenciales. Para restringirlos:

```bash
API_CORS_ORIGINS='http://localhost:5173,http://192.168.1.20:3000' python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

No usar `credentials: 'include'`; la API actual no requiere cookies ni autenticación. CORS no es autenticación. Un frontend alojado con HTTPS necesita un backend HTTPS o un proxy del mismo origen para evitar bloqueos de contenido mixto.

`POWER_CACHE_PATH` permite cambiar la ubicación de la caché SQLite (por defecto `backend-tierra/.cache/power.sqlite3`). Las variables de entorno se leen del proceso; no se carga automáticamente un archivo `.env`.

## Fuentes y validación

Climatología: [NASA POWER](https://power.larc.nasa.gov/docs/services/api/temporal/climatology/). Elevación y relieve: [Open-Meteo](https://open-meteo.com/en/docs/elevation-api), basado en [Copernicus DEM GLO-90](https://doi.org/10.5270/ESA-c5d3d65). Los valores de demostración no son observaciones NASA verificadas. La similitud climática no implica equivalencia de habitabilidad.

Más detalles de metodología, estructura y pruebas en [`backend-tierra/README.md`](backend-tierra/README.md).
