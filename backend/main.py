from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uvicorn
import os
import base64
import time

from services.ingest import ingest_url, ingest_document
from services.search import semantic_search
from services.graph import get_graph_data
from db.mongo import get_all_nodes, delete_all_nodes, delete_node, create_user, get_user_by_email, get_node_by_url, nodes_col
from bson import ObjectId
from services.auth import get_password_hash, verify_password, create_access_token, get_current_user
from services.ai import generate_suggestions, generate_rag_answer

app = FastAPI(title="Memora API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://memora-microservice-2.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Models ────────────────────────────────────────────────────────────────────

class IngestRequest(BaseModel):
    url: str

class SearchRequest(BaseModel):
    query: str

class ChatRequest(BaseModel):
    query: str
    node_id: str = None

class AuthRequest(BaseModel):
    email: str
    password: str

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    """Health check endpoint for Render's load balancer."""
    return {"status": "healthy"}

@app.get("/api/status")
async def status():
    return {"status": "Memora API running"}

@app.get("/api/keep-alive")
async def keep_alive():
    """Heartbeat endpoint to prevent Render sleep."""
    return {"status": "alive", "time": time.time()}

@app.post("/api/register")
async def register(req: AuthRequest):
    existing = await get_user_by_email(req.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_pw = get_password_hash(req.password)
    user = await create_user(req.email, hashed_pw)
    token = create_access_token({"sub": user["id"]})
    return {"token": token, "email": user["email"]}

@app.post("/api/login")
async def login(req: AuthRequest):
    user = await get_user_by_email(req.email)
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": user["id"]})
    return {"token": token, "email": user["email"]}

@app.post("/api/ingest")
async def ingest(req: IngestRequest, user_id: str = Depends(get_current_user)):
    try:
        result = await ingest_url(req.url)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/search")
async def search(req: SearchRequest, user_id: str = Depends(get_current_user)):
    try:
        results = await semantic_search(req.query)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class IngestTextRequest(BaseModel):
    title: str
    text: str
    base64_pdf: str = None

@app.post("/api/upload_pdf_text")
async def upload_pdf_text(req: IngestTextRequest, user_id: str = Depends(get_current_user)):
    try:
        url_val = f"file://{req.title}"
        if req.base64_pdf:
            os.makedirs("public/uploads", exist_ok=True)
            safe_title = "".join(c if c.isalnum() else "_" for c in req.title).strip("_")
            filename = f"{int(time.time())}_{safe_title}.pdf"
            filepath = os.path.join("public/uploads", filename)
            
            with open(filepath, "wb") as f:
                f.write(base64.b64decode(req.base64_pdf))
            
            host = os.environ.get("RENDER_EXTERNAL_URL") or os.environ.get("VITE_API_URL", "http://localhost:10000")
            url_val = f"{host}/uploads/{filename}"

        extracted = {
            "title": req.title,
            "summary": req.text[:250] + "...",
            "content": req.text,
            "url": url_val,
            "tags": ["pdf", "document"],
            "type": "pdf"
        }
        result = await ingest_document(req.title, extracted)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat(req: ChatRequest, user_id: str = Depends(get_current_user)):
    try:
        if not req.node_id:
            raise HTTPException(status_code=400, detail="node_id is required for specific chat")
            
        doc = await nodes_col.find_one({"_id": ObjectId(req.node_id)}) if hasattr(nodes_col, 'find_one') else None
        if not doc:
            raise HTTPException(status_code=404, detail="Node not found")
            
        title = doc.get("title", "Unknown Document")
        content = doc.get("content", doc.get("summary", ""))
        
        answer = await generate_rag_answer(req.query, content, title)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/nodes")
async def list_nodes(user_id: str = Depends(get_current_user)):
    try:
        nodes = await get_all_nodes()
        return {"nodes": nodes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/suggestions")
async def suggestions(user_id: str = Depends(get_current_user)):
    try:
        nodes = await get_all_nodes()
        if not nodes:
            return {"suggestions": []}
        sorted_nodes = sorted(nodes, key=lambda n: n.get("createdAt", ""), reverse=True)
        results = await generate_suggestions(sorted_nodes[:15])
        return {"suggestions": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/graph")
async def graph(user_id: str = Depends(get_current_user)):
    try:
        data = await get_graph_data()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/nodes")
async def clear_nodes(user_id: str = Depends(get_current_user)):
    try:
        await delete_all_nodes()
        return {"message": "All nodes cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/nodes/{node_id}")
async def clear_node(node_id: str, user_id: str = Depends(get_current_user)):
    try:
        success = await delete_node(node_id)
        if not success:
            raise HTTPException(status_code=404, detail="Node not found")
        return {"message": "Node deleted successfully"}
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))

# ── Static Files (Frontend SPA) ───────────────────────────────────────────────

if os.path.exists("public/assets"):
    app.mount("/assets", StaticFiles(directory="public/assets"), name="assets")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    if full_path.startswith("api"):
        raise HTTPException(status_code=404)
    file_path = os.path.join("public", full_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    return FileResponse("public/index.html")

# ── Entry Point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    port = int(os.environ.get("PORT", 10000))
    print(f"Running on port {port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port)
