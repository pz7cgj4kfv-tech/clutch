'use client'

import { useEffect } from 'react'

// Recharge AVEC cache-bust (URL ?cb=…) → force le HTML frais + les bons chunks (contourne le cache GitHub Pages).
function hardReload() {
  try { window.location.replace(window.location.pathname + '?cb=' + Date.now()) }
  catch { window.location.reload() }
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // 🔄 Erreur de CHUNK (après un déploiement, l'ancienne page cachée réclame des JS qui n'existent plus).
  //    → on recharge tout seul avec cache-bust, au plus 1× / 20s (évite la boucle si le déploiement est cassé).
  useEffect(() => {
    const msg = `${error?.name || ''} ${error?.message || ''}`
    const isChunk = /ChunkLoadError|Failed to load chunk|Loading chunk|dynamically imported|importing a module|Importing a module script failed/i.test(msg)
    if (!isChunk) return
    const k = 'clutch_chunk_reload_ts'
    try {
      const last = Number(sessionStorage.getItem(k) || '0')
      if (Date.now() - last > 20000) { sessionStorage.setItem(k, String(Date.now())); hardReload() }
    } catch { hardReload() }
  }, [error])

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
        onClick={hardReload}
        style={{
          background: '#ef4444', color: '#fff', border: 'none',
          borderRadius: 8, padding: '10px 20px', cursor: 'pointer',
          fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
        }}
      >
        Recharger
      </button>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
        Si ça persiste : screenshot et envoie à Claude →
      </div>
    </div>
  )
}
