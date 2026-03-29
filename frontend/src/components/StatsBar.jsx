import { useMediaQuery } from '../hooks/useMediaQuery'

export default function StatsBar({ nodes, edges, onClearAll, onGraphView, view, timeFilter, onTimeFilterChange }) {
  const clusters = new Set(nodes.map(n => n.cluster || 'General')).size
  const resurface = nodes.filter(n => {
    return n.createdAt && (Date.now() - new Date(n.createdAt)) / 86400000 >= 30
  }).length
  const isMobile = useMediaQuery('(max-width: 640px)')

  // Slider mapping
  const sliderSteps = [0, 1, 3, 7, 14, 30]
  const getLabel = (val) => {
    if (val === 0) return 'All Time'
    if (val === 1) return 'Last 24h'
    return `Last ${val} Days`
  }

  return (
    <div style={{
      display: 'flex', gap: 12, padding: '6px 16px',
      background: 'rgba(10,2,30,0.8)', backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      alignItems: 'center',
      overflowX: isMobile ? 'auto' : 'visible',
      flexWrap: isMobile ? 'nowrap' : 'wrap',
      position: 'relative', zIndex: 98,
    }}>
      <Badge label="NODES"    value={nodes.length}  color="#ff6eb4" compact={isMobile} />
      <Badge label="EDGES"    value={edges.length}  color="#a855f7" compact={isMobile} />
      <Badge label="CLUSTERS" value={clusters}      color="#06b6d4" compact={isMobile} />
      
      {/* Time-Travel Slider */}
      {!isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 20, flex: 1, maxWidth: 300 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, whiteSpace: 'nowrap' }}>
            TIME JOURNEY:
          </span>
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input 
              type="range"
              min="0"
              max="5"
              step="1"
              value={sliderSteps.indexOf(timeFilter)}
              onChange={(e) => onTimeFilterChange(sliderSteps[e.target.value])}
              style={{
                width: '100%', cursor: 'pointer', accentColor: '#ff6eb4',
                height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)',
                appearance: 'none', outline: 'none'
              }}
            />
          </div>
          <span style={{ 
            fontSize: 11, fontWeight: 800, color: '#ff6eb4', 
            minWidth: 70, textAlign: 'right', fontFamily: "'Fredoka One', cursive" 
          }}>
            {getLabel(timeFilter)}
          </span>
        </div>
      )}

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
