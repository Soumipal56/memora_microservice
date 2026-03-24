from db.mongo import get_all_nodes, get_all_edges

async def get_graph_data() -> dict:
    nodes = await get_all_nodes()
    edges = await get_all_edges()
    return {"nodes": nodes, "edges": edges}
