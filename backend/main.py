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

# ── Helper to run async code in sync Flask routes ────────────────────────────
def run_async(coro):
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)

# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return send_from_directory("public", "index.html")

@app.route("/api/ingest", methods=["POST"])
def ingest():
    try:
        data = request.json
        url = data.get("url")
        if not url:
            return jsonify({"error": "URL is required"}), 400
        result = run_async(ingest_url(url))
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/search", methods=["POST"])
def search():
    try:
        data = request.json
        query = data.get("query")
        if not query:
            return jsonify({"error": "Query is required"}), 400
        results = run_async(semantic_search(query))
        return jsonify({"results": results})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/nodes", methods=["GET"])
def list_nodes():
    try:
        nodes = run_async(get_all_nodes())
        return jsonify({"nodes": nodes})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/graph", methods=["GET"])
def graph():
    try:
        data = run_async(get_graph_data())
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/nodes", methods=["DELETE"])
def clear_nodes():
    try:
        run_async(delete_all_nodes())
        return jsonify({"message": "All nodes cleared"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Catch-all for SPA routing
@app.route('/<path:path>')
def catch_all(path):
    if path.startswith("api"):
        return jsonify({"error": "Not Found"}), 404
    file_path = os.path.join(app.static_folder, path)
    if os.path.exists(file_path):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    port = int(os.environ.get("PORT", 8000))
    print(f"Running on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)
