from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime
from config import MONGODB_URI
import re

client = AsyncIOMotorClient(MONGODB_URI)
db = client["memora"]
users_col = db["users"]
nodes_col = db["nodes"]
edges_col = db["edges"]

def serialize(doc) -> dict:
    """Convert MongoDB doc to JSON-serializable dict."""
    doc["id"] = str(doc.pop("_id"))
    return doc

# ── Users ─────────────────────────────────────────────────────────────────────

async def create_user(email: str, password_hash: str) -> dict:
    data = {
        "email": email,
        "password_hash": password_hash,
        "createdAt": datetime.utcnow().isoformat()
    }
    result = await users_col.insert_one(data)
    data["id"] = str(result.inserted_id)
    data.pop("_id", None)
    return data

async def get_user_by_email(email: str):
    doc = await users_col.find_one({"email": email})
    return serialize(doc) if doc else None

# ── Nodes ─────────────────────────────────────────────────────────────────────

async def create_node(data: dict) -> dict:
    data["createdAt"] = datetime.utcnow().isoformat()
    result = await nodes_col.insert_one(data)
    data["id"] = str(result.inserted_id)
    data.pop("_id", None)
    return data

async def get_all_nodes() -> list:
    cursor = nodes_col.find({})
    docs = await cursor.to_list(length=1000)
    return [serialize(d) for d in docs]

async def get_node_by_url(url: str):
    doc = await nodes_col.find_one({"url": url})
    return serialize(doc) if doc else None

async def delete_all_nodes():
    await nodes_col.delete_many({})
    await edges_col.delete_many({})

async def delete_node(node_id: str):
    result = await nodes_col.delete_one({"_id": ObjectId(node_id)})
    if result.deleted_count > 0:
        await edges_col.delete_many({"$or": [{"source": node_id}, {"target": node_id}]})
        return True
    return False

# ── Edges ─────────────────────────────────────────────────────────────────────

async def create_edge(source: str, target: str, similarity: float = 0.95):
    existing = await edges_col.find_one({"source": source, "target": target})
    if existing:
        return
    await edges_col.insert_one({
        "source": source,
        "target": target,
        "similarity": similarity,
        "createdAt": datetime.utcnow().isoformat()
    })

async def get_all_edges() -> list:
    cursor = edges_col.find({})
    docs = await cursor.to_list(length=5000)
    result = []
    for d in docs:
        d.pop("_id", None)
        result.append(d)
    return result
