'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'

const C = {
  bg:'#FDFAF7', bgDeep:'#F5F0EA',
  primary:'#C4748A', primaryDark:'#A85C72', primaryLight:'#F2D4DB',
  sage:'#7A9E8A', sageLight:'#D4E8DE',
  peach:'#E8A87C', peachLight:'#FAEBD7',
  gold:'#C9A96E', purple:'#8B7CB8', purpleLight:'#EAE6F8',
  text:'#2C1810', textMid:'#6B4C3B', textLight:'#A08878',
  card:'#FFFFFF', border:'#EDE8E3', shadow:'rgba(44,24,16,0.08)',
  red:'#D64545', redLight:'#FDEAEA',
}

type Screen =
  | 'splash' | 'login' | 'register' | 'forgot-password'
  | 'ob-name' | 'ob-gender' | 'ob-age' | 'ob-photo' | 'ob-interests' | 'ob-done'
  | 'discover' | 'events' | 'inbox' | 'myprofile'
  | 'profile-detail'
  | 'propose' | 'propose2' | 'propose3' | 'sent'
  | 'clutch-received' | 'chat' | 'rdv' | 'rdv-active' | 'sos'
  | 'create-event' | 'my-events'
  | 'feedback' | 'get-certified'

const BANNED_WORDS = ['salope','pute','fdp','enculé','nique','bite','chier','merde ta gueule','ta gueule']

const INTERESTS_CATS = [
  { label:'Sport', icon:'🏃', items:['Randonnée','Yoga','Tennis','Natation','Cyclisme','Course','Escalade','Ski','Fitness'] },
  { label:'Culture', icon:'🎨', items:['Cinéma','Musique','Lecture','Théâtre','Musées','Photo','Danse','Podcasts'] },
  { label:'Cuisine', icon:'☕', items:['Cafés','Brunch','Cuisine','Vins','Boulangeries','Cocktails','Pâtisserie'] },
  { label:'Loisirs', icon:'🎲', items:['Voyages','Jeux de société','Concerts','Stand-up','Gaming','Nature'] },
]

const VENUES = [
  { name:'Café du Grütli', safety:'safe', emoji:'☕' },
  { name:'Brasserie de Montbenon', safety:'safe', emoji:'🍺' },
  { name:'Blackbird Coffee', safety:'safe', emoji:'☕' },
  { name:'Quai d\'Ouchy', safety:'safe', emoji:'🌊' },
  { name:'Place de la Palud', safety:'safe', emoji:'⛲' },
  { name:'Café de l\'Évêché', safety:'safe', emoji:'🎵' },
  { name:'Jardin de Valency', safety:'neutral', emoji:'🌳' },
  { name:'Parc Mon-Repos', safety:'neutral', emoji:'🌿' },
]

// ─── SHARE HELPERS ────────────────────────────────────────────────────────────
const APP_URL = 'https://clutch-mel.netlify.app'

function shareIt({ title, text, url }: { title:string; text:string; url:string }) {
  if (typeof navigator !== 'undefined' && navigator.share) {
    navigator.share({ title, text, url }).catch(()=>{})
  } else {
    // Fallback: ouvre WhatsApp
    const msg = encodeURIComponent(`${text}\n${url}`)
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }
}

function ShareSheet({ options, onClose }: { options:{icon:string;label:string;onTap:()=>void}[]; onClose:()=>void }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:999, display:'flex', alignItems:'flex-end', justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:'24px 24px 0 0', padding:'20px 20px 36px', width:'100%', maxWidth:390 }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36, height:4, borderRadius:2, background:'#ddd', margin:'0 auto 20px' }}/>
        <p style={{ fontWeight:800, color:'#2C1810', fontSize:16, marginBottom:16, textAlign:'center' }}>Partager</p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          {options.map(o=>(
            <button key={o.label} onClick={()=>{o.onTap();onClose()}} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', padding:'8px 12px' }}>
              <div style={{ width:52, height:52, borderRadius:16, background:'#F5F0EA', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>{o.icon}</div>
              <span style={{ fontSize:11, color:'#6B4C3B', fontWeight:600 }}>{o.label}</span>
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{ width:'100%', marginTop:20, padding:12, borderRadius:12, background:'#F5F0EA', border:'none', color:'#A08878', fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>Annuler</button>
      </div>
    </div>
  )
}

// Génère des créneaux exacts à partir de l'heure actuelle
function getTimeSlots() {
  const now = new Date()
  const slots: { label: string; time: Date }[] = []
  const intervals = [30, 60, 90, 120, 150, 180, 240, 300, 360]
  intervals.forEach(mins => {
    const t = new Date(now.getTime() + mins * 60000)
    const h = t.getHours(), m = t.getMinutes()
    const mStr = m === 0 ? '00' : String(m).padStart(2,'0')
    const diff = mins < 60 ? `${mins} min` : `${mins/60}h`
    slots.push({ label: `${h}h${mStr} (dans ${diff})`, time: t })
  })
  return slots
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function Avatar({ p, size=48 }: { p: Partial<Profile>; size?: number }) {
  const init = (p.name || '?').slice(0,2).toUpperCase()
  return p.photo_url
    ? <img src={p.photo_url} alt="" style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', border:`2px solid ${C.border}`, flexShrink:0 }} />
    : <div style={{ width:size, height:size, borderRadius:'50%', background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <span style={{ color:'#fff', fontSize:size*0.32, fontWeight:700 }}>{init}</span>
      </div>
}

function Btn({ children, onClick, variant='primary', disabled=false, loading=false }: any) {
  const s: Record<string,any> = {
    primary: { background:disabled?C.bgDeep:`linear-gradient(135deg,${C.primary},${C.primaryDark})`, color:disabled?C.textLight:'#fff' },
    secondary: { background:C.bgDeep, color:C.text, border:`1.5px solid ${C.border}` },
    ghost: { background:'transparent', color:C.primary, border:`1.5px solid ${C.primaryLight}` },
    sage: { background:`linear-gradient(135deg,${C.sage},#5A8A6A)`, color:'#fff' },
    danger: { background:C.redLight, color:C.red, border:`1.5px solid ${C.red}33` },
  }
  return (
    <button onClick={disabled||loading?undefined:onClick} style={{ ...(s[variant]||s.primary), borderRadius:14, padding:'13px 20px', fontSize:15, fontWeight:700, cursor:disabled||loading?'not-allowed':'pointer', border:'none', width:'100%', fontFamily:'inherit', letterSpacing:'-0.01em', opacity:loading?.7:1 }}>
      {loading?'…':children}
    </button>
  )
}

function Input({ label, type='text', value, onChange, placeholder, error, autoFocus }: any) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {label&&<label style={{ color:C.textLight, fontSize:12, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>{label}</label>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} autoFocus={autoFocus}
        style={{ background:C.bgDeep, border:`1.5px solid ${value?C.primary:C.border}`, borderRadius:13, padding:'14px 16px', color:C.text, fontSize:15, outline:'none', fontFamily:'inherit', transition:'border 0.2s' }} />
      {error&&<span style={{ color:C.red, fontSize:12 }}>{error}</span>}
    </div>
  )
}

function ProgressBar({ step, total }: { step:number; total:number }) {
  return (
    <div style={{ display:'flex', gap:6, marginBottom:8 }}>
      {Array.from({length:total}).map((_,i) => <div key={i} style={{ flex:1, height:3, borderRadius:2, background:i<step?C.primary:C.border }} />)}
    </div>
  )
}

function TabBar({ tab, setTab, badge=0 }: { tab:string; setTab:(t:string)=>void; badge?:number }) {
  return (
    <div style={{ display:'flex', borderTop:`1px solid ${C.border}`, background:C.bg, flexShrink:0 }}>
      {[{id:'discover',icon:'✦',label:'Discover'},{id:'events',icon:'🗓',label:'Événements'},{id:'inbox',icon:'💬',label:'Messages',b:badge},{id:'myprofile',icon:'◉',label:'Profil'}].map(t=>(
        <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1, background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'10px 4px 14px', position:'relative' }}>
          <span style={{ fontSize:20, lineHeight:1, color:tab===t.id?C.primary:C.textLight }}>{t.icon}</span>
          <span style={{ fontSize:10, fontWeight:tab===t.id?700:500, color:tab===t.id?C.primary:C.textLight }}>{t.label}</span>
          {(t as any).b>0&&<div style={{ position:'absolute', top:6, right:'14%', width:16, height:16, borderRadius:'50%', background:C.primary, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#fff', fontWeight:700 }}>{(t as any).b}</div>}
        </button>
      ))}
    </div>
  )
}

function TopBar({ title, onBack, right }: any) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px 8px', background:C.bg, flexShrink:0, borderBottom:`1px solid ${C.border}` }}>
      <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', fontSize:22, color:C.textMid, padding:'0 8px 0 0', minWidth:40 }}>{onBack?'←':' '}</button>
      <span style={{ fontWeight:700, fontSize:16, color:C.text }}>{title}</span>
      <div style={{ minWidth:40, display:'flex', justifyContent:'flex-end' }}>{right}</div>
    </div>
  )
}

function SafetyBadge({ safety }: { safety:string }) {
  const m: Record<string,{icon:string;label:string;bg:string;color:string}> = {
    safe:{icon:'🟢',label:'Lieu sûr',bg:C.sageLight,color:C.sage},
    neutral:{icon:'🟡',label:'Lieu neutre',bg:'#FFF8DC',color:'#B8860B'},
    alert:{icon:'🔴',label:'Prudence',bg:C.redLight,color:C.red},
  }
  const s = m[safety]||m.safe
  return <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:s.bg, color:s.color, fontWeight:600 }}>{s.icon} {s.label}</span>
}

// ─── AUTH SCREENS ──────────────────────────────────────────────────────────────
function Splash({ go }: { go:(s:Screen)=>void }) {
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:`linear-gradient(160deg,#FDF6F0,${C.primaryLight})`, padding:'0 32px', gap:28 }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:58, fontWeight:900, letterSpacing:'-0.05em', color:C.text, lineHeight:.9 }}>CLU<span style={{ color:C.primary }}>TCH</span></div>
        <div style={{ color:C.primary, fontSize:11, letterSpacing:'0.3em', textTransform:'uppercase', marginTop:10, fontWeight:600 }}>be spontaneous · bêta lausanne</div>
        <div style={{ color:C.textMid, fontSize:14, lineHeight:1.7, marginTop:16 }}>Un vrai café dans les 18h.<br/>Réponds en 2h ou c'est libéré.</div>
      </div>
      <div style={{ width:80, height:80, borderRadius:'50%', background:`linear-gradient(135deg,${C.primary},${C.peach})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:36 }}>☕</div>
      <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:12 }}>
        <Btn onClick={()=>go('register')}>Créer mon compte →</Btn>
        <Btn variant="secondary" onClick={()=>go('login')}>J'ai déjà un compte</Btn>
      </div>
      <div style={{ textAlign:'center' }}>
        <p style={{ fontSize:12, color:C.textLight, marginBottom:8 }}>Sécurité & contrôle inclus pour tous 🛡</p>
        <a href="/demo" style={{ fontSize:12, color:C.primary, fontWeight:600, textDecoration:'none' }}>→ Voir la démo interactive d'abord</a>
      </div>
    </div>
  )
}

function Login({ go, setUser }: any) {
  const [email,setEmail]=useState(''); const [pass,setPass]=useState(''); const [loading,setLoading]=useState(false); const [err,setErr]=useState('')
  const login=async()=>{
    setLoading(true);setErr('')
    const {data,error}=await supabase.auth.signInWithPassword({email,password:pass})
    if(error){setErr('Email ou mot de passe incorrect');setLoading(false);return}
    if(data.user){
      const {data:p}=await supabase.from('profiles').select('*').eq('id',data.user.id).single()
      setUser(p||{id:data.user.id,email})
      if(p?.name&&p.name!=='Utilisateur'&&p.gender&&p.age){go('discover')}
      else{go('ob-name')}
    }
    setLoading(false)
  }
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'32px 24px', gap:24, background:C.bg }}>
      <button onClick={()=>go('splash')} style={{ background:'none', border:'none', color:C.textMid, fontSize:22, cursor:'pointer', alignSelf:'flex-start' }}>←</button>
      <div><h2 style={{ color:C.text, fontSize:26, fontWeight:800 }}>Bon retour 👋</h2><p style={{ color:C.textMid, fontSize:14, marginTop:6 }}>Connecte-toi pour voir qui est dispo.</p></div>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <Input label="Email" type="email" value={email} onChange={(e:any)=>setEmail(e.target.value)} placeholder="ton@email.com" autoFocus />
        <Input label="Mot de passe" type="password" value={pass} onChange={(e:any)=>setPass(e.target.value)} placeholder="••••••••" error={err} />
      </div>
      <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:12 }}>
        <Btn onClick={login} loading={loading} disabled={!email||!pass}>Se connecter →</Btn>
        <button onClick={()=>go('forgot-password')} style={{ background:'none', border:'none', color:C.primary, fontSize:13, cursor:'pointer', fontWeight:600 }}>Mot de passe oublié ?</button>
        <button onClick={()=>go('register')} style={{ background:'none', border:'none', color:C.textMid, fontSize:13, cursor:'pointer' }}>Pas de compte ? <span style={{ color:C.primary, fontWeight:700 }}>Créer un compte</span></button>
      </div>
    </div>
  )
}

function ForgotPassword({ go }: any) {
  const [email,setEmail]=useState(''); const [loading,setLoading]=useState(false); const [done,setDone]=useState(false); const [err,setErr]=useState('')
  const send=async()=>{
    if(!email.trim())return
    setLoading(true);setErr('')
    const {error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:window.location.origin+'/app'})
    if(error){setErr('Email non trouvé ou erreur. Vérifie l\'adresse.');setLoading(false);return}
    setDone(true);setLoading(false)
  }
  if(done) return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:C.bg, padding:40, gap:20, textAlign:'center' }}>
      <div style={{ fontSize:60 }}>📧</div>
      <h2 style={{ fontSize:22, fontWeight:800, color:C.text }}>Email envoyé !</h2>
      <p style={{ color:C.textMid, lineHeight:1.7, fontSize:14 }}>Vérifie ta boîte mail à <strong>{email}</strong>.<br/>Clique sur le lien pour choisir un nouveau mot de passe.</p>
      <div style={{ background:C.bgDeep, borderRadius:12, padding:'12px 16px', width:'100%' }}>
        <p style={{ fontSize:12, color:C.textLight }}>Pas reçu ? Vérifie tes spams ou réessaie dans 2 minutes.</p>
      </div>
      <Btn variant="secondary" onClick={()=>go('login')}>← Retour à la connexion</Btn>
    </div>
  )
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'32px 24px', gap:24, background:C.bg }}>
      <button onClick={()=>go('login')} style={{ background:'none', border:'none', color:C.textMid, fontSize:22, cursor:'pointer', alignSelf:'flex-start' }}>←</button>
      <div>
        <h2 style={{ color:C.text, fontSize:26, fontWeight:800 }}>Mot de passe oublié ?</h2>
        <p style={{ color:C.textMid, fontSize:14, marginTop:6 }}>On t'envoie un lien pour en choisir un nouveau.</p>
      </div>
      <Input label="Ton email" type="email" value={email} onChange={(e:any)=>setEmail(e.target.value)} placeholder="ton@email.com" autoFocus error={err}/>
      <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:12 }}>
        <Btn onClick={send} loading={loading} disabled={!email.trim()}>Envoyer le lien →</Btn>
        <button onClick={()=>go('login')} style={{ background:'none', border:'none', color:C.textMid, fontSize:13, cursor:'pointer' }}>← Annuler</button>
      </div>
    </div>
  )
}

function Register({ go, setUser }: any) {
  const [email,setEmail]=useState(''); const [pass,setPass]=useState(''); const [loading,setLoading]=useState(false); const [err,setErr]=useState(''); const [cgu,setCgu]=useState(false)
  const reg=async()=>{
    if(!cgu){setErr('Accepte les CGU pour continuer');return}
    if(pass.length<6){setErr('Minimum 6 caractères');return}
    setLoading(true);setErr('')
    const {data,error}=await supabase.auth.signUp({email,password:pass})
    if(error){setErr(error.message);setLoading(false);return}
    if(data.user){setUser({id:data.user.id,email});go('ob-name')}
    setLoading(false)
  }
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'32px 24px', gap:20, background:C.bg, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y' }}>
      <button onClick={()=>go('splash')} style={{ background:'none', border:'none', color:C.textMid, fontSize:22, cursor:'pointer', alignSelf:'flex-start', flexShrink:0 }}>←</button>
      <div><h2 style={{ color:C.text, fontSize:26, fontWeight:800 }}>Rejoins Clutch ✦</h2><p style={{ color:C.textMid, fontSize:14, marginTop:6 }}>2 min pour créer ton profil.</p></div>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <Input label="Email" type="email" value={email} onChange={(e:any)=>setEmail(e.target.value)} placeholder="ton@email.com" autoFocus />
        <Input label="Mot de passe" type="password" value={pass} onChange={(e:any)=>setPass(e.target.value)} placeholder="6 caractères minimum" error={err} />
      </div>
      <div style={{ background:C.sageLight, border:`1px solid ${C.sage}44`, borderRadius:12, padding:'10px 14px' }}>
        <span style={{ color:C.sage, fontSize:13, fontWeight:600 }}>🛡 Clutch est gratuit pour commencer. Ton contrôle, tes règles.</span>
      </div>
      {/* CGU */}
      <button onClick={()=>setCgu(v=>!v)} style={{ display:'flex', gap:10, alignItems:'flex-start', background:'none', border:'none', cursor:'pointer', padding:0, textAlign:'left' }}>
        <div style={{ width:20, height:20, borderRadius:5, border:`2px solid ${cgu?C.primary:C.border}`, background:cgu?C.primary:'transparent', flexShrink:0, marginTop:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {cgu&&<span style={{ color:'#fff', fontSize:12, fontWeight:700 }}>✓</span>}
        </div>
        <span style={{ fontSize:12, color:C.textMid, lineHeight:1.5 }}>
          J'accepte les <a href="/legal" target="_blank" onClick={e=>e.stopPropagation()} style={{ color:C.primary, fontWeight:600 }}>Conditions d'utilisation</a> et la <a href="/legal" target="_blank" onClick={e=>e.stopPropagation()} style={{ color:C.primary, fontWeight:600 }}>Politique de confidentialité</a>. J'ai 18 ans ou plus.
        </span>
      </button>
      <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:12 }}>
        <Btn onClick={reg} loading={loading} disabled={!email||!pass||!cgu}>Créer mon compte →</Btn>
        <button onClick={()=>go('login')} style={{ background:'none', border:'none', color:C.textMid, fontSize:13, cursor:'pointer' }}>Déjà un compte ? <span style={{ color:C.primary, fontWeight:700 }}>Se connecter</span></button>
      </div>
    </div>
  )
}

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
function ObName({ go, user, save }: any) {
  const locked = !!(user?.name && user.name !== 'Utilisateur')
  const [val,setVal]=useState(user?.name||''); const [loading,setLoading]=useState(false)
  const next=async()=>{
    if(locked){go('ob-gender');return}
    if(!val.trim())return
    setLoading(true)
    await supabase.from('profiles').upsert({id:user.id,name:val.trim()})
    save({name:val.trim()})
    go('ob-gender')
    setLoading(false)
  }
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'40px 24px 32px', gap:24, background:C.bg }}>
      <ProgressBar step={1} total={5}/>
      <div>
        <p style={{ color:C.primary, fontSize:12, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>1 / 5</p>
        <h2 style={{ color:C.text, fontSize:26, fontWeight:800 }}>Comment on t'appelle ?</h2>
      </div>
      <div style={{ position:'relative' }}>
        <input value={val} onChange={e=>!locked&&setVal(e.target.value)} placeholder="Ton prénom…" autoFocus={!locked} onKeyDown={e=>e.key==='Enter'&&next()} style={{ background:'none', border:'none', borderBottom:`2px solid ${locked?C.sage:val?C.primary:C.border}`, padding:'8px 0', color:locked?C.sage:C.text, fontSize:24, fontWeight:700, outline:'none', fontFamily:'inherit', width:'100%', cursor:locked?'default':'text' }}/>
        {locked&&<span style={{ position:'absolute', right:0, bottom:10, fontSize:12, color:C.sage, fontWeight:600 }}>🔒 Non modifiable</span>}
      </div>
      <p style={{ color:C.textLight, fontSize:13 }}>{locked?`Bienvenue de retour, ${val} !`:'Seul ton prénom sera visible.'}</p>
      <div style={{ marginTop:'auto' }}><Btn disabled={!val.trim()} loading={loading} onClick={next}>{locked?'Continuer →':'Confirmer →'}</Btn></div>
    </div>
  )
}

function ObGender({ go, user, save }: any) {
  const locked = !!user?.gender
  const [picked,setPicked]=useState(user?.gender||null); const [loading,setLoading]=useState(false)
  const opts=[{id:'woman',label:'Femme',desc:'Contrôles de sécurité avancés inclus',color:C.sage},{id:'man',label:'Homme',desc:'Accès gratuit · Premium disponible',color:C.primary},{id:'nb',label:'Non-binaire',desc:'Tu choisis tes préférences',color:C.purple}]
  const next=async()=>{
    if(locked){go('ob-age');return}
    if(!picked)return;setLoading(true);await supabase.from('profiles').upsert({id:user.id,gender:picked});save({gender:picked});go('ob-age');setLoading(false)
  }
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'40px 24px 32px', gap:20, background:C.bg }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <button onClick={()=>go('ob-name')} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:C.textMid, padding:0 }}>←</button>
        <ProgressBar step={2} total={5}/>
      </div>
      <div>
        <p style={{ color:C.primary, fontSize:12, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>2 / 5</p>
        <h2 style={{ color:C.text, fontSize:26, fontWeight:800 }}>Salut {user?.name} 👋</h2>
        {locked&&<p style={{ color:C.sage, fontSize:13, marginTop:4 }}>🔒 Non modifiable après inscription</p>}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {opts.map(o=>(
          <button key={o.id} onClick={()=>!locked&&setPicked(o.id)} style={{ background:picked===o.id?`${o.color}18`:C.bgDeep, border:`1.5px solid ${picked===o.id?o.color:C.border}`, borderRadius:14, padding:16, textAlign:'left', cursor:locked?'default':'pointer', opacity:locked&&picked!==o.id?0.4:1 }}>
            <div style={{ color:picked===o.id?o.color:C.text, fontSize:16, fontWeight:700 }}>{o.label} {picked===o.id?'✓':''}</div>
            <div style={{ color:C.textLight, fontSize:12, marginTop:3 }}>{o.desc}</div>
          </button>
        ))}
      </div>
      <div style={{ marginTop:'auto' }}><Btn disabled={!picked} loading={loading} onClick={next}>{locked?'Continuer →':'Confirmer →'}</Btn></div>
    </div>
  )
}

function ObAge({ go, user, save }: any) {
  const locked = !!user?.age
  const [val,setVal]=useState(''); const [loading,setLoading]=useState(false)
  const age=locked?user.age:(val?Math.floor((Date.now()-new Date(val).getTime())/(365.25*24*3600*1000)):null)
  const valid=locked||(!!age&&age>=18&&age<=80)
  const next=async()=>{
    if(locked){go('ob-photo');return}
    if(!valid)return;setLoading(true);await supabase.from('profiles').upsert({id:user.id,age});save({age});go('ob-photo');setLoading(false)
  }
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'40px 24px 32px', gap:24, background:C.bg }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <button onClick={()=>go('ob-gender')} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:C.textMid, padding:0 }}>←</button>
        <ProgressBar step={3} total={5}/>
      </div>
      <div>
        <p style={{ color:C.primary, fontSize:12, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>3 / 5</p>
        <h2 style={{ color:C.text, fontSize:26, fontWeight:800 }}>Ton âge</h2>
        {locked&&<p style={{ color:C.sage, fontSize:13, marginTop:4 }}>🔒 {user.age} ans · Non modifiable</p>}
      </div>
      {!locked&&<>
        <input type="date" value={val} onChange={e=>setVal(e.target.value)} style={{ width:'100%', background:C.bgDeep, border:`1.5px solid ${val?C.primary:C.border}`, borderRadius:14, padding:'14px 16px', color:C.text, fontSize:16, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}/>
        {age&&!valid&&<p style={{ color:C.red, fontSize:13 }}>18 ans minimum requis.</p>}
        {valid&&!locked&&<p style={{ color:C.sage, fontSize:14, fontWeight:600 }}>✓ {age} ans</p>}
      </>}
      <div style={{ marginTop:'auto' }}><Btn disabled={!valid} loading={loading} onClick={next}>{locked?'Continuer →':'Confirmer →'}</Btn></div>
    </div>
  )
}

function ObPhoto({ go, user, save }: any) {
  const [preview,setPreview]=useState<string|null>(null); const [loading,setLoading]=useState(false); const ref=useRef<HTMLInputElement>(null)
  const onChange=(e: React.ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>setPreview(ev.target?.result as string);r.readAsDataURL(f)}
  const next=async()=>{
    setLoading(true)
    try{const file=ref.current?.files?.[0];if(file){const ext=file.name.split('.').pop();const path=`${user.id}/avatar.${ext}`;await supabase.storage.from('avatars').upload(path,file,{upsert:true});const {data:{publicUrl}}=supabase.storage.from('avatars').getPublicUrl(path);await supabase.from('profiles').upsert({id:user.id,photo_url:publicUrl});save({photo_url:publicUrl})}}catch(e){console.error(e)}
    go('ob-interests');setLoading(false)
  }
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'40px 24px 32px', gap:24, background:C.bg }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <button onClick={()=>go('ob-age')} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:C.textMid, padding:0 }}>←</button>
        <ProgressBar step={4} total={5}/>
      </div>
      <div><p style={{ color:C.primary, fontSize:12, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>4 / 5</p><h2 style={{ color:C.text, fontSize:26, fontWeight:800 }}>Ta photo</h2><p style={{ color:C.textMid, fontSize:14, marginTop:6 }}>4× plus de clutches avec une vraie photo.</p></div>
      <input ref={ref} type="file" accept="image/*" onChange={onChange} style={{ display:'none' }}/>
      <div onClick={()=>ref.current?.click()} style={{ alignSelf:'center', width:140, height:140, borderRadius:'50%', overflow:'hidden', background:preview?`url(${preview}) center/cover no-repeat`:C.bgDeep, border:`3px dashed ${preview?C.primary:C.border}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, cursor:'pointer' }}>
        {!preview&&<><span style={{ fontSize:40 }}>📷</span><span style={{ color:C.textLight, fontSize:12, textAlign:'center' }}>Appuyer</span></>}
      </div>
      {preview&&<p style={{ textAlign:'center', color:C.sage, fontSize:14, fontWeight:600 }}>✓ Parfait !</p>}
      <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:10 }}>
        <Btn loading={loading} onClick={next}>{preview?'Sauvegarder →':'Passer pour l\'instant'}</Btn>
      </div>
    </div>
  )
}

