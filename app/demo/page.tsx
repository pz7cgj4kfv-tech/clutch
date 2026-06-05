'use client'
import { useState, useEffect, useRef } from 'react'

// ─── PALETTE ──────────────────────────────────────────────────────────────────
const C = {
  bg: '#FDFAF7',
  bgDeep: '#F5F0EA',
  primary: '#C4748A',
  primaryDark: '#A85C72',
  primaryLight: '#F2D4DB',
  sage: '#7A9E8A',
  sageLight: '#D4E8DE',
  peach: '#E8A87C',
  peachLight: '#FAEBD7',
  gold: '#C9A96E',
  text: '#2C1810',
  textMid: '#6B4C3B',
  textLight: '#A08878',
  card: '#FFFFFF',
  border: '#EDE8E3',
  shadow: 'rgba(44,24,16,0.08)',
  red: '#D64545',
  redLight: '#FDEAEA',
  purple: '#8B7CB8',
  purpleLight: '#EAE6F8',
}

type Screen =
  | 'splash' | 'scenarios'
  | 'tutorial-0' | 'tutorial-1' | 'tutorial-2' | 'tutorial-3' | 'tutorial-4'
  | 'ob1' | 'ob2' | 'ob3' | 'ob4' | 'ob5' | 'ob-done'
  | 'discover' | 'profile-detail'
  | 'propose' | 'propose2' | 'propose3' | 'sent'
  | 'received' | 'counter' | 'counter-received'
  | 'inbox' | 'chat' | 'chat-limit'
  | 'rdv' | 'late-send' | 'late-waiting' | 'cancel-confirm'
  | 'checkin' | 'postrdv'
  | 'timeout' | 'rabbit' | 'ghost'
  | 'events' | 'event-detail' | 'create-event'
  | 'myprofile' | 'premium' | 'sos' | 'sos-active'
  | 'availability'

const APP_URL = 'https://clutch-mel.netlify.app'

