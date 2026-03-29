from services.extractor import universal_extract, detect_type
from services.ai import extract_knowledge_nodes, get_embedding
from services.pinecone_service import upsert_vector, query_similar
from db.mongo import create_node, create_edge, get_node_by_url, get_all_nodes
from bson import ObjectId
from datetime import datetime, timedelta

async def ingest_url(url: str) -> dict:
    # 0. Deduplication check
    existing = await get_node_by_url(url)
    if existing:
        print(f"[ingest] URL already exists: {url}")
        return {"node": existing, "all_nodes": [existing], "content_type": existing.get("type"), "cached": True}

    # 1. Extract content from URL
    print(f"[ingest] Extracting: {url}")
    extracted = await universal_extract(url)
    url_type = detect_type(url)

    title = extracted.get("title", "Untitled")
    content = extracted.get("content", "")
    base_tags = extracted.get("tags", [])

    if not content or len(content) < 20:
        raise ValueError("Insufficient content extracted from URL")

    # 2. AI: decompose into knowledge nodes
    print(f"[ingest] Running AI analysis...")
    analysis = await extract_knowledge_nodes(title, content, url_type)

    extracted_nodes = analysis.get("nodes", [])
    internal_links = analysis.get("internal_links", [])
    cluster = analysis.get("cluster", "General")
    ai_tags = analysis.get("tags", base_tags)
    ai_summary = analysis.get("summary", extracted.get("summary", ""))
    ai_title = analysis.get("title", title)

    # Ensure at least one node (the source itself)
    if not extracted_nodes:
        # Use scraped summary if AI failed
        display_summary = ai_summary if ai_summary else content[:300]
        if "[ai] Claude extraction failed" in str(analysis): # Detect fallback
             display_summary = f"[AI Skip] {display_summary}"

        extracted_nodes = [{
            "title": ai_title,
            "summary": display_summary,
            "type": url_type,
            "tags": ai_tags
        }]

    saved_nodes = []
    embedding_cache = {}

    # 3. Save each node
    for raw_node in extracted_nodes:
        node_tags = list(set(raw_node.get("tags", []) + ai_tags))
        node_text = f"{raw_node['title']}. {raw_node.get('summary', '')}"

        # Get embedding
        embedding = await get_embedding(node_text)
        embedding_cache[raw_node["title"]] = embedding

        # Vector similarity for clustering & related items
        similar = await query_similar(embedding, top_k=5, threshold=0.78)
        related_items = [
            {"id": m.id, "title": m.metadata.get("title", ""), "score": round(m.score, 3)}
            for m in similar[:3]
        ]

        # Inherit cluster from top similar match
        node_cluster = cluster
        if similar:
            node_cluster = similar[0].metadata.get("cluster", cluster)

        # Resurfacing: flag if top match is old
        resurface_context = None
        if similar:
            from db.mongo import nodes_col
            top_match_doc = await nodes_col.find_one({"_id": ObjectId(similar[0].id)}) if hasattr(nodes_col, 'find_one') else None
            # simplified resurfacing check
            pass

        # Save to MongoDB
        node_data = {
            "title": raw_node["title"],
            "url": url,
            "summary": raw_node.get("summary", ""),
            "content": content[:5000],
            "tags": node_tags,
            "type": raw_node.get("type", url_type),
            "cluster": node_cluster,
            "related_items": related_items,
            "resurface_context": resurface_context,
            "thumbnail": extracted.get("thumbnail", ""),
        }
        saved = await create_node(node_data)
        saved_nodes.append(saved)

        # Upsert to Pinecone
        await upsert_vector(
            node_id=saved["id"],
            embedding=embedding,
            metadata={
                "title": saved["title"],
                "url": url,
                "tags": ",".join(node_tags),
                "cluster": node_cluster,
                "type": saved["type"]
            }
        )

    # 4. Internal links between sub-nodes
    for link in internal_links:
        src = saved_nodes[link.get("source_idx", 0)] if link.get("source_idx", 0) < len(saved_nodes) else None
        tgt = saved_nodes[link.get("target_idx", 1)] if link.get("target_idx", 1) < len(saved_nodes) else None
        if src and tgt and src["id"] != tgt["id"]:
            await create_edge(src["id"], tgt["id"], 0.95)

    # 5. Cross-source semantic links & Domain links
    all_stored_nodes = await get_all_nodes()
    
    from urllib.parse import urlparse
    def get_base_domain(u):
        if not u: return None
        n = urlparse(u).netloc.lower()
        return n[4:] if n.startswith("www.") else n

    for node in saved_nodes:
        emb = embedding_cache.get(node["title"])
        cross = []
        if emb:
            cross = await query_similar(emb, top_k=5, threshold=0.75)
        
        node_domain = get_base_domain(node.get("url", url))
        node_tags = set(node.get("tags", []))
        node_words = set(node["title"].lower().split())
        
        # 5a. Domain Hub Node: Connect all similar items through a central domain node
        if node_domain and node.get("type") != "domain":
            domain_node = next((n for n in all_stored_nodes if n.get("type") == "domain" and n.get("title") == node_domain), None)
            
            if not domain_node:
                domain_node = await create_node({
                    "title": node_domain,
                    "url": "",
                    "summary": f"Central hub for all resources from {node_domain}",
                    "content": "",
                    "tags": ["domain", node_domain],
                    "type": "domain",
                    "cluster": "Sources",
                    "related_items": [],
                    "thumbnail": ""
                })
                all_stored_nodes.append(domain_node)
                
            if domain_node and node["id"] != domain_node["id"]:
                await create_edge(node["id"], domain_node["id"], 0.99)
        
        for other in all_stored_nodes:
            if other["id"] == node["id"] or other.get("type") == "domain":
                continue
            
            # 5b. Fallback: Tag/Keyword similarity if no vector matches
            if not cross:
                other_tags = set(other.get("tags", []))
                overlap = node_tags.intersection(other_tags)
                
                other_words = set(other["title"].lower().split())
                word_overlap = node_words.intersection(other_words) - {"the", "and", "a", "of", "to", "in", "is", "for"}

                if len(overlap) >= 2 or len(word_overlap) >= 1:
                    await create_edge(node["id"], other["id"], 0.85)

        # 5c. Vector semantic similarity links
        for match in cross:
            if match.id != node["id"]:
                await create_edge(node["id"], match.id, round(match.score, 3))

    primary = saved_nodes[0]
    print(f"[ingest] Done. Saved {len(saved_nodes)} nodes.")

    return {
        "node": primary,
        "all_nodes": saved_nodes,
        "content_type": url_type,
        "cached": False
    }