function ObInterests({ go, user, save }: any) {
  const [sel,setSel]=useState<string[]>(user?.interests||[]); const [loading,setLoading]=useState(false)
  const toggle=(i:string)=>setSel(p=>p.includes(i)?p.filter(x=>x!==i):p.length<5?[...p,i]:p)
  const next=async()=>{if(sel.length<3)return;setLoading(true);await supabase.from('profiles').upsert({id:user.id,interests:sel});save({interests:sel});go('ob-done');setLoading(false)}
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'24px 20px 20px', gap:10, background:C.bg, minHeight:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <button onClick={()=>go('ob-photo')} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:C.textMid, padding:0 }}>←</button>
        <ProgressBar step={5} total={5}/>
      </div>
      <div style={{ padding:'0 4px', flexShrink:0 }}>
        <p style={{ color:C.primary, fontSize:12, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>5 / 5</p>
        <h2 style={{ color:C.text, fontSize:22, fontWeight:800 }}>Tes passions <span style={{ fontSize:13, color:C.textLight, fontWeight:500 }}>({sel.length}/5)</span></h2>
        <p style={{ color:C.textMid, fontSize:13, marginTop:2 }}>Choisis 3 à 5 passions.</p>
      </div>
      <div style={{ flex:1, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y', display:'flex', flexDirection:'column', gap:12, minHeight:0 }}>
        {INTERESTS_CATS.map(cat=>(
          <div key={cat.label}>
            <p style={{ fontSize:11, fontWeight:700, color:C.textLight, letterSpacing:'0.08em', padding:'0 4px 8px' }}>{cat.icon} {cat.label.toUpperCase()}</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {cat.items.map(item=>{const active=sel.includes(item);const disabled=!active&&sel.length>=5;return(
                <button key={item} onClick={()=>toggle(item)} style={{ padding:'6px 14px', borderRadius:20, fontSize:13, border:'none', cursor:disabled?'not-allowed':'pointer', background:active?C.primary:C.bgDeep, color:active?'#fff':C.textMid, opacity:disabled?.4:1, fontFamily:'inherit', fontWeight:500 }}>{item}</button>
              )})}
            </div>
          </div>
        ))}
      </div>
      <Btn disabled={sel.length<3} loading={loading} onClick={next}>Terminer ✓</Btn>
    </div>
  )
}

function ObDone({ go, user }: any) {
  useEffect(() => {
    if (user?.id) localStorage.setItem('ob_'+user.id, '1')
  }, [user?.id])
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:`linear-gradient(160deg,${C.bg},${C.primaryLight})`, padding:40, gap:24, textAlign:'center' }}>
      <div style={{ fontSize:72 }}>🎉</div>
      <div><h2 style={{ fontSize:26, fontWeight:800, color:C.text }}>Bienvenue, {user?.name} !</h2><p style={{ color:C.textMid, marginTop:10, lineHeight:1.6 }}>Ton profil est prêt 😊</p></div>
      <div style={{ background:C.sageLight, border:`1px solid ${C.sage}44`, borderRadius:16, padding:16, width:'100%' }}>
        <p style={{ fontSize:13, color:C.sage, fontWeight:600 }}>✓ Profil créé avec succès dans la bêta Lausanne</p>
      </div>
      <Btn onClick={()=>go('discover')}>Explorer les profils ✦</Btn>
    </div>
  )
}

