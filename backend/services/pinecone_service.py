from pinecone import Pinecone
from config import PINECONE_API_KEY, PINECONE_INDEX

_index = None

def get_pinecone_index():
    global _index
    if _index is None:
        try:
            pc = Pinecone(api_key=PINECONE_API_KEY)
            _index = pc.Index(PINECONE_INDEX)
            print("[pinecone] Connected to index:", PINECONE_INDEX)
        except Exception as e:
            print(f"[pinecone] Connection failed: {e}")
            _index = None
    return _index

async def upsert_vector(node_id: str, embedding: list, metadata: dict):
    index = get_pinecone_index()
    if not index:
        return
    try:
        index.upsert(vectors=[{
            "id": node_id,
            "values": embedding,
            "metadata": metadata
        }])
    except Exception as e:
        print(f"[pinecone] Upsert failed: {e}")

async def query_similar(embedding: list, top_k: int = 5, threshold: float = 0.78) -> list:
    index = get_pinecone_index()
    if not index:
        return []
    try:
        res = index.query(vector=embedding, top_k=top_k, include_metadata=True)
        return [m for m in res.matches if m.score > threshold]
    except Exception as e:
        print(f"[pinecone] Query failed: {e}")
        return []
