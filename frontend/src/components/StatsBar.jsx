import { useMediaQuery } from '../hooks/useMediaQuery'

export default function StatsBar({ nodes, edges, onClearAll, onGraphView, view }) {
  const clusters = new Set(nodes.map(n => n.cluster)).size
  const resurface = nodes.filter(n => {
    return n.createdAt && (Date.now() - new Date(n.createdAt)) / 86400000 >= 30
  }).length
  const isMobile = useMediaQuery('(max-width: 640px)')

  return (
    <div style={{
      display: 'flex', gap: 6, padding: '5px 12px',
      background: 'rgba(255,255,255,0.02)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      alignItems: 'center',
      overflowX: isMobile ? 'auto' : 'visible',
      flexWrap: isMobile ? 'nowrap' : 'wrap',
      position: 'relative', zIndex: 98,
      WebkitOverflowScrolling: 'touch',
    }}>
      <Badge label="NODES"    value={nodes.length}  color="#ff6eb4" compact={isMobile} />
      <Badge label="EDGES"    value={edges.length}  color="#a855f7" compact={isMobile} />
      <Badge label="CLUSTERS" value={clusters}      color="#06b6d4" compact={isMobile} />
      {resurface > 0 && (
        <Badge label="RESURFACE" value={resurface} color="#f59e0b" pulse compact={isMobile} />
      )}

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
        <button
          onClick={onGraphView}
          style={{
            background: view === 'graph' ? 'rgba(255,110,180,0.18)' : 'transparent',
            border: '1px solid rgba(255,110,180,0.3)',
            borderRadius: 8, color: '#ff6eb4',
            fontSize: 11, padding: '3px 8px',
            cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap',
          }}
        >
          ⬡ {isMobile ? '' : 'GRAPH'}
        </button>
        <button
          onClick={onClearAll}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8, color: 'rgba(255,255,255,0.45)',
            fontSize: 11, padding: '3px 8px',
            cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap',
          }}
        >
          {isMobile ? '✕' : 'CLEAR ALL'}
        </button>
      </div>
    </div>
  )
}

function Badge({ label, value, color, pulse, compact }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${color}33`,
      borderRadius: 8, padding: compact ? '3px 8px' : '3px 12px',
      display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
      animation: pulse ? 'pulse 2s ease-in-out infinite' : 'none',
    }}>
      {!compact && (
        <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 }}>{label}</span>
      )}
      <span style={{ fontSize: compact ? 12 : 14, fontWeight: 900, color }}>{value}</span>
      {compact && (
        <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>{label[0]}</span>
      )}
    </div>
  )
}