// ─── DISCOVER = GRILLE 2 COLONNES ─────────────────────────────────────────────
function Discover({ profiles, user, onSelect, go }: any) {
  const [showAll, setShowAll] = useState(false)
  const now = new Date()
  // Auto-expire: profiles whose available_until is in the past
  const activeProfiles = profiles.filter((p: Profile) => {
    if (!p.is_available) return false
    if (p.available_until) {
      const until = new Date(p.available_until)
      if (!isNaN(until.getTime()) && until < now) return false
    }
    return true
  })
  // Overlap matching: only show profiles whose window overlaps mine
  const myFrom = user?.available_from ? new Date(user.available_from) : null
  const myUntil = user?.available_until ? new Date(user.available_until) : null
  const myFromValid = myFrom && !isNaN(myFrom.getTime())
  const myUntilValid = myUntil && !isNaN(myUntil.getTime())
  const withOverlap = activeProfiles.filter((p: Profile) => {
    if (!myFromValid && !myUntilValid) return true // I have no window → show all available
    const theirFrom = p.available_from ? new Date(p.available_from) : now
    const theirUntil = p.available_until ? new Date(p.available_until) : new Date(now.getTime()+18*3600*1000)
    if (isNaN(theirFrom.getTime())) return true // old format → include
    const iStart = myFromValid ? myFrom! : now
    const iEnd = myUntilValid ? myUntil! : new Date(now.getTime()+18*3600*1000)
    return theirFrom < iEnd && theirUntil > iStart
  })
  const displayed = showAll ? profiles : withOverlap

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bgDeep, overflow:'hidden' }}>
      <div style={{ padding:'12px 16px 8px', display:'flex', justifyContent:'space-between', alignItems:'center', background:C.bg, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:900, letterSpacing:'-0.05em', color:C.text }}>CLUTCH <span style={{ fontSize:10, background:C.primaryLight, color:C.primary, padding:'2px 7px', borderRadius:7, fontWeight:700, letterSpacing:0 }}>BÊTA</span></div>
          <p style={{ fontSize:10, color:C.textLight, fontWeight:600, marginTop:1 }}>{displayed.length} profil{displayed.length>1?'s':''} {showAll?'au total':withOverlap.length<activeProfiles.length?'dans ta fenêtre':'disponible'}{displayed.length>1&&!showAll?'s':''}</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={()=>setShowAll(s=>!s)} style={{ fontSize:11, background:showAll?C.bgDeep:C.primaryLight, color:showAll?C.textLight:C.primary, padding:'5px 10px', borderRadius:10, border:'none', cursor:'pointer', fontWeight:600, fontFamily:'inherit' }}>
            {showAll?'Tous':'Disponibles'}
          </button>
          <button onClick={()=>go('sos')} style={{ background:C.redLight, border:'none', borderRadius:14, padding:'5px 11px', cursor:'pointer', color:C.red, fontWeight:700, fontSize:12, fontFamily:'inherit' }}>SOS</button>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y', padding:'10px 12px 12px' }}>
        {displayed.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:20, textAlign:'center', padding:32 }}>
            <div style={{ fontSize:56 }}>🌿</div>
            <h2 style={{ fontSize:20, fontWeight:800, color:C.text }}>Pas encore de profils {showAll?'':'disponibles'}</h2>
            <p style={{ color:C.textMid, lineHeight:1.6, fontSize:14 }}>
              {showAll ? 'Soyez les premiers bêta-testeurs à Lausanne !' : withOverlap.length===0&&activeProfiles.length>0 ? 'Personne ne correspond à ta fenêtre horaire. Modifie ta dispo ou clique "Tous".' : 'Personne n\'est dispo. Active "Tous" pour voir tous les profils.'}
            </p>
            {showAll && <a href="/demo" style={{ display:'block', padding:'12px 24px', borderRadius:14, background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`, color:'#fff', fontWeight:700, fontSize:14, textDecoration:'none' }}>👁 Voir la démo →</a>}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {displayed.map((p: Profile) => {
              // Compatibility score: passions communes + disponibilité overlap
              const myInterests: string[] = user?.interests || []
              const common = (p.interests||[]).filter((i:string)=>myInterests.includes(i)).length
              const compatScore = Math.min(100, 60 + common * 10 + (p.reliability_score||100) * 0.1)
              const isAvailNow = p.is_available && (!p.available_from || new Date(p.available_from) <= new Date())
              return (
                <button key={p.id} onClick={()=>{ onSelect(p); go('profile-detail') }}
                  style={{ width:'100%', background:C.card, border:`1px solid ${C.border}`, borderRadius:16,
                    display:'flex', gap:0, cursor:'pointer', textAlign:'left', overflow:'hidden',
                    boxShadow:`0 1px 6px ${C.shadow}` }}>
                  {/* Photo */}
                  <div style={{ position:'relative', width:88, height:100, flexShrink:0 }}>
                    {p.photo_url
                      ? <img src={p.photo_url} alt="" style={{ width:88, height:100, objectFit:'cover' }}/>
                      : <div style={{ width:88, height:100, background:`linear-gradient(135deg,${C.primary},${C.peach})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:30 }}>☕</div>
                    }
                    {isAvailNow && (
                      <div style={{ position:'absolute', bottom:7, right:7, width:12, height:12, borderRadius:'50%', background:'#22c55e', border:'2px solid #fff', boxShadow:'0 0 0 3px #22c55e33' }}/>
                    )}
                    {(p as any).certified && (
                      <div style={{ position:'absolute', top:6, left:6, background:'#fff', borderRadius:10, padding:'1px 5px', fontSize:10, fontWeight:700, color:C.gold }}>✓</div>
                    )}
                  </div>
                  {/* Contenu */}
                  <div style={{ flex:1, padding:'10px 12px', minWidth:0, display:'flex', flexDirection:'column', gap:3 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <span style={{ fontWeight:800, fontSize:16, color:C.text, lineHeight:1.2 }}>{p.name}{p.age?`, ${p.age}`:''}</span>
                      <div style={{ textAlign:'right', flexShrink:0, marginLeft:8 }}>
                        <div style={{ fontSize:14, fontWeight:800, color:C.primary }}>{Math.round(compatScore)}%</div>
                        <div style={{ fontSize:9, color:C.textLight, fontWeight:600 }}>compat.</div>
                      </div>
                    </div>
                    <p style={{ fontSize:11, color:C.textLight, lineHeight:1.3 }}>
                      📍 {p.neighborhood||'Lausanne'}
                      {p.available_from&&fmtIsoTime(p.available_from)?` · ${fmtIsoTime(p.available_from)}`:isAvailNow?' · maintenant':''}
                      {p.available_until&&fmtIsoTime(p.available_until)?`→${fmtIsoTime(p.available_until)}`:''}
                    </p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                      {(p.available_modes||[]).map((m:string)=>{
                        const mode=AVAIL_MODES.find(x=>x.id===m)
                        return mode?<span key={m} style={{ fontSize:10, background:m==='rencontre'?C.primaryLight:m==='professionnel'?'#E8F0FE':C.sageLight, color:m==='rencontre'?C.primary:m==='professionnel'?'#1a73e8':C.sage, padding:'1px 6px', borderRadius:6, fontWeight:700 }}>{mode.label}</span>:null
                      })}
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:2 }}>
                      {(p.interests||[]).slice(0,3).map((i:string)=>{
                        const isCommon = myInterests.includes(i)
                        return <span key={i} style={{ fontSize:10, background:isCommon?C.primaryLight:C.bgDeep, color:isCommon?C.primary:C.textMid, padding:'2px 7px', borderRadius:7, fontWeight:isCommon?700:400 }}>{i}</span>
                      })}
                      {common > 0 && <span style={{ fontSize:10, color:C.primary, fontWeight:700 }}>+{common} en commun</span>}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── PROFILE DETAIL ───────────────────────────────────────────────────────────
