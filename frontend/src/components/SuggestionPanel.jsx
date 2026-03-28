import { useState, useEffect } from 'react'
import { api } from '../utils/api'

export default function SuggestionPanel() {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!localStorage.getItem('memora_token')) return;

    let mounted = true
    const fetchSuggestions = async () => {
      try {
        const data = await api.getSuggestions()
        if (mounted) {
          setSuggestions(data.suggestions || [])
        }
      } catch (err) {
        if (mounted) setError(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchSuggestions()
    return () => { mounted = false }
  }, [])

  if (loading) {
    return (
      <div style={{ 
        padding: '20px', background: 'rgba(255,255,255,0.02)', 
        borderRadius: '16px', marginBottom: '24px', textAlign: 'center' 
      }}>
        <p style={{ color: '#ff6eb4', fontWeight: 600, animation: 'pulse 1.5s infinite' }}>
          ✨ Generating AI learning suggestions for you...
        </p>
      </div>
    )
  }

  if (error || suggestions.length === 0) return null

  return (
    <div style={{
      padding: '24px', background: 'linear-gradient(135deg, rgba(26,10,61,0.5), rgba(13,26,46,0.6))',
      borderRadius: '16px', marginBottom: '24px', border: '1px solid rgba(168,85,247,0.3)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
    }}>
      <h3 style={{ margin: '0 0 18px', color: '#a855f7', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>✨</span> Up Next For You
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        {suggestions.map((s, idx) => (
          <a key={idx} href={s.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '16px',
              border: '1px solid rgba(255,255,255,0.1)', transition: 'transform 0.2s, background 0.2s',
              cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column'
            }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
            onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
            >
              <div style={{ fontSize: '12px', color: s.type.toLowerCase().includes('video') ? '#ff4757' : '#2ed573', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>
                {s.type.toLowerCase().includes('video') ? '📺 Watch' : '📖 Read'}
              </div>
              <div style={{ color: '#fff', fontWeight: '600', fontSize: '15px', marginBottom: '8px', lineHeight: '1.3' }}>
                {s.title}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', lineHeight: '1.4', flex: 1 }}>
                {s.reason}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
