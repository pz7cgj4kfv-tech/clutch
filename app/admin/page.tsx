'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// ─── ADMIN EMAILS autorisés ────────────────────────────────────────────────────
// Ajoute vos emails ici pour avoir accès à la modération
const ADMIN_EMAILS = [
  'melanie.brodard@yahoo.fr',
  'david.saugy@gmail.com',
]

const C = {
  bg: '#FDFAF7', bgDeep: '#F5F0EA',
  primary: '#C4748A', primaryDark: '#A85C72', primaryLight: '#F2D4DB',
  sage: '#7A9E8A', sageLight: '#D4E8DE',
  peach: '#E8A87C', peachLight: '#FAEBD7',
  gold: '#C9A96E',
  text: '#2C1810', textMid: '#6B4C3B', textLight: '#A08878',
  card: '#FFFFFF', border: '#EDE8E3', shadow: 'rgba(44,24,16,0.08)',
  red: '#D64545', redLight: '#FDEAEA',
}

type EventRow = {
  id: string
  title: string
  emoji: string
  venue: string
  date_label: string
  price: string
  spots: number
  description: string
  type: string
  status: string
  created_by: string
  created_at: string
  creator?: { name: string; photo_url: string }
}

export default function Admin() {
  const [userEmail, setUserEmail] = useState<string|null>(null)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<EventRow[]>([])
  const [filter, setFilter] = useState<'pending'|'approved'|'rejected'>('pending')
  const [updating, setUpdating] = useState<string|null>(null)
  const [stats, setStats] = useState({ pending:0, approved:0, rejected:0 })

  useEffect(()=>{
    supabase.auth.getSession().then(async ({data:{session}})=>{
      setUserEmail(session?.user?.email||null)
      if(session?.user?.email&&ADMIN_EMAILS.includes(session.user.email)){
        await loadEvents()
      }
      setLoading(false)
    })
  },[])

  const loadEvents = async () => {
    const {data} = await supabase
      .from('events')
      .select('*,creator:profiles(name,photo_url)')
      .order('created_at',{ascending:false})
    if(data){
      setEvents(data)
      setStats({
        pending: data.filter(e=>e.status==='pending').length,
        approved: data.filter(e=>e.status==='approved').length,
        rejected: data.filter(e=>e.status==='rejected').length,
      })
    }
  }

  const updateStatus = async (id: string, status: 'approved'|'rejected') => {
    setUpdating(id)
    const {error} = await supabase.rpc('admin_update_event_status', {event_id: id, new_status: status})
    if(!error){
      setEvents(prev=>prev.map(e=>e.id===id?{...e,status}:e))
      setStats(prev=>({
        ...prev,
        pending: prev.pending-1,
        [status]: prev[status]+1,
      }))
    }
    setUpdating(null)
  }

  const filtered = events.filter(e=>e.status===filter)

  const typeColor = (t:string) => t==='clutch'?C.primary:t==='partner'?C.sage:C.peach
  const typeLabel = (t:string) => t==='clutch'?'✦ Clutch':t==='partner'?'🤝 Partenaire':'👥 Utilisateur'

  if(loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:C.bg,fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>
      <p style={{color:C.textLight}}>Chargement…</p>
    </div>
  )

  if(!userEmail) return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:C.bg,gap:20,fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',padding:32}}>
      <div style={{fontSize:44,fontWeight:900,letterSpacing:'-0.05em',color:C.text}}>CLU<span style={{color:C.primary}}>TCH</span></div>
      <p style={{color:C.textMid,textAlign:'center'}}>Tu dois être connecté·e pour accéder à l'espace admin.</p>
      <a href="/app" style={{background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,borderRadius:14,padding:'12px 24px',color:'#fff',fontWeight:700,textDecoration:'none'}}>Se connecter →</a>
    </div>
  )

  if(!ADMIN_EMAILS.includes(userEmail)) return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:C.bg,gap:20,fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',padding:32}}>
      <div style={{fontSize:48}}>🔒</div>
      <h1 style={{fontSize:24,fontWeight:800,color:C.text}}>Accès refusé</h1>
      <p style={{color:C.textMid,textAlign:'center'}}>Connecté en tant que <strong>{userEmail}</strong><br/>Cet email n'a pas les droits admin.</p>
      <a href="/" style={{color:C.primary,fontWeight:600,textDecoration:'none'}}>← Retour au site</a>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:C.bgDeep,fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>
      {/* Header */}
      <div style={{background:C.bg,borderBottom:`1px solid ${C.border}`,padding:'16px 32px',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:10}}>
        <div>
          <div style={{fontSize:20,fontWeight:900,letterSpacing:'-0.05em',color:C.text}}>CLU<span style={{color:C.primary}}>TCH</span> <span style={{fontSize:12,background:C.primaryLight,color:C.primary,padding:'2px 8px',borderRadius:8,fontWeight:700}}>ADMIN</span></div>
          <p style={{fontSize:12,color:C.textLight,marginTop:2}}>Modération des événements · {userEmail}</p>
        </div>
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <a href="/app" style={{color:C.textMid,fontSize:13,textDecoration:'none'}}>← App</a>
          <button onClick={()=>supabase.auth.signOut().then(()=>window.location.href='/')} style={{background:'none',border:`1.5px solid ${C.border}`,borderRadius:10,padding:'6px 12px',cursor:'pointer',color:C.textLight,fontSize:12,fontFamily:'inherit'}}>Déconnexion</button>
        </div>
      </div>

      <div style={{maxWidth:900,margin:'0 auto',padding:32}}>
        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:28}}>
          {[
            {label:'En attente',count:stats.pending,color:C.peach,bg:C.peachLight},
            {label:'Approuvés',count:stats.approved,color:C.sage,bg:C.sageLight},
            {label:'Refusés',count:stats.rejected,color:C.red,bg:C.redLight},
          ].map(s=>(
            <div key={s.label} style={{background:s.bg,border:`1.5px solid ${s.color}33`,borderRadius:16,padding:'16px 20px'}}>
              <div style={{fontSize:28,fontWeight:900,color:s.color}}>{s.count}</div>
              <div style={{fontSize:13,color:C.textMid,fontWeight:600}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{display:'flex',gap:8,marginBottom:20}}>
          {(['pending','approved','rejected'] as const).map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{padding:'8px 18px',borderRadius:20,cursor:'pointer',fontWeight:700,fontSize:13,fontFamily:'inherit',background:filter===f?C.primary:C.bg,color:filter===f?'#fff':C.textMid,border:filter===f?'none':`1.5px solid ${C.border}`}}>
              {f==='pending'?`⏳ En attente (${stats.pending})`:f==='approved'?`✓ Approuvés (${stats.approved})`:`✕ Refusés (${stats.rejected})`}
            </button>
          ))}
          <button onClick={loadEvents} style={{marginLeft:'auto',padding:'8px 16px',borderRadius:20,border:`1.5px solid ${C.border}`,background:C.bg,cursor:'pointer',fontSize:13,color:C.textMid,fontFamily:'inherit'}}>🔄 Actualiser</button>
        </div>

        {/* Events list */}
        {filtered.length===0&&(
          <div style={{textAlign:'center',padding:48,background:C.bg,borderRadius:20,border:`1px solid ${C.border}`}}>
            <p style={{fontSize:32,marginBottom:12}}>✨</p>
            <p style={{color:C.textMid}}>Aucun événement {filter==='pending'?'en attente':filter==='approved'?'approuvé':'refusé'} pour l'instant.</p>
          </div>
        )}

        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {filtered.map(ev=>(
            <div key={ev.id} style={{background:C.card,borderRadius:20,padding:24,border:`1px solid ${C.border}`,boxShadow:`0 2px 12px ${C.shadow}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:6}}>
                    <span style={{fontSize:24}}>{ev.emoji||'📅'}</span>
                    <h3 style={{fontSize:18,fontWeight:800,color:C.text,margin:0}}>{ev.title}</h3>
                    <span style={{fontSize:11,padding:'3px 8px',borderRadius:8,background:`${typeColor(ev.type)}18`,color:typeColor(ev.type),fontWeight:700}}>{typeLabel(ev.type)}</span>
                  </div>
                  <div style={{display:'flex',gap:20,fontSize:13,color:C.textLight,marginBottom:8}}>
                    <span>📍 {ev.venue}</span>
                    <span>⏰ {ev.date_label||'—'}</span>
                    <span>💰 {ev.price}</span>
                    <span>👥 {ev.spots} places</span>
                  </div>
                  {ev.description&&<p style={{color:C.textMid,fontSize:14,lineHeight:1.6,marginBottom:8}}>{ev.description}</p>}
                  <div style={{display:'flex',gap:8,alignItems:'center',fontSize:12,color:C.textLight}}>
                    <span>Créé par : <strong>{ev.creator?.name||'Inconnu'}</strong></span>
                    <span>·</span>
                    <span>{new Date(ev.created_at).toLocaleDateString('fr-CH',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'})}</span>
                  </div>
                </div>
              </div>

              {filter==='pending'&&(
                <div style={{display:'flex',gap:10,marginTop:14,paddingTop:14,borderTop:`1px solid ${C.border}`}}>
                  <button
                    onClick={()=>updateStatus(ev.id,'approved')}
                    disabled={updating===ev.id}
                    style={{flex:1,padding:'11px 0',borderRadius:12,border:'none',background:`linear-gradient(135deg,${C.sage},#5A8A6A)`,color:'#fff',fontWeight:700,fontSize:14,cursor:updating===ev.id?'wait':'pointer',fontFamily:'inherit',opacity:updating===ev.id?.6:1}}
                  >
                    {updating===ev.id?'…':'✓ Approuver & Publier'}
                  </button>
                  <button
                    onClick={()=>updateStatus(ev.id,'rejected')}
                    disabled={updating===ev.id}
                    style={{flex:1,padding:'11px 0',borderRadius:12,border:`1.5px solid ${C.red}44`,background:C.redLight,color:C.red,fontWeight:700,fontSize:14,cursor:updating===ev.id?'wait':'pointer',fontFamily:'inherit',opacity:updating===ev.id?.6:1}}
                  >
                    {updating===ev.id?'…':'✕ Refuser'}
                  </button>
                </div>
              )}
              {filter==='approved'&&(
                <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C.border}`}}>
                  <button onClick={()=>updateStatus(ev.id,'rejected')} style={{background:'none',border:'none',color:C.textLight,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>Retirer de la publication</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