function shareIt({ title, text, url }: { title:string; text:string; url:string }) {
  if (typeof navigator !== 'undefined' && navigator.share) {
    navigator.share({ title, text, url }).catch(()=>{})
  } else {
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

const INTERESTS_CATS = [
  { label: 'Sport & Outdoor', icon: '🏃', items: ['Randonnée','Yoga','Tennis','Natation','Cyclisme','Course','Escalade','Ski','Fitness','Surf'] },
  { label: 'Culture & Art', icon: '🎨', items: ['Cinéma','Musique','Lecture','Théâtre','Musées','Photo','Dessin','Danse','Écriture','Podcasts'] },
  { label: 'Cuisine & Café', icon: '☕', items: ['Cafés','Brunch','Cuisine','Vins','Boulangeries','Cocktails','Pâtisserie','Street food'] },
  { label: 'Loisirs', icon: '🎲', items: ['Voyages','Jeux de société','Concerts','Karaoké','Stand-up','Gaming','Nature','Jardinage'] },
]

const PROFILES = [
  { id:'p1', name:'Léa', age:27, gender:'woman', job:'UX Designer', neighborhood:'Lausanne-Centre', bio:'Curieuse de tout, fan de cafés indépendants et de balades impromptues 🌿', interests:['Cafés','Dessin','Randonnée','Photo','Cinéma'], score:94, badge:'Fiable ✓', is_available:true, photo:'https://i.pravatar.cc/300?img=47', compat:91 },
  { id:'p2', name:'Camille', age:29, gender:'woman', job:'Journaliste', neighborhood:'Flon', bio:"J'adore découvrir les nouvelles tables de Lausanne. Toujours partante pour un verre impromptu 🍷", interests:['Vins','Écriture','Concerts','Voyages','Théâtre'], score:88, badge:'Régulière', is_available:true, photo:'https://i.pravatar.cc/300?img=12', compat:78 },
  { id:'p3', name:'Sofia', age:25, gender:'woman', job:'Architecte', neighborhood:'Ouchy', bio:'Architecte le jour, exploratrice la nuit. Je cherche des vrais échanges 🏛', interests:['Musées','Yoga','Lecture','Brunch','Dessin'], score:97, badge:'Fiable ✓', is_available:false, photo:'https://i.pravatar.cc/300?img=44', compat:85 },
  { id:'p4', name:'Tom', age:31, gender:'man', job:'Ingénieur', neighborhood:'Pully', bio:'Fan de randos et de bière artisanale. Je propose, j\'assume 🏔', interests:['Randonnée','Craft beer','Cyclisme','Gaming','Concerts'], score:82, badge:'Régulier', is_available:true, photo:'https://i.pravatar.cc/300?img=67', compat:72 },
  { id:'p5', name:'Nora', age:33, gender:'woman', job:'Médecin', neighborhood:'Lausanne', bio:'Médecin passionnée de yoga et de thé. Cherche des rencontres authentiques 🍵', interests:['Yoga','Méditation','Thé','Lecture','Natation'], score:100, badge:'⭐ Top', is_available:true, photo:'https://i.pravatar.cc/300?img=21', compat:89 },
  { id:'p6', name:'Alex', age:26, gender:'nb', job:'Musicien·ne', neighborhood:'Lausanne-Ouest', bio:'Je joue de la guitare et écris des chansons 🎸', interests:['Musique','Concerts','Karaoké','Vinyles','Cafés'], score:76, badge:'🐰 Lapin', is_available:true, photo:'https://i.pravatar.cc/300?img=33', compat:68 },
]

const EVENTS = [
  { id:'e1', type:'clutch', title:'Jazz au Bourg', emoji:'🎷', venue:'Le Bourg, Lausanne', date:'Ce soir 20h', price:'Gratuit', spots:8, desc:'Soirée jazz intimiste. Clutch organise une table pour 8 personnes.', photo:'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&q=80', badge:'Clutch', badgeColor:C.primary },
  { id:'e2', type:'partner', title:'Brunch Maison Manesse', emoji:'🥞', venue:'Maison Manesse, Ouchy', date:'Dim. 10h30', price:'28 CHF', spots:4, desc:'Brunch gastronomique avec vue sur le lac. Réservation partenaire Clutch.', photo:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80', badge:'Partenaire', badgeColor:C.sage, creator:null },
  { id:'e3', type:'partner', title:'Expo Photo Mudac', emoji:'📸', venue:'Mudac, Plateforme 10', date:'Sam. 14h', price:'12 CHF', spots:12, desc:'Visite guidée privée. Tarif préférentiel partenaire Clutch.', photo:'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=400&q=80', badge:'Partenaire', badgeColor:C.sage, creator:null },
  { id:'e4', type:'user', title:'Rando Jorat matinale', emoji:'🥾', venue:'Forêt du Jorat', date:'Mer. 8h', price:'Gratuit', spots:5, desc:'2h de rando, niveau facile. Café inclus au retour !', photo:'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&q=80', badge:'Utilisatrice', badgeColor:C.peach, creator:PROFILES[0] },
  { id:'e5', type:'clutch', title:'Dégustation Vins Vaudois', emoji:'🍷', venue:'Cave de la Côte', date:'Ven. 19h', price:'35 CHF', spots:6, desc:'Découvrez les meilleurs vins vaudois avec un sommelier.', photo:'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80', badge:'Clutch', badgeColor:C.primary },
  { id:'e6', type:'user', title:'Stand-up amateur Nora', emoji:'🎤', venue:'BarBarBar, Flon', date:'Jeu. 21h', price:'10 CHF', spots:20, desc:'Mon premier stand-up ! Venez soutenir. Consommation incluse.', photo:'https://images.unsplash.com/photo-1527224538127-2104bb71c51b?w=400&q=80', badge:'Utilisatrice', badgeColor:C.peach, creator:PROFILES[4] },
  { id:'e7', type:'partner', title:'Yoga au Bord du Lac', emoji:'🧘', venue:'Ouchy, face au lac', date:'Mar. 7h', price:'15 CHF', spots:10, desc:'Yoga au lever du soleil, vue sur le lac de Genève.', photo:'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80', badge:'Partenaire', badgeColor:C.sage, creator:null },
  { id:'e8', type:'clutch', title:'Tournoi Ping-Pong Flon', emoji:'🏓', venue:'Le Flon Underground', date:'Lun. 18h30', price:'5 CHF', spots:16, desc:'Tournoi amical en doubles mixtes.', photo:'https://images.unsplash.com/photo-1534158914592-062992fbe900?w=400&q=80', badge:'Clutch', badgeColor:C.primary },
]

const VENUES = [
  { name:'Café du Grütli', safety:'safe', emoji:'☕', desc:'Bar café central, très fréquenté' },
  { name:'Brasserie de Montbenon', safety:'safe', emoji:'🍺', desc:'Grande terrasse publique' },
  { name:'Globus Café', safety:'safe', emoji:'🛍', desc:'Café dans galerie marchande' },
  { name:'Jardin de Valency', safety:'neutral', emoji:'🌳', desc:'Parc public, fréquenté en journée' },
  { name:'Quai d\'Ouchy', safety:'safe', emoji:'🌊', desc:'Promenade publique animée' },
  { name:'Place de la Palud', safety:'safe', emoji:'⛲', desc:'Place centrale animée' },
]

const ME = { name:'Marie', age:28, job:'Chef de projet', neighborhood:'Lausanne-Centre', bio:'Passionnée de découvertes et rencontres authentiques 🌸', interests:['Cafés','Yoga','Cinéma','Voyages','Brunch'], photo:'https://i.pravatar.cc/300?img=20', score:92, badge:'Fiable ✓' }

const TUTORIALS = [
  { icon:'✦', title:"Propose, c'est tout", body:"Tu vois quelqu'un qui te plaît, tu proposes un café dans les 18h. Pas de match, pas de chat infini — un vrai rendez-vous.", color:C.primary },
  { icon:'⏱', title:'2h pour répondre', body:"La personne a 2h pour accepter, décliner ou contre-proposer. Le temps libre, c'est rare — on le respecte.", color:C.sage },
  { icon:'📍', title:'Lieux sûrs classifiés', body:'🟢 Sûr (café animé), 🟡 Neutre (parc public), 🔴 Prudence (isolé). Tu choisis en connaissance de cause.', color:C.peach },
  { icon:'⭐', title:'Score de fiabilité', body:'Chaque RDV honoré renforce ton badge. Poser un lapin 🐰 ou jouer le fantôme 👻 a des conséquences réelles.', color:C.gold },
  { icon:'🔒', title:'Toujours pour toi', body:'SOS intégré, lieux vérifiés, aucune info perso partagée avant le RDV. Clutch est fait pour te sentir en sécurité.', color:C.purple },
]

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function SafetyBadge({ safety }: { safety:string }) {
  const map:Record<string,{icon:string;label:string;bg:string;color:string}> = {
    safe:{icon:'🟢',label:'Lieu sûr',bg:C.sageLight,color:C.sage},
    neutral:{icon:'🟡',label:'Lieu neutre',bg:'#FFF8DC',color:'#B8860B'},
    alert:{icon:'🔴',label:'Prudence',bg:C.redLight,color:C.red},
  }
  const s = map[safety]||map.safe
  return <span style={{fontSize:11,padding:'2px 8px',borderRadius:10,background:s.bg,color:s.color,fontWeight:600}}>{s.icon} {s.label}</span>
}

function ReliabilityBar({ score, badge }: { score:number; badge:string }) {
  const color = score>=90?C.sage:score>=70?C.peach:C.red
  return (
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      <div style={{flex:1,height:4,background:C.border,borderRadius:2}}>
        <div style={{width:`${score}%`,height:'100%',background:color,borderRadius:2}}/>
      </div>
      <span style={{fontSize:11,fontWeight:700,color,minWidth:30}}>{score}%</span>
      <span style={{fontSize:11,color:C.textLight}}>{badge}</span>
    </div>
  )
}

function Avatar({ src, size=48, border }: { src:string; size?:number; border?:string }) {
  return <img src={src} alt="" style={{width:size,height:size,borderRadius:'50%',objectFit:'cover',border:border||`2px solid ${C.border}`}}/>
}

function Pill({ children, active, onClick, color }: { children:React.ReactNode; active?:boolean; onClick?:()=>void; color?:string }) {
  return (
    <button onClick={onClick} style={{padding:'6px 14px',borderRadius:20,fontSize:13,border:'none',cursor:'pointer',fontWeight:500,background:active?(color||C.primary):C.bgDeep,color:active?'#fff':C.textMid,transition:'all 0.2s'}}>
      {children}
    </button>
  )
}

function Btn({ children, onClick, variant='primary', size='md', disabled }: { children:React.ReactNode; onClick?:()=>void; variant?:string; size?:string; disabled?:boolean }) {
  const styles:Record<string,React.CSSProperties> = {
    primary:{background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,color:'#fff',border:'none'},
    secondary:{background:C.bgDeep,color:C.text,border:`1.5px solid ${C.border}`},
    ghost:{background:'transparent',color:C.primary,border:`1.5px solid ${C.primaryLight}`},
    danger:{background:`linear-gradient(135deg,${C.red},#B83030)`,color:'#fff',border:'none'},
    sage:{background:`linear-gradient(135deg,${C.sage},#5A8A6A)`,color:'#fff',border:'none'},
    premium:{background:`linear-gradient(135deg,${C.gold},#B8860B)`,color:'#fff',border:'none'},
  }
  const pads:Record<string,string> = {sm:'8px 16px',md:'12px 24px',lg:'16px 32px'}
  const fonts:Record<string,number> = {sm:13,md:15,lg:17}
  return (
    <button onClick={onClick} disabled={disabled} style={{...(styles[variant]||styles.primary),padding:pads[size]||pads.md,borderRadius:14,fontSize:fonts[size]||15,fontWeight:700,cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.5:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,width:'100%',fontFamily:'inherit',letterSpacing:'-0.01em'}}>
      {children}
    </button>
  )
}

function Card({ children, style }: { children:React.ReactNode; style?:React.CSSProperties }) {
  return <div style={{background:C.card,borderRadius:20,padding:20,border:`1px solid ${C.border}`,boxShadow:`0 2px 12px ${C.shadow}`,...style}}>{children}</div>
}

function TopBar({ title, onBack, right }: { title?:string; onBack?:()=>void; right?:React.ReactNode }) {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px 8px',background:C.bg}}>
      <button onClick={onBack} style={{background:'none',border:'none',cursor:'pointer',fontSize:22,color:C.textMid,padding:'4px 8px 4px 0'}}>{onBack?'←':' '}</button>
      <span style={{fontWeight:700,fontSize:17,color:C.text,letterSpacing:'-0.02em'}}>{title}</span>
      <div style={{minWidth:40,display:'flex',justifyContent:'flex-end'}}>{right}</div>
    </div>
  )
}

function TabBar({ tab, setScreen }: { tab:string; setScreen:(s:Screen)=>void }) {
  const tabs = [
    {id:'discover',icon:'✦',label:'Discover',screen:'discover' as Screen},
    {id:'events',icon:'🗓',label:'Événements',screen:'events' as Screen},
    {id:'messages',icon:'💬',label:'Messages',screen:'inbox' as Screen},
    {id:'profile',icon:'◉',label:'Profil',screen:'myprofile' as Screen},
  ]
  return (
    <div style={{display:'flex',borderTop:`1px solid ${C.border}`,background:C.bg,flexShrink:0}}>
      {tabs.map(t=>(
        <button key={t.id} onClick={()=>setScreen(t.screen)} style={{flex:1,padding:'10px 4px 12px',border:'none',background:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:3,color:tab===t.id?C.primary:C.textLight}}>
          <span style={{fontSize:20,lineHeight:1}}>{t.icon}</span>
          <span style={{fontSize:10,fontWeight:tab===t.id?700:500}}>{t.label}</span>
        </button>
      ))}
    </div>
  )
}

function ProgressBar({ step, total }: { step:number; total:number }) {
  return (
    <div style={{display:'flex',gap:4,marginBottom:32}}>
      {Array.from({length:total}).map((_,i)=>(
        <div key={i} style={{flex:1,height:3,borderRadius:2,background:i<step?C.primary:C.border}}/>
      ))}
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
// localStorage helpers
function lsGet(k:string,def:any){try{const v=localStorage.getItem(k);return v?JSON.parse(v):def}catch{return def}}
function lsSet(k:string,v:any){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}

const LAUSANNE_ZONES = ['Lausanne-Centre','Flon','Ouchy','Lausanne-Ouest','Pully','Renens','Prilly','Chailly','Sallaz','Épalinges','Montriond']
const SWISS_CITIES = ['Genève','Zurich','Berne','Fribourg','Neuchâtel','Sion','Lugano','Basel','Montreux']

function applyOffset(baseTime: string, offset: string): string {
  if(offset==='Comme proposé') return baseTime
  const offsets: Record<string,number> = {'-2h':-120,'-1h':-60,'-30 min':-30,'+30 min':30,'+1h':60,'+2h':120}
  const mins = offsets[offset]
  if(!mins) return baseTime
  // Parse hours from strings like "Ce soir 19h", "Dans 1h", "Demain matin 9h", "19h30 (dans 45min)"
  const match = baseTime.match(/(\d{1,2})h(\d{0,2})/)
  if(!match) return baseTime
  let h = parseInt(match[1])
  let m = match[2] ? parseInt(match[2])||0 : 0
  const total = h*60 + m + mins
  const nh = Math.floor(((total%1440)+1440)%1440/60)
  const nm = ((total%1440)+1440)%1440%60
  return `${nh}h${nm===0?'00':String(nm).padStart(2,'0')}`
}

function genTimeSlots(){
  const now=new Date(), slots:string[]=[]
  const start=new Date(now)
  start.setSeconds(0,0)
  const m=start.getMinutes()
  start.setMinutes(m<30?30:60)
  if(m>=30)start.setHours(start.getHours()+1)
  for(let i=0;i<=36;i++){
    const t=new Date(start.getTime()+i*30*60000)
    const h=t.getHours(), mn=t.getMinutes()
    const diff=Math.round((t.getTime()-now.getTime())/60000)
    const label=`${h}h${mn===0?'00':'30'} (dans ${diff<60?`${diff}min`:`${Math.floor(diff/60)}h${diff%60?String(diff%60).padStart(2,'0')+'min':''}`})`
    if(diff<=1080) slots.push(label)
  }
  return slots
}

export default function Demo() {
  const hasProfile = typeof window!=='undefined' && lsGet('demo_done',false)
  const [screen, setScreen] = useState<Screen>(hasProfile?'scenarios':'splash')
  const [profileIdx, setProfileIdx] = useState(0)
  const [selectedEvent, setSelectedEvent] = useState<typeof EVENTS[0]|null>(null)
  const [venueInput, setVenueInput] = useState('')
  const [selectedVenue, setSelectedVenue] = useState('')
  const [venueSafety, setVenueSafety] = useState<'safe'|'neutral'|'alert'>('safe')
  const [selectedTime, setSelectedTime] = useState('')
  const [messageText, setMessageText] = useState('')
  const [chatMessages, setChatMessages] = useState([
    {from:'other',text:"Super, j'ai hâte ! C'est quel café exactement ?"},
    {from:'me',text:'Le Grütli, au rez. Facile à trouver 😊'},
    {from:'other',text:'Parfait ! À tout à l\'heure ✨'},
  ])
  const [chatInput, setChatInput] = useState('')
  const [isPremium, setIsPremium] = useState(lsGet('demo_premium',false))
  const [demoAccountType, setDemoAccountType] = useState<'user'|'partner'|'admin'>(lsGet('demo_account_type','user'))
  const [selectedInterests, setSelectedInterests] = useState<string[]>(lsGet('demo_interests',['Cafés','Yoga','Cinéma']))
  const [obName, setObName] = useState(lsGet('demo_name','Marie'))
  const [availCity, setAvailCity] = useState(lsGet('demo_avail_city','Lausanne-Centre'))
  const [availFrom, setAvailFrom] = useState('')
  const [availUntil, setAvailUntil] = useState('')
  const [isAvailable, setIsAvailable] = useState(lsGet('demo_available',false))
  const [tutorialIdx, setTutorialIdx] = useState(0)
  const [prevScreen, setPrevScreen] = useState<Screen>('scenarios')
  const [activeTab, setActiveTab] = useState<string>('discover')
  const [eventFilter, setEventFilter] = useState<string>('all')
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventVenue, setNewEventVenue] = useState('')
  const [newEventType, setNewEventType] = useState<'user'|'partner'|'clutch'>('user')
  const [countdown, setCountdown] = useState(7200)
  const chatRef = useRef<HTMLDivElement>(null)
  const MSG_LIMIT = 8
  const profile = PROFILES[profileIdx]
  const timeSlots = genTimeSlots()

  useEffect(()=>{
    if(screen==='rdv'||screen==='sent'){
      const t=setInterval(()=>setCountdown(c=>Math.max(0,c-1)),1000)
      return ()=>clearInterval(t)
    }
  },[screen])

  useEffect(()=>{
    if(chatRef.current) chatRef.current.scrollTop=chatRef.current.scrollHeight
  },[chatMessages])

  function fmt(s:number){
    const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60
    return `${h}h ${String(m).padStart(2,'0')}m ${String(sec).padStart(2,'0')}s`
  }

  function go(s:Screen,tab?:string){
    if(tab) setActiveTab(tab)
    setPrevScreen(screen)
    setScreen(s)
  }

  function sendMsg(){
    if(!chatInput.trim()||chatMessages.length>=MSG_LIMIT) return
    setChatMessages(m=>[...m,{from:'me',text:chatInput}])
    setChatInput('')
    if(chatMessages.length+1>=MSG_LIMIT) setTimeout(()=>setScreen('chat-limit'),400)
  }

  function pickVenue(v:typeof VENUES[0]){
    setVenueInput(v.name); setSelectedVenue(v.name); setVenueSafety(v.safety as any)
  }

  // ── SPLASH ──────────────────────────────────────────────────────────────────
  if(screen==='splash') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:`linear-gradient(160deg,#FDF6F0 0%,${C.primaryLight} 100%)`,padding:40,gap:24}}>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:52,fontWeight:900,letterSpacing:'-0.05em',color:C.text,lineHeight:1}}>CLUTCH</div>
          <div style={{fontSize:13,letterSpacing:'0.2em',color:C.primary,fontWeight:600,marginTop:6}}>BE SPONTANEOUS</div>
        </div>
        <div style={{width:110,height:110,borderRadius:'50%',background:`linear-gradient(135deg,${C.primary},${C.peach})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:48,boxShadow:`0 8px 32px ${C.primaryLight}`}}>☕</div>
        <p style={{textAlign:'center',color:C.textMid,fontSize:15,lineHeight:1.6,maxWidth:260}}>Un vrai café.<br/>Pas un match de plus.</p>
        <div style={{width:'100%',display:'flex',flexDirection:'column',gap:12}}>
          <Btn onClick={()=>{setTutorialIdx(0);go('tutorial-0')}}>✨ Voir comment ça marche</Btn>
          <Btn variant="secondary" onClick={()=>go('ob1')}>Créer mon profil de démo</Btn>
          {lsGet('demo_done',false)&&<Btn variant="ghost" onClick={()=>go('scenarios')}>→ Reprendre où j'en étais</Btn>}
        </div>
        <p style={{fontSize:12,color:C.textLight}}>Gratuit pour commencer · Sécurité incluse 🛡</p>
      </div>
    </Frame>
  )

  // ── SCENARIOS ─────────────────────────────────────────────────────────────
  if(screen==='scenarios') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',background:C.bg,overflowY:'scroll',WebkitOverflowScrolling:'touch' as any}}>
        <div style={{padding:'20px 20px 8px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontSize:18,fontWeight:900,letterSpacing:'-0.05em',color:C.text}}>CLU<span style={{color:C.primary}}>TCH</span></div>
            <p style={{fontSize:12,color:C.textLight}}>Bonjour {obName} 👋 Que veux-tu explorer ?</p>
          </div>
          <button onClick={()=>{lsSet('demo_done',false);setScreen('splash')}} style={{fontSize:11,color:C.textLight,background:'none',border:`1px solid ${C.border}`,borderRadius:10,padding:'4px 10px',cursor:'pointer',fontFamily:'inherit'}}>Réinitialiser</button>
        </div>
        <div style={{padding:'8px 16px 24px',display:'flex',flexDirection:'column',gap:10}}>
          {[
            {emoji:'☕',title:'Je propose un café',sub:'Voir un profil → envoyer un clutch → attendre la réponse',color:C.primary,bg:C.primaryLight,action:()=>go('discover','discover')},
            {emoji:'📥',title:'J\'ai reçu un clutch',sub:'Quelqu\'un te propose un café → tu acceptes ou refuses',color:C.sage,bg:C.sageLight,action:()=>{setVenueInput('Café du Grütli');setSelectedTime('Ce soir 19h');go('received')}},
            {emoji:'✓',title:'RDV dans 30 minutes',sub:'Le clutch est accepté → compte à rebours → check-in',color:C.peach,bg:C.peachLight,action:()=>{setVenueInput('Café du Grütli');setSelectedTime('Ce soir 19h');setCountdown(1800);go('rdv')}},
            {emoji:'💬',title:'On chatte avant le RDV',sub:'Le chat limité à 8 messages — pourquoi c\'est voulu',color:C.purple,bg:C.purpleLight,action:()=>{setVenueInput('Café du Grütli');setSelectedTime('Ce soir 19h');go('chat')}},
            {emoji:'↔',title:'Contre-proposition',sub:'Tu proposes un autre lieu ou une autre heure',color:'#7A9E8A',bg:C.sageLight,action:()=>{setVenueInput('Brasserie de Montbenon');setSelectedTime('Ce soir 20h');go('counter')}},
            {emoji:'👻',title:'Ghosting & Lapin',sub:'Ce qui se passe quand on n\'honore pas un RDV',color:C.red,bg:C.redLight,action:()=>go('cancel-confirm')},
            {emoji:'🎪',title:'Événements',sub:'Concerts, brunches, expos — voir et créer',color:C.peach,bg:C.peachLight,action:()=>go('events','events')},
            {emoji:'🆘',title:'SOS & Sécurité',sub:'Partage de position, contacts d\'urgence, conseils',color:C.red,bg:C.redLight,action:()=>go('sos')},
            {emoji:'⭐',title:'Premium',sub:'19.90 CHF/mois — ce que ça débloque',color:C.gold,bg:'#FFF8DC',action:()=>go('premium')},
            {emoji:'◉',title:'Mon profil complet',sub:'Bio, intérêts, disponibilité, type de compte',color:C.primary,bg:C.primaryLight,action:()=>go('myprofile','profile')},
          ].map(s=>(
            <button key={s.title} onClick={s.action} style={{background:s.bg,border:`1.5px solid ${s.color}33`,borderRadius:16,padding:'14px 16px',textAlign:'left',cursor:'pointer',display:'flex',gap:14,alignItems:'center'}}>
              <span style={{fontSize:28,minWidth:36,textAlign:'center'}}>{s.emoji}</span>
              <div>
                <p style={{fontWeight:700,color:C.text,fontSize:14}}>{s.title}</p>
                <p style={{fontSize:11,color:C.textMid,marginTop:2,lineHeight:1.4}}>{s.sub}</p>
              </div>
              <span style={{marginLeft:'auto',color:s.color,fontSize:18}}>→</span>
            </button>
          ))}
        </div>
      </div>
    </Frame>
  )

  // ── TUTORIAL ──────────────────────────────────────────────────────────────
  if(screen.startsWith('tutorial-')){
    const t=TUTORIALS[tutorialIdx]
    return (
      <Frame>
        <div style={{flex:1,display:'flex',flexDirection:'column',background:`linear-gradient(160deg,${C.bg} 0%,#F0EBF8 100%)`,padding:'40px 28px 32px'}}>
          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <button onClick={()=>go('ob1')} style={{background:'none',border:'none',color:C.textLight,fontSize:13,cursor:'pointer'}}>Passer →</button>
          </div>
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:28}}>
            <div style={{width:100,height:100,borderRadius:'50%',background:`linear-gradient(135deg,${t.color}33,${t.color}66)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:44}}>{t.icon}</div>
            <div style={{textAlign:'center'}}>
              <h2 style={{fontSize:24,fontWeight:800,color:C.text,marginBottom:12,letterSpacing:'-0.03em'}}>{t.title}</h2>
              <p style={{color:C.textMid,fontSize:15,lineHeight:1.65}}>{t.body}</p>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,justifyContent:'center',marginBottom:24}}>
            {TUTORIALS.map((_,i)=><div key={i} style={{width:i===tutorialIdx?24:8,height:8,borderRadius:4,background:i===tutorialIdx?C.primary:C.border,transition:'all 0.3s'}}/>)}
          </div>
          {tutorialIdx<4
            ?<Btn onClick={()=>setTutorialIdx(i=>i+1)}>Suivant →</Btn>
            :<Btn onClick={()=>go('ob1')}>Commencer ✨</Btn>
          }
        </div>
      </Frame>
    )
  }

  // ── ONBOARDING ────────────────────────────────────────────────────────────
  if(screen==='ob1') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',background:C.bg,padding:'48px 28px 32px'}}>
        <ProgressBar step={1} total={5}/>
        <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',gap:24}}>
          <div>
            <p style={{fontSize:13,color:C.primary,fontWeight:600,letterSpacing:'0.1em',marginBottom:8}}>ÉTAPE 1 / 5</p>
            <h2 style={{fontSize:28,fontWeight:800,color:C.text,letterSpacing:'-0.03em'}}>Comment tu t'appelles ?</h2>
          </div>
          <input value={obName} onChange={e=>setObName(e.target.value)} placeholder="Ton prénom" style={{fontSize:24,fontWeight:700,border:'none',borderBottom:`2px solid ${C.primary}`,background:'transparent',color:C.text,padding:'8px 0',outline:'none',width:'100%'}}/>
          <p style={{fontSize:13,color:C.textLight}}>Seul ton prénom sera visible sur ton profil.</p>
        </div>
        <Btn onClick={()=>go('ob2')} disabled={!obName.trim()}>Continuer →</Btn>
      </div>
    </Frame>
  )

  if(screen==='ob2') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',background:C.bg,padding:'48px 28px 32px'}}>
        <ProgressBar step={2} total={5}/>
        <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',gap:20,alignItems:'center'}}>
          <p style={{fontSize:13,color:C.primary,fontWeight:600,letterSpacing:'0.1em'}}>ÉTAPE 2 / 5</p>
          <h2 style={{fontSize:26,fontWeight:800,color:C.text,textAlign:'center'}}>Ta photo de profil</h2>
          <div style={{width:120,height:120,borderRadius:'50%',background:`linear-gradient(135deg,${C.primaryLight},${C.peachLight})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:48,cursor:'pointer',border:`3px dashed ${C.primary}`}}>📷</div>
          <p style={{fontSize:13,color:C.textLight,textAlign:'center'}}>Une vraie photo augmente tes chances de clutch de 3×</p>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <Btn onClick={()=>go('ob3')}>Choisir une photo</Btn>
          <Btn variant="ghost" onClick={()=>go('ob3')}>Plus tard</Btn>
        </div>
      </div>
    </Frame>
  )

  if(screen==='ob3') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',background:C.bg,padding:'48px 20px 32px',minHeight:0}}>
        <ProgressBar step={3} total={5}/>
        <div style={{display:'flex',flexDirection:'column',gap:16,flex:1,minHeight:0}}>
          <div style={{flexShrink:0}}>
            <p style={{fontSize:13,color:C.primary,fontWeight:600,letterSpacing:'0.1em',marginBottom:6,paddingLeft:8}}>ÉTAPE 3 / 5</p>
            <h2 style={{fontSize:24,fontWeight:800,color:C.text,paddingLeft:8}}>Tes passions <span style={{fontSize:15,color:C.textLight,fontWeight:500}}>({selectedInterests.length}/5)</span></h2>
          </div>
          <div style={{flex:1,height:0,overflowY:'scroll',WebkitOverflowScrolling:'touch' as any,touchAction:'pan-y',display:'flex',flexDirection:'column',gap:16}}>
            {INTERESTS_CATS.map(cat=>(
              <div key={cat.label}>
                <p style={{fontSize:12,fontWeight:700,color:C.textLight,letterSpacing:'0.08em',padding:'0 8px 8px'}}>{cat.icon} {cat.label.toUpperCase()}</p>
                <div style={{display:'flex',flexWrap:'wrap',gap:8,padding:'0 8px'}}>
                  {cat.items.map(item=>{
                    const active=selectedInterests.includes(item)
                    const disabled=!active&&selectedInterests.length>=5
                    return <Pill key={item} active={active} onClick={()=>{
                      if(disabled) return
                      setSelectedInterests(prev=>active?prev.filter(i=>i!==item):[...prev,item])
                    }}>{item}</Pill>
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        <Btn onClick={()=>go('ob4')} disabled={selectedInterests.length===0}>Continuer →</Btn>
      </div>
    </Frame>
  )

  if(screen==='ob4') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',background:C.bg,padding:'48px 28px 32px'}}>
        <ProgressBar step={4} total={5}/>
        <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',gap:16}}>
          <p style={{fontSize:13,color:C.primary,fontWeight:600,letterSpacing:'0.1em'}}>ÉTAPE 4 / 5</p>
          <h2 style={{fontSize:26,fontWeight:800,color:C.text}}>Tu es disponible ?</h2>
          <p style={{color:C.textMid,fontSize:14,lineHeight:1.6}}>Active ta disponibilité quand tu es open à un café spontané.</p>
          <div style={{display:'flex',flexDirection:'column',gap:12,marginTop:8}}>
            {[{label:'✅ Oui, je suis disponible !',sub:'Les autres peuvent te proposer un clutch'},{label:'😴 Pas maintenant',sub:'Tu peux activer plus tard'}].map(opt=>(
              <button key={opt.label} onClick={()=>go('ob5')} style={{padding:16,borderRadius:16,border:`2px solid ${C.border}`,background:C.card,textAlign:'left',cursor:'pointer'}}>
                <div style={{fontWeight:700,color:C.text}}>{opt.label}</div>
                <div style={{fontSize:12,color:C.textLight,marginTop:2}}>{opt.sub}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  )

  if(screen==='ob5') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',background:C.bg,padding:'48px 28px 32px'}}>
        <ProgressBar step={5} total={5}/>
        <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',gap:20}}>
          <p style={{fontSize:13,color:C.primary,fontWeight:600,letterSpacing:'0.1em'}}>ÉTAPE 5 / 5</p>
          <h2 style={{fontSize:24,fontWeight:800,color:C.text}}>Deux mots sur toi</h2>
          <textarea placeholder="Ex: J'adore les cafés le matin et les concerts le soir..." maxLength={140} rows={4} style={{border:`1.5px solid ${C.border}`,borderRadius:12,padding:14,fontSize:14,background:C.bgDeep,color:C.text,fontFamily:'inherit',resize:'none',outline:'none',lineHeight:1.6}}/>
          <p style={{fontSize:12,color:C.textLight}}>140 caractères max 😊</p>
        </div>
        <Btn onClick={()=>{lsSet('demo_interests',selectedInterests);go('ob-done')}}>Terminer ✓</Btn>
      </div>
    </Frame>
  )

  if(screen==='ob-done') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:`linear-gradient(160deg,${C.bg},${C.primaryLight})`,padding:40,gap:24,textAlign:'center'}}>
        <div style={{fontSize:80}}>🎉</div>
        <div>
          <h2 style={{fontSize:28,fontWeight:800,color:C.text}}>Bienvenue, {obName} !</h2>
          <p style={{color:C.textMid,marginTop:10,lineHeight:1.6}}>Ton profil est prêt. Il ne reste plus qu'à trouver quelqu'un pour un café 😊</p>
        </div>
        <Card style={{width:'100%'}}>
          <p style={{fontWeight:700,color:C.text,marginBottom:12}}>Tes passions :</p>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {selectedInterests.map(i=><Pill key={i} active>{i}</Pill>)}
          </div>
        </Card>
        <Btn onClick={()=>{lsSet('demo_done',true);lsSet('demo_name',obName);go('scenarios')}}>Explorer les profils ✦</Btn>
      </div>
    </Frame>
  )

  // ── DISCOVER ──────────────────────────────────────────────────────────────
  if(screen==='discover') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',background:C.bgDeep,minHeight:0}}>
        <div style={{padding:'12px 16px 8px',display:'flex',justifyContent:'space-between',alignItems:'center',background:C.bg,flexShrink:0}}>
          <div>
            <div style={{fontSize:18,fontWeight:900,letterSpacing:'-0.05em',color:C.text}}>CLU<span style={{color:C.primary}}>TCH</span></div>
            <p style={{fontSize:10,color:C.textLight,fontWeight:600}}>{PROFILES.filter(p=>p.is_available).length} disponibles · {PROFILES.length} profils</p>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            {isPremium&&<span style={{fontSize:10,background:`linear-gradient(135deg,${C.gold},#B8860B)`,color:'#fff',padding:'2px 6px',borderRadius:8,fontWeight:700}}>⭐ PREMIUM</span>}
            <button onClick={()=>go('sos')} style={{background:C.redLight,border:'none',borderRadius:14,padding:'5px 11px',cursor:'pointer',color:C.red,fontWeight:700,fontSize:12}}>SOS</button>
          </div>
        </div>
        <div style={{flex:1,overflowY:'scroll',WebkitOverflowScrolling:'touch' as any}}>
          {PROFILES.map((p,i)=>(
            <button key={p.id} onClick={()=>{setProfileIdx(i);go('profile-detail')}} style={{width:'100%',padding:'12px 16px',background:'none',border:'none',borderBottom:`1px solid ${C.border}`,display:'flex',gap:12,alignItems:'center',cursor:'pointer',textAlign:'left'}}>
              <div style={{position:'relative',flexShrink:0}}>
                <img src={p.photo} alt="" style={{width:56,height:56,borderRadius:'50%',objectFit:'cover',border:`2px solid ${C.border}`}}/>
                {p.is_available&&<div style={{position:'absolute',bottom:0,right:0,width:14,height:14,borderRadius:'50%',background:C.sage,border:'2px solid #fff'}}/>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontWeight:700,fontSize:15,color:C.text}}>{p.name}, {p.age}</span>
                  <span style={{fontSize:11,fontWeight:800,color:C.primary}}>✦ {p.compat}%</span>
                </div>
                <p style={{fontSize:12,color:C.textLight,marginTop:1}}>{p.job} · 📍 {p.neighborhood}</p>
                <div style={{display:'flex',gap:4,marginTop:5,flexWrap:'wrap'}}>
                  {p.interests.slice(0,3).map(interest=>(
                    <span key={interest} style={{fontSize:10,background:selectedInterests.includes(interest)?C.primaryLight:C.bgDeep,color:selectedInterests.includes(interest)?C.primary:C.textMid,padding:'2px 7px',borderRadius:8,fontWeight:selectedInterests.includes(interest)?700:400}}>{interest}</span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
        <TabBar tab={activeTab} setScreen={s=>{setActiveTab(s==='discover'?'discover':s==='events'?'events':s==='inbox'?'messages':'profile');go(s)}}/>
      </div>
    </Frame>
  )

  // ── PROFILE DETAIL ────────────────────────────────────────────────────────
  if(screen==='profile-detail') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',background:C.bg,overflowY:'scroll',WebkitOverflowScrolling:'touch' as any,touchAction:'pan-y'}}>
        <div style={{position:'relative'}}>
          <img src={profile.photo} alt="" style={{width:'100%',height:300,objectFit:'cover'}}/>
          <button onClick={()=>go('discover')} style={{position:'absolute',top:16,left:16,width:36,height:36,borderRadius:'50%',background:'rgba(255,255,255,0.9)',border:'none',fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>←</button>
        </div>
        <div style={{padding:20,display:'flex',flexDirection:'column',gap:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div><h2 style={{fontSize:26,fontWeight:800,color:C.text}}>{profile.name}, {profile.age}</h2><p style={{color:C.textLight,fontSize:13}}>📍 {profile.neighborhood} · {profile.job}</p></div>
            <span style={{fontSize:13,fontWeight:800,color:C.primary}}>✦ {profile.compat}%</span>
          </div>
          <ReliabilityBar score={profile.score} badge={profile.badge}/>
          <p style={{color:C.textMid,lineHeight:1.65}}>{profile.bio}</p>
          <div>
            <p style={{fontWeight:700,fontSize:13,color:C.text,marginBottom:8}}>Passions</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {profile.interests.map(i=><Pill key={i} active={selectedInterests.includes(i)}>{i}</Pill>)}
            </div>
          </div>
          {isPremium&&(
            <Card style={{background:C.purpleLight,border:`1px solid ${C.purple}33`}}>
              <p style={{fontWeight:700,color:C.purple,fontSize:13}}>⭐ Premium — Affinités détaillées</p>
              <div style={{display:'flex',gap:16,marginTop:10}}>
                {[['Rythme de vie','Matinale'],['Cherche','Amitié OK'],['Distance','1.2 km']].map(([k,v])=>(
                  <div key={k} style={{textAlign:'center'}}>
                    <div style={{fontWeight:700,color:C.purple,fontSize:14}}>{v}</div>
                    <div style={{fontSize:11,color:C.textLight}}>{k}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
        <div style={{padding:'0 20px 32px',display:'flex',flexDirection:'column',gap:10}}>
          <Btn onClick={()=>go('propose')}>☕ Proposer un clutch</Btn>
          <Btn variant="ghost" onClick={()=>go('discover')}>← Retour</Btn>
        </div>
      </div>
    </Frame>
  )

  // ── PROPOSE ───────────────────────────────────────────────────────────────
  if(screen==='propose') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',background:C.bg}}>
        <TopBar title={`Clutch avec ${profile.name}`} onBack={()=>go('profile-detail')}/>
        <div style={{flex:1,height:0,overflowY:'scroll',WebkitOverflowScrolling:'touch' as any,touchAction:'pan-y',padding:'0 20px'}}>
          <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0 20px'}}>
            <Avatar src={profile.photo} size={48}/>
            <div><p style={{fontWeight:700,color:C.text}}>{profile.name}</p><ReliabilityBar score={profile.score} badge={profile.badge}/></div>
          </div>
          <p style={{fontWeight:700,color:C.text,marginBottom:12}}>📍 Où se retrouver ?</p>
          <input value={venueInput} onChange={e=>{setVenueInput(e.target.value);setSelectedVenue('');setVenueSafety('safe')}} placeholder="Ex: Café du Grütli..." style={{width:'100%',padding:'12px 14px',borderRadius:12,border:`1.5px solid ${C.border}`,background:C.card,fontSize:14,color:C.text,outline:'none',boxSizing:'border-box'}}/>
          {venueInput&&!selectedVenue&&(
            <div style={{marginTop:8,borderRadius:12,overflow:'hidden',border:`1px solid ${C.border}`}}>
              {VENUES.filter(v=>v.name.toLowerCase().includes(venueInput.toLowerCase())).slice(0,4).map(v=>(
                <button key={v.name} onClick={()=>pickVenue(v)} style={{width:'100%',padding:'10px 14px',background:C.card,border:'none',borderBottom:`1px solid ${C.border}`,textAlign:'left',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div><span style={{fontWeight:600,color:C.text,fontSize:13}}>{v.emoji} {v.name}</span><div style={{fontSize:11,color:C.textLight}}>{v.desc}</div></div>
                  <SafetyBadge safety={v.safety}/>
                </button>
              ))}
            </div>
          )}
          {selectedVenue&&<div style={{marginTop:10,padding:'10px 14px',background:C.sageLight,borderRadius:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontWeight:600,color:C.text,fontSize:13}}>✓ {selectedVenue}</span><SafetyBadge safety={venueSafety}/></div>}
          <div style={{marginTop:16}}>
            <p style={{fontWeight:700,color:C.text,marginBottom:10}}>Suggestions rapides</p>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {VENUES.slice(0,4).map(v=>(
                <button key={v.name} onClick={()=>pickVenue(v)} style={{padding:'10px 14px',background:C.card,border:`1.5px solid ${selectedVenue===v.name?C.primary:C.border}`,borderRadius:12,textAlign:'left',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:13,fontWeight:600,color:C.text}}>{v.emoji} {v.name}</span>
                  <SafetyBadge safety={v.safety}/>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={{padding:'16px 20px 32px'}}>
          <Btn onClick={()=>go('propose2')} disabled={!venueInput}>Choisir l'heure →</Btn>
        </div>
      </div>
    </Frame>
  )

  if(screen==='propose2') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',background:C.bg}}>
        <TopBar title="Quelle heure ?" onBack={()=>go('propose')}/>
        <div style={{flex:1,padding:'0 20px',overflowY:'scroll',WebkitOverflowScrolling:'touch' as any,touchAction:'pan-y'}}>
          <p style={{color:C.textMid,fontSize:14,marginBottom:20,lineHeight:1.6}}>RDV dans les <strong>18h max</strong>. Tu proposes :</p>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {['Dans 30 min','Dans 1h','Dans 2h','Ce soir 18h','Ce soir 19h','Ce soir 20h','Demain matin 9h','Demain midi 12h30'].map(t=>(
              <button key={t} onClick={()=>setSelectedTime(t)} style={{padding:'14px 18px',borderRadius:14,border:`2px solid ${selectedTime===t?C.primary:C.border}`,background:selectedTime===t?C.primaryLight:C.card,textAlign:'left',cursor:'pointer',fontWeight:selectedTime===t?700:500,color:C.text,fontSize:15}}>
                ⏰ {t}
              </button>
            ))}
          </div>
        </div>
        <div style={{padding:'16px 20px 32px'}}>
          <Btn onClick={()=>go('propose3')} disabled={!selectedTime}>Écrire le message →</Btn>
        </div>
      </div>
    </Frame>
  )

  if(screen==='propose3'){
    const quality=messageText.length>60?'excellent':messageText.length>30?'bien':messageText.length>10?'ok':'faible'
    const qColor={excellent:C.sage,bien:C.peach,ok:C.gold,faible:C.textLight}[quality]
    return (
      <Frame>
        <div style={{flex:1,display:'flex',flexDirection:'column',background:C.bg}}>
          <TopBar title="Ton message" onBack={()=>go('propose2')}/>
          <div style={{flex:1,padding:'0 20px',display:'flex',flexDirection:'column',gap:16,overflowY:'scroll',WebkitOverflowScrolling:'touch' as any}}>
            <div style={{padding:14,background:C.bgDeep,borderRadius:14}}>
              <p style={{fontSize:12,color:C.textLight,marginBottom:4}}>Récap</p>
              <p style={{fontWeight:700,color:C.text}}>📍 {venueInput} · ⏰ {selectedTime}</p>
            </div>
            <div>
              <p style={{fontWeight:700,color:C.text,marginBottom:8}}>Message pour {profile.name}</p>
              <textarea value={messageText} onChange={e=>setMessageText(e.target.value)} placeholder={`"Salut ${profile.name} ! J'adorerais prendre un café — j'ai vu qu'on aime tous les deux les expos photo. ${selectedTime||'Ce soir'} chez ${venueInput||'le Grütli'} ?"`} rows={5} maxLength={280} style={{width:'100%',border:`1.5px solid ${C.border}`,borderRadius:14,padding:14,fontSize:14,background:C.card,color:C.text,fontFamily:'inherit',resize:'none',outline:'none',lineHeight:1.6,boxSizing:'border-box'}}/>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
                <span style={{fontSize:12,color:qColor,fontWeight:600}}>{quality==='excellent'?'✨ Excellent !':quality==='bien'?'👍 Bon message':quality==='ok'?'📝 Correct':'💡 Ajoute un peu...'}</span>
                <span style={{fontSize:12,color:C.textLight}}>{messageText.length}/280</span>
              </div>
            </div>
            <div style={{padding:14,background:C.peachLight,borderRadius:14}}>
              <p style={{fontSize:12,color:C.textMid,lineHeight:1.5}}>💡 Les messages personnalisés ont <strong>3× plus</strong> de chance d'être acceptés.</p>
            </div>
          </div>
          <div style={{padding:'16px 20px 32px'}}>
            <Btn onClick={()=>go('sent')} disabled={messageText.length<10}>Envoyer le clutch ✦</Btn>
          </div>
        </div>
      </Frame>
    )
  }

  if(screen==='sent') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:`linear-gradient(160deg,${C.bg},${C.primaryLight})`,padding:32,gap:24,textAlign:'center'}}>
        <div style={{fontSize:72}}>☕</div>
        <div>
          <h2 style={{fontSize:26,fontWeight:800,color:C.text}}>Clutch envoyé !</h2>
          <p style={{color:C.textMid,marginTop:8,lineHeight:1.6}}>{profile.name} a <strong>2h</strong> pour répondre.</p>
        </div>
        <Card style={{width:'100%'}}>
          <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:12}}>
            <Avatar src={profile.photo} size={44}/>
            <div style={{textAlign:'left'}}><p style={{fontWeight:700,color:C.text}}>{profile.name}</p><p style={{fontSize:12,color:C.textLight}}>📍 {venueInput} · {selectedTime}</p></div>
          </div>
          <p style={{fontSize:12,color:C.textLight,marginBottom:4,textAlign:'center'}}>Expire dans</p>
          <p style={{fontSize:28,fontWeight:800,color:C.primary,textAlign:'center',fontVariantNumeric:'tabular-nums'}}>{fmt(countdown)}</p>
        </Card>
        <div style={{width:'100%',display:'flex',flexDirection:'column',gap:10}}>
          <Btn onClick={()=>go('received')}>→ Voir la réponse de {profile.name}</Btn>
          <Btn variant="secondary" onClick={()=>go('discover','discover')}>Retour découverte</Btn>
        </div>
      </div>
    </Frame>
  )

  if(screen==='received') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',background:C.bg}}>
        <div style={{padding:'20px 20px 0',display:'flex',alignItems:'center',gap:12}}>
          <Avatar src={ME.photo} size={44}/>
          <div><p style={{fontWeight:700,color:C.text}}>Marie, 28 · {ME.job}</p><ReliabilityBar score={ME.score} badge={ME.badge}/></div>
        </div>
        <div style={{flex:1,padding:20,display:'flex',flexDirection:'column',gap:14}}>
          <Card>
            <p style={{fontSize:12,color:C.textLight,marginBottom:4}}>📍 Lieu proposé</p>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <p style={{fontWeight:700,color:C.text}}>{venueInput||'Café du Grütli'}</p>
              <SafetyBadge safety={venueSafety}/>
            </div>
            <p style={{fontSize:12,color:C.textLight,marginTop:8}}>⏰ {selectedTime||'Ce soir 19h'}</p>
          </Card>
          <Card style={{background:C.primaryLight,border:`1px solid ${C.primary}33`}}>
            <p style={{fontSize:12,color:C.primary,marginBottom:4,fontWeight:600}}>💬 Message</p>
            <p style={{color:C.text,lineHeight:1.6,fontSize:14}}>{messageText||'"Salut ! J\'adorerais prendre un café — j\'ai vu qu\'on aime tous les deux les expos. Ce soir ?"'}</p>
          </Card>
          <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:8}}>
            <Btn variant="sage" onClick={()=>go('rdv')}>✓ Accepter</Btn>
            <Btn variant="ghost" onClick={()=>go('counter')}>↔ Contre-proposer</Btn>
            <Btn variant="secondary" onClick={()=>go('timeout')}>✕ Décliner</Btn>
          </div>
          <p style={{fontSize:12,color:C.textLight,textAlign:'center'}}>Expire dans {fmt(countdown)}</p>
        </div>
      </div>
    </Frame>
  )

  if(screen==='counter') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',background:C.bg}}>
        <TopBar title="Contre-proposition" onBack={()=>go('received')}/>
        <div style={{flex:1,padding:'0 20px',display:'flex',flexDirection:'column',gap:16}}>
          <p style={{color:C.textMid,fontSize:14}}>Ajuste l'heure ou le lieu — <strong>1 seule contre-prop possible</strong>.</p>
          <div>
            <p style={{fontWeight:700,color:C.text,marginBottom:8}}>Ajuster l'heure</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:10}}>
              {['-2h','-1h','-30 min','Comme proposé','+30 min','+1h','+2h'].map(t=>(
                <Pill key={t} active={selectedTime===t} onClick={()=>setSelectedTime(t)}>{t}</Pill>
              ))}
            </div>
            {selectedTime&&selectedTime!=='Comme proposé'&&(
              <div style={{background:C.primaryLight,border:`1px solid ${C.primary}44`,borderRadius:10,padding:'8px 14px',fontSize:13,color:C.primary,fontWeight:700}}>
                ⏰ RDV prévu à : <strong>{applyOffset('Ce soir 19h', selectedTime)}</strong>
              </div>
            )}
          </div>
          <div>
            <p style={{fontWeight:700,color:C.text,marginBottom:8}}>Changer le lieu (optionnel)</p>
            <input placeholder="Autre café..." style={{width:'100%',padding:'12px 14px',borderRadius:12,border:`1.5px solid ${C.border}`,background:C.card,fontSize:14,color:C.text,outline:'none',boxSizing:'border-box'}}/>
          </div>
          <div>
            <p style={{fontWeight:700,color:C.text,marginBottom:8}}>Message (optionnel)</p>
            <textarea placeholder="Ex: Ce serait mieux un peu plus tard pour moi..." rows={3} style={{width:'100%',border:`1.5px solid ${C.border}`,borderRadius:12,padding:12,fontSize:14,fontFamily:'inherit',background:C.card,color:C.text,resize:'none',outline:'none',boxSizing:'border-box'}}/>
          </div>
        </div>
        <div style={{padding:'16px 20px 32px'}}>
          <Btn onClick={()=>go('counter-received')}>Envoyer la contre-proposition</Btn>
        </div>
      </div>
    </Frame>
  )

  if(screen==='counter-received') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:`linear-gradient(160deg,${C.bg},${C.peachLight})`,padding:32,gap:20,textAlign:'center'}}>
        <div style={{fontSize:56}}>↔</div>
        <div>
          <h2 style={{fontSize:24,fontWeight:800,color:C.text}}>Contre-proposition reçue !</h2>
          <p style={{color:C.textMid,marginTop:8,lineHeight:1.6}}>{profile.name} propose <strong>+1h</strong> — même lieu.</p>
        </div>
        <div style={{width:'100%',display:'flex',flexDirection:'column',gap:10}}>
          <Btn variant="sage" onClick={()=>go('rdv')}>✓ J'accepte !</Btn>
          <Btn variant="secondary" onClick={()=>go('timeout')}>Non, je décline</Btn>
        </div>
        <p style={{fontSize:12,color:C.textLight}}>⚠️ Dernier round — 1 seule contre-prop possible</p>
      </div>
    </Frame>
  )

  // ── INBOX ─────────────────────────────────────────────────────────────────
  if(screen==='inbox') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',background:C.bg}}>
        <div style={{padding:'16px 20px 8px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h2 style={{fontSize:22,fontWeight:800,color:C.text}}>Messages</h2>
          <span style={{background:C.primary,color:'#fff',width:22,height:22,borderRadius:'50%',fontSize:12,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>2</span>
        </div>
        <div style={{flex:1,height:0,overflowY:'scroll',WebkitOverflowScrolling:'touch' as any,touchAction:'pan-y'}}>
          {[
            {p:PROFILES[0],last:"Parfait ! À tout à l'heure ✨",time:'14:32',unread:1,status:'accepted'},
            {p:PROFILES[4],last:'Demande de clutch envoyée',time:'12:10',unread:0,status:'pending'},
            {p:PROFILES[1],last:'Dommage, une prochaine fois !',time:'Hier',unread:0,status:'declined'},
          ].map((conv,i)=>(
            <button key={i} onClick={()=>go('chat')} style={{width:'100%',padding:'14px 20px',background:'none',border:'none',borderBottom:`1px solid ${C.border}`,display:'flex',gap:12,alignItems:'center',cursor:'pointer',textAlign:'left'}}>
              <div style={{position:'relative'}}>
                <Avatar src={conv.p.photo} size={48}/>
                {conv.unread>0&&<div style={{position:'absolute',top:0,right:0,width:14,height:14,background:C.primary,borderRadius:'50%',border:'2px solid #fff'}}/>}
              </div>
              <div style={{flex:1}}>
                <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontWeight:700,color:C.text}}>{conv.p.name}</span><span style={{fontSize:12,color:C.textLight}}>{conv.time}</span></div>
                <p style={{fontSize:13,color:conv.unread?C.text:C.textLight,marginTop:2,fontWeight:conv.unread?600:400}}>{conv.last}</p>
              </div>
              <span style={{fontSize:11,padding:'3px 8px',borderRadius:8,background:conv.status==='accepted'?C.sageLight:conv.status==='pending'?C.primaryLight:C.bgDeep,color:conv.status==='accepted'?C.sage:conv.status==='pending'?C.primary:C.textLight,fontWeight:600,whiteSpace:'nowrap'}}>
                {conv.status==='accepted'?'✓ RDV':conv.status==='pending'?'En attente':'Décliné'}
              </span>
            </button>
          ))}
        </div>
        <TabBar tab={activeTab} setScreen={s=>{setActiveTab(s==='discover'?'discover':s==='events'?'events':s==='inbox'?'messages':'profile');go(s)}}/>
      </div>
    </Frame>
  )

  // ── CHAT ──────────────────────────────────────────────────────────────────
  if(screen==='chat') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',background:C.bg}}>
        <div style={{padding:'12px 16px',display:'flex',alignItems:'center',gap:12,borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          <button onClick={()=>go('inbox')} style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:C.textMid}}>←</button>
          <Avatar src={PROFILES[0].photo} size={36}/>
          <div style={{flex:1}}>
            <p style={{fontWeight:700,color:C.text,fontSize:15}}>{PROFILES[0].name}</p>
            <p style={{fontSize:11,color:C.sage}}>✓ RDV · {venueInput||'Café du Grütli'} · {selectedTime||'Ce soir 19h'}</p>
          </div>
          <button onClick={()=>go('sos')} style={{background:C.redLight,border:'none',borderRadius:10,padding:'4px 10px',cursor:'pointer',color:C.red,fontSize:12,fontWeight:700}}>SOS</button>
        </div>
        <div style={{padding:'6px 16px',background:C.primaryLight,display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
          <span style={{fontSize:11,color:C.primary,fontWeight:600}}>💬 {chatMessages.length}/{MSG_LIMIT} — Chatter moins, se voir plus ✨</span>
          <div style={{display:'flex',gap:2}}>
            {Array.from({length:MSG_LIMIT}).map((_,i)=><div key={i} style={{width:8,height:8,borderRadius:'50%',background:i<chatMessages.length?C.primary:C.border}}/>)}
          </div>
        </div>
        <div ref={chatRef} style={{flex:1,height:0,overflowY:'scroll',WebkitOverflowScrolling:'touch' as any,touchAction:'pan-y',padding:16,display:'flex',flexDirection:'column',gap:10}}>
          {chatMessages.map((msg,i)=>(
            <div key={i} style={{display:'flex',justifyContent:msg.from==='me'?'flex-end':'flex-start'}}>
              <div style={{maxWidth:'75%',padding:'10px 14px',borderRadius:msg.from==='me'?'18px 18px 4px 18px':'18px 18px 18px 4px',background:msg.from==='me'?`linear-gradient(135deg,${C.primary},${C.primaryDark})`:C.card,border:msg.from==='me'?'none':`1px solid ${C.border}`,color:msg.from==='me'?'#fff':C.text,fontSize:14,lineHeight:1.5}}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
        {chatMessages.length<MSG_LIMIT?(
          <div style={{padding:'8px 16px 20px',display:'flex',gap:8,borderTop:`1px solid ${C.border}`,flexShrink:0}}>
            <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendMsg()} placeholder="Ton message..." style={{flex:1,padding:'10px 14px',borderRadius:24,border:`1.5px solid ${C.border}`,background:C.bgDeep,fontSize:14,color:C.text,outline:'none'}}/>
            <button onClick={sendMsg} style={{width:40,height:40,borderRadius:'50%',background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,border:'none',color:'#fff',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>↑</button>
          </div>
        ):(
          <div style={{padding:'12px 16px 20px',borderTop:`1px solid ${C.border}`,textAlign:'center',flexShrink:0}}>
            <p style={{fontSize:13,color:C.textMid,marginBottom:10}}>🔒 Limite atteinte — place à la rencontre réelle !</p>
            <Btn onClick={()=>go('rdv')} size="sm">→ Voir le RDV</Btn>
          </div>
        )}
      </div>
    </Frame>
  )

  if(screen==='chat-limit') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:`linear-gradient(160deg,${C.bg},${C.primaryLight})`,padding:32,gap:20,textAlign:'center'}}>
        <div style={{fontSize:64}}>☕</div>
        <h2 style={{fontSize:24,fontWeight:800,color:C.text}}>C'est l'heure de se voir !</h2>
        <p style={{color:C.textMid,lineHeight:1.6}}>Vous avez échangé {MSG_LIMIT} messages. Clutch c'est fait pour les rencontres <em>réelles</em> !</p>
        <Card style={{width:'100%'}}>
          <p style={{fontWeight:700,color:C.text}}>Votre RDV</p>
          <p style={{color:C.textMid,marginTop:4}}>📍 {venueInput||'Café du Grütli'} · {selectedTime||'Ce soir 19h'}</p>
        </Card>
        <Btn onClick={()=>go('rdv')}>→ Voir le RDV actif</Btn>
      </div>
    </Frame>
  )

  // ── RDV ───────────────────────────────────────────────────────────────────
  if(screen==='rdv') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',background:C.bg}}>
        <div style={{padding:'16px 20px',background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,color:'#fff',textAlign:'center',flexShrink:0}}>
          <p style={{fontSize:12,opacity:0.8,letterSpacing:'0.1em'}}>RDV ACTIF</p>
          <p style={{fontSize:32,fontWeight:800,fontVariantNumeric:'tabular-nums',letterSpacing:'-0.02em'}}>{fmt(countdown)}</p>
          <p style={{fontSize:12,opacity:0.8}}>avant que le créneau soit libéré</p>
        </div>
        <div style={{flex:1,padding:20,display:'flex',flexDirection:'column',gap:14,overflowY:'scroll',WebkitOverflowScrolling:'touch' as any,touchAction:'pan-y'}}>
          <Card>
            <div style={{display:'flex',gap:12,alignItems:'center'}}>
              <Avatar src={PROFILES[0].photo} size={48}/>
              <div><p style={{fontWeight:700,color:C.text}}>{PROFILES[0].name}</p><ReliabilityBar score={PROFILES[0].score} badge={PROFILES[0].badge}/></div>
            </div>
            <div style={{marginTop:14,display:'flex',flexDirection:'column',gap:8}}>
              {[['📍 Lieu',venueInput||'Café du Grütli'],['⏰ Heure',selectedTime||'Ce soir 19h']].map(([k,v])=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between'}}><span style={{color:C.textLight,fontSize:13}}>{k}</span><span style={{fontWeight:700,color:C.text,fontSize:13}}>{v}</span></div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:C.textLight,fontSize:13}}>🔒 Sécurité</span><SafetyBadge safety={venueSafety}/></div>
            </div>
          </Card>
          <button onClick={()=>go('checkin')} style={{padding:16,borderRadius:16,border:'none',background:`linear-gradient(135deg,${C.sage},#5A8A6A)`,color:'#fff',fontWeight:700,fontSize:16,cursor:'pointer'}}>
            📍 Je suis arrivé·e — Check-in
          </button>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <Btn variant="secondary" size="sm" onClick={()=>go('late-send')}>⏰ En retard</Btn>
            <Btn variant="danger" size="sm" onClick={()=>go('cancel-confirm')}>✕ Annuler</Btn>
          </div>
          <button onClick={()=>go('sos')} style={{padding:14,borderRadius:14,background:C.redLight,border:`1.5px solid ${C.red}33`,color:C.red,fontWeight:700,fontSize:15,cursor:'pointer'}}>
            🆘 SOS — Besoin d'aide
          </button>
        </div>
      </div>
    </Frame>
  )

  if(screen==='late-send') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:C.bg,padding:32,gap:20,textAlign:'center'}}>
        <div style={{fontSize:64}}>⏰</div>
        <h2 style={{fontSize:24,fontWeight:800,color:C.text}}>Tu es en retard</h2>
        <p style={{color:C.textMid,lineHeight:1.6}}>{PROFILES[0].name} va être prévenu·e. Combien de temps ?</p>
        <div style={{width:'100%',display:'flex',flexDirection:'column',gap:10}}>
          {['5 min','10 min','15 min','20 min+'].map(t=>(
            <button key={t} onClick={()=>go('late-waiting')} style={{padding:14,borderRadius:14,border:`1.5px solid ${C.border}`,background:C.card,cursor:'pointer',fontWeight:600,color:C.text}}>+{t}</button>
          ))}
        </div>
        <p style={{fontSize:12,color:C.textLight}}>Prévenir évite la pénalité 🐰</p>
      </div>
    </Frame>
  )

  if(screen==='late-waiting') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:C.bg,padding:32,gap:20,textAlign:'center'}}>
        <div style={{fontSize:64}}>🏃</div>
        <h2 style={{fontSize:22,fontWeight:800,color:C.text}}>{PROFILES[0].name} a été prévenu·e</h2>
        <p style={{color:C.textMid,lineHeight:1.6}}>Ton retard a été notifié. Aucune pénalité si tu arrives bientôt.</p>
        <Btn onClick={()=>go('rdv')}>← Retour au RDV</Btn>
      </div>
    </Frame>
  )

  if(screen==='cancel-confirm') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:C.bg,padding:32,gap:20,textAlign:'center'}}>
        <div style={{fontSize:64}}>🐰</div>
        <h2 style={{fontSize:24,fontWeight:800,color:C.text}}>Annuler = Poser un lapin</h2>
        <p style={{color:C.textMid,lineHeight:1.6}}>Ton score baisse de <strong>10 points</strong> et tu perds 1 crédit d'invitation.</p>
        <Card style={{background:C.redLight,border:`1px solid ${C.red}33`,width:'100%',textAlign:'left'}}>
          <p style={{color:C.red,fontWeight:700}}>Conséquences :</p>
          <ul style={{color:C.textMid,paddingLeft:16,marginTop:8,fontSize:13,lineHeight:1.8}}>
            <li>Score : 92% → 82%</li>
            <li>Badge temporaire : 🐰 Lapin</li>
            <li>-1 invitation cette semaine</li>
          </ul>
        </Card>
        <div style={{width:'100%',display:'flex',flexDirection:'column',gap:10}}>
          <Btn variant="danger" onClick={()=>go('rabbit')}>Confirmer l'annulation</Btn>
          <Btn variant="secondary" onClick={()=>go('rdv')}>← Non, j'y vais !</Btn>
        </div>
      </div>
    </Frame>
  )

  if(screen==='checkin') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:`linear-gradient(160deg,${C.bg},${C.sageLight})`,padding:32,gap:20,textAlign:'center'}}>
        <div style={{fontSize:72}}>📍</div>
        <h2 style={{fontSize:24,fontWeight:800,color:C.text}}>Check-in confirmé !</h2>
        <p style={{color:C.textMid,lineHeight:1.6}}>Tu es arrivé·e. En attente du check-in de {PROFILES[0].name}...</p>
        <p style={{fontSize:13,color:C.sage,fontWeight:600}}>✓ Ton arrivée est enregistrée</p>
        <Btn onClick={()=>go('postrdv')}>→ Simuler la fin du RDV</Btn>
      </div>
    </Frame>
  )

  if(screen==='postrdv') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',background:C.bg,padding:24,gap:20}}>
        <div style={{textAlign:'center',paddingTop:20}}>
          <div style={{fontSize:56}}>✨</div>
          <h2 style={{fontSize:24,fontWeight:800,color:C.text,marginTop:10}}>Comment s'est passé le clutch ?</h2>
          <p style={{color:C.textMid,fontSize:13,marginTop:6}}>Ton retour est anonyme.</p>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {[
            {rating:'super',emoji:'⭐',label:'Super rencontre !',desc:`+5 pts pour ${PROFILES[0].name}`,color:C.sage,bg:C.sageLight},
            {rating:'ok',emoji:'👍',label:"C'était bien",desc:'Pas d\'impact sur le score',color:C.peach,bg:C.peachLight},
            {rating:'rabbit',emoji:'🐰',label:'A posé un lapin',desc:'-10 pts et badge Lapin',color:C.gold,bg:'#FFF8DC'},
            {rating:'ghost',emoji:'👻',label:"N'est pas venu·e",desc:'-20 pts, cooldown 7 jours',color:C.red,bg:C.redLight},
          ].map(r=>(
            <button key={r.rating} onClick={()=>go('discover','discover')} style={{padding:16,borderRadius:16,border:`1.5px solid ${r.color}33`,background:r.bg,cursor:'pointer',display:'flex',alignItems:'center',gap:14,textAlign:'left'}}>
              <span style={{fontSize:32}}>{r.emoji}</span>
              <div><p style={{fontWeight:700,color:C.text}}>{r.label}</p><p style={{fontSize:12,color:r.color}}>{r.desc}</p></div>
            </button>
          ))}
        </div>
      </div>
    </Frame>
  )

  if(screen==='timeout') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:C.bg,padding:32,gap:20,textAlign:'center'}}>
        <div style={{fontSize:64}}>⏳</div>
        <h2 style={{fontSize:24,fontWeight:800,color:C.text}}>Le créneau est expiré</h2>
        <p style={{color:C.textMid,lineHeight:1.6}}>{profile.name} n'a pas répondu en 2h. Aucune pénalité pour toi.</p>
        <Btn onClick={()=>go('discover','discover')}>Découvrir d'autres profils</Btn>
      </div>
    </Frame>
  )

  if(screen==='rabbit') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:C.bg,padding:32,gap:20,textAlign:'center'}}>
        <div style={{fontSize:72}}>🐰</div>
        <h2 style={{fontSize:24,fontWeight:800,color:C.text}}>Tu as posé un lapin...</h2>
        <p style={{color:C.textMid,lineHeight:1.6}}>Score : <strong>82%</strong> · Badge 🐰 Lapin temporaire.</p>
        <Card style={{background:'#FFF8DC',border:'1px solid #D4A017',width:'100%'}}>
          <p style={{fontWeight:700,color:C.text}}>Regagner ta réputation :</p>
          <p style={{fontSize:13,color:C.textMid,marginTop:6,lineHeight:1.6}}>3 RDV consécutifs honorés → badge effacé.</p>
        </Card>
        <Btn onClick={()=>go('discover','discover')}>Recommencer proprement</Btn>
      </div>
    </Frame>
  )

  if(screen==='ghost') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#0D0D0D',padding:32,gap:20,textAlign:'center'}}>
        <div style={{fontSize:80}}>👻</div>
        <h2 style={{fontSize:24,fontWeight:800,color:'#fff'}}>Vous avez joué le fantôme</h2>
        <p style={{color:'#aaa',lineHeight:1.6}}>Score <strong style={{color:C.red}}>-20 pts</strong>. Cooldown <strong style={{color:C.red}}>7 jours</strong>.</p>
        <div style={{background:'#1a1a1a',borderRadius:16,padding:20,width:'100%',textAlign:'left'}}>
          <p style={{color:'#fff',fontWeight:700}}>👻 Fantôme vs 🐰 Lapin :</p>
          <p style={{color:'#aaa',fontSize:13,marginTop:6,lineHeight:1.8}}>Lapin = tu as prévenu avant. Fantôme = tu as disparu sans rien dire. La différence compte.</p>
        </div>
        <Btn variant="danger" onClick={()=>go('discover','discover')}>Reprendre correctement</Btn>
      </div>
    </Frame>
  )

  // ── EVENTS ────────────────────────────────────────────────────────────────
  if(screen==='events'){
    const filtered=EVENTS.filter(e=>eventFilter==='all'||e.type===eventFilter)
    return (
      <Frame>
        <div style={{flex:1,display:'flex',flexDirection:'column',background:C.bg}}>
          <div style={{padding:'16px 20px 8px',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
            <h2 style={{fontSize:22,fontWeight:800,color:C.text}}>Événements</h2>
            <button onClick={()=>go('create-event')} style={{background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,border:'none',borderRadius:20,padding:'6px 14px',color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer'}}>+ Créer</button>
          </div>
          <div style={{padding:'0 20px 8px',display:'flex',gap:8,overflowX:'auto',flexShrink:0}}>
            {[{id:'all',label:'Tout'},{id:'clutch',label:'✦ Clutch'},{id:'partner',label:'🤝 Partenaires'},{id:'user',label:'👥 Communauté'}].map(f=>(
              <Pill key={f.id} active={eventFilter===f.id} onClick={()=>setEventFilter(f.id)}>{f.label}</Pill>
            ))}
          </div>
          <div style={{flex:1,height:0,overflowY:'scroll',WebkitOverflowScrolling:'touch' as any,touchAction:'pan-y',padding:'0 12px 12px',display:'flex',flexDirection:'column',gap:8}}>
            {filtered.map(ev=>(
              <button key={ev.id} onClick={()=>{setSelectedEvent(ev);go('event-detail')}} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:'hidden',textAlign:'left',cursor:'pointer',display:'flex',boxShadow:`0 1px 6px ${C.shadow}`,minHeight:76}}>
                <img src={ev.photo} alt="" style={{width:76,height:76,objectFit:'cover',flexShrink:0}}/>
                <div style={{padding:'10px 12px',flex:1,minWidth:0}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:4,marginBottom:3}}>
                    <span style={{fontSize:13,fontWeight:700,color:C.text,lineHeight:1.2}}>{ev.emoji} {ev.title}</span>
                    <span style={{fontSize:9,padding:'2px 6px',borderRadius:6,background:`${ev.badgeColor}22`,color:ev.badgeColor,fontWeight:700,whiteSpace:'nowrap',flexShrink:0}}>{ev.badge}</span>
                  </div>
                  <div style={{fontSize:11,color:C.textLight,marginBottom:4}}>📍 {ev.venue}</div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:11,color:C.textMid}}>⏰ {ev.date}</span>
                    <div style={{display:'flex',gap:6,alignItems:'center'}}>
                      <span style={{fontSize:12,fontWeight:700,color:C.primary}}>{ev.price}</span>
                      <button onClick={e=>{e.stopPropagation();shareIt({title:ev.title,text:`${ev.emoji} ${ev.title} — ${ev.venue} · ${ev.date} · ${ev.price}\n\nVia Clutch Lausanne`,url:APP_URL+'/demo'})}} style={{background:'none',border:'none',cursor:'pointer',fontSize:13,padding:'2px 4px',color:C.textLight}}>↗</button>
                    </div>
                  </div>
                  <div style={{fontSize:10,color:C.textLight,marginTop:2,display:'flex',alignItems:'center',gap:6}}>
                    <span>👥 {ev.spots} places</span>
                    {ev.creator&&<><span>·</span><span>{(ev.creator as any).name}</span></>}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <TabBar tab={activeTab} setScreen={s=>{setActiveTab(s==='discover'?'discover':s==='events'?'events':s==='inbox'?'messages':'profile');go(s)}}/>
        </div>
      </Frame>
    )
  }

  if(screen==='event-detail'&&selectedEvent) return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',background:C.bg,overflowY:'scroll',WebkitOverflowScrolling:'touch' as any,touchAction:'pan-y'}}>
        <div style={{position:'relative'}}>
          <img src={selectedEvent.photo} alt="" style={{width:'100%',height:220,objectFit:'cover'}}/>
          <button onClick={()=>go('events')} style={{position:'absolute',top:16,left:16,width:36,height:36,borderRadius:'50%',background:'rgba(255,255,255,0.9)',border:'none',fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>←</button>
          <span style={{position:'absolute',top:16,right:16,fontSize:11,padding:'4px 10px',borderRadius:20,background:selectedEvent.badgeColor,color:'#fff',fontWeight:700}}>{selectedEvent.badge}</span>
        </div>
        <div style={{padding:20,display:'flex',flexDirection:'column',gap:14}}>
          <div><h2 style={{fontSize:22,fontWeight:800,color:C.text}}>{selectedEvent.emoji} {selectedEvent.title}</h2><p style={{color:C.textLight,fontSize:13,marginTop:4}}>📍 {selectedEvent.venue}</p></div>
          <p style={{color:C.textMid,lineHeight:1.65}}>{selectedEvent.desc}</p>
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {[['⏰ Date',selectedEvent.date],['💰 Prix',selectedEvent.price],['👥 Places',`${selectedEvent.spots} restantes`],['🏷 Type',selectedEvent.badge]].map(([k,v])=>(
                <div key={k}><p style={{fontSize:11,color:C.textLight}}>{k}</p><p style={{fontWeight:700,color:C.text,fontSize:14}}>{v}</p></div>
              ))}
            </div>
          </Card>
          {selectedEvent.creator&&(
            <Card>
              <p style={{fontSize:12,color:C.textLight,marginBottom:8}}>Organisé par</p>
              <div style={{display:'flex',gap:10,alignItems:'center'}}>
                <Avatar src={(selectedEvent.creator as any).photo} size={40}/>
                <div><p style={{fontWeight:700,color:C.text}}>{(selectedEvent.creator as any).name}</p><ReliabilityBar score={(selectedEvent.creator as any).score} badge={(selectedEvent.creator as any).badge}/></div>
              </div>
            </Card>
          )}
        </div>
        <div style={{padding:'0 20px 32px',display:'flex',flexDirection:'column',gap:10}}>
          <Btn>🎟 Réserver ma place</Btn>
          <Btn variant="ghost" onClick={()=>go('propose')}>☕ Clutcher quelqu'un pour cet event</Btn>
        </div>
      </div>
    </Frame>
  )

  if(screen==='create-event') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',background:C.bg}}>
        <TopBar title="Créer un événement" onBack={()=>go('events')}/>
        <div style={{flex:1,height:0,overflowY:'scroll',WebkitOverflowScrolling:'touch' as any,touchAction:'pan-y',padding:'0 20px',display:'flex',flexDirection:'column',gap:14}}>
          <div>
            <p style={{fontWeight:700,color:C.text,marginBottom:8,fontSize:13}}>Type d'événement</p>
            {demoAccountType==='user'&&<p style={{fontSize:11,color:C.peach,marginBottom:8}}>👥 Compte standard — tu peux créer des activités communautaires uniquement.</p>}
            {demoAccountType==='partner'&&<p style={{fontSize:11,color:C.sage,marginBottom:8}}>🤝 Compte partenaire — tu peux créer des activités et des événements partenaire.</p>}
            {demoAccountType==='admin'&&<p style={{fontSize:11,color:C.primary,marginBottom:8}}>✦ Compte admin — accès à tous les types.</p>}
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {[
                {t:'user',l:'👥 Mon activité',c:C.peach,allowed:['user','partner','admin']},
                {t:'partner',l:'🤝 Partenaire',c:C.sage,allowed:['partner','admin']},
                {t:'clutch',l:'✦ Clutch Officiel',c:C.primary,allowed:['admin']},
              ].filter(opt=>opt.allowed.includes(demoAccountType)).map(opt=>(
                <Pill key={opt.t} active={newEventType===opt.t} color={opt.c} onClick={()=>setNewEventType(opt.t as any)}>{opt.l}</Pill>
              ))}
            </div>
          </div>
          {[{label:'Titre',placeholder:'Ex: Brunch au lac dimanche',val:newEventTitle,set:setNewEventTitle},{label:'Lieu',placeholder:'Ex: Plage d\'Ouchy, Lausanne',val:newEventVenue,set:setNewEventVenue}].map(f=>(
            <div key={f.label}>
              <p style={{fontWeight:700,color:C.text,marginBottom:6,fontSize:13}}>{f.label}</p>
              <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.placeholder} style={{width:'100%',padding:'12px 14px',borderRadius:12,border:`1.5px solid ${C.border}`,background:C.card,fontSize:14,color:C.text,outline:'none',boxSizing:'border-box'}}/>
            </div>
          ))}
          <div>
            <p style={{fontWeight:700,color:C.text,marginBottom:6,fontSize:13}}>Description</p>
            <textarea placeholder="Décris ton activité..." rows={4} style={{width:'100%',border:`1.5px solid ${C.border}`,borderRadius:12,padding:12,fontSize:14,fontFamily:'inherit',background:C.card,color:C.text,resize:'none',outline:'none',boxSizing:'border-box'}}/>
          </div>
          <div>
            <p style={{fontWeight:700,color:C.text,marginBottom:6,fontSize:13}}>Prix / participation</p>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}}>
              {['Gratuit','5 CHF','10 CHF','15 CHF','20 CHF','28 CHF'].map(pr=>(
                <button key={pr} onClick={()=>setNewEventVenue(pr)} style={{padding:'6px 12px',borderRadius:20,border:`1.5px solid ${newEventVenue===pr?C.primary:C.border}`,background:newEventVenue===pr?C.primaryLight:C.card,color:C.text,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>{pr}</button>
              ))}
            </div>
            <input placeholder="Ou saisir un montant (ex: 12 CHF)" style={{width:'100%',padding:'10px 12px',borderRadius:12,border:`1.5px solid ${C.border}`,background:C.card,fontSize:13,color:C.text,outline:'none',boxSizing:'border-box'}}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div>
              <p style={{fontWeight:700,color:C.text,marginBottom:6,fontSize:13}}>Date & heure</p>
              <input type="datetime-local" style={{width:'100%',padding:'10px 12px',borderRadius:12,border:`1.5px solid ${C.border}`,background:C.card,fontSize:13,color:C.text,outline:'none',boxSizing:'border-box'}}/>
            </div>
            <div>
              <p style={{fontWeight:700,color:C.text,marginBottom:6,fontSize:13}}>Places</p>
              <input type="number" defaultValue={6} min={2} max={20} style={{width:'100%',padding:'10px 12px',borderRadius:12,border:`1.5px solid ${C.border}`,background:C.card,fontSize:13,color:C.text,outline:'none',boxSizing:'border-box'}}/>
            </div>
          </div>
          <div style={{padding:'12px 14px',background:'#FFF8DC',borderRadius:12,border:'1px solid #D4A01733',fontSize:12,color:'#7A6020',lineHeight:1.5}}>
            ⚠️ Les événements créés par des utilisateurs sont <strong>examinés par l'équipe Clutch</strong> avant publication (sous 24h). Les contenus inappropriés sont refusés.
          </div>
        </div>
        <div style={{padding:'16px 20px 32px'}}>
          <Btn onClick={()=>go('events')} disabled={!newEventTitle||!newEventVenue}>Publier l'événement 🎉</Btn>
        </div>
      </div>
    </Frame>
  )

  // ── MY PROFILE ────────────────────────────────────────────────────────────
  if(screen==='myprofile') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',background:C.bg,overflowY:'scroll',WebkitOverflowScrolling:'touch' as any,touchAction:'pan-y'}}>
        <div style={{background:`linear-gradient(160deg,${C.primaryLight},${C.peachLight})`,padding:'32px 20px 20px',display:'flex',flexDirection:'column',alignItems:'center',gap:12,flexShrink:0}}>
          <div style={{position:'relative'}}>
            <Avatar src={ME.photo} size={80} border={`3px solid ${C.primary}`}/>
            {isPremium&&<div style={{position:'absolute',bottom:0,right:0,background:`linear-gradient(135deg,${C.gold},#B8860B)`,borderRadius:'50%',width:24,height:24,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12}}>⭐</div>}
          </div>
          <div style={{textAlign:'center'}}>
            <h2 style={{fontSize:22,fontWeight:800,color:C.text}}>{ME.name}, {ME.age}</h2>
            <p style={{fontSize:13,color:C.textMid}}>{ME.job} · 📍 {ME.neighborhood}</p>
          </div>
          <div style={{width:'100%',maxWidth:240}}><ReliabilityBar score={ME.score} badge={ME.badge}/></div>
          <div style={{display:'flex',gap:20}}>
            {[['7','Clutches'],['5','Honorés'],['92%','Fiabilité']].map(([v,l])=>(
              <div key={l} style={{textAlign:'center'}}><p style={{fontWeight:800,fontSize:18,color:C.text}}>{v}</p><p style={{fontSize:11,color:C.textLight}}>{l}</p></div>
            ))}
          </div>
        </div>
        <div style={{padding:20,display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {ME.interests.map(i=><Pill key={i} active>{i}</Pill>)}
          </div>
          <button onClick={()=>go('premium')} style={{padding:16,borderRadius:16,background:isPremium?`linear-gradient(135deg,${C.gold}22,${C.gold}44)`:`linear-gradient(135deg,${C.gold}11,${C.gold}22)`,border:`1.5px solid ${C.gold}`,cursor:'pointer',textAlign:'left',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div><p style={{fontWeight:700,color:C.text}}>{isPremium?'⭐ Premium actif':'⭐ Passer en Premium'}</p><p style={{fontSize:12,color:C.textLight}}>{isPremium?'Profite de toutes les fonctions':'19.90 CHF/mois · Clutches illimités + boost'}</p></div>
            <span style={{color:C.gold,fontSize:20}}>→</span>
          </button>
          {/* Share section */}
          <div style={{background:C.card,borderRadius:16,padding:16,border:`1px solid ${C.border}`}}>
            <p style={{fontWeight:700,color:C.text,fontSize:14,marginBottom:12}}>📤 Partager</p>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <button onClick={()=>shareIt({title:'Mon profil Clutch',text:`Je suis sur Clutch, l'app des rencontres spontanées à Lausanne ! Rejoins-moi ☕`,url:APP_URL+'/app'})}
                style={{padding:'11px 14px',borderRadius:12,border:`1.5px solid ${C.border}`,background:C.bgDeep,cursor:'pointer',color:C.text,fontSize:13,fontWeight:600,textAlign:'left',fontFamily:'inherit'}}>
                👤 Partager mon profil
              </button>
              <button onClick={()=>shareIt({title:'Rejoins Clutch !',text:`Viens sur Clutch — l'app pour se retrouver en vrai dans les 18h à Lausanne ☕`,url:APP_URL})}
                style={{padding:'11px 14px',borderRadius:12,border:`1.5px solid ${C.primary}44`,background:C.primaryLight,cursor:'pointer',color:C.primary,fontSize:13,fontWeight:600,textAlign:'left',fontFamily:'inherit'}}>
                ✉️ Inviter un(e) ami(e)
              </button>
              <button onClick={()=>shareIt({title:'Clutch — démo interactive',text:`Essaie la démo Clutch — l'app des RDV physiques dans les 18h à Lausanne ☕`,url:APP_URL+'/demo'})}
                style={{padding:'11px 14px',borderRadius:12,border:`1.5px solid ${C.border}`,background:C.bgDeep,cursor:'pointer',color:C.textMid,fontSize:13,fontWeight:600,textAlign:'left',fontFamily:'inherit'}}>
                🎬 Partager la démo
              </button>
            </div>
          </div>
          {/* Disponibilité */}
          <button onClick={()=>go('availability')} style={{padding:14,borderRadius:14,background:isAvailable?C.sageLight:C.bgDeep,border:`1.5px solid ${isAvailable?C.sage:C.border}`,cursor:'pointer',textAlign:'left',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <p style={{fontWeight:700,color:isAvailable?C.sage:C.text,fontSize:13}}>{isAvailable?'● Je suis disponible':'○ Pas disponible'}</p>
              {isAvailable&&<p style={{fontSize:11,color:C.sage,marginTop:2}}>{availCity}{availFrom?` · ${availFrom}`:''}{availUntil?` → ${availUntil}`:''}</p>}
            </div>
            <span style={{color:isAvailable?C.sage:C.textLight,fontSize:14}}>→</span>
          </button>
          {/* Type de compte (démo) */}
          <div style={{background:C.card,borderRadius:14,padding:14,border:`1px solid ${C.border}`}}>
            <p style={{fontWeight:700,color:C.text,fontSize:13,marginBottom:10}}>🎭 Type de compte (démo)</p>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {([['user','👥 Standard',C.peach],['partner','🤝 Partenaire',C.sage],['admin','✦ Admin',C.primary]] as const).map(([t,l,c])=>(
                <button key={t} onClick={()=>{setDemoAccountType(t);lsSet('demo_account_type',t)}} style={{padding:'6px 12px',borderRadius:20,border:`1.5px solid ${demoAccountType===t?c:C.border}`,background:demoAccountType===t?`${c}22`:C.bgDeep,color:demoAccountType===t?c:C.textMid,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>{l}</button>
              ))}
            </div>
          </div>
          <button onClick={()=>go('sos')} style={{padding:14,borderRadius:14,background:C.redLight,border:`1.5px solid ${C.red}33`,cursor:'pointer',color:C.red,fontWeight:700,fontSize:14}}>
            🆘 Paramètres SOS
          </button>
          <button onClick={()=>go('scenarios')} style={{padding:14,borderRadius:14,background:C.bgDeep,border:`1.5px solid ${C.border}`,cursor:'pointer',color:C.textMid,fontSize:14,fontWeight:600}}>
            🗺 Menu des scénarios
          </button>
          <button onClick={()=>{setTutorialIdx(0);go('tutorial-0')}} style={{padding:14,borderRadius:14,background:C.bgDeep,border:`1.5px solid ${C.border}`,cursor:'pointer',color:C.textMid,fontSize:14,fontWeight:600}}>
            📖 Comment ça marche ?
          </button>
        </div>
        <TabBar tab={activeTab} setScreen={s=>{setActiveTab(s==='discover'?'discover':s==='events'?'events':s==='inbox'?'messages':'profile');go(s)}}/>
      </div>
    </Frame>
  )

  // ── PREMIUM ───────────────────────────────────────────────────────────────
  if(screen==='premium') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',background:C.bg,overflowY:'scroll',WebkitOverflowScrolling:'touch' as any,touchAction:'pan-y'}}>
        <TopBar title="Premium" onBack={()=>go('myprofile')}/>
        <div style={{padding:'0 20px 32px',display:'flex',flexDirection:'column',gap:16}}>
          <div style={{background:`linear-gradient(135deg,${C.gold}22,${C.gold}44)`,borderRadius:20,padding:24,textAlign:'center',border:`1.5px solid ${C.gold}`}}>
            <p style={{fontSize:42}}>⭐</p>
            <h2 style={{fontSize:24,fontWeight:800,color:C.text}}>Clutch Premium</h2>
            <p style={{fontSize:28,fontWeight:900,color:C.gold,marginTop:4}}>19.90 CHF<span style={{fontSize:14,fontWeight:500,color:C.textMid}}>/mois</span></p>
            <p style={{fontSize:13,color:C.sage,fontWeight:600,marginTop:4}}>✓ Sécurité & contrôle inclus par défaut</p>
          </div>
          {[
            {icon:'💜',title:'Voir qui a aimé ton profil',desc:'Accède directement aux profils intéressés par toi.'},
            {icon:'📊',title:'Affinités détaillées',desc:'Rythme de vie, valeurs, distance — tout analyser.'},
            {icon:'⚡',title:'Priorité dans la découverte',desc:'Ton profil apparaît en premier.'},
            {icon:'🎟',title:'Accès prioritaire aux events',desc:'Réserve avant les autres sur les événements Clutch.'},
            {icon:'↔',title:'Deux contre-propositions',desc:"Au lieu d'une seule, tu peux négocier plus."},
            {icon:'📈',title:'Stats détaillées',desc:'Taux d\'acceptation, meilleurs horaires.'},
          ].map(f=>(
            <div key={f.title} style={{display:'flex',gap:14,alignItems:'flex-start'}}>
              <span style={{fontSize:24,minWidth:36,textAlign:'center'}}>{f.icon}</span>
              <div><p style={{fontWeight:700,color:C.text}}>{f.title}</p><p style={{fontSize:13,color:C.textMid,marginTop:2}}>{f.desc}</p></div>
            </div>
          ))}
          <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:8}}>
            <Btn variant="premium" onClick={()=>{setIsPremium(true);go('myprofile')}}>{isPremium?'✓ Premium actif':'⭐ Activer Premium (démo)'}</Btn>
            {isPremium&&<Btn variant="secondary" onClick={()=>{setIsPremium(false);go('myprofile')}}>Désactiver (démo)</Btn>}
          </div>
        </div>
      </div>
    </Frame>
  )

  // ── SOS ───────────────────────────────────────────────────────────────────
  if(screen==='sos') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',background:C.bg}}>
        <TopBar title="Sécurité" onBack={()=>go(prevScreen)}/>
        <div style={{flex:1,padding:'0 20px',display:'flex',flexDirection:'column',gap:14,overflowY:'scroll',WebkitOverflowScrolling:'touch' as any,touchAction:'pan-y'}}>
          <div style={{padding:16,background:C.redLight,borderRadius:16,border:`1.5px solid ${C.red}33`,textAlign:'center'}}>
            <p style={{fontSize:36}}>🆘</p>
            <p style={{fontWeight:700,color:C.red,fontSize:16}}>Besoin d'aide immédiate ?</p>
            <p style={{fontSize:13,color:C.textMid,marginTop:4}}>Appelle le 117 (Police) ou le 144 (Ambulance)</p>
          </div>
          <button onClick={()=>go('sos-active')} style={{padding:20,borderRadius:18,background:`linear-gradient(135deg,${C.red},#B83030)`,border:'none',color:'#fff',fontWeight:800,fontSize:18,cursor:'pointer'}}>
            🆘 Envoyer ma position à mes proches
          </button>
          <Card>
            <p style={{fontWeight:700,color:C.text,marginBottom:10}}>📞 Contacts d'urgence</p>
            {[{name:'Maman',phone:'+41 79 123 45 67'},{name:'Sophie (amie)',phone:'+41 78 987 65 43'}].map(c=>(
              <div key={c.name} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:`1px solid ${C.border}`}}>
                <span style={{fontWeight:600,color:C.text}}>{c.name}</span>
                <span style={{fontSize:13,color:C.primary}}>{c.phone}</span>
              </div>
            ))}
            <button style={{marginTop:10,background:'none',border:`1.5px dashed ${C.border}`,borderRadius:10,padding:'8px 14px',color:C.textLight,cursor:'pointer',width:'100%',fontSize:13}}>+ Ajouter un contact</button>
          </Card>
          <Card>
            <p style={{fontWeight:700,color:C.text,marginBottom:8}}>💡 Conseils Clutch</p>
            {['Premier RDV = lieu public animé','Dis à un proche où tu vas','Fais confiance à ton instinct','Tu peux partir à tout moment'].map(tip=>(
              <p key={tip} style={{fontSize:13,color:C.textMid,padding:'4px 0',display:'flex',gap:8}}><span style={{color:C.sage}}>✓</span>{tip}</p>
            ))}
          </Card>
        </div>
      </div>
    </Frame>
  )

  if(screen==='sos-active') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#0D0810',padding:32,gap:24,textAlign:'center'}}>
        <div style={{width:120,height:120,borderRadius:'50%',background:C.redLight,display:'flex',alignItems:'center',justifyContent:'center',fontSize:52}}>🆘</div>
        <h2 style={{fontSize:24,fontWeight:800,color:'#fff'}}>Position partagée</h2>
        <p style={{color:'#ccc',lineHeight:1.6}}>Ta position GPS est envoyée en temps réel à <strong style={{color:'#fff'}}>Maman</strong> et <strong style={{color:'#fff'}}>Sophie</strong>.</p>
        <div style={{background:'#1a1a2e',borderRadius:16,padding:16,width:'100%'}}>
          <p style={{color:'#888',fontSize:12}}>📍 Position actuelle</p>
          <p style={{color:'#fff',fontWeight:700}}>Café du Grütli, Lausanne</p>
          <p style={{color:C.red,fontSize:12,marginTop:4}}>● Partage actif depuis 00:42</p>
        </div>
        <div style={{width:'100%',display:'flex',flexDirection:'column',gap:10}}>
          <button style={{padding:14,borderRadius:14,background:C.red,border:'none',color:'#fff',fontWeight:700,fontSize:16,cursor:'pointer'}}>📞 Appeler le 117</button>
          <button onClick={()=>go('sos')} style={{padding:12,borderRadius:14,background:'#1a1a1a',border:'none',color:'#888',cursor:'pointer'}}>Arrêter le partage</button>
        </div>
      </div>
    </Frame>
  )

  // ── AVAILABILITY ────────────────────────────────────────────────────────────
  if(screen==='availability') return (
    <Frame>
      <div style={{flex:1,display:'flex',flexDirection:'column',background:C.bg}}>
        <TopBar title="Ma disponibilité" onBack={()=>go('myprofile')}/>
        <div style={{flex:1,overflowY:'scroll',WebkitOverflowScrolling:'touch' as any,padding:'12px 20px',display:'flex',flexDirection:'column',gap:16}}>
          <div style={{background:isAvailable?C.sageLight:C.bgDeep,border:`1.5px solid ${isAvailable?C.sage:C.border}`,borderRadius:16,padding:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <p style={{fontWeight:700,color:isAvailable?C.sage:C.text}}>{isAvailable?'● Je suis disponible':'○ Pas disponible'}</p>
              <p style={{fontSize:12,color:C.textMid,marginTop:2}}>Visible dans la liste des profils</p>
            </div>
            <button onClick={()=>{const n=!isAvailable;setIsAvailable(n);lsSet('demo_available',n)}} style={{width:44,height:24,borderRadius:12,background:isAvailable?C.sage:C.border,border:'none',position:'relative',cursor:'pointer',flexShrink:0}}>
              <div style={{width:18,height:18,borderRadius:'50%',background:'#fff',position:'absolute',top:3,left:isAvailable?23:3,transition:'left 0.2s'}}/>
            </button>
          </div>
          <div>
            <p style={{fontWeight:700,color:C.text,fontSize:13,marginBottom:8}}>📍 Où es-tu disponible ?</p>
            <p style={{fontSize:11,color:C.textLight,marginBottom:10}}>Lausanne</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:12}}>
              {LAUSANNE_ZONES.map(z=>(
                <button key={z} onClick={()=>{setAvailCity(z);lsSet('demo_avail_city',z)}} style={{padding:'5px 12px',borderRadius:20,border:`1.5px solid ${availCity===z?C.primary:C.border}`,background:availCity===z?C.primaryLight:'none',color:availCity===z?C.primary:C.textMid,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>{z}</button>
              ))}
            </div>
            <p style={{fontSize:11,color:C.textLight,marginBottom:10}}>Autres villes</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {SWISS_CITIES.map(z=>(
                <button key={z} onClick={()=>{setAvailCity(z);lsSet('demo_avail_city',z)}} style={{padding:'5px 12px',borderRadius:20,border:`1.5px solid ${availCity===z?C.primary:C.border}`,background:availCity===z?C.primaryLight:'none',color:availCity===z?C.primary:C.textMid,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>{z}</button>
              ))}
            </div>
          </div>
          <div>
            <p style={{fontWeight:700,color:C.text,fontSize:13,marginBottom:8}}>⏰ Disponible à partir de</p>
            <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:160,overflowY:'scroll',WebkitOverflowScrolling:'touch' as any}}>
              {timeSlots.slice(0,12).map(t=>(
                <button key={t} onClick={()=>setAvailFrom(availFrom===t?'':t)} style={{padding:'9px 14px',borderRadius:12,border:`1.5px solid ${availFrom===t?C.sage:C.border}`,background:availFrom===t?C.sageLight:'none',color:availFrom===t?C.sage:C.text,fontSize:13,fontWeight:availFrom===t?700:400,cursor:'pointer',textAlign:'left',fontFamily:'inherit'}}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <p style={{fontWeight:700,color:C.text,fontSize:13,marginBottom:8}}>⏰ Jusqu'à (optionnel)</p>
            <p style={{fontSize:11,color:C.textLight,marginBottom:8}}>Laisse vide = tu désactives manuellement</p>
            <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:120,overflowY:'scroll',WebkitOverflowScrolling:'touch' as any}}>
              {timeSlots.slice(2,12).map(t=>(
                <button key={t} onClick={()=>setAvailUntil(availUntil===t?'':t)} style={{padding:'9px 14px',borderRadius:12,border:`1.5px solid ${availUntil===t?C.peach:C.border}`,background:availUntil===t?C.peachLight:'none',color:availUntil===t?C.peach:C.text,fontSize:13,fontWeight:availUntil===t?700:400,cursor:'pointer',textAlign:'left',fontFamily:'inherit'}}>{t}</button>
              ))}
            </div>
          </div>
        </div>
        <div style={{padding:'12px 20px 28px'}}>
          <Btn variant="sage" onClick={()=>{setIsAvailable(true);lsSet('demo_available',true);go('myprofile')}}>✓ Sauvegarder ma dispo</Btn>
        </div>
      </div>
    </Frame>
  )

  return <Frame><div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}><Btn onClick={()=>go('splash')}>← Retour</Btn></div></Frame>
}

// ─── PHONE FRAME ──────────────────────────────────────────────────────────────
function Frame({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => { setIsMobile(window.innerWidth < 768) }, [])
  if (isMobile) {
    return (
      <div style={{width:'100%',height:'100dvh',background:C.bg,display:'flex',flexDirection:'column',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',position:'relative'}}>
        <div style={{position:'fixed',top:10,left:'50%',transform:'translateX(-50%)',zIndex:100,display:'flex',gap:6,alignItems:'center'}}>
          <a href="/" style={{background:'rgba(255,255,255,0.9)',backdropFilter:'blur(10px)',padding:'5px 10px',borderRadius:20,fontSize:11,color:C.text,textDecoration:'none',fontWeight:600,border:`1px solid ${C.border}`}}>← Site</a>
          <div style={{background:'rgba(255,165,0,0.15)',border:'1.5px solid orange',borderRadius:20,padding:'4px 10px',fontSize:10,fontWeight:800,color:'#8B6000'}}>🎬 DÉMO</div>
          <a href="/app" style={{background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,padding:'5px 10px',borderRadius:20,fontSize:11,color:'#fff',textDecoration:'none',fontWeight:700}}>Vraie app →</a>
        </div>
        <div style={{flex:1,display:'flex',flexDirection:'column',minHeight:0,paddingTop:44}}>
          {children}
        </div>
      </div>
    )
  }
  return (
    <div style={{minHeight:'100vh',background:`linear-gradient(135deg,#F5E6DC 0%,#EDE0F0 50%,#DCE8F5 100%)`,display:'flex',alignItems:'center',justifyContent:'center',padding:20,fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>
      <div style={{position:'fixed',top:14,left:'50%',transform:'translateX(-50%)',zIndex:100,display:'flex',gap:8,alignItems:'center'}}>
        <a href="/" style={{background:'rgba(255,255,255,0.9)',backdropFilter:'blur(10px)',padding:'6px 14px',borderRadius:20,fontSize:12,color:C.text,textDecoration:'none',fontWeight:600,border:`1px solid ${C.border}`}}>← Site</a>
        <div style={{background:'rgba(255,165,0,0.15)',border:'1.5px solid orange',borderRadius:20,padding:'5px 12px',fontSize:11,fontWeight:800,color:'#8B6000',letterSpacing:'0.05em'}}>🎬 DÉMO INTERACTIVE</div>
        <a href="/app" style={{background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,padding:'6px 14px',borderRadius:20,fontSize:12,color:'#fff',textDecoration:'none',fontWeight:700}}>Vraie app →</a>
      </div>
      <div style={{width:390,maxWidth:'100%',background:C.bg,borderRadius:44,overflow:'hidden',boxShadow:'0 32px 80px rgba(0,0,0,0.2)',display:'flex',flexDirection:'column',height:'min(844px, calc(100vh - 120px))',position:'relative'}}>
        <div style={{height:44,background:C.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <div style={{width:120,height:32,background:C.text,borderRadius:20,opacity:0.08}}/>
        </div>
        <div style={{flex:1,display:'flex',flexDirection:'column',minHeight:0,position:'relative'}}>
          {children}
        </div>
        <div style={{height:28,display:'flex',alignItems:'center',justifyContent:'center',background:C.bg,flexShrink:0}}>
          <div style={{width:100,height:4,background:C.text,borderRadius:2,opacity:0.15}}/>
        </div>
      </div>
    </div>
  )
}
