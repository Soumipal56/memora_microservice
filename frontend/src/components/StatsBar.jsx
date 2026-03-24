export default function StatsBar({ nodes, edges, onClearAll, onGraphView, view }) {
  const clusters = new Set(nodes.map(n => n.cluster)).size
  const resurface = nodes.filter(n => {
    return n.createdAt && (Date.now() - new Date(n.createdAt)) / 86400000 >= 30
  }).length

  return (
    <div style={{
      display: 'flex', gap: 8, padding: '6px 16px',
      background: 'rgba(255,255,255,0.02)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      flexWrap: 'wrap', alignItems: 'center',
      position: 'relative', zIndex: 98,
    }}>
      <Badge label="NODES"    value={nodes.length}  color="#ff6eb4" />
      <Badge label="EDGES"    value={edges.length}  color="#a855f7" />
      <Badge label="CLUSTERS" value={clusters}      color="#06b6d4" />
      {resurface > 0 && (
        <Badge label="RESURFACE" value={resurface} color="#f59e0b" pulse />
      )}

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={onGraphView}
          style={{
            background: view === 'graph' ? 'rgba(255,110,180,0.18)' : 'transparent',
            border: '1px solid rgba(255,110,180,0.3)',
            borderRadius: 8, color: '#ff6eb4',
            fontSize: 11, padding: '3px 10px',
            cursor: 'pointer', fontWeight: 700,
          }}
        >
          ⬡ GRAPH
        </button>
        <button
          onClick={onClearAll}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8, color: 'rgba(255,255,255,0.45)',
            fontSize: 11, padding: '3px 10px',
            cursor: 'pointer', fontWeight: 700,
          }}
        >
          CLEAR ALL
        </button>
      </div>
    </div>
  )
}

function Badge({ label, value, color, pulse }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${color}33`,
      borderRadius: 8, padding: '3px 12px',
      display: 'flex', alignItems: 'center', gap: 6,
      animation: pulse ? 'pulse 2s ease-in-out infinite' : 'none',
    }}>
      <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 900, color }}>{value}</span>
    </div>
  )
}
