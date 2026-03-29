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
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={ "type": "json_object" },
            messages=[{"role": "user", "content": prompt}]
        )
        text = response.choices[0].message.content.strip()
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
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200
        )
        text = response.choices[0].message.content.strip()
        clean = re.sub(r'```json|```', '', text).strip()
        return json.loads(clean)
    except Exception as e:
        print(f"[ai] Search failed: {e}")
        return []

# ── Suggestions ───────────────────────────────────────────────────────────────

async def generate_suggestions(nodes: list) -> list:
    """Generate 3 personalized learning suggestions based on user's saved items."""
    if not nodes:
        return []

    node_list = [{"title": n["title"], "summary": n.get("summary", ""), "tags": n.get("tags", [])} for n in nodes[:15]]

    prompt = f"""Based on the following knowledge nodes a user has saved, recommend 3 highly specific, real-world resources (videos, articles, or concepts) they should explore next to expand their understanding.
    
User's saved nodes: {json.dumps(node_list)}

Return ONLY a valid JSON array of objects. Example format:
[
  {{
    "title": "Exact Search Term or Video Title",
    "type": "video",
    "reason": "Why this specifically connects to their saved items...",
    "url": "https://www.youtube.com/results?search_query=Exact+Search+Term"
  }},
  {{
    "title": "Specific Article or Paper Topic",
    "type": "article",
    "reason": "Why this connects...",
    "url": "https://www.google.com/search?q=Specific+Article+Topic"
  }}
]

RULES:
1. Provide exactly 3 suggestions.
2. The 'type' must be either 'video' or 'article'.
3. For videos, 'url' MUST be a valid YouTube search link. Do NOT hallucinate actual video IDs.
4. For articles, 'url' MUST be a valid Google search link. Do NOT hallucinate actual article URLs.
5. Output ONLY the raw JSON array (no markdown code blocks, no intro text)."""

    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=600
        )
        text = response.choices[0].message.content.strip()
        clean = re.sub(r'```json|```', '', text).strip()
        return json.loads(clean)
    except Exception as e:
        print(f"[ai] Suggestions failed: {e}")
        return []

# ── Chat & RAG ────────────────────────────────────────────────────────────────

async def generate_rag_answer(query: str, context_text: str, context_title: str) -> str:
    """Generate an answer using RAG from local context."""
    prompt = f"""You are an intelligent knowledge assistant helping a user understand their saved documents.
Answer the user's question directly and concisely based ONLY on the following context. 
If the context does not contain the answer, say "I don't see that information in this specific document."

Document Title: {context_title}

Context:
{context_text}

User Question: {query}"""

    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=600
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"[ai] RAG Chat failed: {e}")
        return f"Sorry, I couldn't generate an answer due to an error: {e}"


