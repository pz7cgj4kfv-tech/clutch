'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SosPage() {
  const [session, setSession] = useState<any>(null)
  const [err, setErr] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('t')
    if (!t) { setErr(true); return }
    const load = async () => {
      const { data } = await supabase.from('sos_sessions').select('*').eq('token', t).single()
      if (data) setSession(data); else setErr(true)
    }
    load()
    const ch = supabase.channel(`sos-${t}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sos_sessions', filter: `token=eq.${t}` },
        (payload: any) => setSession(payload.new))
      .subscribe()
    const poll = setInterval(load, 5000)            // fallback polling
    const clock = setInterval(() => setTick(x => x + 1), 1000)
    return () => { supabase.removeChannel(ch); clearInterval(poll); clearInterval(clock) }
  }, [])

  const wrap: React.CSSProperties = { minHeight: '100vh', background: '#1a0810', color: '#fff', fontFamily: 'system-ui', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center' }

  if (err) return <div style={wrap}><div style={{ fontSize: 40 }}>⚠️</div><div style={{ fontSize: 18, fontWeight: 800, marginTop: 12 }}>Lien SOS invalide ou expiré</div></div>
  if (!session) return <div style={wrap}><div style={{ fontSize: 16, opacity: .7 }}>Chargement…</div></div>

  const ago = Math.max(0, Math.round((Date.now() - new Date(session.updated_at).getTime()) / 1000)); void tick
  const hasPos = session.lat != null && session.lng != null
  const mapSrc = hasPos ? `https://maps.google.com/maps?q=${session.lat},${session.lng}&z=16&output=embed` : null
  const mapsUrl = hasPos ? `https://maps.google.com/?q=${session.lat},${session.lng}` : null

  return (
    <div style={{ minHeight: '100vh', background: '#1a0810', color: '#fff', fontFamily: 'system-ui', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: session.active ? '#ef4444' : '#4b5563', padding: '18px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 900 }}>🆘 {session.user_name || 'Quelqu’un'} a besoin d&apos;aide</div>
        <div style={{ fontSize: 13, opacity: .9, marginTop: 4 }}>
          {session.active ? `Position en direct · mise à jour il y a ${ago}s` : 'Alerte SOS terminée'}
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative', minHeight: 320 }}>
        {mapSrc
          ? <iframe title="position" src={mapSrc} style={{ width: '100%', height: '100%', border: 0, position: 'absolute', inset: 0 }} />
          : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: .6 }}>Position GPS en attente…</div>}
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {mapsUrl && <a href={mapsUrl} target="_blank" rel="noopener" style={{ display: 'block', textAlign: 'center', padding: 14, borderRadius: 12, background: '#fff', color: '#1a0810', fontWeight: 900, fontSize: 15, textDecoration: 'none' }}>📍 Ouvrir dans Google Maps</a>}
        <a href="tel:112" style={{ display: 'block', textAlign: 'center', padding: 14, borderRadius: 12, background: '#ef4444', color: '#fff', fontWeight: 900, fontSize: 15, textDecoration: 'none' }}>📞 Appeler les urgences (112)</a>
        <div style={{ fontSize: 11, opacity: .5, textAlign: 'center', marginTop: 4 }}>Clutch · alerte de sécurité 🇨🇭</div>
      </div>
    </div>
  )
}
