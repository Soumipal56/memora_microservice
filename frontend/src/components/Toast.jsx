export default function Toast({ toast }) {
  if (!toast) return null
  return (
    <div style={{
      position: 'fixed', top: 76, right: 20, zIndex: 9999,
      background: toast.type === 'error'
        ? '#ff4444'
        : 'linear-gradient(135deg,#ff6eb4,#a855f7)',
      color: '#fff', padding: '12px 20px', borderRadius: 12,
      fontWeight: 700, fontSize: 14,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      animation: 'toastIn 0.3s ease',
      maxWidth: 320,
    }}>
      {toast.msg}
    </div>
  )
}
