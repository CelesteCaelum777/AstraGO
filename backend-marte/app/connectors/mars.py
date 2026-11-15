import csv
import io
import httpx

BASE_URL = (
    "https://pds-atmospheres.nmsu.edu/data_and_services/"
    "atmospheres_data/PERSEVERANCE/logs/"
)

PDS_DATA_BASE = (
    "https://pds-atmospheres.nmsu.edu/PDS/data/PDS4/"
    "Mars2020/mars2020_meda/data_calibrated_env"
)

# Índices oficiales de productos calibrados MEDA.
MEDA_INDEXES = {
    "air_temperature": BASE_URL + "mars2020_meda_calibrated_ATS.csv",
    "pressure": BASE_URL + "mars2020_meda_calibrated-PS.csv",
    "radiation": BASE_URL + "mars2020_meda_calibrated_RDS.csv",
    "humidity": BASE_URL + "mars2020_meda_calibrated-RHS.csv",
    "thermal_infrared": BASE_URL + "mars2020_meda_calibrated-TIRS.csv",
    "wind": BASE_URL + "mars2020_meda_calibrated-WIND.csv",
}

# Código del instrumento utilizado en el nombre del producto PDS.
INSTRUMENT_CODES = {
    "air_temperature": "ATS",
    "pressure": "PS",
    "radiation": "RDS",
    "humidity": "RHS",
    "thermal_infrared": "TIRS",
    "wind": "WIND",
}

# Variables terrestres y su correspondencia en Marte.
MARS_VARIABLES = {
    "air_temperature_mean": {
        "description": "Temperatura promedio del aire",
        "instrument": "MEDA ATS",
        "mars_variable": "Temperatura del aire",
        "availability": "directa",
    },
    "air_temperature_min": {
        "description": "Temperatura mínima del aire",
        "instrument": "MEDA ATS",
        "mars_variable": "Temperatura mínima del aire",
        "availability": "directa",
    },
    "relative_humidity": {
        "description": "Humedad relativa",
        "instrument": "MEDA RHS",
        "mars_variable": "Humedad relativa",
        "availability": "directa",
    },
    "solar_radiation": {
        "description": "Radiación solar superficial",
        "instrument": "MEDA RDS / TIRS",
        "mars_variable": "Mediciones radiométricas disponibles",
        "availability": "relacionada",
    },
    "wind_speed": {
        "description": "Velocidad del viento a 10 metros",
        "instrument": "MEDA WIND",
        "mars_variable": "Velocidad del viento a la altura del sensor",
        "availability": "directa_con_diferencia_de_altura",
    },
    "precipitation": {
        "description": "Precipitación diaria",
        "instrument": None,
        "mars_variable": None,
        "availability": "sin_equivalente_directo",
    },
    "atmospheric_pressure": {
        "description": "Presión atmosférica",
        "instrument": "MEDA PS",
        "mars_variable": "Presión atmosférica",
        "availability": "directa",
    },
    "soil_temperature": {
        "description": "Temperatura del suelo",
        "instrument": "MEDA TIRS",
        "mars_variable": "Temperatura superficial/radiométrica del terreno",
        "availability": "relacionada",
    },
    "surface_soil_moisture": {
        "description": "Humedad superficial del suelo",
        "instrument": None,
        "mars_variable": None,
        "availability": "sin_medicion_directa",
    },
}


class MarsDataClient:

    def __init__(self):
        self.timeout = 60

    async def _download(self, url: str):
        async with httpx.AsyncClient(
            timeout=self.timeout,
            follow_redirects=True
        ) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.content

    def _parse_csv(self, content: bytes):
        text = content.decode("utf-8-sig", errors="replace")
        reader = csv.DictReader(io.StringIO(text))

        records = []

        for row in reader:
            record = {
                key.strip(): value.strip() if value else None
                for key, value in row.items()
                if key
            }
            records.append(record)

        return reader.fieldnames or [], records

    async def get_index(self, variable: str):
        if variable not in MEDA_INDEXES:
            raise ValueError(
                f"Variable MEDA no reconocida: {variable}"
            )

        url = MEDA_INDEXES[variable]
        content = await self._download(url)

        text = content.decode("utf-8-sig", errors="replace")
        reader = csv.DictReader(io.StringIO(text))

        products = []

        for row in reader:
            product = {
                key.strip(): value.strip() if value else None
                for key, value in row.items()
                if key
            }
            products.append(product)

        return {
            "instrument": "MEDA",
            "variable": variable,
            "index_url": url,
            "total_products": len(products),
            "columns": reader.fieldnames or [],
            "products": products,
        }

    async def get_available_indexes(self):
        results = {}

        for variable in MEDA_INDEXES:
            try:
                data = await self.get_index(variable)

                results[variable] = {
                    "status": "available",
                    "products_count": data["total_products"],
                    "columns": data["columns"],
                }

            except (httpx.HTTPError, ValueError) as exc:
                results[variable] = {
                    "status": "error",
                    "message": str(exc),
                }

        return results

    async def get_products(self, variable: str, limit: int = 5):
        if limit < 1:
            raise ValueError("El límite debe ser mayor que cero")

        data = await self.get_index(variable)

        return {
            "instrument": data["instrument"],
            "variable": variable,
            "total_products": data["total_products"],
            "products": data["products"][:limit],
        }

    def build_product_url(self, variable: str, sol: int):
        if variable not in INSTRUMENT_CODES:
            raise ValueError(
                f"No existe un instrumento MEDA para: {variable}"
            )

        if sol < 0:
            raise ValueError("El número de sol no puede ser negativo")

        instrument = INSTRUMENT_CODES[variable]

        folder_start = (sol // 90) * 90
        folder_end = folder_start + 89

        filename = (
            f"WE__{sol:04d}___________"
            f"CAL_{instrument}_________________P01.CSV"
        )

        url = (
            f"{PDS_DATA_BASE}/"
            f"sol_{folder_start:04d}_{folder_end:04d}/"
            f"sol_{sol:04d}/{filename}"
        )

        return filename, url

    async def get_sample(self, variable: str, sol: int, limit: int = 10):
        filename, url = self.build_product_url(variable, sol)

        content = await self._download(url)
        columns, records = self._parse_csv(content)

        result = {
            "planet": "Mars",
            "mission": "Mars 2020",
            "rover": "Perseverance",
            "instrument": "MEDA",
            "variable": variable,
            "sol": sol,
            "filename": filename,
            "source_url": url,
            "columns": columns,
            "total_records": len(records),
            "preview": records[:limit],
        }

        # Para ATS calculamos una temperatura representativa
        # usando los sensores 1, 2 y 3 del mástil.
        if variable == "air_temperature":
            result["derived_values"] = self._calculate_air_temperature(
                records
            )

        return result

    def _calculate_air_temperature(self, records):
        values = []

        for record in records:
            try:
                t1 = float(record["ATS_LOCAL_TEMP1"])
                t2 = float(record["ATS_LOCAL_TEMP2"])
                t3 = float(record["ATS_LOCAL_TEMP3"])

                values.append(min(t1, t2, t3))

            except (KeyError, TypeError, ValueError):
                continue

        if not values:
            return {
                "status": "no_valid_data",
                "message": "No se encontraron valores válidos de ATS.",
            }

        return {
            "method": "Mínimo entre ATS_LOCAL_TEMP1, 2 y 3 por registro",
            "valid_records": len(values),
            "mean": round(sum(values) / len(values), 3),
            "minimum": round(min(values), 3),
            "maximum": round(max(values), 3),
        }

    def get_variable_catalog(self):
        return MARS_VARIABLES