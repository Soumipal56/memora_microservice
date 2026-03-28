const BASE = import.meta.env.VITE_API_URL || ''

async function request(method, path, body, isFormData = false) {
  const token = localStorage.getItem('memora_token')
  const headers = {}
  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  ingest:           (url)   => request('POST', '/api/ingest',  { url }),
  ingestText:       (title, text, base64_pdf)  => request('POST', '/api/upload_pdf_text', { title, text, base64_pdf }),
  chat:             (query, node_id) => request('POST', '/api/chat', { query, node_id }),
  search:           (query) => request('POST', '/api/search',  { query }),
  getNodes:         ()      => request('GET',  '/api/nodes'),
  getGraph:         ()      => request('GET',  '/api/graph'),
  getSuggestions:   ()      => request('GET',  '/api/suggestions'),
  clearAll:         ()      => request('DELETE', '/api/nodes'),
  deleteNode:       (id)    => request('DELETE', '/api/nodes/' + id),
}
