import { useState } from 'react'
import { getColor, getIcon, exactDate } from '../utils/constants'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { api } from '../utils/api'

export default function NodeDetail({ node, nodes, edges, onClose, onRelatedClick, onDelete }) {
  const [chatQuery, setChatQuery] = useState('')
  const [chatAnswer, setChatAnswer] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  const handleChatSubmit = async () => {
    if (!chatQuery.trim() || chatLoading) return
    setChatLoading(true)
    try {
      const res = await api.chat(chatQuery, node.id)
      setChatAnswer(res.answer || 'No answer received.')
      setChatQuery('')
    } catch (e) {
      setChatAnswer(`Error: ${e.message}`)
    } finally {
      setChatLoading(false)
    }
  }

  if (!node) return null

  const related = edges
    .filter(e => e.source === node.id || e.target === node.id)
    .map(e => e.source === node.id ? e.target : e.source)
    .map(id => nodes.find(n => n.id === id))
    .filter(Boolean)
    .slice(0, 5)

  const color = getColor(node.type)
  const isMobile = useMediaQuery('(max-width: 640px)')

  const mobileStyle = {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    maxHeight: '70vh',
    background: 'rgba(10,2,30,0.97)',
    backdropFilter: 'blur(20px)',
    borderTop: '1px solid rgba(255,110,180,0.25)',
    borderRadius: '20px 20px 0 0',
    overflowY: 'auto', padding: '8px 16px 28px',
    animation: 'slideUp 0.3s ease',
    display: 'flex', flexDirection: 'column', gap: 14,
    zIndex: 300,
  }

  const desktopStyle = {
    width: 320, minWidth: 280,
    background: 'rgba(10,2,30,0.95)',
    backdropFilter: 'blur(20px)',
    borderLeft: '1px solid rgba(255,110,180,0.2)',
    overflowY: 'auto', padding: 20,
    animation: 'fadeIn 0.3s ease',
    display: 'flex', flexDirection: 'column', gap: 14,
  }

  return (
    <aside style={isMobile ? mobileStyle : desktopStyle}>
      {/* Drag hint bar — mobile only */}
      {isMobile && (
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 4, paddingTop: 4 }}>
          <div style={{
            width: 40, height: 4, borderRadius: 2,
            background: 'rgba(255,255,255,0.18)',
          }} />
        </div>
      )}

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{
          background: color, borderRadius: 8, padding: '4px 10px',
          fontSize: 11, fontWeight: 800, letterSpacing: 1,
          color: '#fff', textTransform: 'uppercase',
        }}>
          {getIcon(node.type)} {node.type}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => { if(window.confirm('Delete this memory?')) onDelete(node.id) }} style={{
            background: 'rgba(239, 68, 68, 0.2)', border: 'none',
            borderRadius: '50%', width: 28, height: 28,
            color: '#ef4444', cursor: 'pointer', fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }} title="Delete memory">🗑</button>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none',
            borderRadius: '50%', width: 28, height: 28,
            color: '#fff', cursor: 'pointer', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>✕</button>
        </div>
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
        <span style={{ color: 'rgba(255,255,255,0.3)' }}>{exactDate(node.createdAt)}</span>
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
        <a href={node.url.startsWith('file://') ? `${import.meta.env.VITE_API_URL || 'http://localhost:10000'}/uploads/${node.url.replace('file://', '')}` : node.url} target="_blank" rel="noreferrer" style={{
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
            DIRECT CONNECTIONS
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
                transition: 'all 0.2s',
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

      {/* Smart Suggestions */}
      {(() => {
        const directIds = new Set(related.map(r => r.id))
        const suggestions = nodes
          .filter(n => n.id !== node.id && !directIds.has(n.id))
          .filter(n => {
            const sameCluster = n.cluster === node.cluster
            const commonTags = n.tags?.filter(t => node.tags?.includes(t)) || []
            return sameCluster || commonTags.length > 0
          })
          .sort((a, b) => {
             // Prioritize tag overlap
             const aTags = a.tags?.filter(t => node.tags?.includes(t)).length || 0
             const bTags = b.tags?.filter(t => node.tags?.includes(t)).length || 0
             return bTags - aTags
          })
          .slice(0, 3)

        if (suggestions.length === 0) return null

        return (
          <div style={{ marginTop: 10 }}>
            <div style={{
              fontSize: 10, fontWeight: 800,
              color: 'rgba(6,182,212,0.6)', letterSpacing: 1, marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 6
            }}>
              <span>✦</span> RECOMMENDED NEXT
            </div>
            {suggestions.map(n => (
              <div
                key={n.id}
                onClick={() => onRelatedClick(n)}
                style={{
                  background: 'rgba(6,182,212,0.05)',
                  border: '1px solid rgba(6,182,212,0.2)',
                  borderRadius: 8, padding: '8px 12px', marginBottom: 6,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(6,182,212,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(6,182,212,0.05)'}
              >
                <span style={{ fontSize: 12 }}>✨</span>
                <span style={{ fontSize: 12, color: '#e0f2fe', fontWeight: 600 }}>
                  {n.title?.length > 32 ? n.title.slice(0, 30) + '…' : n.title}
                </span>
              </div>
            ))}
          </div>
        )
      })()}

      {/* Chat Section */}
      <div style={{ marginTop: 'auto', paddingTop: 16 }}>
        <div style={{
          fontSize: 10, fontWeight: 800,
          color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginBottom: 8,
        }}>
          ASK AI ABOUT THIS
        </div>
        
        {chatAnswer && (
          <div style={{
            background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 12,
            fontSize: 13, color: '#e0f2fe', lineHeight: 1.5
          }}>
            <div style={{ fontWeight: 800, color: '#06b6d4', marginBottom: 4 }}>AI Answer:</div>
            {chatAnswer}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={chatQuery}
            onChange={e => setChatQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleChatSubmit()}
            placeholder="Ask a question..."
            style={{
              flex: 1, background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '8px 12px',
              color: '#fff', fontSize: 13, outline: 'none',
              fontFamily: "'Nunito', sans-serif",
            }}
          />
          <button
            onClick={handleChatSubmit}
            disabled={chatLoading || !chatQuery.trim()}
            style={{
              background: 'linear-gradient(135deg,#06b6d4,#0ea5e9)',
              border: 'none', borderRadius: 8, padding: '0 12px',
              color: '#fff', fontWeight: 800, fontSize: 13,
              cursor: chatLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {chatLoading ? '...' : 'Ask'}
          </button>
        </div>
      </div>
    </aside>
  )
}
