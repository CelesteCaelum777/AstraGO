
import asyncio
from app.connectors.mars import MarsDataClient


async def main():
    client = MarsDataClient()

    print("BUSCANDO PRODUCTOS MEDA...")
    meda = await client.search_meda(limit=5)
    print(meda)

    print("\nBUSCANDO PRODUCTOS REMS...")
    rems = await client.search_rems(limit=5)
    print(rems)


if __name__ == "__main__":
    asyncio.run(main())
