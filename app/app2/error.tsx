'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#1a0a14',
      color: '#FFBF9E',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: 'monospace', gap: 16,
    }}>
      <div style={{ fontSize: 32 }}>⚠️</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>Erreur app</div>
      <div style={{
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8, padding: '12px 16px', maxWidth: '90%',
        fontSize: 11, color: 'rgba(255,255,255,0.7)', wordBreak: 'break-all',
      }}>
        {error?.message || 'Erreur inconnue'}
        {error?.stack && <div style={{ marginTop: 8, opacity: 0.5, fontSize: 10 }}>{error.stack.substring(0, 500)}</div>}
      </div>
      <button
        onClick={reset}
        style={{
          background: '#ef4444', color: '#fff', border: 'none',
          borderRadius: 8, padding: '10px 20px', cursor: 'pointer',
          fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
        }}
      >
        Réessayer
      </button>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
        Screenshot cet écran et envoie à Claude →
      </div>
    </div>
  )
}
