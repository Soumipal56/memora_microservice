export default function Toast({ toast }) {
  if (!toast) return null
  
  const getIcon = () => {
    switch (toast.type) {
      case 'error': return '❌ ';
      case 'success': return '✅ ';
      case 'loading': return '⏳ ';
      default: return '✨ ';
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 76, right: 20, zIndex: 9999,
      background: toast.type === 'error'
        ? 'rgba(239, 68, 68, 0.95)'
        : 'linear-gradient(135deg, rgba(255, 110, 180, 0.95), rgba(168, 85, 247, 0.95))',
      backdropFilter: 'blur(10px)',
      color: '#fff', padding: '12px 20px', borderRadius: 12,
      fontWeight: 'bold', fontSize: 14,
      boxShadow: `0 8px 32px ${toast.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 110, 180, 0.3)'}`,
      animation: 'toastIn 0.3s ease',
      maxWidth: 320,
      display: 'flex', alignItems: 'center', gap: 10,
      border: `1px solid ${toast.type === 'error' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`
    }}>
      <span style={{ fontSize: 18 }}>{getIcon()}</span>
      <span>{toast.msg}</span>
    </div>
  )
}
