from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn
import os

from services.ingest import ingest_url
from services.search import semantic_search
from services.graph import get_graph_data
from db.mongo import get_all_nodes, delete_all_nodes

# Ensure environment variables are loaded if running as a script
if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

PORT = int(os.getenv("PORT", 8000))
print(f"Running on port {PORT}")

app = FastAPI(title="Memora API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Models ────────────────────────────────────────────────────────────────────

class IngestRequest(BaseModel):
    url: str

class SearchRequest(BaseModel):
    query: str

# ── Routes & Static Files ────────────────────────────────────────────────────

@app.get("/")
async def root():
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

# Match static assets first
app.mount("/assets", StaticFiles(directory="public/assets"), name="assets")

# Catch-all for SPA
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # API 404s should stay 404s
    if full_path.startswith("api"):
        raise HTTPException(status_code=404)
    
    # Try to serve static file
    file_path = os.path.join("public", full_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # Otherwise serve index.html
    return FileResponse("public/index.html")

if __name__ == "__main__":
    # Disable reload in production (when PORT is assigned by Render)
    is_prod = os.getenv("PORT") is not None
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=not is_prod)
