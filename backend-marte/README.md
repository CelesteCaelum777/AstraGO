# Planetary Analogue Explorer — Backend

Backend inicial para registrar sitios terrestres y descubrir datos geoespaciales mediante una STAC API.

## Requisitos
- Python 3.10 o superior
- pip

## Instalación

```bash
python -m venv .venv
```

Activar el entorno:

**Windows PowerShell**
```powershell
.venv\Scripts\Activate.ps1
```

**Linux/macOS**
```bash
source .venv/bin/activate
```

Instalar dependencias:
```bash
pip install -r requirements.txt
```

## Ejecutar

```bash
uvicorn app.main:app --reload
```

Abrir documentación interactiva:
- http://127.0.0.1:8000/docs
- Estado: http://127.0.0.1:8000/health

La base SQLite se crea automáticamente al iniciar la aplicación.

## Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/sites` | Lista sitios; admite `?q=atacama` |
| POST | `/api/v1/sites` | Crea un sitio con coordenadas |
| GET | `/api/v1/sites/{id}` | Obtiene un sitio |
| PATCH | `/api/v1/sites/{id}` | Actualiza un sitio |
| DELETE | `/api/v1/sites/{id}` | Elimina un sitio |
| GET | `/api/v1/places/geocode?q=Atacama` | Busca un lugar por nombre usando Nominatim |
| GET | `/api/v1/stac/collections` | Lista colecciones del catálogo STAC |
| GET | `/api/v1/stac/search?...` | Busca productos STAC por bounding box |

## Ejemplos

Crear un sitio:
```bash
curl -X POST http://127.0.0.1:8000/api/v1/sites \
  -H "Content-Type: application/json" \
  -d '{"name":"Desierto de Atacama","country":"Chile","latitude":-23.5,"longitude":-68.2,"radius_km":10}'
```

Buscar colecciones:
```bash
curl http://127.0.0.1:8000/api/v1/stac/collections
```

Buscar imágenes/productos para un área:
```bash
curl "http://127.0.0.1:8000/api/v1/stac/search?west=-69&south=-24&east=-68&north=-23&limit=10"
```

## Pruebas

```bash
pytest -q
```

Las pruebas usan una base SQLite en memoria y no necesitan conectarse a servicios externos.

## Decisiones y límites de esta versión

- La búsqueda por nombre usa OpenStreetMap Nominatim y devuelve candidatos; el usuario elige uno y luego registra el sitio con sus coordenadas. Respetar la política de uso de Nominatim y evitar consultas masivas.
- El conector STAC consulta colecciones y busca Items por bbox y fecha. La disponibilidad, los nombres de colecciones y los assets dependen del catálogo remoto y pueden cambiar.
- Este MVP todavía no descarga ni procesa GeoTIFF/NetCDF ni calcula indicadores científicos. Es el siguiente incremento.
- SQLite almacena coordenadas como números. El área se representa inicialmente mediante un radio de análisis; en una siguiente versión se podrá incorporar un polígono GeoJSON.
- Los endpoints STAC son asíncronos y devuelven metadatos del catálogo; no se debe interpretar que un Item equivale automáticamente a un valor científico ya procesado.
