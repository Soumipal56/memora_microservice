import React from 'react'

export default function HowToUse({ onGetStarted }) {
  const steps = [
    {
      icon: '📥',
      title: 'Ingest Knowledge',
      desc: 'Paste any URL, YouTube video, or upload a PDF. Memora extracts the core intent and facts automatically.',
      color: '#ff6eb4'
    },
    {
      icon: '🕸',
      title: 'Neural Graph',
      desc: 'Memora builds a semantic map of your memories. Related ideas are linked automatically to reveal deep insights.',
      color: '#a855f7'
    },
    {
      icon: '🔍',
      title: 'Semantic Search',
      desc: 'Forget keywords. Search your knowledge by meaning. "What did I learn about AI agents last month?"',
      color: '#06b6d4'
    },
    {
      icon: '🔔',
      title: 'Resurfacing',
      desc: 'Never forget. Memora identifies forgotten knowledge and resurfaces it at the perfect moment.',
      color: '#f59e0b'
    }
  ]

  return (
    <div style={{
      flex: 1, overflowY: 'auto', padding: '40px 20px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      animation: 'fadeIn 0.5s ease', background: 'rgba(13, 2, 33, 0.4)',
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{ maxWidth: '800px', width: '100%', textAlign: 'center' }}>
        <h1 style={{
          fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(28px, 5vw, 42px)',
          background: 'linear-gradient(135deg, #ff6eb4, #c084fc)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: '10px',
        }}>
          Welcome to Memora
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(14px, 2vw, 18px)',
          marginBottom: '40px', fontWeight: 600,
        }}>
          Your augmented brain for the digital age.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px', marginBottom: '50px',
        }}>
          {steps.map((step, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${step.color}44`,
              borderRadius: '24px', padding: '24px',
              textAlign: 'left', transition: 'all 0.3s ease',
              cursor: 'default',
              boxShadow: `0 8px 32px ${step.color}11`,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = `0 12px 48px ${step.color}22`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 8px 32px ${step.color}11`;
            }}>
              <div style={{
                width: '50px', height: '50px', borderRadius: '16px',
                background: step.color, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '24px', marginBottom: '16px',
                boxShadow: `0 0 20px ${step.color}66`,
              }}>
                {step.icon}
              </div>
              <h3 style={{
                color: '#fff', fontSize: '20px', fontWeight: 800,
                marginBottom: '10px',
              }}>{step.title}</h3>
              <p style={{
                color: 'rgba(255,255,255,0.5)', fontSize: '14px',
                lineHeight: 1.6, margin: 0,
              }}>{step.desc}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onGetStarted}
          style={{
            background: 'linear-gradient(135deg, #ff6eb4, #a855f7)',
            border: 'none', borderRadius: '30px', padding: '16px 40px',
            color: '#fff', fontWeight: 800, fontSize: '18px',
            cursor: 'pointer', boxShadow: '0 8px 32px rgba(255, 110, 180, 0.4)',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          Let's Go! ➔
        </button>
      </div>
    </div>
  )
}
