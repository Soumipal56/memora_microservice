import { useState } from 'react'
import { api } from '../utils/api'
import NodeCard from './NodeCard'

export default function SearchView({ nodes, onNodeClick, onBack }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const data = await api.search(query.trim())
      setResults(data.results || [])
    } catch {
      // Fallback: client-side text match
      const q = query.toLowerCase()
      setResults(nodes.filter(n =>
        n.title?.toLowerCase().includes(q) ||
        n.summary?.toLowerCase().includes(q) ||
        n.tags?.some(t => t.toLowerCase().includes(q))
      ).slice(0, 5))
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 20, animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{
          fontFamily: "'Fredoka One', cursive", fontSize: 24,
          color: '#06b6d4', margin: 0,
        }}>
          🔍 Semantic Search
        </h2>
        
        <button 
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '20px', padding: '8px 16px', color: '#fff', fontSize: '13px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'all 0.2s', fontWeight: 'bold'
          }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >
          ⬅ Back to Graph
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Search your knowledge graph…"
          style={{
            flex: 1, background: 'rgba(255,255,255,0.08)',
            border: '1.5px solid rgba(6,182,212,0.3)',
            borderRadius: 12, padding: '10px 16px',
            color: '#fff', fontSize: 14, outline: 'none',
            fontFamily: "'Nunito', sans-serif",
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(6,182,212,0.7)'}
          onBlur={e  => e.target.style.borderColor = 'rgba(6,182,212,0.3)'}
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          style={{
            background: 'linear-gradient(135deg,#06b6d4,#0ea5e9)',
            border: 'none', borderRadius: 12, padding: '10px 22px',
            color: '#fff', fontWeight: 800, fontSize: 14,
            cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
          }}
        >
          {loading ? '…' : 'Search'}
        </button>
      </div>

      {searched && results.length === 0 && (
        <p style={{ color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 40 }}>
          No results found for "{query}"
        </p>
      )}

      {results.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
          gap: 14,
        }}>
          {results.map(n => (
            <NodeCard key={n.id} node={n} onClick={() => onNodeClick(n)} />
          ))}
        </div>
      )}
    </div>
  )
}
