'use client'
// ─────────────────────────────────────────────────────────────────────────────
// /lab — Page web DÉDIÉE au générateur de bots + reset (David 20.06)
// Pourquoi : dans l'app iPhone le générateur sature le haut de l'écran (dynamic
// island). Cette page s'ouvre sur navigateur, layout propre, on choisit un bot
// et son panneau s'ouvre avec tous les contrôles. Réutilise EXACTEMENT la même
// logique Supabase que le BotLab in-app (policies bot-admin).
// SÉCURITÉ : pas de mot de passe forcé (demande David). On utilise la session
// Supabase déjà présente dans CE navigateur (partagée avec /app2, même origine).
// Les écritures restent protégées par les RLS bot-admin : sans session admin,
// elles échouent proprement (toast d'erreur). Login en REPLI optionnel seulement.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const C = {
  bg:'#2a1020', bgCard:'rgba(255,191,158,0.05)', bgInput:'rgba(255,191,158,0.08)',
  border:'rgba(255,191,158,0.2)', white:'#f5e8de', whiteMid:'rgba(245,232,222,0.6)',
  green:'#22c55e', red:'#dc6a6a', gold:'#E27C00', salmon:'#FFBF9E',
  salmonFaint:'rgba(255,191,158,0.12)',
}

export default function LabPage() {
  const [uid, setUid] = useState<string|null>(null)
  const [checking, setChecking] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  const [bots, setBots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string|null>(null)
  const [expanded, setExpanded] = useState<string|null>(null)
  const [radius, setRadius] = useState<Record<string,number>>({})
  const [slotFrom, setSlotFrom] = useState<Record<string,string>>({})
  const [slotUntil, setSlotUntil] = useState<Record<string,string>>({})
  const [addr, setAddr] = useState<Record<string,string>>({})
  const [addrRes, setAddrRes] = useState<Record<string,any[]>>({})
  const [toast, setToast] = useState<{msg:string,color:string}|null>(null)
  const [myLat, setMyLat] = useState(46.5197)
  const [myLng, setMyLng] = useState(6.6323)

  const showToast = (msg:string, color=C.salmon) => { setToast({msg,color}); setTimeout(()=>setToast(null), 2800) }

  // ── Session (pas de password forcé) ──────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({data})=>{ setUid(data.session?.user?.id || null); setChecking(false) })
  }, [])

  const doLogin = async () => {
    setLoggingIn(true); setLoginErr('')
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pwd })
    setLoggingIn(false)
    if (error) { setLoginErr(error.message); return }
    setUid(data.user?.id || null); setShowLogin(false)
  }
  const logout = async () => { await supabase.auth.signOut(); setUid(null); setBots([]) }

  // ── Chargement bots + position du profil connecté ────────────────────────────
  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('profiles')
      .select('id,name,gender,age,is_available,center_lat,center_lng,available_radius_km,account_type,looking_for,available_from,available_until')
      .eq('is_bot', true).order('name')
    setBots(data||[]); setLoading(false)
  }
  useEffect(() => {
    load()
    if (uid) supabase.from('profiles').select('center_lat,center_lng').eq('id', uid).maybeSingle().then(({data})=>{
      if (data?.center_lat) { setMyLat(data.center_lat); setMyLng(data.center_lng) }
    })
  }, [uid])

  const POS = () => ({
    me:    { lat: myLat,        lng: myLng,        label:'Sur moi' },
    near:  { lat: myLat+0.0045, lng: myLng+0.0030, label:'Proche ~500m' },
    morges:{ lat: 46.5094,      lng: 6.4983,       label:'Morges ~12km' },
  })
  const slotISO = (hhmm:string|undefined, fallbackMs:number) => {
    if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return new Date(fallbackMs).toISOString()
    const [h,m] = hhmm.split(':').map(Number)
    const d = new Date(); d.setHours(h, m, 0, 0); return d.toISOString()
  }

  // ── Actions bots (mêmes que BotLab in-app) ───────────────────────────────────
  const activateAt = async (bot:any, lat:number, lng:number, label:string) => {
    setBusy(bot.id)
    const r = radius[bot.id] ?? 10
    const fromISO  = slotISO(slotFrom[bot.id], Date.now())
    const untilISO = slotISO(slotUntil[bot.id], Date.now()+6*3600*1000)
    const { data, error } = await supabase.from('profiles').update({
      is_available:true, available_from:fromISO, available_until:untilISO,
      center_lat:lat, center_lng:lng, available_radius_km:r,
    }).eq('id', bot.id).select('id')
    setBusy(null)
    if (error || !data?.length) { showToast('❌ Échec — connecte-toi (admin) ou migration manquante', C.red); return }
    showToast(`✓ ${bot.name} en ligne · ${label} · ${r}km`, C.green); setAddrRes(a=>({...a,[bot.id]:[]})); load()
  }
  const activate = (bot:any, key:'me'|'near'|'morges') => { const p = POS()[key]; return activateAt(bot, p.lat, p.lng, p.label) }
  const searchAddr = async (botId:string) => {
    const q = (addr[botId]||'').trim(); if (q.length < 3) return
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`)
      const j = (await res.json())||[]
      setAddrRes(a=>({...a,[botId]: j}))
    } catch { showToast('Recherche adresse indisponible', C.red) }
  }
  const deactivate = async (bot:any) => {
    setBusy(bot.id)
    const { data } = await supabase.from('profiles').update({ is_available:false }).eq('id', bot.id).select('id')
    setBusy(null); if(!data?.length){showToast('❌ Échec',C.red);return}; showToast(`${bot.name} hors ligne`); load()
  }
  const patchBot = async (bot:any, patch:any, msg:string) => {
    const { data } = await supabase.from('profiles').update(patch).eq('id', bot.id).select('id')
    if(!data?.length){showToast('❌ Échec',C.red);return}; showToast(msg,C.green); load()
  }
  const acceptClutch = async (bot:any) => {
    setBusy(bot.id)
    const { data:cl } = await supabase.from('clutches').select('id').eq('receiver_id', bot.id).eq('status','pending').order('created_at',{ascending:false}).limit(1)
    if (!cl?.length) { setBusy(null); showToast(`Aucun clutch en attente pour ${bot.name}`,C.gold); return }
    const { data, error } = await supabase.from('clutches').update({ status:'accepted' }).eq('id', cl[0].id).select('id')
    setBusy(null)
    if (error||!data?.length) { showToast('❌ Échec — policy clutches_bot_admin ?', C.red); return }
    showToast(`✓ ${bot.name} a accepté → Verrou ! 🔒`, C.green)
  }
  const refuseClutch = async (bot:any) => {
    setBusy(bot.id)
    const { data:cl } = await supabase.from('clutches').select('id').eq('receiver_id', bot.id).eq('status','pending').order('created_at',{ascending:false}).limit(1)
    if (!cl?.length) { setBusy(null); showToast(`Aucun clutch en attente pour ${bot.name}`,C.gold); return }
    const { data, error } = await supabase.from('clutches').update({ status:'declined' }).eq('id', cl[0].id).select('id')
    setBusy(null)
    if (error||!data?.length) { showToast('❌ Échec — policy clutches_bot_admin ?', C.red); return }
    showToast(`✕ ${bot.name} a refusé → cooldown 48h`, C.gold)
  }
  const findVerrou = async (botId:string) => {
    const { data:cl } = await supabase.from('clutches')
      .select('id,venue_lat,venue_lng,sender_id,receiver_id,sender_cur_lat,sender_cur_lng,receiver_cur_lat,receiver_cur_lng')
      .or(`sender_id.eq.${botId},receiver_id.eq.${botId}`).in('status',['accepted','confirmed','checked_in'])
      .order('created_at',{ascending:false}).limit(1)
    return cl?.[0] || null
  }
  const approach = async (bot:any) => {
    setBusy(bot.id)
    const c = await findVerrou(bot.id)
    if (!c || !c.venue_lat) { setBusy(null); showToast(`Pas de Verrou actif (avec lieu) pour ${bot.name}`,C.gold); return }
    const isSnd = c.sender_id===bot.id
    const curLat = (isSnd?c.sender_cur_lat:c.receiver_cur_lat) ?? bot.center_lat ?? (c.venue_lat+0.02)
    const curLng = (isSnd?c.sender_cur_lng:c.receiver_cur_lng) ?? (c.venue_lng+0.02)
    const nLat = curLat + (c.venue_lat-curLat)*0.6, nLng = curLng + (c.venue_lng-curLng)*0.6
    const patch = isSnd ? {sender_cur_lat:nLat,sender_cur_lng:nLng} : {receiver_cur_lat:nLat,receiver_cur_lng:nLng}
    const { data } = await supabase.from('clutches').update(patch).eq('id',c.id).select('id')
    setBusy(null); if(!data?.length){showToast('❌ Échec',C.red);return}
    showToast(`${bot.name} se rapproche… 📡`,C.green)
  }
  const arrive = async (bot:any) => {
    setBusy(bot.id)
    const c = await findVerrou(bot.id)
    if (!c) { setBusy(null); showToast(`Pas de Verrou actif pour ${bot.name}`,C.gold); return }
    const isSnd = c.sender_id===bot.id
    const patch = isSnd ? {sender_arrived:true, sender_cur_lat:c.venue_lat, sender_cur_lng:c.venue_lng}
                        : {receiver_arrived:true, receiver_cur_lat:c.venue_lat, receiver_cur_lng:c.venue_lng}
    const { data } = await supabase.from('clutches').update(patch).eq('id',c.id).select('id')
    setBusy(null); if(!data?.length){showToast('❌ Échec',C.red);return}
    showToast(`✓ ${bot.name} est au RDV ✅`,C.green)
  }
  const rdvNow = async (bot:any) => {
    setBusy(bot.id)
    const c = await findVerrou(bot.id)
    if (!c) { setBusy(null); showToast(`Pas de Verrou actif pour ${bot.name}`,C.gold); return }
    const patch:any = { proposed_time: new Date(Date.now()-60*1000).toISOString() }
    if (c.venue_lat==null) { patch.venue_lat = myLat; patch.venue_lng = myLng }
    const { data } = await supabase.from('clutches').update(patch).eq('id',c.id).select('id')
    setBusy(null); if(!data?.length){showToast('❌ Échec',C.red);return}
    showToast(`✓ RDV de ${bot.name} → maintenant, le radar s'affiche 📡`,C.green)
  }
  const meClutch = async (bot:any) => {
    if (!uid) { showToast('Connecte-toi pour recevoir un clutch', C.gold); return }
    setBusy(bot.id)
    const { error } = await supabase.from('clutches').insert({
      sender_id: bot.id, receiver_id: uid,
      venue: 'Café du Marché · Place de la Palud, Lausanne', venue_lat: 46.5210, venue_lng: 6.6340,
      proposed_time: new Date(Date.now()+30*60*1000).toISOString(),
      expires_at: new Date(Date.now()+2*3600*1000).toISOString(),
      status: 'pending', message: `Un café ? — ${bot.name}`,
    })
    setBusy(null)
    if (error) { showToast('❌ Échec — policy clutches_bot_admin ?', C.red); return }
    showToast(`✓ ${bot.name} t'a envoyé un Clutch — va dans l'app 📨`, C.green)
  }
  const createBotEvent = async (bot:any) => {
    setBusy(bot.id)
    const { error } = await supabase.from('events').insert({
      title: `${bot.name} — Apéro découverte`, emoji:'🍷', lieu:'Café du Marché, Lausanne',
      event_time:'19:00', event_date:'Ce soir', spots:6, taken:0,
      description:'Événement de test créé par un bot.', tags:['groupe'], ev_gender:'X',
      type:'user', status:'pending', active:true, created_by: bot.id, creator: bot.name,
    })
    setBusy(null)
    if (error) { showToast('❌ Applique le SQL events_bot_admin', C.red); return }
    showToast(`✓ ${bot.name} a créé un event 🎟️`, C.green)
  }
  const toggleDriver = (bot:any) => {
    const isDriver = bot.account_type === 'driver'
    patchBot(bot, { account_type: isDriver ? 'H' : 'driver' }, `${bot.name} : ${isDriver?'Membre normal':'Clutch Driver 🚗 (masqué des Présences)'}`)
  }
  const deactivateAll = async () => {
    setBusy('all')
    await supabase.from('profiles').update({ is_available:false }).eq('is_bot', true)
    setBusy(null); showToast('Tous les bots désactivés', C.gold); load()
  }
  const clearBotInteractions = async () => {
    setBusy('all')
    const { data: botRows } = await supabase.from('profiles').select('id').eq('is_bot', true)
    const botIds = (botRows||[]).map((b:any)=>b.id)
    if (botIds.length) {
      const ACT = ['pending','accepted','confirmed','checked_in']
      await supabase.from('clutches').update({status:'cancelled'}).in('sender_id', botIds).in('status', ACT)
      await supabase.from('clutches').update({status:'cancelled'}).in('receiver_id', botIds).in('status', ACT)
      if (uid) await supabase.from('rdv_feedbacks').update({outcome:'on_time'}).eq('from_id', uid).in('to_id', botIds).eq('outcome','absent')
      await supabase.from('profiles').update({ account_type:'H' }).in('id', botIds).eq('account_type','driver')
      await supabase.from('profiles').update({ rdv_locked_until:null, rdv_locked_from:null }).in('id', botIds)
    }
    setBusy(null); showToast('✓ Reset complet — bots débloqués', C.green); load()
  }

  // ── UI helpers ───────────────────────────────────────────────────────────────
  const Btn = ({onClick,children,bg=C.bgCard,col=C.white}:any)=>(
    <button onClick={onClick} disabled={!!busy} style={{padding:'8px 11px',borderRadius:9,border:`1px solid ${C.border}`,background:bg,color:col,fontSize:12,fontWeight:700,cursor:busy?'default':'pointer',fontFamily:'inherit',opacity:busy?0.6:1}}>{children}</button>
  )
  const inp:React.CSSProperties = {width:'100%',boxSizing:'border-box',padding:'12px 14px',marginBottom:10,borderRadius:10,border:`1px solid ${C.border}`,background:C.bgInput,color:C.white,fontSize:14,outline:'none',fontFamily:'inherit'}
  const wrap:React.CSSProperties = { minHeight:'100vh', background:C.bg, color:C.white, fontFamily:'system-ui,-apple-system,sans-serif' }

  if (checking) return <div style={{...wrap,display:'flex',alignItems:'center',justifyContent:'center'}}>Chargement…</div>

  const onlineCount = bots.filter(b=>b.is_available).length

  return (
    <div style={wrap}>
      {toast && <div style={{position:'fixed',top:16,left:'50%',transform:'translateX(-50%)',zIndex:50,background:'#1a0810',border:`1px solid ${toast.color}`,color:toast.color,padding:'10px 18px',borderRadius:30,fontSize:13,fontWeight:700,maxWidth:'90vw',textAlign:'center',boxShadow:'0 8px 30px rgba(0,0,0,.4)'}}>{toast.msg}</div>}

      {/* Header */}
      <div style={{position:'sticky',top:0,zIndex:10,background:'rgba(42,16,32,0.95)',backdropFilter:'blur(10px)',borderBottom:`1px solid ${C.border}`,padding:'16px 20px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontSize:18,fontWeight:900}}>🤖 Clutch Lab</div>
          <div style={{fontSize:11,color:C.whiteMid}}>{bots.length} bots · {onlineCount} en ligne · {uid?'connecté ✓':'non connecté'}</div>
        </div>
        {uid
          ? <button onClick={logout} style={{background:'none',border:`1px solid ${C.border}`,borderRadius:10,color:C.whiteMid,fontSize:12,padding:'7px 12px',cursor:'pointer',fontFamily:'inherit'}}>Déconnexion</button>
          : <button onClick={()=>setShowLogin(s=>!s)} style={{background:'none',border:`1px solid ${C.border}`,borderRadius:10,color:C.salmon,fontSize:12,padding:'7px 12px',cursor:'pointer',fontFamily:'inherit'}}>Se connecter</button>}
      </div>

      <div style={{maxWidth:680,margin:'0 auto',padding:'16px 20px 60px'}}>
        {/* Login repli (optionnel, seulement si pas de session et demandé) */}
        {!uid && showLogin && (
          <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:14,padding:16,marginBottom:16}}>
            <div style={{fontSize:12,color:C.whiteMid,marginBottom:10}}>Connecte-toi avec ton compte de test (admin) pour piloter les bots.</div>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" autoComplete="email" style={inp}/>
            <input value={pwd} onChange={e=>setPwd(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')doLogin()}} placeholder="Mot de passe" type="password" autoComplete="current-password" style={inp}/>
            {loginErr && <div style={{fontSize:12,color:C.red,marginBottom:10}}>{loginErr}</div>}
            <button onClick={doLogin} disabled={loggingIn} style={{width:'100%',padding:'12px',borderRadius:12,border:'none',background:C.gold,color:'#1a0810',fontSize:15,fontWeight:900,cursor:'pointer',fontFamily:'inherit',opacity:loggingIn?0.6:1}}>{loggingIn?'…':'Se connecter'}</button>
          </div>
        )}

        <div style={{fontSize:12,color:C.whiteMid,lineHeight:1.6,marginBottom:16,background:C.bgCard,borderRadius:12,padding:'12px 14px',border:`1px solid ${C.border}`}}>
          ① <b>Active</b> un bot → il apparaît dans tes Présences (app). ② <b>Clutche-le</b> depuis l'app. ③ Reviens ici → <b>Accepter</b> (→ Verrou). ④ <b>Rapprocher</b> ×3-4 (regarde le radar) puis <b>Au RDV</b>. ⑤ Toi : J'y suis → Terminer.
        </div>

        <div style={{display:'flex',gap:8,marginBottom:18,flexWrap:'wrap'}}>
          <Btn onClick={deactivateAll} bg="rgba(220,106,106,.12)" col={C.red}>🔄 Désactiver tous</Btn>
          <Btn onClick={clearBotInteractions} bg={C.salmonFaint} col={C.salmon}>🧹 Reset complet (débloque)</Btn>
        </div>

        {loading && <div style={{color:C.whiteMid,textAlign:'center',padding:30}}>Chargement des bots…</div>}
        {!loading && bots.length===0 && <div style={{color:C.whiteMid,textAlign:'center',padding:30}}>Aucun bot (connecte-toi / migration appliquée ?)</div>}

        {bots.map(bot=>{
          const open = expanded===bot.id
          const TL = bot.account_type==='Rh'?'Rhodium':bot.account_type==='Au'?'Or':bot.account_type==='At'?'Astate':bot.account_type==='driver'?'Clutch Driver':'Hydrogène'
          const isH = !['Au','Rh','At','driver'].includes(bot.account_type)
          const seek = bot.looking_for
          return (
          <div key={bot.id} style={{background:C.bgCard,border:`1px solid ${bot.is_available?C.green:C.border}`,borderRadius:14,marginBottom:10,overflow:'hidden'}}>
            <button onClick={()=>setExpanded(open?null:bot.id)}
              style={{width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,padding:'14px',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',textAlign:'left'}}>
              <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                <span style={{width:10,height:10,borderRadius:'50%',background:bot.is_available?C.green:'rgba(255,255,255,.15)',display:'inline-block'}}/>
                <span style={{fontSize:15,fontWeight:800,color:C.white}}>{bot.name}</span>
                <span style={{fontSize:12,color:C.whiteMid}}>{bot.gender==='woman'?'♀':bot.gender==='man'?'♂':''} · {bot.age||'?'}a · {TL}</span>
                {bot.account_type==='driver' && <span style={{fontSize:9,fontWeight:900,padding:'1px 6px',borderRadius:10,background:'#FF5FA222',color:'#FF5FA2',border:'1px solid #FF5FA244'}}>✦ CD</span>}
              </div>
              <span style={{color:C.whiteMid,fontSize:14,transform:open?'rotate(180deg)':'none',transition:'transform .2s'}}>▾</span>
            </button>

            {open && <div style={{padding:'0 14px 14px'}}>
              <button onClick={()=>bot.is_available?deactivate(bot):activate(bot,'me')} disabled={!!busy}
                style={{fontSize:11,fontWeight:800,padding:'6px 12px',borderRadius:20,cursor:'pointer',fontFamily:'inherit',marginBottom:12,
                  border:`1px solid ${bot.is_available?C.green:C.border}`,background:bot.is_available?'rgba(45,189,126,.15)':'transparent',color:bot.is_available?C.green:C.whiteMid}}>
                {bot.is_available?'🟢 EN LIGNE — cliquer pour éteindre':'⚪ hors ligne — cliquer = Sur moi'}
              </button>

              <div style={{fontSize:9,color:C.whiteMid,letterSpacing:'.06em',marginBottom:6}}>ACTIVER À :</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8,alignItems:'center'}}>
                <Btn onClick={()=>activate(bot,'me')} bg={C.salmonFaint} col={C.salmon}>📍 Sur moi</Btn>
                <Btn onClick={()=>activate(bot,'near')} bg={C.salmonFaint} col={C.salmon}>🚶 Proche 500m</Btn>
                <Btn onClick={()=>activate(bot,'morges')} bg={C.salmonFaint} col={C.salmon}>🚗 Morges</Btn>
                <span style={{fontSize:11,color:C.whiteMid}}>rayon</span>
                <input type="number" value={radius[bot.id]??10} onChange={e=>setRadius(r=>({...r,[bot.id]:Number(e.target.value)}))}
                  style={{width:52,padding:'7px',borderRadius:8,border:`1px solid ${C.border}`,background:C.bgInput,color:C.white,fontSize:12,fontFamily:'inherit'}}/>
                <span style={{fontSize:11,color:C.whiteMid}}>km</span>
              </div>

              <div style={{display:'flex',gap:6,marginBottom:8}}>
                <input value={addr[bot.id]||''} onChange={e=>setAddr(a=>({...a,[bot.id]:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter')searchAddr(bot.id)}}
                  placeholder="Adresse (ex: Gare de Nyon)…"
                  style={{flex:1,padding:'9px 11px',borderRadius:8,border:`1px solid ${C.border}`,background:C.bgInput,color:C.white,fontSize:12,fontFamily:'inherit',outline:'none'}}/>
                <Btn onClick={()=>searchAddr(bot.id)} bg={C.salmonFaint} col={C.salmon}>🔍</Btn>
              </div>
              {(addrRes[bot.id]||[]).length>0 && (
                <div style={{marginBottom:10,background:C.bg,borderRadius:8,border:`1px solid ${C.border}`,overflow:'hidden'}}>
                  {(addrRes[bot.id]||[]).map((r:any,ri:number)=>(
                    <div key={ri} onClick={()=>activateAt(bot, parseFloat(r.lat), parseFloat(r.lon), (r.display_name||'').split(',').slice(0,2).join(','))}
                      style={{padding:'9px 11px',fontSize:12,color:C.white,cursor:'pointer',borderBottom:ri<(addrRes[bot.id]||[]).length-1?`1px solid ${C.border}`:'none'}}>
                      📍 {(r.display_name||'').split(',').slice(0,3).join(',')}
                    </div>
                  ))}
                </div>
              )}

              {/* Créneau horaire */}
              <div style={{fontSize:9,color:C.whiteMid,letterSpacing:'.06em',marginBottom:6}}>CRÉNEAU (vide = maintenant → +6h) :</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10,alignItems:'center'}}>
                <input type="time" value={slotFrom[bot.id]||''} onChange={e=>setSlotFrom(s=>({...s,[bot.id]:e.target.value}))} style={{padding:'7px',borderRadius:8,border:`1px solid ${C.border}`,background:C.bgInput,color:C.white,fontSize:12,fontFamily:'inherit'}}/>
                <span style={{fontSize:12,color:C.whiteMid}}>→</span>
                <input type="time" value={slotUntil[bot.id]||''} onChange={e=>setSlotUntil(s=>({...s,[bot.id]:e.target.value}))} style={{padding:'7px',borderRadius:8,border:`1px solid ${C.border}`,background:C.bgInput,color:C.white,fontSize:12,fontFamily:'inherit'}}/>
                <Btn onClick={()=>activateAt(bot, bot.center_lat??myLat, bot.center_lng??myLng, 'créneau')} bg={C.salmonFaint} col={C.salmon}>⏱ Appliquer</Btn>
              </div>

              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
                <Btn onClick={()=>patchBot(bot,{age:(bot.age||25)+1},`${bot.name} : ${(bot.age||25)+1} ans`)}>âge +1</Btn>
                <Btn onClick={()=>patchBot(bot,{age:Math.max(18,(bot.age||25)-1)},`${bot.name} : ${Math.max(18,(bot.age||25)-1)} ans`)}>âge −1</Btn>
              </div>

              <div style={{fontSize:9,color:C.whiteMid,letterSpacing:'.06em',marginBottom:6}}>TYPE DE COMPTE :</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
                {[['H','Hydrogène'],['Au','Or'],['Rh','Rhodium'],['At','Astate']].map(([v,lab])=>{
                  const sel = bot.account_type===v || (v==='H'&&isH)
                  return <Btn key={v} onClick={()=>patchBot(bot,{account_type:v},`${bot.name} : ${lab}`)} bg={sel?C.gold:C.bgCard} col={sel?'#1a0810':C.white}>{lab}</Btn>
                })}
              </div>

              {/* Genre recherché */}
              <div style={{fontSize:9,color:C.whiteMid,letterSpacing:'.06em',marginBottom:6}}>CHERCHE (genre) :</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
                {[['F','♀ Femmes'],['M','♂ Hommes'],['ALL','Tout le monde']].map(([v,lab])=>{
                  const sel = (seek||'ALL')===v || (v==='ALL'&&!['M','F'].includes(seek))
                  return <Btn key={v} onClick={()=>patchBot(bot,{looking_for:v},`${bot.name} cherche : ${lab}`)} bg={sel?C.gold:C.bgCard} col={sel?'#1a0810':C.white}>{lab}</Btn>
                })}
              </div>

              <div style={{fontSize:9,color:C.whiteMid,letterSpacing:'.06em',marginBottom:6}}>SCÉNARIOS :</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
                <Btn onClick={()=>meClutch(bot)} bg={C.salmonFaint} col={C.salmon}>📨 Me clutcher</Btn>
                <Btn onClick={()=>createBotEvent(bot)} bg={C.salmonFaint} col={C.salmon}>🎟️ Créer un event</Btn>
                <Btn onClick={()=>toggleDriver(bot)} bg={bot.account_type==='driver'?C.gold:C.bgCard} col={bot.account_type==='driver'?'#1a0810':C.white}>🚗 {bot.account_type==='driver'?'Driver ✓':'Clutch Driver'}</Btn>
              </div>

              <div style={{fontSize:9,color:C.whiteMid,letterSpacing:'.06em',marginBottom:6}}>FLOW RDV (après l'avoir clutché) :</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                <Btn onClick={()=>acceptClutch(bot)} bg="rgba(45,189,126,.15)" col={C.green}>✓ Accepter</Btn>
                <Btn onClick={()=>refuseClutch(bot)} bg="rgba(220,106,106,.12)" col={C.red}>✕ Refuser (48h)</Btn>
                <Btn onClick={()=>rdvNow(bot)} bg={C.salmonFaint} col={C.salmon}>🕐 RDV maintenant</Btn>
                <Btn onClick={()=>approach(bot)}>📡 Rapprocher</Btn>
                <Btn onClick={()=>arrive(bot)} bg="rgba(45,189,126,.15)" col={C.green}>📍 Au RDV</Btn>
              </div>
            </div>}
          </div>
        )})}
      </div>
    </div>
  )
}