async def ingest_document(filename: str, extracted: dict) -> dict:
    # 0. Deduplication is handled by URL/title (simplification: skip dedupe for raw files for now or use filename)
    print(f"[ingest] Ingesting document: {filename}")
    
    title = extracted.get("title", filename)
    content = extracted.get("content", "")
    base_tags = extracted.get("tags", [])
    doc_type = extracted.get("type", "document")
    
    # AI chunking
    analysis = await extract_knowledge_nodes(title, content, doc_type)
    
    extracted_nodes = analysis.get("nodes", [])
    internal_links = analysis.get("internal_links", [])
    cluster = analysis.get("cluster", "Document")
    ai_tags = analysis.get("tags", base_tags)
    
    if not extracted_nodes:
        extracted_nodes = [{
            "title": title,
            "summary": content[:300],
            "type": doc_type,
            "tags": ai_tags
        }]
        
    saved_nodes = []
    
    for raw_node in extracted_nodes:
        node_tags = list(set(raw_node.get("tags", []) + ai_tags))
        node_text = f"{raw_node['title']}. {raw_node.get('summary', '')}"
        
        embedding = await get_embedding(node_text)
        
        url_val = extracted.get("url", f"file://{filename}")
        
        # Save to Mongo
        node_data = {
            "title": raw_node["title"],
            "url": url_val,
            "summary": raw_node.get("summary", ""),
            "content": content[:5000],
            "tags": node_tags,
            "type": raw_node.get("type", doc_type),
            "cluster": cluster,
            "related_items": [],
            "thumbnail": "",
        }
        saved = await create_node(node_data)
        saved_nodes.append(saved)
        
        # Upsert
        from services.pinecone_service import upsert_vector
        await upsert_vector(
            node_id=saved["id"],
            embedding=embedding,
            metadata={
                "title": saved["title"],
                "url": url_val,
                "tags": ",".join(node_tags),
                "cluster": cluster,
                "type": saved["type"]
            }
        )
        
    for link in internal_links:
        src = saved_nodes[link.get("source_idx", 0)] if link.get("source_idx", 0) < len(saved_nodes) else None
        tgt = saved_nodes[link.get("target_idx", 1)] if link.get("target_idx", 1) < len(saved_nodes) else None
        if src and tgt and src["id"] != tgt["id"]:
            await create_edge(src["id"], tgt["id"], 0.95)
            
    return {
        "node": saved_nodes[0] if saved_nodes else None,
        "all_nodes": saved_nodes,
        "content_type": doc_type,
        "cached": False
    }
