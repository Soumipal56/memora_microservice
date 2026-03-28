import { useState } from 'react'

export default function AuthOverlay({ onSuccess }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const endpoint = isLogin ? '/api/login' : '/api/register'
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.detail || 'Authentication failed')
      }
      
      localStorage.setItem('memora_token', data.token)
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(13, 2, 33, 0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a0a3d 0%, #0d1a2e 100%)',
        padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '400px',
        boxShadow: '0 0 40px rgba(168, 85, 247, 0.4)',
        border: '1px solid rgba(255, 110, 180, 0.3)',
        textAlign: 'center', color: '#fff'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '10px', animation: 'pulse 3s infinite', filter: 'drop-shadow(0 0 10px #ff6eb4)' }}>✿</div>
        <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: '28px', color: '#ff6eb4', marginBottom: '10px' }}>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '30px', fontSize: '14px' }}>
          Sign in to access your knowledge graph.
        </p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '10px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '16px', outline: 'none'
            }}
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '16px', outline: 'none'
            }}
          />
          <button 
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #ff6eb4, #a855f7)',
              padding: '16px', borderRadius: '12px', border: 'none',
              color: '#fff', fontWeight: 'bold', fontSize: '16px', marginTop: '10px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 4px 15px rgba(255, 110, 180, 0.4)'
            }}
          >
            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>

        <p style={{ marginTop: '25px', fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span 
            onClick={() => setIsLogin(!isLogin)}
            style={{ color: '#ff6eb4', marginLeft: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </span>
        </p>
      </div>
    </div>
  )
}
