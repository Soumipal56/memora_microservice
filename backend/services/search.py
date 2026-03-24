from services.ai import ai_search, get_embedding
from services.pinecone_service import query_similar
from db.mongo import get_all_nodes
import re

async def semantic_search(query: str) -> list:
    """Search nodes using vector similarity + AI ranking."""
    all_nodes = await get_all_nodes()
    if not all_nodes:
        return []

    # First: vector search via Pinecone
    try:
        embedding = await get_embedding(query)
        similar = await query_similar(embedding, top_k=10, threshold=0.5)
        if similar:
            ids = [m.id for m in similar]
            matched = [n for n in all_nodes if n["id"] in ids]
            matched.sort(key=lambda n: ids.index(n["id"]) if n["id"] in ids else 999)
            return matched[:5]
    except Exception as e:
        print(f"[search] Vector search failed: {e}")

    # Fallback: AI semantic ranking
    try:
        ranked_ids = await ai_search(query, all_nodes)
        if ranked_ids:
            return [n for n in all_nodes if n["id"] in ranked_ids][:5]
    except Exception as e:
        print(f"[search] AI search failed: {e}")

    # Final fallback: basic text match
    q = query.lower()
    return [
        n for n in all_nodes
        if q in n.get("title", "").lower()
        or q in n.get("summary", "").lower()
        or any(q in t.lower() for t in n.get("tags", []))
    ][:5]
