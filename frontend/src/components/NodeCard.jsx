import { useState } from 'react'
import { getColor, getIcon, exactDate } from '../utils/constants'

export default function NodeCard({ node, onClick, onDelete }) {
  const [hovered, setHovered] = useState(false)
  const color = getColor(node.type)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
        border: `1.5px solid ${hovered ? color + '88' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 16, padding: 16, cursor: 'pointer',
        transition: 'all 0.2s',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? `0 8px 24px ${color}22` : 'none',
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: color, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, color: '#fff',
          }}>
            {getIcon(node.type)}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{
              fontSize: 13, fontWeight: 800, color: '#fff',
              lineHeight: 1.2, whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {node.title}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700, marginTop: 2 }}>
              {node.type?.toUpperCase()} · {exactDate(node.createdAt)}
            </div>
          </div>
        </div>
        
        {onDelete && (
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              if(window.confirm('Are you sure you want to delete this memory?')) {
                onDelete(node.id);
              }
            }} 
            title="Delete memory"
            style={{
              background: 'rgba(239, 68, 68, 0.15)', border: 'none',
              borderRadius: '50%', width: 28, height: 28, flexShrink: 0,
              color: '#ef4444', cursor: 'pointer', fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: hovered ? 1 : 0.3, transition: 'all 0.2s',
            }}
          >
            🗑
          </button>
        )}
      </div>

      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.55, margin: '0 0 10px' }}>
        {node.summary?.slice(0, 110)}{node.summary?.length > 110 ? '…' : ''}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {node.tags?.slice(0, 3).map(t => (
          <span key={t} style={{
            background: 'rgba(168,85,247,0.15)',
            border: '1px solid rgba(168,85,247,0.3)',
            borderRadius: 8, padding: '2px 8px',
            fontSize: 10, color: '#c084fc', fontWeight: 700,
          }}>#{t}</span>
        ))}
      </div>
    </div>
  )
}
