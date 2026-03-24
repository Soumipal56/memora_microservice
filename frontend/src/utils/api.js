const BASE = import.meta.env.VITE_API_URL || ''

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  ingest:     (url)   => request('POST', '/api/ingest',  { url }),
  search:     (query) => request('POST', '/api/search',  { query }),
  getNodes:   ()      => request('GET',  '/api/nodes'),
  getGraph:   ()      => request('GET',  '/api/graph'),
  clearAll:   ()      => request('DELETE', '/api/nodes'),
}
