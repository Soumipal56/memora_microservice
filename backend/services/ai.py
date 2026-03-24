import json
import re
from anthropic import AsyncAnthropic
from config import OPENAI_API_KEY
from openai import AsyncOpenAI

anthropic_client = AsyncAnthropic()
openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)

# ── Knowledge Extraction ──────────────────────────────────────────────────────

async def extract_knowledge_nodes(title: str, content: str, url_type: str) -> dict:
    """Use Claude to decompose content into knowledge nodes."""
    prompt = f"""You are a knowledge management AI. Analyze this content and extract structured knowledge nodes.

Title: {title}
Type: {url_type}
Content (first 3000 chars): {content[:3000]}

Return ONLY valid JSON (no markdown, no explanation):
{{
  "title": "clean title",
  "summary": "2-3 sentence summary",
  "cluster": "one of: Technology, Science, Design, Business, Culture, Health, Education, Entertainment, Research",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "nodes": [
    {{"title": "key concept 1", "summary": "what this concept means in context", "type": "concept", "tags": ["tag"]}},
    {{"title": "key concept 2", "summary": "what this concept means in context", "type": "concept", "tags": ["tag"]}},
    {{"title": "key concept 3", "summary": "what this concept means in context", "type": "concept", "tags": ["tag"]}}
  ],
  "internal_links": [
    {{"source_idx": 0, "target_idx": 1, "relation": "relates to"}}
  ]
}}"""

    try:
        response = await anthropic_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1200,
            messages=[{"role": "user", "content": prompt}]
        )
        text = response.content[0].text
        clean = re.sub(r'```json|```', '', text).strip()
        return json.loads(clean)
    except Exception as e:
        print(f"[ai] Claude extraction failed: {e}")
        return {
            "title": title,
            "summary": content[:200],
            "cluster": "General",
            "tags": [url_type, "general"],
            "nodes": [],
            "internal_links": []
        }

# ── Embeddings ────────────────────────────────────────────────────────────────

async def get_embedding(text: str) -> list[float]:
    """Get text embedding using OpenAI."""
    try:
        response = await openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=text[:8000],
            dimensions=384
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"[ai] Embedding failed: {e}")
        # Return zero vector as fallback (now 384 dims)
        return [0.0] * 384

# ── Semantic Search ───────────────────────────────────────────────────────────

async def ai_search(query: str, nodes: list) -> list:
    """Use Claude to rank nodes by relevance to query."""
    if not nodes:
        return []

    node_list = [{"id": n["id"], "title": n["title"], "summary": n.get("summary", ""), "tags": n.get("tags", [])} for n in nodes]

    prompt = f"""Given these knowledge nodes: {json.dumps(node_list)}

Search query: "{query}"

Return ONLY a JSON array of node IDs sorted by relevance (most relevant first), max 5:
["id1", "id2"]

If no nodes match, return: []"""

    try:
        response = await anthropic_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}]
        )
        text = response.content[0].text
        clean = re.sub(r'```json|```', '', text).strip()
        return json.loads(clean)
    except Exception as e:
        print(f"[ai] Search failed: {e}")
        return []
