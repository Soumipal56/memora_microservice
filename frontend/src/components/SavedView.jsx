import NodeCard from './NodeCard'

export default function SavedView({ nodes, onNodeClick }) {
  const topLevel = nodes.filter(n => !n.parentId)

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 20, animation: 'fadeIn 0.3s ease' }}>
      <h2 style={{
        fontFamily: "'Fredoka One', cursive", fontSize: 24,
        color: '#ff6eb4', marginBottom: 16,
      }}>
        📋 Saved Items ({topLevel.length})
      </h2>

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
            <NodeCard key={n.id} node={n} onClick={() => onNodeClick(n)} />
          ))}
        </div>
      )}
    </div>
  )
}
