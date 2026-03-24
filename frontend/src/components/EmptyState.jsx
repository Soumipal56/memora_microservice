export default function EmptyState({ onFocus }) {
  const pills = ['YouTube', 'Articles', 'GitHub', 'PDFs', 'Blogs', 'Papers', 'Tweets']

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100%', gap: 18, padding: 40,
      animation: 'fadeIn 0.6s ease',
    }}>
      <div style={{
        fontSize: 72, lineHeight: 1,
        animation: 'pulse 3s ease-in-out infinite',
        filter: 'drop-shadow(0 0 24px rgba(255,110,180,0.5))',
      }}>✿</div>

      <h2 style={{
        fontFamily: "'Fredoka One', cursive",
        fontSize: 30, color: '#ff6eb4',
        textAlign: 'center', margin: 0,
      }}>
        Your knowledge graph is empty
      </h2>

      <p style={{
        color: 'rgba(255,255,255,0.4)', textAlign: 'center',
        fontSize: 15, maxWidth: 380, lineHeight: 1.65,
      }}>
        Paste any URL — article, YouTube video, GitHub repo, research paper — and Memora will automatically organize and connect your knowledge.
      </p>

      <button
        onClick={onFocus}
        style={{
          background: 'linear-gradient(135deg,#ff6eb4,#a855f7)',
          border: 'none', borderRadius: 20, padding: '12px 32px',
          color: '#fff', fontWeight: 800, fontSize: 16,
          cursor: 'pointer', boxShadow: '0 8px 32px rgba(255,110,180,0.35)',
          animation: 'pulse 2s ease-in-out infinite',
        }}
      >
        + Add your first memory
      </button>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
        {pills.map(t => (
          <span key={t} style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20, padding: '5px 14px',
            fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 700,
          }}>{t}</span>
        ))}
      </div>
    </div>
  )
}
