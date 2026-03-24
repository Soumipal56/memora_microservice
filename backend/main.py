from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import asyncio

# Import existing services
from services.ingest import ingest_url
from services.search import semantic_search
from services.graph import get_graph_data
from db.mongo import get_all_nodes, delete_all_nodes

app = Flask(__name__, static_folder="public", static_url_path="")
CORS(app, resources={r"/api/*": {"origins": [
    "http://localhost:8000", 
    "http://localhost:5173", 
    "http://localhost:3000",
    "https://memora-microservice-2.onrender.com"
]}})

# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return send_from_directory("public", "index.html")

@app.route("/api/ingest", methods=["POST"])
async def ingest():
    try:
        data = request.json
        url = data.get("url")
        if not url:
            return jsonify({"error": "URL is required"}), 400
        
        result = await ingest_url(url)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/search", methods=["POST"])
async def search():
    try:
        data = request.json
        query = data.get("query")
        if not query:
            return jsonify({"error": "Query is required"}), 400
        
        results = await semantic_search(query)
        return jsonify({"results": results})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.get("/api/nodes")
async def list_nodes():
    try:
        nodes = await get_all_nodes()
        return jsonify({"nodes": nodes})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.get("/api/graph")
async def graph():
    try:
        data = await get_graph_data()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.delete("/api/nodes")
async def clear_nodes():
    try:
        await delete_all_nodes()
        return jsonify({"message": "All nodes cleared"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Catch-all for SPA routing
@app.route('/<path:path>')
def catch_all(path):
    # API 404s should stay 404s
    if path.startswith("api"):
        return jsonify({"error": "Not Found"}), 404
    
    # Check if the file exists in public/
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    
    # Otherwise serve index.html
    return send_from_directory(app.static_folder, "index.html")

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    
    port = int(os.environ.get("PORT", 8000))
    print(f"Running on port {port}")
    
    # Flask matches host="0.0.0.0" automatically if run via `flask run --host=0.0.0.0`
    # but for manual python main.py:
    app.run(host="0.0.0.0", port=port, debug=False)
