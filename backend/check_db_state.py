import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

async def check():
    uri = os.getenv("MONGODB_URI")
    client = AsyncIOMotorClient(uri)
    db = client["memora"]
    
    node_count = await db["nodes"].count_documents({})
    edge_count = await db["edges"].count_documents({})
    
    print(f"Nodes in DB: {node_count}")
    print(f"Edges in DB: {edge_count}")
    
    if edge_count > 0:
        edges = await db["edges"].find().to_list(10)
        print("\nSample Edges:")
        for e in edges:
            print(f"Source: {e.get('source')} -> Target: {e.get('target')} (Sim: {e.get('similarity')})")
    else:
        print("\nNo edges found!")

if __name__ == "__main__":
    asyncio.run(check())
