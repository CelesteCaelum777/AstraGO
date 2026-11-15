import asyncio
import httpx
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000/api/v1"

# Sol que utilizaremos para las pruebas
SOL = 1

ENDPOINTS = [
    {
        "name": "Catálogo de variables",
        "url": "/mars/variables"
    },
    {
        "name": "Índices MEDA",
        "url": "/mars/meda/indexes"
    },
    {
        "name": "Productos de temperatura",
        "url": "/mars/meda/products/air_temperature"
    },
    {
        "name": "Temperatura del aire",
        "url": f"/mars/meda/sample/air_temperature/{SOL}"
    },
    {
        "name": "Presión atmosférica",
        "url": f"/mars/meda/sample/pressure/{SOL}"
    },
    {
        "name": "Humedad relativa",
        "url": f"/mars/meda/sample/humidity/{SOL}"
    },
    {
        "name": "Velocidad del viento",
        "url": f"/mars/meda/sample/wind/{SOL}"
    },
    {
        "name": "Radiación",
        "url": f"/mars/meda/sample/radiation/{SOL}"
    },
    {
        "name": "Temperatura infrarroja",
        "url": f"/mars/meda/sample/thermal_infrared/{SOL}"
    }
]


async def test_endpoint(client, endpoint):
    name = endpoint["name"]
    url = BASE_URL + endpoint["url"]

    try:
        response = await client.get(url)

        if response.status_code == 200:
            data = response.json()

            print(f"✅ {name}")
            print(f"   Estado HTTP: {response.status_code}")

            if isinstance(data, dict):
                print(f"   Instrumento: {data.get('instrument', '-')}")
                print(f"   Variable: {data.get('variable', '-')}")
                print(f"   Registros: {data.get('total_records', '-')}")
                print(f"   Productos: {data.get('total_products', '-')}")

            return {
                "endpoint": name,
                "status": "OK",
                "http_code": response.status_code
            }

        print(f"❌ {name}")
        print(f"   Estado HTTP: {response.status_code}")
        print(f"   Respuesta: {response.text[:300]}")

        return {
            "endpoint": name,
            "status": "ERROR",
            "http_code": response.status_code,
            "detail": response.text[:300]
        }

    except httpx.RequestError as exc:
        print(f"❌ {name}")
        print(f"   Error de conexión: {exc}")

        return {
            "endpoint": name,
            "status": "CONNECTION_ERROR",
            "detail": str(exc)
        }

    except ValueError as exc:
        print(f"❌ {name}")
        print(f"   Error procesando respuesta: {exc}")

        return {
            "endpoint": name,
            "status": "INVALID_RESPONSE",
            "detail": str(exc)
        }


async def main():
    print("\n" + "=" * 60)
    print(" PRUEBAS AUTOMÁTICAS - PLANETARY ANALOGUE EXPLORER")
    print("=" * 60)

    print(f"\nFecha: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"Servidor: {BASE_URL}")
    print(f"Sol de prueba: {SOL}\n")

    results = []

    async with httpx.AsyncClient(timeout=120) as client:

        # Comprobar primero que FastAPI esté funcionando.
        try:
            health = await client.get(
                "http://127.0.0.1:8000/health"
            )
            health.raise_for_status()
            print("Servidor FastAPI: DISPONIBLE\n")

        except httpx.RequestError:
            print("ERROR: No se puede conectar con FastAPI.")
            print("Verificá que el servidor esté iniciado.")
            return

        for endpoint in ENDPOINTS:
            result = await test_endpoint(client, endpoint)
            results.append(result)
            print("-" * 60)

    # Resumen final
    successful = sum(
        1 for result in results
        if result["status"] == "OK"
    )

    failed = len(results) - successful

    print("\n" + "=" * 60)
    print(" RESUMEN DE PRUEBAS")
    print("=" * 60)

    print(f"Total de pruebas: {len(results)}")
    print(f"Exitosas: {successful}")
    print(f"Fallidas: {failed}")

    # Guardar resultados en JSON
    with open(
        "mars_test_results.json",
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            results,
            file,
            indent=4,
            ensure_ascii=False
        )

    print("\nResultados guardados en:")
    print("mars_test_results.json")


if __name__ == "__main__":
    asyncio.run(main())