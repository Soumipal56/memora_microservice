import { useState } from 'react'
import { getColor, getIcon, timeAgo } from '../utils/constants'

export default function NodeCard({ node, onClick }) {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
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
            {node.type?.toUpperCase()} · {timeAgo(node.createdAt)}
          </div>
        </div>
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
