import { getColor, getIcon, timeAgo } from '../utils/constants'

export default function NodeDetail({ node, nodes, edges, onClose, onRelatedClick }) {
  if (!node) return null

  const related = edges
    .filter(e => e.source === node.id || e.target === node.id)
    .map(e => e.source === node.id ? e.target : e.source)
    .map(id => nodes.find(n => n.id === id))
    .filter(Boolean)
    .slice(0, 5)

  const color = getColor(node.type)

  return (
    <aside style={{
      width: 320, minWidth: 280,
      background: 'rgba(10,2,30,0.95)',
      backdropFilter: 'blur(20px)',
      borderLeft: '1px solid rgba(255,110,180,0.2)',
      overflowY: 'auto', padding: 20,
      animation: 'fadeIn 0.3s ease',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{
          background: color, borderRadius: 8, padding: '4px 10px',
          fontSize: 11, fontWeight: 800, letterSpacing: 1,
          color: '#fff', textTransform: 'uppercase',
        }}>
          {getIcon(node.type)} {node.type}
        </span>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none',
          borderRadius: '50%', width: 28, height: 28,
          color: '#fff', cursor: 'pointer', fontSize: 14,
        }}>✕</button>
      </div>

      {/* Title */}
      <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1.35 }}>
        {node.title}
      </h3>

      {/* Summary */}
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65 }}>
        {node.summary}
      </p>

      {/* Tags */}
      {node.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {node.tags.map(tag => (
            <span key={tag} style={{
              background: 'rgba(168,85,247,0.18)',
              border: '1px solid rgba(168,85,247,0.35)',
              borderRadius: 12, padding: '3px 10px',
              fontSize: 11, color: '#c084fc', fontWeight: 700,
            }}>#{tag}</span>
          ))}
        </div>
      )}

      {/* Meta */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 10, padding: '10px 14px', fontSize: 12,
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>CLUSTER </span>
          <span style={{ color: '#ff6eb4', fontWeight: 800 }}>{node.cluster}</span>
        </span>
        <span style={{ color: 'rgba(255,255,255,0.3)' }}>{timeAgo(node.createdAt)}</span>
      </div>

      {/* Resurface */}
      {node.resurface_context && (
        <div style={{
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 10, padding: '10px 14px',
          fontSize: 12, color: '#fbbf24',
        }}>
          🔔 {node.resurface_context}
        </div>
      )}

      {/* Open original */}
      {node.url && (
        <a href={node.url} target="_blank" rel="noreferrer" style={{
          display: 'block',
          background: 'linear-gradient(135deg,#ff6eb4,#a855f7)',
          borderRadius: 10, padding: '10px 16px',
          color: '#fff', textDecoration: 'none',
          fontSize: 13, fontWeight: 800, textAlign: 'center',
        }}>
          Open Original ↗
        </a>
      )}

      {/* Related nodes */}
      {related.length > 0 && (
        <div>
          <div style={{
            fontSize: 10, fontWeight: 800,
            color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginBottom: 8,
          }}>
            RELATED NODES
          </div>
          {related.map(n => (
            <div
              key={n.id}
              onClick={() => onRelatedClick(n)}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, padding: '8px 12px', marginBottom: 6,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,110,180,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            >
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: getColor(n.type), flexShrink: 0,
              }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                {n.title?.length > 32 ? n.title.slice(0, 30) + '…' : n.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}