function ProfileDetail({ profile, go, currentUser }: { profile: Profile|null; go:(s:Screen)=>void; currentUser:any }) {
  const [reporting, setReporting] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDone, setReportDone] = useState(false)

  const sendReport = async () => {
    if (!reportReason || !profile?.id || !currentUser?.id) return
    await supabase.from('reports').insert({ reported_id: profile.id, reporter_id: currentUser.id, reason: reportReason })
    setReportDone(true)
  }

  if (!profile) return null
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bg, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y' }}>
      <div style={{ position:'relative' }}>
        {profile.photo_url
          ? <img src={profile.photo_url} alt="" style={{ width:'100%', height:280, objectFit:'cover' }}/>
          : <div style={{ width:'100%', height:200, background:`linear-gradient(135deg,${C.primary},${C.peach})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:72 }}>☕</div>
        }
        <button onClick={()=>go('discover')} style={{ position:'absolute', top:16, left:16, width:38, height:38, borderRadius:'50%', background:'rgba(255,255,255,0.92)', border:'none', fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>←</button>
        <div style={{ position:'absolute', top:16, right:16, display:'flex', gap:8 }}>
          <button onClick={()=>shareIt({ title:`${profile.name} sur Clutch`, text:`Regarde le profil de ${profile.name} sur Clutch Lausanne ☕`, url:APP_URL+'/app' })} style={{ width:38, height:38, borderRadius:'50%', background:'rgba(255,255,255,0.92)', border:'none', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>↗</button>
          <button onClick={()=>setReporting(true)} style={{ width:38, height:38, borderRadius:'50%', background:'rgba(255,255,255,0.92)', border:'none', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }} title="Signaler">🚩</button>
        </div>
      </div>
      <div style={{ padding:20, display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h2 style={{ fontSize:24, fontWeight:800, color:C.text }}>{profile.name}, {profile.age}</h2>
            <p style={{ color:C.textLight, fontSize:13 }}>📍 {profile.neighborhood||'Lausanne'}{profile.job?` · ${profile.job}`:''}</p>
          </div>
          <span style={{ fontSize:11, background:profile.is_available?C.sageLight:C.bgDeep, color:profile.is_available?C.sage:C.textLight, padding:'4px 10px', borderRadius:12, fontWeight:600 }}>
            {profile.is_available?'● Disponible':'○ Pas dispo'}
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ flex:1, height:4, background:C.border, borderRadius:2 }}><div style={{ width:`${profile.reliability_score||100}%`, height:'100%', background:C.sage, borderRadius:2 }}/></div>
          <span style={{ fontSize:12, color:C.sage, fontWeight:700 }}>{profile.reliability_score||100}%</span>
          <span style={{ fontSize:12, color:C.textLight }}>{profile.badge||'Nouveau'}</span>
        </div>
        {profile.bio&&<p style={{ color:C.textMid, lineHeight:1.65, fontSize:14 }}>{profile.bio}</p>}
        {(profile.interests||[]).length>0&&(
          <div>
            <p style={{ fontWeight:700, fontSize:13, color:C.text, marginBottom:8 }}>Passions</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {(profile.interests||[]).map((i:string)=><span key={i} style={{ padding:'6px 14px', borderRadius:20, fontSize:13, background:C.bgDeep, color:C.textMid, fontWeight:500 }}>{i}</span>)}
            </div>
          </div>
        )}
      </div>
      <div style={{ padding:'0 20px 32px', display:'flex', flexDirection:'column', gap:10 }}>
        {profile.is_available
          ? <button onClick={()=>go('propose')} style={{ padding:'16px', borderRadius:16, border:'none', background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`, color:'#fff', fontWeight:800, fontSize:17, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              ☕ Clutcher {profile.name}
            </button>
          : <div style={{ padding:14, borderRadius:14, background:C.bgDeep, textAlign:'center', fontSize:14, color:C.textLight }}>
              {profile.name} n'est pas disponible pour l'instant
            </div>
        }
        <Btn variant="ghost" onClick={()=>go('discover')}>← Retour à la liste</Btn>
      </div>

      {/* Modal signalement */}
      {reporting && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:999, display:'flex', alignItems:'flex-end', justifyContent:'center' }} onClick={()=>{if(!reportDone)setReporting(false)}}>
          <div style={{ background:'#fff', borderRadius:'20px 20px 0 0', padding:'24px 20px 36px', width:'100%', maxWidth:390 }} onClick={e=>e.stopPropagation()}>
            {reportDone ? (
              <div style={{ textAlign:'center', padding:'16px 0' }}>
                <p style={{ fontSize:32, marginBottom:12 }}>✅</p>
                <p style={{ fontWeight:700, color:C.text, fontSize:16 }}>Signalement envoyé</p>
                <p style={{ color:C.textMid, fontSize:13, marginTop:6 }}>L'équipe Clutch examinera le profil sous 24h.</p>
                <button onClick={()=>{setReporting(false);setReportDone(false)}} style={{ marginTop:16, padding:'10px 24px', borderRadius:12, border:'none', background:C.bgDeep, color:C.textMid, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>Fermer</button>
              </div>
            ) : (
              <>
                <div style={{ width:36, height:4, borderRadius:2, background:'#ddd', margin:'0 auto 20px' }}/>
                <p style={{ fontWeight:800, color:C.text, fontSize:16, marginBottom:4 }}>🚩 Signaler ce profil</p>
                <p style={{ color:C.textMid, fontSize:13, marginBottom:16 }}>Quelle est la raison ?</p>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {['Photo inappropriée ou fausse','Comportement harcelant','Profil fake / bot','Contenu offensant','Mineur·e','Autre raison'].map(r=>(
                    <button key={r} onClick={()=>setReportReason(r)} style={{ padding:'11px 14px', borderRadius:12, border:`1.5px solid ${reportReason===r?C.red:C.border}`, background:reportReason===r?C.redLight:'transparent', color:reportReason===r?C.red:C.textMid, fontSize:13, fontWeight:reportReason===r?700:400, textAlign:'left', cursor:'pointer', fontFamily:'inherit' }}>{r}</button>
                  ))}
                </div>
                <div style={{ display:'flex', gap:10, marginTop:16 }}>
                  <button onClick={()=>setReporting(false)} style={{ flex:1, padding:12, borderRadius:12, border:`1px solid ${C.border}`, background:'none', color:C.textMid, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Annuler</button>
                  <button onClick={sendReport} disabled={!reportReason} style={{ flex:2, padding:12, borderRadius:12, border:'none', background:reportReason?C.red:C.bgDeep, color:reportReason?'#fff':C.textLight, fontSize:13, fontWeight:700, cursor:reportReason?'pointer':'not-allowed', fontFamily:'inherit' }}>Envoyer le signalement</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── PROPOSE FLOW ─────────────────────────────────────────────────────────────
function Propose({ profile, go, setVenue, setVenueInput, venueInput, selectedVenue, venueSafety, setVenueSafety }: any) {
  const pick=(v:typeof VENUES[0])=>{setVenueInput(v.name);setVenue(v.name);setVenueSafety(v.safety as any)}
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bg }}>
      <TopBar title={`Clutcher ${profile?.name||''}`} onBack={()=>go('profile-detail')}/>
      <div style={{ flex:1, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y', padding:'12px 20px' }}>
        <p style={{ fontWeight:700, color:C.text, marginBottom:10 }}>📍 Où se retrouver ?</p>
        <input value={venueInput} onChange={e=>{setVenueInput(e.target.value);setVenue('');setVenueSafety('safe')}} placeholder="Tape le nom d'un café…"
          style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:`1.5px solid ${C.border}`, background:C.card, fontSize:14, color:C.text, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}/>
        {venueInput&&!selectedVenue&&(
          <div style={{ marginTop:8, borderRadius:12, overflow:'hidden', border:`1px solid ${C.border}` }}>
            {VENUES.filter(v=>v.name.toLowerCase().includes(venueInput.toLowerCase())).slice(0,4).map(v=>(
              <button key={v.name} onClick={()=>pick(v)} style={{ width:'100%', padding:'10px 14px', background:C.card, border:'none', borderBottom:`1px solid ${C.border}`, textAlign:'left', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontWeight:600, color:C.text, fontSize:13 }}>{v.emoji} {v.name}</span>
                <SafetyBadge safety={v.safety}/>
              </button>
            ))}
          </div>
        )}
        {selectedVenue&&<div style={{ marginTop:8, padding:'10px 14px', background:C.sageLight, borderRadius:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}><span style={{ fontWeight:600, color:C.text, fontSize:13 }}>✓ {selectedVenue}</span><SafetyBadge safety={venueSafety}/></div>}
        <p style={{ fontWeight:700, color:C.text, margin:'20px 0 10px' }}>Suggestions</p>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {VENUES.slice(0,5).map(v=>(
            <button key={v.name} onClick={()=>pick(v)} style={{ padding:'11px 14px', background:C.card, border:`1.5px solid ${selectedVenue===v.name?C.primary:C.border}`, borderRadius:12, textAlign:'left', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{v.emoji} {v.name}</span>
              <SafetyBadge safety={v.safety}/>
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding:'12px 20px 28px' }}>
        <Btn onClick={()=>go('propose2')} disabled={!venueInput}>Choisir l'heure →</Btn>
      </div>
    </div>
  )
}

function Propose2({ profile, go, selectedTime, setSelectedTime, venueInput }: any) {
  const slots = getTimeSlots()
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bg }}>
      <TopBar title="Quelle heure ?" onBack={()=>go('propose')}/>
      <div style={{ flex:1, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y', padding:'12px 20px' }}>
        <div style={{ padding:'10px 14px', background:C.bgDeep, borderRadius:12, marginBottom:16 }}>
          <p style={{ fontSize:12, color:C.textLight }}>📍 {venueInput}</p>
        </div>
        <p style={{ color:C.textMid, fontSize:13, marginBottom:14, lineHeight:1.5 }}>RDV dans les <strong>18h max</strong>. Heure proposée :</p>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {slots.map((s,i)=>(
            <button key={i} onClick={()=>setSelectedTime(s.label)} style={{ padding:'13px 16px', borderRadius:13, border:`2px solid ${selectedTime===s.label?C.primary:C.border}`, background:selectedTime===s.label?C.primaryLight:C.card, textAlign:'left', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontWeight:selectedTime===s.label?700:500, color:C.text, fontSize:15 }}>🕐 {s.label.split(' (')[0]}</span>
              <span style={{ fontSize:12, color:C.textLight }}>{s.label.split('(')[1]?.replace(')','')}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding:'12px 20px 28px' }}>
        <Btn onClick={()=>go('propose3')} disabled={!selectedTime}>Écrire le message →</Btn>
      </div>
    </div>
  )
}

function Propose3({ profile, go, venueInput, selectedTime, message, setMessage, onSend, sending }: any) {
  const q = message.length>60?'excellent':message.length>30?'bien':message.length>10?'ok':'faible'
  const qColor = {excellent:C.sage,bien:C.peach,ok:C.gold,faible:C.textLight}[q]
  const canSend = message.trim().length >= 10 && !sending
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bg }}>
      <TopBar title="Ton message" onBack={()=>go('propose2')}/>
      <div style={{ flex:1, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y', padding:'12px 20px', display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ padding:'10px 14px', background:C.bgDeep, borderRadius:12 }}>
          <p style={{ fontSize:12, color:C.textLight, marginBottom:3 }}>Récap</p>
          <p style={{ fontWeight:700, color:C.text, fontSize:14 }}>📍 {venueInput} · 🕐 {selectedTime?.split(' (')[0]}</p>
        </div>
        <div>
          <p style={{ fontWeight:700, color:C.text, marginBottom:8 }}>Message pour {profile?.name}</p>
          <textarea value={message} onChange={e=>setMessage(e.target.value)}
            placeholder={`"Salut ${profile?.name||''} ! J'adorerais prendre un café — j'ai vu qu'on partage des intérêts communs. Tu es dispo ${selectedTime?.split(' (')[0]||''} ?"`}
            rows={5} maxLength={280}
            style={{ width:'100%', border:`1.5px solid ${C.border}`, borderRadius:14, padding:14, fontSize:14, background:C.card, color:C.text, fontFamily:'inherit', resize:'none', outline:'none', lineHeight:1.6, boxSizing:'border-box' }}/>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
            <span style={{ fontSize:12, color:qColor, fontWeight:600 }}>
              {q==='excellent'?'✨ Excellent !':q==='bien'?'👍 Bon':q==='ok'?'📝 Correct':'💡 Ajoute un peu plus…'}
            </span>
            <span style={{ fontSize:12, color:C.textLight }}>{message.length}/280</span>
          </div>
        </div>
        <div style={{ padding:12, background:C.peachLight, borderRadius:12 }}>
          <p style={{ fontSize:12, color:C.textMid, lineHeight:1.5 }}>💡 Les messages personnalisés ont <strong>3× plus</strong> de chance d'être acceptés.</p>
        </div>
      </div>
      <div style={{ padding:'12px 20px 28px' }}>
        <button onClick={canSend?onSend:undefined} disabled={!canSend} style={{ borderRadius:14, padding:'14px 20px', fontSize:15, fontWeight:700, cursor:canSend?'pointer':'not-allowed', border:'none', width:'100%', fontFamily:'inherit', background:canSend?`linear-gradient(135deg,${C.primary},${C.primaryDark})`:`${C.bgDeep}`, color:canSend?'#fff':C.textLight, opacity:sending?.7:1, letterSpacing:'-0.01em' }}>
          {sending?'Envoi…':'Envoyer le clutch ✦'}
        </button>
      </div>
    </div>
  )
}

function Sent({ profile, go, venueInput, selectedTime }: any) {
  const [countdown, setCountdown] = useState(7200)
  useEffect(()=>{ const t=setInterval(()=>setCountdown(c=>Math.max(0,c-1)),1000); return ()=>clearInterval(t) },[])
  const fmt=(s:number)=>`${Math.floor(s/3600)}h ${String(Math.floor((s%3600)/60)).padStart(2,'0')}m`
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:`linear-gradient(160deg,${C.bg},${C.primaryLight})`, padding:32, gap:20, textAlign:'center' }}>
      <div style={{ fontSize:64 }}>☕</div>
      <div><h2 style={{ fontSize:24, fontWeight:800, color:C.text }}>Clutch envoyé !</h2><p style={{ color:C.textMid, marginTop:8, lineHeight:1.6 }}>{profile?.name} a <strong>2h</strong> pour répondre.</p></div>
      <div style={{ background:C.card, borderRadius:18, padding:20, width:'100%', border:`1px solid ${C.border}` }}>
        <p style={{ fontSize:12, color:C.textLight, marginBottom:4 }}>📍 {venueInput} · {selectedTime?.split(' (')[0]}</p>
        <p style={{ fontSize:12, color:C.textLight, marginBottom:8 }}>Expire dans</p>
        <p style={{ fontSize:26, fontWeight:800, color:C.primary }}>{fmt(countdown)}</p>
      </div>
      <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:10 }}>
        <Btn onClick={()=>go('inbox')}>→ Voir mes messages</Btn>
        <Btn variant="secondary" onClick={()=>go('discover')}>Retour à la liste</Btn>
      </div>
    </div>
  )
}

// ─── EVENTS = LISTE COMPACTE (Supabase + fallback statique) ──────────────────
function Events({ user, go }: { user:any; go:(s:Screen)=>void }) {
  const [filter, setFilter] = useState('all')
  const [dbEvents, setDbEvents] = useState<any[]>([])
  const [myPending, setMyPending] = useState<any[]>([])

  useEffect(()=>{
    // Approved events from Supabase
    supabase.from('events').select('*,creator:profiles(name,photo_url)')
      .eq('status','approved').order('created_at',{ascending:false})
      .then(({data})=>{ if(data) setDbEvents(data) })
    // My own pending events
    if(user?.id) supabase.from('events').select('*').eq('created_by',user.id).eq('status','pending')
      .then(({data})=>{ if(data) setMyPending(data) })
  },[user?.id])

  const allEvents = dbEvents.map(e=>({...e, color:e.type==='clutch'?C.primary:e.type==='partner'?C.sage:C.peach}))
  const filtered = allEvents.filter(e=>filter==='all'||e.type===filter)

  const badgeColor = (type:string) => type==='clutch'?C.primary:type==='partner'?C.sage:C.peach
  const badgeLabel = (type:string) => type==='clutch'?'✦ Clutch':type==='partner'?'🤝 Partenaire':'👥 Communauté'

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bg, overflowY:'scroll' }}>
      <div style={{ padding:'12px 16px 8px', borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <h2 style={{ fontSize:19, fontWeight:800, color:C.text }}>Événements <span style={{ fontSize:10, background:C.bgDeep, color:C.textLight, padding:'2px 7px', borderRadius:7, fontWeight:600 }}>Lausanne</span></h2>
          <div style={{ display:'flex', gap:6 }}>
            {myPending.length>0&&<button onClick={()=>go('my-events')} style={{ background:C.peachLight, border:`1px solid ${C.peach}44`, borderRadius:14, padding:'5px 10px', color:C.peach, fontWeight:700, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>⏳ {myPending.length} en attente</button>}
            <button onClick={()=>go('create-event')} style={{ background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`, border:'none', borderRadius:14, padding:'5px 12px', color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>+ Créer</button>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:2 }}>
          {[{id:'all',label:'Tous'},{id:'clutch',label:'✦ Clutch'},{id:'partner',label:'🤝 Partenaires'},{id:'user',label:'👥 Communauté'}].map(f=>(
            <button key={f.id} onClick={()=>setFilter(f.id)} style={{ padding:'5px 12px', borderRadius:20, fontSize:11, border:'none', cursor:'pointer', fontWeight:600, background:filter===f.id?C.primary:C.bgDeep, color:filter===f.id?'#fff':C.textMid, whiteSpace:'nowrap', fontFamily:'inherit' }}>{f.label}</button>
          ))}
        </div>
      </div>
      <div style={{ flex:1, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y', padding:'10px 12px 12px', display:'flex', flexDirection:'column', gap:8 }}>
        {filtered.map((ev,i)=>(
          <div key={`${ev.id}-${i}`} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden', boxShadow:`0 1px 6px ${C.shadow}`, display:'flex', minHeight:76 }}>
            {ev.photo
              ? <img src={ev.photo} alt="" style={{ width:76, height:76, objectFit:'cover', flexShrink:0 }}/>
              : <div style={{ width:76, height:76, background:`linear-gradient(135deg,${badgeColor(ev.type)}33,${badgeColor(ev.type)}55)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, flexShrink:0 }}>{ev.emoji||'📅'}</div>
            }
            <div style={{ padding:'10px 12px', flex:1, minWidth:0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:4, marginBottom:3 }}>
                <span style={{ fontSize:13, fontWeight:700, color:C.text, lineHeight:1.2 }}>{ev.emoji||''} {ev.title}</span>
                <span style={{ fontSize:9, padding:'2px 6px', borderRadius:6, background:`${badgeColor(ev.type)}18`, color:badgeColor(ev.type), fontWeight:700, whiteSpace:'nowrap', flexShrink:0 }}>{badgeLabel(ev.type)}</span>
              </div>
              <div style={{ fontSize:11, color:C.textLight, marginBottom:4 }}>📍 {ev.venue}</div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:11, color:C.textMid }}>⏰ {ev.date||ev.date_label||'—'}</span>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <span style={{ fontSize:12, fontWeight:700, color:badgeColor(ev.type) }}>{ev.price||'—'}</span>
                  <button onClick={()=>shareIt({
                    title: ev.title,
                    text: `${ev.emoji||'📅'} ${ev.title} — ${ev.venue} · ${ev.date||ev.date_label||''} · ${ev.price||''}\n\nVia Clutch Lausanne`,
                    url: APP_URL+'/app'
                  })} style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, padding:'2px 4px' }}>↗</button>
                </div>
              </div>
              {ev.creator&&<div style={{ fontSize:10, color:C.textLight, marginTop:2 }}>par {ev.creator.name}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── CREATE EVENT ─────────────────────────────────────────────────────────────
function CreateEvent({ user, go }: { user:any; go:(s:Screen)=>void }) {
  const [type, setType] = useState<'user'|'clutch'|'partner'>('user')
  const [title, setTitle] = useState('')
  const [venue, setVenue] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('Gratuit')
  const [priceCustom, setPriceCustom] = useState('')
  const [spots, setSpots] = useState('6')
  const [dateTime, setDateTime] = useState('')
  const [emoji, setEmoji] = useState('📅')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const finalPrice = priceCustom || price

  const submit = async () => {
    if (!title.trim()||!venue.trim()||!dateTime) return
    setSaving(true)
    const { error } = await supabase.from('events').insert({
      title: title.trim(),
      emoji,
      venue: venue.trim(),
      description: description.trim(),
      price: finalPrice,
      spots: parseInt(spots)||6,
      type,
      date_label: new Date(dateTime).toLocaleDateString('fr-CH',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}),
      status: type==='user' ? 'pending' : 'pending', // tous pending, admin approuve
      created_by: user.id,
    })
    setSaving(false)
    if (!error) setDone(true)
  }

  if (done) return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:`linear-gradient(160deg,${C.bg},${C.sageLight})`, padding:32, gap:20, textAlign:'center' }}>
      <div style={{ fontSize:64 }}>🎉</div>
      <h2 style={{ fontSize:22, fontWeight:800, color:C.text }}>Événement soumis !</h2>
      <div style={{ background:C.card, borderRadius:16, padding:16, width:'100%', border:`1px solid ${C.border}` }}>
        <p style={{ color:C.textMid, lineHeight:1.6, fontSize:14 }}>
          {type==='user'
            ? "✅ Ton événement sera examiné par l'équipe Clutch et publié sous 24h si tout est ok."
            : "✅ Soumis pour validation. Tu seras notifié·e rapidement."}
        </p>
      </div>
      <Btn onClick={()=>go('events')}>← Retour aux événements</Btn>
    </div>
  )

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bg }}>
      <TopBar title="Créer un événement" onBack={()=>go('events')}/>
      <div style={{ flex:1, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y', padding:'12px 20px', display:'flex', flexDirection:'column', gap:14 }}>
        {/* Type */}
        <div>
          <p style={{ fontWeight:700, color:C.text, marginBottom:8, fontSize:13 }}>Type d'événement</p>
          <div style={{ display:'flex', gap:8 }}>
            {[{t:'user',l:'👥 Mon activité',c:C.peach,allowed:['user','partner','admin']},{t:'partner',l:'🤝 Partenaire',c:C.sage,allowed:['partner','admin']},{t:'clutch',l:'✦ Clutch Officiel',c:C.primary,allowed:['admin']}]
              .filter(opt=>opt.allowed.includes(user?.account_type||'user'))
              .map(opt=>(
              <button key={opt.t} onClick={()=>setType(opt.t as any)} style={{ flex:1, padding:'8px 4px', borderRadius:12, border:`2px solid ${type===opt.t?opt.c:C.border}`, background:type===opt.t?`${opt.c}18`:C.card, color:type===opt.t?opt.c:C.textMid, fontWeight:700, fontSize:11, cursor:'pointer', fontFamily:'inherit', textAlign:'center' }}>{opt.l}</button>
            ))}
          </div>
        </div>

        {/* Emoji */}
        <div>
          <p style={{ fontWeight:700, color:C.text, marginBottom:8, fontSize:13 }}>Emoji</p>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {['📅','☕','🎵','🎨','🏃','🍷','🧘','🎤','🏓','📸','🥾','🌿'].map(e=>(
              <button key={e} onClick={()=>setEmoji(e)} style={{ width:38, height:38, borderRadius:10, border:`2px solid ${emoji===e?C.primary:C.border}`, background:emoji===e?C.primaryLight:C.card, fontSize:20, cursor:'pointer' }}>{e}</button>
            ))}
          </div>
        </div>

        {/* Titre + lieu */}
        {[{label:'Titre *',placeholder:'Ex: Rando Jorat dimanche matin',val:title,set:setTitle},{label:'Lieu *',placeholder:'Ex: Forêt du Jorat, Lausanne',val:venue,set:setVenue}].map(f=>(
          <div key={f.label}>
            <p style={{ fontWeight:700, color:C.text, marginBottom:6, fontSize:13 }}>{f.label}</p>
            <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.placeholder} style={{ width:'100%', padding:'11px 13px', borderRadius:12, border:`1.5px solid ${f.val?C.primary:C.border}`, background:C.card, fontSize:14, color:C.text, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}/>
          </div>
        ))}

        {/* Description */}
        <div>
          <p style={{ fontWeight:700, color:C.text, marginBottom:6, fontSize:13 }}>Description</p>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Décris ton activité, le niveau requis, ce qu'il faut apporter…" rows={3} style={{ width:'100%', border:`1.5px solid ${C.border}`, borderRadius:12, padding:'11px 13px', fontSize:13, fontFamily:'inherit', background:C.card, color:C.text, resize:'none', outline:'none', boxSizing:'border-box' }}/>
        </div>

        {/* Prix */}
        <div>
          <p style={{ fontWeight:700, color:C.text, marginBottom:8, fontSize:13 }}>Prix / participation</p>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
            {['Gratuit','5 CHF','10 CHF','15 CHF','20 CHF','28 CHF'].map(pr=>(
              <button key={pr} onClick={()=>{setPrice(pr);setPriceCustom('')}} style={{ padding:'5px 11px', borderRadius:20, border:`1.5px solid ${price===pr&&!priceCustom?C.primary:C.border}`, background:price===pr&&!priceCustom?C.primaryLight:C.card, color:C.text, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>{pr}</button>
            ))}
          </div>
          <input value={priceCustom} onChange={e=>setPriceCustom(e.target.value)} placeholder="Ou saisir un montant (ex: 12 CHF)" style={{ width:'100%', padding:'9px 13px', borderRadius:12, border:`1.5px solid ${priceCustom?C.primary:C.border}`, background:C.card, fontSize:13, color:C.text, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}/>
        </div>

        {/* Date + Places */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div>
            <p style={{ fontWeight:700, color:C.text, marginBottom:6, fontSize:13 }}>Date & heure *</p>
            <input type="datetime-local" value={dateTime} onChange={e=>setDateTime(e.target.value)} style={{ width:'100%', padding:'9px 11px', borderRadius:12, border:`1.5px solid ${dateTime?C.primary:C.border}`, background:C.card, fontSize:12, color:C.text, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}/>
          </div>
          <div>
            <p style={{ fontWeight:700, color:C.text, marginBottom:6, fontSize:13 }}>Places</p>
            <input type="number" value={spots} onChange={e=>setSpots(e.target.value)} min={2} max={50} style={{ width:'100%', padding:'9px 11px', borderRadius:12, border:`1.5px solid ${C.border}`, background:C.card, fontSize:13, color:C.text, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}/>
          </div>
        </div>

        {/* Moderation note */}
        <div style={{ padding:'12px 14px', background:'#FFF8DC', borderRadius:12, border:'1px solid #D4A01733', fontSize:12, color:'#7A6020', lineHeight:1.55 }}>
          ⚠️ {type==='user' ? "Ton événement sera examiné par l'équipe Clutch avant publication (sous 24h). Les contenus inappropriés sont refusés." : "Les événements Clutch et Partenaire sont validés en priorité."}
        </div>
      </div>
      <div style={{ padding:'12px 20px 28px' }}>
        <button onClick={saving?undefined:submit} disabled={!title||!venue||!dateTime} style={{ borderRadius:14, padding:'14px 20px', fontSize:15, fontWeight:700, cursor:(title&&venue&&dateTime&&!saving)?'pointer':'not-allowed', border:'none', width:'100%', fontFamily:'inherit', background:(title&&venue&&dateTime)?`linear-gradient(135deg,${C.primary},${C.primaryDark})`:C.bgDeep, color:(title&&venue&&dateTime)?'#fff':C.textLight, opacity:saving?.7:1 }}>
          {saving?'Envoi…':'Publier l\'événement 🎉'}
        </button>
      </div>
    </div>
  )
}

// ─── MY EVENTS (pending) ──────────────────────────────────────────────────────
function MyEvents({ user, go }: { user:any; go:(s:Screen)=>void }) {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    supabase.from('events').select('*').eq('created_by',user.id).order('created_at',{ascending:false})
      .then(({data})=>{ if(data) setEvents(data); setLoading(false) })
  },[user?.id])

  const statusColor = (s:string) => s==='approved'?C.sage:s==='rejected'?C.red:C.peach
  const statusLabel = (s:string) => s==='approved'?'✓ Publié':s==='rejected'?'✕ Refusé':'⏳ En attente'

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bg }}>
      <TopBar title="Mes événements" onBack={()=>go('events')}/>
      <div style={{ flex:1, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y', padding:'12px 16px', display:'flex', flexDirection:'column', gap:10 }}>
        {loading&&<p style={{ color:C.textLight, textAlign:'center', marginTop:32 }}>Chargement…</p>}
        {!loading&&events.length===0&&(
          <div style={{ textAlign:'center', marginTop:40 }}>
            <p style={{ fontSize:40 }}>📅</p>
            <p style={{ color:C.textMid, marginTop:12 }}>Aucun événement créé.</p>
          </div>
        )}
        {events.map(ev=>(
          <div key={ev.id} style={{ background:C.card, borderRadius:14, padding:'14px 16px', border:`1.5px solid ${statusColor(ev.status)}33`, boxShadow:`0 1px 6px ${C.shadow}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
              <span style={{ fontWeight:700, color:C.text, fontSize:14 }}>{ev.emoji} {ev.title}</span>
              <span style={{ fontSize:11, padding:'3px 8px', borderRadius:8, background:`${statusColor(ev.status)}18`, color:statusColor(ev.status), fontWeight:700 }}>{statusLabel(ev.status)}</span>
            </div>
            <p style={{ fontSize:12, color:C.textLight }}>📍 {ev.venue} · {ev.price}</p>
            {ev.status==='pending'&&<p style={{ fontSize:11, color:C.peach, marginTop:6 }}>Examiné sous 24h par l'équipe Clutch.</p>}
            {ev.status==='rejected'&&<p style={{ fontSize:11, color:C.red, marginTop:6 }}>Refusé — contacte nous pour plus d'info.</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── INBOX ────────────────────────────────────────────────────────────────────
function Inbox({ clutches, user, go, setSelectedClutch }: any) {
  const open = (c:any) => {
    setSelectedClutch(c)
    if (c.receiver_id === user.id && c.status === 'pending') go('clutch-received')
    else if (c.status === 'accepted') go('rdv-active')
    else go('chat')
  }
  if (!clutches.length) return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:C.bg, padding:32, gap:16, textAlign:'center' }}>
      <div style={{ fontSize:56 }}>💬</div>
      <h2 style={{ fontSize:20, fontWeight:800, color:C.text }}>Pas encore de messages</h2>
      <p style={{ color:C.textMid, fontSize:14, lineHeight:1.6 }}>Clutche quelqu'un depuis la liste de profils !</p>
    </div>
  )
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bg }}>
      <div style={{ padding:'14px 20px 10px', borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        <h2 style={{ fontSize:20, fontWeight:800, color:C.text }}>Messages</h2>
      </div>
      <div style={{ flex:1, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y' }}>
        {clutches.map((c:any)=>{
          const other=c.sender_id===user.id?c.receiver:c.sender
          const isReceived=c.receiver_id===user.id
          const isPending=c.status==='pending'
          const isAccepted=c.status==='accepted'
          return (
            <button key={c.id} onClick={()=>open(c)} style={{ width:'100%', padding:'14px 20px', background:'none', border:'none', borderBottom:`1px solid ${C.border}`, display:'flex', gap:12, alignItems:'center', cursor:'pointer', textAlign:'left' }}>
              <Avatar p={other||{}} size={46}/>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontWeight:700, color:C.text }}>{other?.name||'Utilisateur'}</span>
                  <span style={{ fontSize:11, color:C.textLight }}>{new Date(c.created_at).toLocaleDateString('fr')}</span>
                </div>
                <p style={{ fontSize:13, color:C.textMid, marginTop:2 }}>📍 {c.venue}</p>
              </div>
              <span style={{ fontSize:11, padding:'3px 8px', borderRadius:8, fontWeight:600, whiteSpace:'nowrap',
                background:isAccepted?C.sageLight:isPending&&isReceived?C.primaryLight:C.bgDeep,
                color:isAccepted?C.sage:isPending&&isReceived?C.primary:C.textLight }}>
                {isAccepted?'✓ RDV':isPending&&isReceived?'⚡ Répondre':isPending?'En attente':'Terminé'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── MY PROFILE ───────────────────────────────────────────────────────────────
const LAUSANNE_ZONES = ['Centre','Flon','Ouchy','Lausanne-Ouest','Pully','Renens','Prilly','Chailly','Sallaz','Épalinges']
const SWISS_CITIES = ['Genève','Zurich','Berne','Fribourg','Neuchâtel','Sion','Lugano','Basel','Montreux']
const AVAIL_MODES = [
  { id:'professionnel', label:'💼 Pro', desc:'Networking, café pro' },
  { id:'amis', label:'👥 Amis / Activité', desc:'Balade, sport, culture' },
  { id:'rencontre', label:'💖 Rencontre', desc:'Date, romantique' },
]
function genTimeSlotsAvail() {
  const now=new Date(), slots:{label:string;iso:string}[]=[]
  const start=new Date(now); start.setSeconds(0,0)
  const m=start.getMinutes()
  start.setMinutes(m<30?30:60)
  if(m>=30) start.setHours(start.getHours()+1)
  for(let i=0;i<=36;i++){
    const t=new Date(start.getTime()+i*30*60000)
    const h=t.getHours(), mn=t.getMinutes()
    const diff=Math.round((t.getTime()-now.getTime())/60000)
    if(diff>1080) break
    slots.push({label:`${h}h${mn===0?'00':'30'} (dans ${diff<60?`${diff}min`:`${Math.floor(diff/60)}h`})`,iso:t.toISOString()})
  }
  return slots
}
function fmtIsoTime(iso:string|null){
  if(!iso)return ''
  const d=new Date(iso); if(isNaN(d.getTime()))return ''
  return `${d.getHours()}h${String(d.getMinutes()).padStart(2,'0')}`
}

function MyProfile({ user, go, signOut, save }: any) {
  const [editBio,setEditBio]=useState(false); const [bio,setBio]=useState(user?.bio||''); const [saving,setSaving]=useState(false)
  const [isAvailable,setIsAvailable]=useState(user?.is_available||false)
  const [editInterests,setEditInterests]=useState(false)
  const [selInterests,setSelInterests]=useState<string[]>(user?.interests||[])
  const [editAvail,setEditAvail]=useState(false)
  const [availZone,setAvailZone]=useState(user?.available_city?.includes('(')?user.available_city.match(/\(([^)]+)\)/)?.[1]||'Centre':'Centre')
  const [availCity,setAvailCity]=useState(user?.available_city?.startsWith('Lausanne')?'Lausanne':user?.available_city||'Lausanne')
  const [availFrom,setAvailFrom]=useState('')  // ISO string from dropdown
  const [availUntil,setAvailUntil]=useState('') // ISO string from dropdown
  const [availModes,setAvailModes]=useState<string[]>(user?.available_modes||[])
  const [locLoading,setLocLoading]=useState(false)
  const [locLabel,setLocLabel]=useState('')
  const timeSlots = genTimeSlotsAvail()
  const toggleMode=(m:string)=>setAvailModes(p=>p.includes(m)?p.filter(x=>x!==m):[...p,m])
  const getGPS=()=>{
    if(!('geolocation' in navigator)){alert('GPS non disponible sur ce navigateur');return}
    setLocLoading(true)
    navigator.geolocation.getCurrentPosition(async pos=>{
      try{
        const {latitude:lat,longitude:lng}=pos.coords
        const res=await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=fr`)
        const data=await res.json()
        const addr=data.address||{}
        const city=addr.city||addr.town||addr.village||'Lausanne'
        const suburb=addr.suburb||addr.neighbourhood||addr.district||''
        setAvailCity(city)
        if(suburb) setAvailZone(suburb)
        setLocLabel(`📍 ${city}${suburb?` · ${suburb}`:''}`)
      }catch{setLocLabel('')}
      setLocLoading(false)
    },()=>{alert('Accès GPS refusé. Active la localisation dans les réglages.');setLocLoading(false)},{timeout:10000,enableHighAccuracy:true})
  }
  const saveBio=async()=>{setSaving(true);await supabase.from('profiles').update({bio}).eq('id',user.id);save({bio});setSaving(false);setEditBio(false)}
  const toggleAvail=async()=>{const n=!isAvailable;setIsAvailable(n);await supabase.from('profiles').update({is_available:n}).eq('id',user.id);save({is_available:n})}
  const saveAvail=async()=>{
    if(availModes.length===0){alert('Choisis au moins un type de rencontre');return}
    setSaving(true)
    const city=availCity==='Lausanne'?`Lausanne (${availZone})`:availCity
    // Store as ISO timestamps (or empty = "maintenant")
    const fromIso = availFrom || new Date().toISOString()
    // Auto-expire: available_until = min(chosen until, now + 18h)
    const maxUntil = new Date(Date.now()+18*60*60*1000).toISOString()
    const untilIso = availUntil && availUntil < maxUntil ? availUntil : maxUntil
    await supabase.from('profiles').update({is_available:true,available_city:city,available_from:fromIso,available_until:untilIso,available_modes:availModes}).eq('id',user.id)
    save({is_available:true,available_city:city,available_from:fromIso,available_until:untilIso,available_modes:availModes})
    setIsAvailable(true);setSaving(false);setEditAvail(false)
  }
  const saveInterests=async()=>{setSaving(true);await supabase.from('profiles').update({interests:selInterests}).eq('id',user.id);save({interests:selInterests});setSaving(false);setEditInterests(false)}
  const toggleInterest=(i:string)=>setSelInterests(p=>p.includes(i)?p.filter(x=>x!==i):p.length<5?[...p,i]:p)
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bg, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y' }}>
      <div style={{ background:`linear-gradient(160deg,${C.primaryLight},${C.peachLight})`, padding:'28px 20px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:12, flexShrink:0 }}>
        <Avatar p={user||{}} size={80}/>
        <div style={{ textAlign:'center' }}>
          <h2 style={{ fontSize:22, fontWeight:800, color:C.text }}>{user?.name||'Mon profil'}{user?.age?`, ${user.age}`:''}</h2>
          <p style={{ fontSize:13, color:C.textMid }}>📍 {user?.neighborhood||'Lausanne'}{user?.job?` · ${user.job}`:''}</p>
        </div>
        {/* Disponibilité toggle */}
        <button onClick={toggleAvail} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 20px', borderRadius:20, border:`1.5px solid ${isAvailable?C.sage:C.border}`, background:isAvailable?C.sageLight:C.bgDeep, cursor:'pointer' }}>
          <div style={{ width:36, height:20, borderRadius:10, background:isAvailable?C.sage:C.border, position:'relative', transition:'background 0.3s' }}>
            <div style={{ width:16, height:16, borderRadius:'50%', background:'#fff', position:'absolute', top:2, left:isAvailable?18:2, transition:'left 0.3s' }}/>
          </div>
          <span style={{ fontSize:13, fontWeight:700, color:isAvailable?C.sage:C.textLight }}>{isAvailable?'● Je suis disponible':'○ Pas disponible'}</span>
        </button>
        <p style={{ fontSize:11, color:C.textLight, textAlign:'center' }}>Activé = tu apparais dans la liste des profils disponibles</p>
        {/* Availability detail */}
        <div style={{ width:'100%', padding:'0 4px' }}>
          {!editAvail ? (
            <button onClick={()=>setEditAvail(true)} style={{ width:'100%', padding:'10px 14px', borderRadius:12, border:`1px dashed ${C.border}`, background:'none', cursor:'pointer', color:C.primary, fontSize:13, fontWeight:600, fontFamily:'inherit', textAlign:'left' }}>
              📍 {user?.available_city||'Lausanne'}
              {user?.available_from&&fmtIsoTime(user.available_from)&&` · dès ${fmtIsoTime(user.available_from)}`}
              {user?.available_until&&fmtIsoTime(user.available_until)&&` → ${fmtIsoTime(user.available_until)}`}
              {' '}— Modifier
              {(user?.available_modes||[]).length>0&&<><br/><span style={{fontSize:11,color:C.textLight}}>{(user.available_modes as string[]).map((m:string)=>AVAIL_MODES.find(x=>x.id===m)?.label||m).join(' · ')}</span></>}
            </button>
          ) : (
            <div style={{ background:C.card, borderRadius:14, padding:14, border:`1px solid ${C.border}`, display:'flex', flexDirection:'column', gap:10 }}>
              <p style={{ fontWeight:700, color:C.text, fontSize:13 }}>🤝 Je cherche à rencontrer</p>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {AVAIL_MODES.map(m=>(
                  <button key={m.id} onClick={()=>toggleMode(m.id)} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:12, border:`1.5px solid ${availModes.includes(m.id)?C.primary:C.border}`, background:availModes.includes(m.id)?C.primaryLight:'none', cursor:'pointer', textAlign:'left' }}>
                    <span style={{ fontSize:20 }}>{m.label.split(' ')[0]}</span>
                    <div>
                      <div style={{ fontWeight:700, color:availModes.includes(m.id)?C.primary:C.text, fontSize:13 }}>{m.label.split(' ').slice(1).join(' ')}</div>
                      <div style={{ fontSize:11, color:C.textLight }}>{m.desc}</div>
                    </div>
                    {availModes.includes(m.id)&&<span style={{ marginLeft:'auto', color:C.primary }}>✓</span>}
                  </button>
                ))}
              </div>
              <button onClick={getGPS} disabled={locLoading} style={{ width:'100%', padding:'11px 14px', borderRadius:12, border:`1.5px solid ${C.primary}`, background:C.primaryLight, color:C.primary, fontWeight:700, fontSize:13, cursor:locLoading?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {locLoading?'⏳ Localisation en cours…':'📍 Utiliser ma position GPS'}
              </button>
              {locLabel&&<p style={{ fontSize:12, color:C.sage, fontWeight:600, textAlign:'center' }}>✓ Position détectée : {locLabel}</p>}
              <p style={{ fontWeight:700, color:C.text, fontSize:13 }}>🏙️ Ou choisis manuellement</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {(['Lausanne',...SWISS_CITIES]).map(c=>(
                  <button key={c} onClick={()=>setAvailCity(c)} style={{ padding:'5px 12px', borderRadius:20, border:`1.5px solid ${availCity===c?C.primary:C.border}`, background:availCity===c?C.primaryLight:'none', color:availCity===c?C.primary:C.textMid, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>{c}</button>
                ))}
              </div>
              {availCity==='Lausanne'&&<>
                <p style={{ fontWeight:700, color:C.text, fontSize:13 }}>📍 Quartier</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {LAUSANNE_ZONES.map(z=>(
                    <button key={z} onClick={()=>setAvailZone(z)} style={{ padding:'5px 12px', borderRadius:20, border:`1.5px solid ${availZone===z?C.primary:C.border}`, background:availZone===z?C.primaryLight:'none', color:availZone===z?C.primary:C.textMid, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>{z}</button>
                  ))}
                </div>
              </>}
              <p style={{ fontWeight:700, color:C.text, fontSize:13 }}>⏰ Disponible à partir de</p>
              <select value={availFrom} onChange={e=>setAvailFrom(e.target.value)} style={{ width:'100%', padding:'8px 12px', borderRadius:10, border:`1.5px solid ${C.border}`, background:C.bg, color:C.text, fontSize:13, fontFamily:'inherit', outline:'none' }}>
                <option value="">Maintenant</option>
                {timeSlots.map(t=><option key={t.iso} value={t.iso}>{t.label}</option>)}
              </select>
              <p style={{ fontWeight:700, color:C.text, fontSize:13 }}>🔚 Jusqu'à (max 18h)</p>
              <select value={availUntil} onChange={e=>setAvailUntil(e.target.value)} style={{ width:'100%', padding:'8px 12px', borderRadius:10, border:`1.5px solid ${C.border}`, background:C.bg, color:C.text, fontSize:13, fontFamily:'inherit', outline:'none' }}>
                <option value="">18h max (auto)</option>
                {timeSlots.map(t=><option key={t.iso} value={t.iso}>{t.label}</option>)}
              </select>
              <p style={{ fontSize:11, color:C.textLight }}>⚡ La disponibilité s'éteint automatiquement au bout de 18h max</p>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={saveAvail} disabled={saving} style={{ flex:1, padding:10, borderRadius:10, border:'none', background:`linear-gradient(135deg,${C.sage},#5A8A6A)`, color:'#fff', fontWeight:700, fontSize:13, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit' }}>{saving?'…':'✓ Je suis dispo !'}</button>
                <button onClick={()=>setEditAvail(false)} style={{ padding:'10px 14px', borderRadius:10, border:`1px solid ${C.border}`, background:'none', color:C.textMid, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Annuler</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ background:C.card, borderRadius:16, padding:16, border:`1px solid ${C.border}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <p style={{ fontWeight:700, color:C.text, fontSize:14 }}>À propos</p>
            <button onClick={()=>setEditBio(!editBio)} style={{ background:'none', border:'none', color:C.primary, fontSize:13, cursor:'pointer', fontWeight:600 }}>{editBio?'Annuler':'Modifier'}</button>
          </div>
          {editBio
            ? <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <textarea value={bio} onChange={e=>setBio(e.target.value)} rows={3} maxLength={140} style={{ width:'100%', border:`1.5px solid ${C.primary}`, borderRadius:10, padding:10, fontSize:14, fontFamily:'inherit', resize:'none', outline:'none', color:C.text, background:C.bgDeep, boxSizing:'border-box' }}/>
                <Btn onClick={saveBio} loading={saving}>Sauvegarder</Btn>
              </div>
            : <p style={{ color:C.textMid, fontSize:14, lineHeight:1.6 }}>{user?.bio||'Ajoute une bio pour te présenter…'}</p>
          }
        </div>
        <div style={{ background:C.card, borderRadius:16, padding:16, border:`1px solid ${C.border}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <p style={{ fontWeight:700, color:C.text, fontSize:14 }}>Mes passions ({selInterests.length}/5)</p>
            <button onClick={()=>setEditInterests(!editInterests)} style={{ background:'none', border:'none', color:C.primary, fontSize:13, cursor:'pointer', fontWeight:600, fontFamily:'inherit' }}>{editInterests?'Annuler':'Modifier'}</button>
          </div>
          {editInterests ? (
            <div>
              {INTERESTS_CATS.map(cat=>(
                <div key={cat.label} style={{ marginBottom:10 }}>
                  <p style={{ fontSize:11, fontWeight:700, color:C.textLight, letterSpacing:'0.08em', marginBottom:6 }}>{cat.icon} {cat.label.toUpperCase()}</p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {cat.items.map(item=>{const active=selInterests.includes(item);const disabled=!active&&selInterests.length>=5;return(
                      <button key={item} onClick={()=>toggleInterest(item)} style={{ padding:'5px 12px', borderRadius:20, fontSize:12, border:'none', cursor:disabled?'not-allowed':'pointer', background:active?C.primary:C.bgDeep, color:active?'#fff':C.textMid, opacity:disabled?.4:1, fontFamily:'inherit', fontWeight:500 }}>{item}</button>
                    )})}
                  </div>
                </div>
              ))}
              <Btn loading={saving} disabled={selInterests.length<3} onClick={saveInterests}>Sauvegarder les passions</Btn>
            </div>
          ) : (
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {selInterests.length>0
                ? selInterests.map((i:string)=><span key={i} style={{ padding:'5px 13px', borderRadius:20, fontSize:13, background:C.primaryLight, color:C.primaryDark }}>{i}</span>)
                : <p style={{ color:C.textLight, fontSize:13 }}>Ajoute tes passions pour apparaître dans les résultats.</p>
              }
            </div>
          )}
        </div>
        {/* Share */}
        <div style={{ background:C.card, borderRadius:16, padding:16, border:`1px solid ${C.border}` }}>
          <p style={{ fontWeight:700, color:C.text, fontSize:14, marginBottom:12 }}>📤 Partager</p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <button onClick={()=>shareIt({ title:'Mon profil Clutch', text:`Je suis sur Clutch, l'app des rencontres spontanées à Lausanne ! Rejoins-moi ☕`, url:APP_URL+'/app' })}
              style={{ padding:'11px 14px', borderRadius:12, border:`1.5px solid ${C.border}`, background:C.bgDeep, cursor:'pointer', color:C.text, fontSize:13, fontWeight:600, textAlign:'left', fontFamily:'inherit' }}>
              👤 Partager mon profil
            </button>
            <button onClick={()=>shareIt({ title:'Rejoins Clutch !', text:`Viens sur Clutch — l'app pour se retrouver en vrai dans les 18h à Lausanne ☕`, url:APP_URL })}
              style={{ padding:'11px 14px', borderRadius:12, border:`1.5px solid ${C.primary}44`, background:C.primaryLight, cursor:'pointer', color:C.primary, fontSize:13, fontWeight:600, textAlign:'left', fontFamily:'inherit' }}>
              ✉️ Inviter un(e) ami(e)
            </button>
            <button onClick={()=>shareIt({ title:'Clutch — rencontres spontanées', text:`Essaie la démo Clutch — l'app des RDV physiques dans les 18h à Lausanne ☕`, url:APP_URL+'/demo' })}
              style={{ padding:'11px 14px', borderRadius:12, border:`1.5px solid ${C.border}`, background:C.bgDeep, cursor:'pointer', color:C.textMid, fontSize:13, fontWeight:600, textAlign:'left', fontFamily:'inherit' }}>
              🎬 Partager la démo
            </button>
          </div>
        </div>
        {/* Certification */}
        <button onClick={()=>go('get-certified')} style={{ padding:13, borderRadius:14, background:user?.certified?C.sageLight:C.bgDeep, border:`1.5px solid ${user?.certified?C.sage:C.border}`, cursor:'pointer', color:user?.certified?C.sage:C.textMid, fontWeight:700, fontSize:13, textAlign:'left' }}>
          {user?.certified?'✅ Profil certifié':'✓ Certifier mon profil — boostez vos clutches'}
          {user?.certif_status==='pending'&&!user?.certified&&<span style={{ color:C.peach, marginLeft:6, fontSize:12 }}>· en attente de vérification</span>}
        </button>
        <button onClick={()=>go('sos')} style={{ padding:13, borderRadius:14, background:C.redLight, border:`1.5px solid ${C.red}33`, cursor:'pointer', color:C.red, fontWeight:700, fontSize:14 }}>🆘 SOS & Sécurité</button>
        <button onClick={signOut} style={{ padding:12, borderRadius:14, background:'none', border:`1.5px solid ${C.border}`, cursor:'pointer', color:C.textLight, fontSize:13 }}>Se déconnecter</button>
      </div>
    </div>
  )
}

// ─── CLUTCH RECEIVED ──────────────────────────────────────────────────────────
function ClutchReceived({ clutch, user, go, refresh }: any) {
  const [loading, setLoading] = useState<string|null>(null)
  if (!clutch) return null
  const sender = clutch.sender
  const expires = clutch.expires_at ? new Date(clutch.expires_at) : null
  const msLeft = expires ? expires.getTime() - Date.now() : 0
  const hLeft = Math.max(0, Math.floor(msLeft/3600000))
  const mLeft = Math.max(0, Math.floor((msLeft%3600000)/60000))

  const respond = async (status: 'accepted'|'declined') => {
    setLoading(status)
    await supabase.from('clutches').update({ status }).eq('id', clutch.id)
    refresh()
    if (status === 'accepted') go('rdv-active')
    else go('inbox')
    setLoading(null)
  }
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bg }}>
      <TopBar title="Clutch reçu ☕" onBack={()=>go('inbox')}/>
      <div style={{ flex:1, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y', padding:'16px 20px', display:'flex', flexDirection:'column', gap:14 }}>
        {/* Sender card */}
        <div style={{ background:`linear-gradient(135deg,${C.primaryLight},${C.peachLight})`, borderRadius:20, padding:20, display:'flex', gap:14, alignItems:'center' }}>
          <Avatar p={sender||{}} size={60}/>
          <div>
            <p style={{ fontWeight:800, fontSize:18, color:C.text }}>{sender?.name||'?'}</p>
            <p style={{ fontSize:13, color:C.textMid }}>📍 {sender?.neighborhood||'Lausanne'}</p>
            {sender?.reliability_score!=null&&<p style={{ fontSize:12, color:C.sage, fontWeight:600 }}>✓ Fiabilité {sender.reliability_score}%</p>}
          </div>
        </div>
        {/* RDV details */}
        <div style={{ background:C.card, borderRadius:16, padding:16, border:`1px solid ${C.border}`, display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ display:'flex', gap:12 }}>
            <span style={{ fontSize:20 }}>📍</span>
            <div><p style={{ fontWeight:700, fontSize:14, color:C.text }}>{clutch.venue}</p><SafetyBadge safety={clutch.venue_safety||'safe'}/></div>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <span style={{ fontSize:20 }}>🕐</span>
            <p style={{ fontSize:14, color:C.text, fontWeight:600 }}>{new Date(clutch.proposed_time).toLocaleString('fr-CH',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</p>
          </div>
        </div>
        {/* Message */}
        <div style={{ background:C.bgDeep, borderRadius:14, padding:'14px 16px', borderLeft:`3px solid ${C.primary}` }}>
          <p style={{ fontSize:12, color:C.textLight, marginBottom:6 }}>Message de {sender?.name}</p>
          <p style={{ fontSize:14, color:C.text, lineHeight:1.6, fontStyle:'italic' }}>"{clutch.message}"</p>
        </div>
        {/* Countdown */}
        {msLeft > 0 && <div style={{ background:C.primaryLight, borderRadius:12, padding:'10px 14px', textAlign:'center' }}>
          <p style={{ fontSize:12, color:C.primary, fontWeight:700 }}>⏳ Tu as {hLeft}h{String(mLeft).padStart(2,'0')} pour répondre</p>
        </div>}
      </div>
      <div style={{ padding:'12px 20px 28px', display:'flex', flexDirection:'column', gap:10 }}>
        <button onClick={()=>respond('accepted')} disabled={!!loading} style={{ padding:'15px', borderRadius:14, border:'none', background:loading?C.bgDeep:`linear-gradient(135deg,${C.sage},#5A8A6A)`, color:loading?C.textLight:'#fff', fontWeight:800, fontSize:16, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit' }}>
          {loading==='accepted'?'…':'✓ Accepter le RDV'}
        </button>
        <button onClick={()=>respond('declined')} disabled={!!loading} style={{ padding:'12px', borderRadius:14, border:`1.5px solid ${C.red}33`, background:C.redLight, color:C.red, fontWeight:700, fontSize:14, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit' }}>
          {loading==='declined'?'…':'✕ Refuser'}
        </button>
      </div>
    </div>
  )
}

// ─── CHAT RÉEL ────────────────────────────────────────────────────────────────
function Chat({ clutch, user, go }: any) {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const MSG_LIMIT = 8
  if (!clutch) return null
  const other = clutch.sender_id === user.id ? clutch.receiver : clutch.sender

  useEffect(()=>{
    supabase.from('messages').select('*').eq('clutch_id', clutch.id).order('created_at')
      .then(({data})=>{ if(data) setMessages(data) })
    const ch = supabase.channel(`chat-${clutch.id}`)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:`clutch_id=eq.${clutch.id}`},
        payload=>setMessages(prev=>[...prev,payload.new]))
      .subscribe()
    return ()=>{ supabase.removeChannel(ch) }
  },[clutch.id])

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[messages])

  const [inputErr, setInputErr] = useState('')
  const send = async () => {
    if(!input.trim()||messages.length>=MSG_LIMIT) return
    const text=input.trim()
    const lower=text.toLowerCase()
    if(BANNED_WORDS.some(w=>lower.includes(w))){setInputErr('Message inapproprié — merci de rester respectueux·se');setTimeout(()=>setInputErr(''),3000);return}
    setInput('');setInputErr('')
    await supabase.from('messages').insert({clutch_id:clutch.id,sender_id:user.id,content:text})
  }

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bg }}>
      <TopBar title={other?.name||'Chat'} onBack={()=>go('inbox')}/>
      <div style={{ padding:'6px 16px', background:C.bgDeep, fontSize:11, color:C.textMid, textAlign:'center' }}>
        📍 {clutch.venue} · {MSG_LIMIT - messages.length} message{MSG_LIMIT - messages.length > 1?'s':''} restant{MSG_LIMIT - messages.length > 1?'s':''}
      </div>
      <div style={{ flex:1, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y', padding:'12px 16px', display:'flex', flexDirection:'column', gap:8 }}>
        {messages.map(m=>{
          const isMine = m.sender_id === user.id
          return (
            <div key={m.id} style={{ display:'flex', justifyContent:isMine?'flex-end':'flex-start' }}>
              <div style={{ maxWidth:'78%', padding:'9px 13px', borderRadius:isMine?'16px 16px 4px 16px':'16px 16px 16px 4px', background:isMine?`linear-gradient(135deg,${C.primary},${C.primaryDark})`:'#fff', color:isMine?'#fff':C.text, fontSize:14, lineHeight:1.5, border:isMine?'none':`1px solid ${C.border}` }}>
                {m.content}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef}/>
      </div>
      {messages.length >= MSG_LIMIT
        ? <div style={{ padding:'12px 16px 20px', textAlign:'center', fontSize:12, color:C.textLight, background:C.bgDeep }}>
            Limite de {MSG_LIMIT} messages atteinte — le café est pour bientôt ☕
          </div>
        : <div style={{ background:C.bg, borderTop:`1px solid ${C.border}` }}>
            {inputErr&&<p style={{ fontSize:11, color:C.red, padding:'4px 16px 0', textAlign:'center' }}>{inputErr}</p>}
            <div style={{ padding:'10px 16px 24px', display:'flex', gap:8 }}>
              <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Ton message…"
                style={{ flex:1, padding:'11px 14px', borderRadius:20, border:`1.5px solid ${inputErr?C.red:C.border}`, background:C.bgDeep, fontSize:14, outline:'none', color:C.text, fontFamily:'inherit' }}/>
              <button onClick={send} disabled={!input.trim()} style={{ padding:'11px 18px', borderRadius:20, border:'none', background:input.trim()?`linear-gradient(135deg,${C.primary},${C.primaryDark})`:C.bgDeep, color:input.trim()?'#fff':C.textLight, fontWeight:700, fontSize:14, cursor:input.trim()?'pointer':'not-allowed', fontFamily:'inherit' }}>→</button>
            </div>
          </div>
      }
    </div>
  )
}

// ─── RDV ACTIVE ───────────────────────────────────────────────────────────────
function RdvActive({ clutch, user, go, refresh }: any) {
  const [countdown, setCountdown] = useState(0)
  if (!clutch) return null
  const other = clutch.sender_id === user.id ? clutch.receiver : clutch.sender
  const meetTime = new Date(clutch.proposed_time)

  useEffect(()=>{
    const update = () => setCountdown(Math.max(0, meetTime.getTime() - Date.now()))
    update()
    const t = setInterval(update, 1000)
    return ()=>clearInterval(t)
  },[])

  const h = Math.floor(countdown/3600000)
  const m = Math.floor((countdown%3600000)/60000)
  const s = Math.floor((countdown%60000)/1000)
  const isNow = countdown <= 0

  const cancel = async () => {
    await supabase.from('clutches').update({ status:'cancelled' }).eq('id', clutch.id)
    refresh(); go('inbox')
  }
  const checkin = async () => {
    const field = clutch.sender_id===user.id ? 'checked_in_sender' : 'checked_in_receiver'
    await supabase.from('clutches').update({ [field]:true, status:'completed' }).eq('id', clutch.id)
    refresh(); go('feedback')
  }

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bg }}>
      <TopBar title="RDV confirmé ✓" onBack={()=>go('inbox')}/>
      <div style={{ flex:1, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y', padding:'16px 20px', display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ background:`linear-gradient(135deg,${C.sageLight},${C.bgDeep})`, borderRadius:20, padding:20, textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:8 }}>☕</div>
          <p style={{ fontWeight:800, fontSize:17, color:C.text, marginBottom:4 }}>RDV avec {other?.name}</p>
          <p style={{ fontSize:13, color:C.textMid }}>📍 {clutch.venue}</p>
          <p style={{ fontSize:13, color:C.textMid, marginTop:4 }}>🗓 {meetTime.toLocaleString('fr-CH',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</p>
        </div>
        {!isNow && (
          <div style={{ background:C.card, border:`1.5px solid ${C.primary}44`, borderRadius:18, padding:20, textAlign:'center' }}>
            <p style={{ fontSize:12, color:C.textLight, marginBottom:6 }}>Rendez-vous dans</p>
            <p style={{ fontSize:36, fontWeight:900, color:C.primary, letterSpacing:'-0.03em' }}>
              {h>0?`${h}h `:''}{String(m).padStart(2,'0')}m {String(s).padStart(2,'0')}s
            </p>
          </div>
        )}
        {isNow && (
          <div style={{ background:C.sageLight, borderRadius:18, padding:20, textAlign:'center' }}>
            <p style={{ fontSize:18, fontWeight:800, color:C.sage }}>C'est l'heure ! 🎉</p>
            <p style={{ color:C.textMid, fontSize:13, marginTop:6 }}>Tu es arrivé·e ?</p>
          </div>
        )}
        <button onClick={()=>shareIt({ title:'Mon RDV ce soir', text:`Je suis à ${clutch.venue} pour un café avec quelqu'un via Clutch. Je te tiens au courant 😊`, url:`https://maps.google.com/?q=${encodeURIComponent(clutch.venue+' Lausanne')}` })} style={{ padding:'12px', borderRadius:14, background:C.bgDeep, border:`1px solid ${C.border}`, cursor:'pointer', color:C.textMid, fontWeight:600, fontSize:13, fontFamily:'inherit' }}>📤 Partager mon lieu avec un proche</button>
        <button onClick={()=>go('sos')} style={{ padding:'12px', borderRadius:14, background:C.redLight, border:`1.5px solid ${C.red}33`, cursor:'pointer', color:C.red, fontWeight:700, fontSize:14, fontFamily:'inherit' }}>🆘 SOS · Sécurité</button>
        <button onClick={()=>{ setSelectedClutch_HACK(clutch); go('chat') }} style={{ padding:12, borderRadius:14, background:C.bgDeep, border:`1px solid ${C.border}`, cursor:'pointer', color:C.textMid, fontSize:13, fontFamily:'inherit' }}>💬 Envoyer un message</button>
      </div>
      <div style={{ padding:'10px 20px 28px', display:'flex', flexDirection:'column', gap:10 }}>
        {isNow && <button onClick={checkin} style={{ padding:14, borderRadius:14, border:'none', background:`linear-gradient(135deg,${C.sage},#5A8A6A)`, color:'#fff', fontWeight:800, fontSize:15, cursor:'pointer', fontFamily:'inherit' }}>✓ Je suis arrivé·e (check-in)</button>}
        <button onClick={cancel} style={{ padding:11, borderRadius:12, background:'none', border:`1.5px solid ${C.border}`, color:C.textLight, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>Annuler le RDV</button>
      </div>
    </div>
  )
}
// ─── FEEDBACK APRÈS RDV ───────────────────────────────────────────────────────
function FeedbackRdv({ clutch, user, go }: any) {
  const [rating, setRating] = useState<string|null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const other = clutch ? (clutch.sender_id===user?.id ? clutch.receiver : clutch.sender) : null

  const submit = async () => {
    if (!rating || !clutch?.id) { go('discover'); return }
    setLoading(true)
    await supabase.from('feedback').insert({ clutch_id: clutch.id, given_by: user.id, rating })
    // Mettre à jour le score de fiabilité de l'autre personne
    if (other?.id) {
      const otherId = clutch.sender_id===user.id ? clutch.receiver_id : clutch.sender_id
      if (rating === 'ghost' || rating === 'rabbit') {
        const { data: p } = await supabase.from('profiles').select('reliability_score').eq('id', otherId).single()
        const newScore = Math.max(0, (p?.reliability_score||100) - 15)
        await supabase.from('profiles').update({ reliability_score: newScore }).eq('id', otherId)
      } else if (rating === 'super') {
        const { data: p } = await supabase.from('profiles').select('reliability_score').eq('id', otherId).single()
        const newScore = Math.min(100, (p?.reliability_score||100) + 3)
        await supabase.from('profiles').update({ reliability_score: newScore }).eq('id', otherId)
      }
    }
    setDone(true); setLoading(false)
  }

  if (done) return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:`linear-gradient(160deg,${C.bg},${C.sageLight})`, padding:40, gap:20, textAlign:'center' }}>
      <div style={{ fontSize:64 }}>{rating==='super'?'⭐':rating==='ok'?'😊':rating==='rabbit'?'🐇':'👻'}</div>
      <h2 style={{ fontSize:22, fontWeight:800, color:C.text }}>Merci pour ton retour !</h2>
      <p style={{ color:C.textMid, fontSize:14, lineHeight:1.6 }}>Ça aide à maintenir une communauté de qualité sur Clutch.</p>
      <Btn onClick={()=>go('discover')}>Retour à la liste ✦</Btn>
    </div>
  )

  const opts = [
    { id:'super', emoji:'⭐', label:'Super RDV !', desc:'On s\'est bien vus, c\'était génial', color:C.gold },
    { id:'ok', emoji:'😊', label:'RDV correct', desc:'Rien d\'extraordinaire mais c\'était bien', color:C.sage },
    { id:'rabbit', emoji:'🐇', label:'Lapin partiel', desc:'En retard ou pas tout à fait comme prévu', color:C.peach },
    { id:'ghost', emoji:'👻', label:'Fantôme / No-show', desc:'La personne n\'est pas venue sans prévenir', color:C.red },
  ]

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bg }}>
      <TopBar title="Comment s'est passé le RDV ?" onBack={()=>go('discover')}/>
      <div style={{ flex:1, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y', padding:'20px 20px' }}>
        {other && (
          <div style={{ display:'flex', alignItems:'center', gap:12, background:C.bgDeep, borderRadius:14, padding:'12px 16px', marginBottom:20 }}>
            <Avatar p={other} size={44}/>
            <div>
              <p style={{ fontWeight:700, color:C.text, fontSize:15 }}>RDV avec {other.name}</p>
              <p style={{ fontSize:12, color:C.textLight }}>📍 {clutch?.venue}</p>
            </div>
          </div>
        )}
        <p style={{ fontWeight:700, color:C.text, fontSize:14, marginBottom:12 }}>Comment s'est passé votre rencontre ?</p>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {opts.map(o => (
            <button key={o.id} onClick={()=>setRating(o.id)} style={{ padding:'14px 16px', borderRadius:14, border:`2px solid ${rating===o.id?o.color:C.border}`, background:rating===o.id?`${o.color}18`:C.card, textAlign:'left', cursor:'pointer', display:'flex', gap:14, alignItems:'center' }}>
              <span style={{ fontSize:28 }}>{o.emoji}</span>
              <div>
                <p style={{ fontWeight:700, color:rating===o.id?o.color:C.text, fontSize:14 }}>{o.label}</p>
                <p style={{ fontSize:12, color:C.textLight, marginTop:2 }}>{o.desc}</p>
              </div>
            </button>
          ))}
        </div>
        <p style={{ fontSize:11, color:C.textLight, textAlign:'center', marginTop:16, lineHeight:1.5 }}>Ton retour est anonyme. Il influe sur le score de fiabilité de l'autre personne.</p>
      </div>
      <div style={{ padding:'12px 20px 28px', display:'flex', flexDirection:'column', gap:10 }}>
        <Btn onClick={submit} loading={loading} disabled={!rating}>Envoyer mon retour →</Btn>
        <button onClick={()=>go('discover')} style={{ background:'none', border:'none', color:C.textLight, fontSize:13, cursor:'pointer' }}>Passer</button>
      </div>
    </div>
  )
}

// ─── PROFIL CERTIFIÉ ──────────────────────────────────────────────────────────
function GetCertified({ user, go, save }: any) {
  const [step, setStep] = useState<'intro'|'selfie'|'done'>(user?.certified?'done':'intro')
  const [preview, setPreview] = useState<string|null>(null)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader(); r.onload = ev => setPreview(ev.target?.result as string); r.readAsDataURL(f)
  }

  const submit = async () => {
    if (!preview || !ref.current?.files?.[0]) return
    setLoading(true)
    try {
      const file = ref.current.files[0]
      const path = `${user.id}/selfie_certif.${file.name.split('.').pop()}`
      await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('profiles').update({ certif_selfie: publicUrl, certif_status: 'pending' }).eq('id', user.id)
      save({ certif_status: 'pending' })
      setStep('done')
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  if (user?.certified) return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:C.bg, padding:40, gap:20, textAlign:'center' }}>
      <div style={{ fontSize:64 }}>✅</div>
      <h2 style={{ fontSize:22, fontWeight:800, color:C.text }}>Profil certifié !</h2>
      <div style={{ background:C.sageLight, borderRadius:16, padding:16 }}><p style={{ color:C.sage, fontWeight:600 }}>✓ Ton badge de certification est actif</p></div>
      <Btn variant="secondary" onClick={()=>go('myprofile')}>← Retour au profil</Btn>
    </div>
  )

  if (step === 'done') return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:`linear-gradient(160deg,${C.bg},${C.sageLight})`, padding:40, gap:20, textAlign:'center' }}>
      <div style={{ fontSize:64 }}>⏳</div>
      <h2 style={{ fontSize:22, fontWeight:800, color:C.text }}>Selfie envoyé !</h2>
      <p style={{ color:C.textMid, fontSize:14, lineHeight:1.7 }}>L'équipe Clutch vérifie ton selfie sous <strong>24h</strong>.<br/>Tu recevras une confirmation par email.</p>
      <div style={{ background:C.card, borderRadius:14, padding:16, width:'100%', border:`1px solid ${C.border}`, fontSize:13, color:C.textMid, lineHeight:1.6 }}>
        ✅ Une fois certifié·e :<br/>
        📌 Badge <strong>✓ Certifié</strong> sur ton profil<br/>
        🔝 Priorité dans la liste de découverte<br/>
        💜 3× plus de clutches reçus
      </div>
      <Btn onClick={()=>go('myprofile')}>← Retour au profil</Btn>
    </div>
  )

  if (step === 'selfie') return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'32px 24px', gap:20, background:C.bg }}>
      <button onClick={()=>setStep('intro')} style={{ background:'none', border:'none', fontSize:22, color:C.textMid, cursor:'pointer', alignSelf:'flex-start' }}>←</button>
      <div>
        <h2 style={{ fontSize:22, fontWeight:800, color:C.text }}>Selfie de vérification</h2>
        <p style={{ color:C.textMid, fontSize:14, marginTop:6 }}>Tiens ton téléphone devant toi, sourire obligatoire 😊</p>
      </div>
      <div style={{ background:C.bgDeep, borderRadius:14, padding:'12px 16px', display:'flex', flexDirection:'column', gap:6 }}>
        <p style={{ fontSize:13, fontWeight:700, color:C.text }}>📋 Instructions :</p>
        {['Prends un selfie clair de ton visage','Pas de filtre, pas de photo de photo','Même visage que ta photo de profil'].map(t=><p key={t} style={{ fontSize:13, color:C.textMid }}>• {t}</p>)}
      </div>
      <input ref={ref} type="file" accept="image/*" capture="user" onChange={onChange} style={{ display:'none' }}/>
      <div onClick={()=>ref.current?.click()} style={{ alignSelf:'center', width:160, height:160, borderRadius:'50%', background:preview?`url(${preview}) center/cover no-repeat`:C.bgDeep, border:`3px dashed ${preview?C.sage:C.border}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, cursor:'pointer', overflow:'hidden' }}>
        {!preview&&<><span style={{ fontSize:44 }}>🤳</span><span style={{ color:C.textLight, fontSize:12 }}>Prendre un selfie</span></>}
      </div>
      {preview&&<p style={{ textAlign:'center', color:C.sage, fontWeight:600 }}>✓ Parfait ! On dirait bien toi 😄</p>}
      <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:10 }}>
        <Btn loading={loading} disabled={!preview} onClick={submit}>Envoyer pour vérification →</Btn>
      </div>
    </div>
  )

  // step = 'intro'
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'32px 24px', gap:20, background:C.bg, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y' }}>
      <button onClick={()=>go('myprofile')} style={{ background:'none', border:'none', fontSize:22, color:C.textMid, cursor:'pointer', alignSelf:'flex-start' }}>←</button>
      <div style={{ textAlign:'center', paddingTop:8 }}>
        <div style={{ fontSize:56, marginBottom:12 }}>✓</div>
        <h2 style={{ fontSize:24, fontWeight:800, color:C.text }}>Fais certifier ton profil</h2>
        <p style={{ color:C.textMid, fontSize:14, marginTop:8, lineHeight:1.7 }}>Un selfie rapide suffit. L'équipe Clutch vérifie que c'est bien toi sous 24h.</p>
      </div>
      {[
        { icon:'🔝', title:'Priorité dans la liste', desc:'Les profils certifiés apparaissent en premier' },
        { icon:'💌', title:'3× plus de clutches', desc:'Les gens font + confiance aux profils vérifiés' },
        { icon:'🛡', title:'Badge visible', desc:'✓ Certifié sur ta fiche — rassurant pour tous' },
      ].map(b=>(
        <div key={b.title} style={{ background:C.card, borderRadius:14, padding:'14px 16px', border:`1px solid ${C.border}`, display:'flex', gap:14, alignItems:'center' }}>
          <span style={{ fontSize:28 }}>{b.icon}</span>
          <div><p style={{ fontWeight:700, color:C.text, fontSize:14 }}>{b.title}</p><p style={{ color:C.textLight, fontSize:12, marginTop:2 }}>{b.desc}</p></div>
        </div>
      ))}
      <div style={{ background:C.bgDeep, borderRadius:12, padding:'12px 16px', fontSize:12, color:C.textLight, lineHeight:1.6 }}>
        🔒 Ton selfie est utilisé uniquement pour la vérification et supprimé après. Jamais partagé publiquement.
      </div>
      <div style={{ marginTop:'auto' }}>
        <Btn onClick={()=>setStep('selfie')}>Commencer la vérification → (30 sec)</Btn>
      </div>
    </div>
  )
}

// hack ref pour chat depuis RdvActive (pas de closure propre sans refactor)
let setSelectedClutch_HACK: (c:any)=>void = ()=>{}

function Sos({ go }: { go:(s:Screen)=>void }) {
  const [gpsStatus,setGpsStatus]=useState<'idle'|'loading'|'active'|'error'>('idle')
  const [gpsCoords,setGpsCoords]=useState<{lat:number;lng:number}|null>(null)
  const [gpsTime,setGpsTime]=useState(0)
  const timerRef=useRef<any>(null)
  const [contacts,setContacts]=useState<{name:string;phone:string}[]>(()=>JSON.parse(typeof window!=='undefined'?localStorage.getItem('sos_contacts')||'[]':'[]'))
  const [addingContact,setAddingContact]=useState(false)
  const [cName,setCName]=useState('')
  const [cPhone,setCPhone]=useState('')
  const saveContact=()=>{if(!cName.trim()||!cPhone.trim())return;const updated=[...contacts,{name:cName.trim(),phone:cPhone.trim()}];setContacts(updated);localStorage.setItem('sos_contacts',JSON.stringify(updated));setCName('');setCPhone('');setAddingContact(false)}
  const removeContact=(i:number)=>{const updated=contacts.filter((_,idx)=>idx!==i);setContacts(updated);localStorage.setItem('sos_contacts',JSON.stringify(updated))}

  const startGps=()=>{
    if(!navigator.geolocation){setGpsStatus('error');return}
    setGpsStatus('loading')
    navigator.geolocation.getCurrentPosition(
      pos=>{
        setGpsCoords({lat:pos.coords.latitude,lng:pos.coords.longitude})
        setGpsStatus('active')
        setGpsTime(0)
        timerRef.current=setInterval(()=>setGpsTime(t=>t+1),1000)
      },
      ()=>setGpsStatus('error'),
      {enableHighAccuracy:true}
    )
  }
  const stopGps=()=>{
    setGpsStatus('idle');setGpsCoords(null)
    if(timerRef.current)clearInterval(timerRef.current)
  }
  const fmtTime=(s:number)=>`${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`
  const mapsUrl=gpsCoords?`https://maps.google.com/?q=${gpsCoords.lat},${gpsCoords.lng}`:''

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bg }}>
      <TopBar title="Sécurité" onBack={()=>go('myprofile')}/>
      <div style={{ flex:1, padding:'12px 20px', display:'flex', flexDirection:'column', gap:14, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y' }}>
        <div style={{ padding:16, background:C.redLight, borderRadius:16, border:`1.5px solid ${C.red}33`, textAlign:'center' }}>
          <p style={{ fontSize:32 }}>🆘</p>
          <p style={{ fontWeight:700, color:C.red, fontSize:16 }}>Besoin d'aide ?</p>
        </div>
        <a href="tel:117" style={{ display:'block', padding:18, borderRadius:16, background:`linear-gradient(135deg,${C.red},#B83030)`, color:'#fff', fontWeight:800, fontSize:17, textAlign:'center', textDecoration:'none' }}>📞 Appeler le 117 (Police)</a>
        <a href="tel:144" style={{ display:'block', padding:14, borderRadius:16, background:C.redLight, border:`1.5px solid ${C.red}44`, color:C.red, fontWeight:700, fontSize:15, textAlign:'center', textDecoration:'none' }}>🚑 Appeler le 144 (Urgences)</a>

        {/* GPS position sharing */}
        <div style={{ background:C.card, borderRadius:16, padding:16, border:`1px solid ${C.border}` }}>
          <p style={{ fontWeight:700, color:C.text, marginBottom:10, fontSize:14 }}>📍 Partager ma position GPS</p>
          {gpsStatus==='idle'&&(
            <button onClick={startGps} style={{ width:'100%', padding:12, borderRadius:12, border:'none', background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`, color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>Activer le partage de position</button>
          )}
          {gpsStatus==='loading'&&<p style={{ color:C.textLight, fontSize:13, textAlign:'center' }}>Localisation en cours…</p>}
          {gpsStatus==='error'&&<p style={{ color:C.red, fontSize:13 }}>GPS non disponible. Copie ce lien manuellement.</p>}
          {gpsStatus==='active'&&gpsCoords&&(
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ background:C.sageLight, borderRadius:10, padding:'10px 14px' }}>
                <p style={{ color:C.sage, fontWeight:700, fontSize:13 }}>● Position active depuis {fmtTime(gpsTime)}</p>
                <p style={{ fontSize:11, color:C.textMid, marginTop:4 }}>{gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)}</p>
              </div>
              <a href={mapsUrl} target="_blank" rel="noreferrer" style={{ display:'block', padding:10, borderRadius:10, background:C.bgDeep, border:`1px solid ${C.border}`, color:C.primary, fontWeight:700, fontSize:13, textAlign:'center', textDecoration:'none' }}>Ouvrir dans Google Maps →</a>
              <button onClick={()=>{if(navigator.share){navigator.share({title:'Ma position Clutch',url:mapsUrl})}else{navigator.clipboard?.writeText(mapsUrl)}}} style={{ width:'100%', padding:10, borderRadius:10, border:`1.5px solid ${C.primary}`, background:'transparent', color:C.primary, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>📋 Copier le lien de position</button>
              <button onClick={stopGps} style={{ background:'none', border:'none', color:C.textLight, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>Arrêter le partage</button>
            </div>
          )}
        </div>

        {/* Contacts de confiance */}
        <div style={{ background:C.card, borderRadius:16, padding:16, border:`1px solid ${C.border}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <p style={{ fontWeight:700, color:C.text, fontSize:14 }}>👥 Contacts de confiance</p>
            <button onClick={()=>setAddingContact(!addingContact)} style={{ background:'none', border:'none', color:C.primary, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>{addingContact?'Annuler':'+ Ajouter'}</button>
          </div>
          {addingContact&&(
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:10 }}>
              <input value={cName} onChange={e=>setCName(e.target.value)} placeholder="Prénom (ex: Maman)" style={{ padding:'9px 12px', borderRadius:10, border:`1.5px solid ${C.border}`, background:C.bgDeep, fontSize:13, color:C.text, outline:'none', fontFamily:'inherit' }}/>
              <input value={cPhone} onChange={e=>setCPhone(e.target.value)} placeholder="Numéro (ex: +41 79 000 00 00)" type="tel" style={{ padding:'9px 12px', borderRadius:10, border:`1.5px solid ${C.border}`, background:C.bgDeep, fontSize:13, color:C.text, outline:'none', fontFamily:'inherit' }}/>
              <button onClick={saveContact} style={{ padding:'9px', borderRadius:10, border:'none', background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Sauvegarder</button>
            </div>
          )}
          {contacts.length===0&&!addingContact&&<p style={{ fontSize:12, color:C.textLight }}>Ajoute des proches pour partager ta position en cas de besoin.</p>}
          {contacts.map((c,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:`1px solid ${C.border}` }}>
              <div><p style={{ fontWeight:600, fontSize:13, color:C.text }}>{c.name}</p><p style={{ fontSize:11, color:C.textLight }}>{c.phone}</p></div>
              <div style={{ display:'flex', gap:8 }}>
                <a href={`tel:${c.phone}`} style={{ padding:'5px 10px', borderRadius:8, background:C.sageLight, color:C.sage, fontSize:12, fontWeight:700, textDecoration:'none' }}>📞</a>
                <button onClick={()=>removeContact(i)} style={{ padding:'5px 10px', borderRadius:8, background:C.redLight, color:C.red, border:'none', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>✕</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background:C.card, borderRadius:14, padding:16, border:`1px solid ${C.border}` }}>
          <p style={{ fontWeight:700, color:C.text, marginBottom:8 }}>💡 Conseils</p>
          {['Premier RDV = lieu public animé','Dis à un proche où tu vas','Fais confiance à ton instinct','Tu peux partir à tout moment'].map(tip=>(
            <p key={tip} style={{ fontSize:13, color:C.textMid, padding:'4px 0', display:'flex', gap:8 }}><span style={{ color:C.sage }}>✓</span>{tip}</p>
          ))}
        </div>
        <Btn variant="secondary" onClick={()=>go('myprofile')}>← Retour</Btn>
      </div>
    </div>
  )
}


// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>('splash')
  const [user, setUser] = useState<any>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [clutches, setClutches] = useState<any[]>([])
  const [pendingBadge, setPendingBadge] = useState(0)
  const [tab, setTabState] = useState('discover')
  const [loading, setLoading] = useState(true)
  const [selectedProfile, setSelectedProfile] = useState<Profile|null>(null)
  const [selectedClutch, setSelectedClutch] = useState<any>(null)
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  // propose state
  const [venueInput, setVenueInput] = useState('')
  const [selectedVenue, setSelectedVenue] = useState('')
  const [venueSafety, setVenueSafety] = useState<'safe'|'neutral'|'alert'>('safe')
  const [selectedTime, setSelectedTime] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const go = (s: Screen) => setScreen(s)
  const setTab = (t: string) => { setTabState(t); setScreen(t as Screen) }
  const save = (patch: any) => setUser((u: any) => ({ ...u, ...patch }))
  // Expose setSelectedClutch for RdvActive → Chat navigation
  useEffect(() => { setSelectedClutch_HACK = setSelectedClutch }, [])
  const refreshClutches = () => supabase.from('clutches').select('*,sender:profiles!clutches_sender_id_fkey(*),receiver:profiles!clutches_receiver_id_fkey(*)')
    .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
    .then(({ data }) => { if (data) { setClutches(data); setPendingBadge(data.filter((c:any) => c.receiver_id===user?.id&&c.status==='pending').length) } })

  useEffect(() => {
    // Timeout de sécurité : si Supabase ne répond pas en 8s, on affiche quand même l'app
    const timeout = setTimeout(() => setLoading(false), 8000)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeout)
      if (session?.user) {
        try {
          const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
          const u = p || { id: session.user.id }
          setUser(u)
          const obDone = typeof localStorage !== 'undefined' && localStorage.getItem('ob_'+session.user.id)
          if (obDone && p?.name && p.name !== 'Utilisateur') {
            setScreen('discover')
          } else {
            if (!p?.name || p.name === 'Utilisateur') setScreen('ob-name')
            else if (!p?.gender) setScreen('ob-gender')
            else if (!p?.age) setScreen('ob-age')
            else if (!p?.interests || (p.interests as string[]).length === 0) setScreen('ob-interests')
            else { localStorage.setItem('ob_'+session.user.id,'1'); setScreen('discover') }
          }
        } catch(e) { console.error('profile load error', e) }
      }
      setLoading(false)
    }).catch(e => { clearTimeout(timeout); console.error('getSession error', e); setLoading(false) })
  }, [])

  // Auto-expiry check (separate so it doesn't block profile/clutch loading)
  useEffect(() => {
    if (!user?.id || !user?.name) return
    const checkExpiry = () => {
      if (user.is_available && user.available_until) {
        const until = new Date(user.available_until)
        if (!isNaN(until.getTime()) && until < new Date()) {
          supabase.from('profiles').update({is_available:false,available_from:null,available_until:null}).eq('id',user.id)
          save({is_available:false,available_from:null,available_until:null})
        }
      }
    }
    checkExpiry()
    const expiryTimer = setInterval(checkExpiry, 60000)
    return () => clearInterval(expiryTimer)
  }, [user?.id, user?.name, user?.is_available, user?.available_until])

  // Load profiles, clutches, setup realtime
  useEffect(() => {
    if (!user?.id || !user?.name) return
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    supabase.from('profiles').select('*').neq('id', user.id).then(({ data }) => { if (data) setProfiles(data) })
    const loadClutches = () => supabase.from('clutches').select('*,sender:profiles!clutches_sender_id_fkey(*),receiver:profiles!clutches_receiver_id_fkey(*)')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .then(({ data }) => {
        if (data) { setClutches(data); setPendingBadge(data.filter((c:any) => c.receiver_id===user.id&&c.status==='pending').length) }
      })
    loadClutches()
    const channel = supabase.channel('notif-'+user.id)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'clutches', filter:`receiver_id=eq.${user.id}` }, () => {
        setPendingBadge(b => b+1)
        loadClutches()
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('☕ Nouveau clutch !', { body: 'Quelqu\'un te propose un café. Tu as 2h pour répondre.' })
        }
      })
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'clutches', filter:`sender_id=eq.${user.id}` }, () => loadClutches())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user?.id, user?.name])

  const sendClutch = async () => {
    if (!user?.id || !selectedProfile?.id || !venueInput || !selectedTime || message.trim().length < 10) return
    setSending(true)
    // Rate limiting : max 3 clutches envoyés par jour
    const today = new Date(); today.setHours(0,0,0,0)
    const { count } = await supabase.from('clutches').select('id',{count:'exact',head:true})
      .eq('sender_id',user.id).gte('created_at',today.toISOString())
    if ((count||0) >= 3) {
      alert('Tu as atteint la limite de 3 clutches par jour. Reviens demain !')
      setSending(false); return
    }
    const proposedTime = new Date(selectedTime).toISOString()
    const { error } = await supabase.from('clutches').insert({
      sender_id: user.id, receiver_id: selectedProfile.id,
      venue: venueInput, venue_safety: venueSafety,
      proposed_time: proposedTime, message: message.trim(),
      expires_at: new Date(Date.now() + 2*60*60*1000).toISOString()
    })
    if (!error) { setMessage(''); go('sent') }
    setSending(false)
  }

  const signOut = async () => { await supabase.auth.signOut(); setUser(null); setScreen('splash') }

  const TAB_SCREENS = ['discover','events','inbox','myprofile','create-event','my-events','chat','clutch-received','rdv-active']
  const showTabBar = TAB_SCREENS.includes(screen) && !!user?.name

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(160deg,#FDF6F0,${C.primaryLight})`, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:44, fontWeight:900, letterSpacing:'-0.05em', color:C.text }}>CLU<span style={{ color:C.primary }}>TCH</span></div>
        <p style={{ color:C.textLight, marginTop:8 }}>Chargement…</p>
      </div>
    </div>
  )

  // Mobile: plein écran sans frame. Desktop: frame centré.
  const frameStyle: React.CSSProperties = isMobile
    ? { width:'100%', height:'100dvh', background:C.bg, display:'flex', flexDirection:'column', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', position:'relative' as const }
    : { width:390, maxWidth:'100%', background:C.bg, borderRadius:44, overflow:'hidden', boxShadow:'0 28px 70px rgba(0,0,0,0.18)', display:'flex', flexDirection:'column', height:'min(844px,85vh)', position:'relative' as const }

  return (
    <div style={{ minHeight:'100vh', background:isMobile?C.bg:`linear-gradient(135deg,#F5E6DC,#EDE0F0,#DCE8F5)`, display:'flex', alignItems:'center', justifyContent:'center', padding:isMobile?0:'60px 16px 16px', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', boxSizing:'border-box' }}>
      {/* Top nav — desktop only */}
      {!isMobile&&<div style={{ position:'fixed', top:14, left:'50%', transform:'translateX(-50%)', zIndex:100, display:'flex', gap:8, alignItems:'center' }}>
        <a href="/" style={{ background:'rgba(255,255,255,0.88)', backdropFilter:'blur(8px)', padding:'6px 14px', borderRadius:20, fontSize:12, color:C.text, textDecoration:'none', fontWeight:600, border:`1px solid ${C.border}` }}>← Accueil</a>
        <div style={{ background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`, borderRadius:20, padding:'5px 12px', fontSize:11, fontWeight:800, color:'#fff', letterSpacing:'0.05em' }}>✦ APP RÉELLE</div>
        <a href="/demo" style={{ background:'rgba(255,255,255,0.88)', backdropFilter:'blur(8px)', padding:'6px 14px', borderRadius:20, fontSize:12, color:C.textMid, textDecoration:'none', fontWeight:500, border:`1px solid ${C.border}` }}>🎬 Démo</a>
      </div>}

      {/* Frame : phone sur desktop, plein écran sur mobile */}
      <div style={frameStyle}>
        {/* Notch desktop seulement */}
        {!isMobile&&<div style={{ height:40, background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <div style={{ width:110, height:28, background:C.text, borderRadius:20, opacity:0.06 }}/>
        </div>}

        {/* Content */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:0, overflow:isMobile?'visible':'hidden' }}>
          {screen==='splash' && <Splash go={go}/>}
          {screen==='login' && <Login go={go} setUser={setUser}/>}
          {screen==='register' && <Register go={go} setUser={setUser}/>}
          {screen==='forgot-password' && <ForgotPassword go={go}/>}
          {screen==='ob-name' && <ObName go={go} user={user} save={save}/>}
          {screen==='ob-gender' && <ObGender go={go} user={user} save={save}/>}
          {screen==='ob-age' && <ObAge go={go} user={user} save={save}/>}
          {screen==='ob-photo' && <ObPhoto go={go} user={user} save={save}/>}
          {screen==='ob-interests' && <ObInterests go={go} user={user} save={save}/>}
          {screen==='ob-done' && <ObDone go={go} user={user}/>}
          {screen==='discover' && <Discover profiles={profiles} user={user} onSelect={(p:Profile)=>setSelectedProfile(p)} go={go}/>}
          {screen==='profile-detail' && <ProfileDetail profile={selectedProfile} go={go} currentUser={user}/>}
          {screen==='events' && <Events user={user} go={go}/>}
          {screen==='create-event' && <CreateEvent user={user} go={go}/>}
          {screen==='my-events' && <MyEvents user={user} go={go}/>}
          {screen==='inbox' && <Inbox clutches={clutches} user={user} go={go} setSelectedClutch={setSelectedClutch}/>}
          {screen==='myprofile' && <MyProfile user={user} go={go} signOut={signOut} save={save}/>}
          {screen==='sos' && <Sos go={go}/>}
          {screen==='propose' && <Propose profile={selectedProfile} go={go} setVenue={setSelectedVenue} setVenueInput={setVenueInput} venueInput={venueInput} selectedVenue={selectedVenue} venueSafety={venueSafety} setVenueSafety={setVenueSafety}/>}
          {screen==='propose2' && <Propose2 profile={selectedProfile} go={go} selectedTime={selectedTime} setSelectedTime={setSelectedTime} venueInput={venueInput}/>}
          {screen==='propose3' && <Propose3 profile={selectedProfile} go={go} venueInput={venueInput} selectedTime={selectedTime} message={message} setMessage={setMessage} onSend={sendClutch} sending={sending}/>}
          {screen==='sent' && <Sent profile={selectedProfile} go={go} venueInput={venueInput} selectedTime={selectedTime}/>}
          {screen==='chat' && <Chat clutch={selectedClutch} user={user} go={go}/>}
          {screen==='clutch-received' && <ClutchReceived clutch={selectedClutch} user={user} go={go} refresh={refreshClutches}/>}
          {screen==='rdv-active' && <RdvActive clutch={selectedClutch} user={user} go={go} refresh={refreshClutches}/>}
          {screen==='feedback' && <FeedbackRdv clutch={selectedClutch} user={user} go={go}/>}
          {screen==='get-certified' && <GetCertified user={user} go={go} save={save}/>}
          {showTabBar && <TabBar tab={tab} setTab={setTab} badge={pendingBadge}/>}
        </div>

        {/* Home bar desktop seulement */}
        {!isMobile&&<div style={{ height:24, display:'flex', alignItems:'center', justifyContent:'center', background:C.bg, flexShrink:0 }}>
          <div style={{ width:90, height:4, background:C.text, borderRadius:2, opacity:0.1 }}/>
        </div>}
      </div>
    </div>
  )
}
