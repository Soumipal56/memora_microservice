import { useState } from 'react'

export default function Header({ onIngest, loading, progress, onToggleSaved, onToggleSearch, savedCount, view }) {
  const [url, setUrl] = useState('')

  const handleIngest = () => {
    if (!url.trim() || loading) return
    onIngest(url.trim()).then(() => setUrl(''))
  }

  return (
    <header style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
      background: 'rgba(10,2,30,0.92)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,110,180,0.2)',
      position: 'relative', zIndex: 100,
      animation: 'slideDown 0.5s ease',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, #ff6eb4, #a855f7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, boxShadow: '0 0 20px rgba(255,110,180,0.5)',
          animation: 'pulse 3s ease-in-out infinite',
        }}>✿</div>
        <span style={{
          fontFamily: "'Fredoka One', cursive", fontSize: 26,
          background: 'linear-gradient(135deg, #ff6eb4, #c084fc)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>Memora</span>
      </div>

      {/* Saved */}
      <button onClick={onToggleSaved} style={btnStyle(view === 'saved', '#ff6eb4')}>
        📋 SAVED
        {savedCount > 0 && (
          <span style={{
            background: '#fff', color: '#ff6eb4', borderRadius: '50%',
            width: 20, height: 20, display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 900, marginLeft: 4,
          }}>{savedCount}</span>
        )}
      </button>

      {/* URL input */}
      <input
        value={url}
        onChange={e => setUrl(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleIngest()}
        placeholder="Paste a URL to remember…"
        style={{
          flex: 1, background: 'rgba(255,255,255,0.08)',
          border: '1.5px solid rgba(255,255,255,0.15)',
          borderRadius: 24, padding: '10px 20px',
          color: '#fff', fontSize: 14, outline: 'none',
          fontFamily: "'Nunito', sans-serif", transition: 'border 0.2s',
        }}
        onFocus={e => e.target.style.borderColor = 'rgba(255,110,180,0.6)'}
        onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
      />

      {/* Ingest button */}
      <button
        onClick={handleIngest}
        disabled={loading || !url.trim()}
        style={{
          background: loading ? 'rgba(168,85,247,0.3)' : 'linear-gradient(135deg,#a855f7,#7c3aed)',
          border: 'none', borderRadius: 24, padding: '10px 22px',
          color: '#fff', fontWeight: 800, fontSize: 14,
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 4px 20px rgba(168,85,247,0.5)',
          display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
          transition: 'all 0.2s',
        }}
      >
        {loading
          ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>◌</span> {progress || 'Processing…'}</>
          : 'INGEST'}
      </button>

      {/* Search */}
      <button onClick={onToggleSearch} style={btnStyle(view === 'search', '#06b6d4')}>
        🔍
      </button>
    </header>
  )
}

function btnStyle(active, color) {
  return {
    background: active ? `linear-gradient(135deg,${color},${color}cc)` : `${color}22`,
    border: `1.5px solid ${color}66`,
    borderRadius: 20, padding: '8px 16px',
    color: '#fff', fontWeight: 800, fontSize: 13,
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
    transition: 'all 0.2s', whiteSpace: 'nowrap',
  }
}
