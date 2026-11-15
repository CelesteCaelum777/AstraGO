
import re
import unicodedata


PARAMETERS = {
    "pressure": {
        "label": "Presión",
        "keywords": [
            "surface pressure",
            "atmospheric pressure",
            "surface air pressure",
            "pressure",
            "presion atmosferica",
        ],
        "variables": [
            "surface-pressure",
            "surface-air-pressure",
            "air-pressure",
            "atmospheric-pressure",
        ],
    },
    "gravity": {
        "label": "Gravedad",
        "keywords": [
            "gravity",
            "gravitational field",
            "gravitational acceleration",
        ],
        "variables": [
            "gravity",
            "gravitational-field",
            "gravitational-acceleration",
        ],
    },
    "radiation": {
        "label": "Radiación",
        "keywords": [
            "solar radiation",
            "solar irradiance",
            "ultraviolet",
            "uv radiation",
            "radiation",
        ],
        "variables": [
            "solar-irradiance",
            "solar-radiation",
            "ultraviolet-radiation",
            "uv-index",
        ],
    },
    "mineralogy": {
        "label": "Mineralogía",
        "keywords": [
            "mineral",
            "mineralogy",
            "mineral composition",
            "spectral reflectance",
            "surface composition",
        ],
        "variables": [
            "mineral-composition",
            "mineral-abundance",
            "spectral-reflectance",
            "surface-composition",
        ],
    },
    "topography": {
        "label": "Topografía",
        "keywords": [
            "elevation",
            "digital elevation model",
            "dem",
            "terrain",
            "topography",
        ],
        "variables": [
            "elevation",
            "digital-elevation-model",
            "terrain-height",
            "slope",
        ],
    },
    "temperature": {
        "label": "Temperatura",
        "keywords": [
            "land surface temperature",
            "surface temperature",
            "air temperature",
            "temperature",
        ],
        "variables": [
            "land-surface-temperature",
            "surface-temperature",
            "air-temperature",
            "2m-temperature",
        ],
    },
}


def normalize(value: str) -> str:
    """Normaliza texto para facilitar la comparación de términos."""
    value = unicodedata.normalize("NFKD", value.lower())
    value = "".join(c for c in value if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", " ", value).strip()


def get_collection_text(collection: dict) -> str:
    """Construye un texto con los metadatos relevantes de una colección."""
    fields = [
        collection.get("id", ""),
        collection.get("title", ""),
        collection.get("description", ""),
        collection.get("keywords", []),
        collection.get("osc:variables", []),
    ]

    parts = []
    for field in fields:
        if isinstance(field, list):
            parts.extend(str(item) for item in field)
        else:
            parts.append(str(field))

    return normalize(" ".join(parts))


def classify_collection(collection: dict) -> list[dict]:
    """
    Devuelve los parámetros para los que una colección es candidata.
    La clasificación se basa únicamente en metadatos, no valida los datos.
    """
    text = get_collection_text(collection)
    matches = []

    for parameter, config in PARAMETERS.items():
        terms = config["keywords"] + config["variables"]
        matched_terms = [
            term for term in terms
            if normalize(term) in text
        ]

        if matched_terms:
            matches.append({
                "parameter": parameter,
                "label": config["label"],
                "matched_terms": matched_terms,
            })

    return matches


def classify_catalog(collections: list[dict]) -> dict:
    """Agrupa las colecciones candidatas por parámetro científico."""
    result = {
        key: {
            "label": config["label"],
            "count": 0,
            "collections": [],
        }
        for key, config in PARAMETERS.items()
    }

    for collection in collections:
        matches = classify_collection(collection)

        for match in matches:
            key = match["parameter"]
            result[key]["count"] += 1
            result[key]["collections"].append({
                "id": collection.get("id"),
                "title": collection.get("title"),
                "description": collection.get("description"),
                "matched_terms": match["matched_terms"],
                "extent": collection.get("extent"),
                "links": collection.get("links", []),
            })

    return result
