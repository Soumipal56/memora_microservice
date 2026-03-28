import NodeCard from './NodeCard'
import SuggestionPanel from './SuggestionPanel'

export default function SavedView({ nodes, onNodeClick, onBack, onDelete }) {
  const topLevel = nodes.filter(n => !n.parentId)

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 20, animation: 'fadeIn 0.3s ease' }}>
      <SuggestionPanel />
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{
          fontFamily: "'Fredoka One', cursive", fontSize: 24,
          color: '#ff6eb4', margin: 0,
        }}>
          📋 Saved Items ({topLevel.length})
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

      {topLevel.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 60, fontSize: 15 }}>
          No items saved yet. Paste a URL and click INGEST!
        </p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
          gap: 14,
        }}>
          {topLevel.map(n => (
            <NodeCard key={n.id} node={n} onClick={() => onNodeClick(n)} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
