from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uvicorn
import os

from services.ingest import ingest_url
from services.search import semantic_search
from services.graph import get_graph_data
from db.mongo import get_all_nodes, delete_all_nodes

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

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    """Health check endpoint for Render's load balancer."""
    return {"status": "healthy"}

@app.get("/api/status")
async def status():
    return {"status": "Memora API running"}

@app.post("/api/ingest")
async def ingest(req: IngestRequest):
    try:
        result = await ingest_url(req.url)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/search")
async def search(req: SearchRequest):
    try:
        results = await semantic_search(req.query)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/nodes")
async def list_nodes():
    try:
        nodes = await get_all_nodes()
        return {"nodes": nodes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/graph")
async def graph():
    try:
        data = await get_graph_data()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/nodes")
async def clear_nodes():
    try:
        await delete_all_nodes()
        return {"message": "All nodes cleared"}
    except Exception as e:
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
