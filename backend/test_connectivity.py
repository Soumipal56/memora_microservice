import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pinecone import Pinecone
from openai import AsyncOpenAI

load_dotenv()

async def test_mongo():
    uri = os.getenv("MONGODB_URI")
    print(f"Testing MongoDB: {uri[:20]}...")
    client = AsyncIOMotorClient(uri)
    try:
        await client.admin.command('ping')
        print("✅ MongoDB Connection OK")
    except Exception as e:
        print(f"❌ MongoDB Connection Failed: {e}")

async def test_pinecone():
    api_key = os.getenv("PINECONE_API_KEY")
    index_name = os.getenv("PINECONE_INDEX", "memora")
    print(f"Testing Pinecone: Index={index_name}")
    try:
        pc = Pinecone(api_key=api_key)
        index = pc.Index(index_name)
        stats = index.describe_index_stats()
        print(f"✅ Pinecone Connection OK (Stats: {stats.dimension} dimensions)")
    except Exception as e:
        print(f"❌ Pinecone Connection Failed: {e}")

async def test_openai():
    api_key = os.getenv("OPENAI_API_KEY")
    print(f"Testing OpenAI: {api_key[:10]}...")
    client = AsyncOpenAI(api_key=api_key)
    try:
        await client.embeddings.create(model="text-embedding-3-small", input="test")
        print("✅ OpenAI Embeddings OK")
    except Exception as e:
        print(f"❌ OpenAI Embeddings Failed: {e}")

async def main():
    await test_mongo()
    await test_pinecone()
    await test_openai()

if __name__ == "__main__":
    asyncio.run(main())
