'use client'
import React, { useState } from 'react'
import { supabase as sbAnon } from '@/lib/supabase'

const DAVID_ID = 'bad38f3e-87df-40e0-a2d2-75c03b58d72b'
const MEL_ID_V = '9626a0ba-037f-49dd-9957-ebd37e58a864'

const QuickResetButtons = () => {
  const [stateClutch, setStateClutch] = useState<'idle'|'loading'|'ok'|'err'>('idle')
  const [stateLock, setStateLock] = useState<'idle'|'loading'|'ok'|'err'>('idle')
  const [msgC, setMsgC] = useState('')
  const [msgL, setMsgL] = useState('')

  const resetClutches = async () => {
    setStateClutch('loading')
    const { data: rows, error } = await sbAnon
      .from('clutches')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .in('status', ['pending','confirmed','accepted','checked_in'])
      .select('id')
    const count = rows?.length ?? 0
    if (error) {
      setMsgC('Erreur : exécute d\'abord les 2 CREATE POLICY dans Supabase SQL Editor')
      setStateClutch('err')
    } else {
      setMsgC(`${count ?? '?'} clutch(s) annulé(s)`)
      setStateClutch('ok')
      setTimeout(() => setStateClutch('idle'), 3000)
    }
  }

  const resetLock = async () => {
    setStateLock('loading')
    const { error } = await sbAnon
      .from('profiles')
      .update({ rdv_locked_until: null, rdv_locked_from: null })
      .in('id', [DAVID_ID, MEL_ID_V])
    if (error) {
      setMsgL('Erreur : exécute d\'abord les 2 CREATE POLICY dans Supabase SQL Editor')
      setStateLock('err')
    } else {
      setMsgL('RDV débloqué pour David + Mel')
      setStateLock('ok')
      setTimeout(() => setStateLock('idle'), 3000)
    }
  }

  const btn = (label: string, emoji: string, state: typeof stateClutch, color: string, onClick: ()=>void) => {
    const bg = state==='ok'?'#16a34a':state==='err'?'#991b1b':state==='loading'?'#333':color
    return (
      <button onClick={onClick} disabled={state==='loading'}
        style={{flex:1,padding:'14px 10px',borderRadius:12,border:'none',background:bg,color:'#fff',fontSize:13,fontWeight:800,cursor:state==='loading'?'wait':'pointer',transition:'background .2s',letterSpacing:'.02em'}}>
        {state==='loading'?'...' : state==='ok'?'✓ OK' : state==='err'?'✗ Erreur' : `${emoji} ${label}`}
      </button>
    )
  }

  return (
    <div style={{background:'rgba(200,134,10,.08)',border:'2px solid rgba(200,134,10,.4)',borderRadius:16,padding:'16px',marginBottom:16}}>
      <div style={{fontSize:13,fontWeight:900,color:'#C8860A',marginBottom:4}}>⚡ RESET RAPIDE — 1 clic</div>
      <div style={{fontSize:11,color:'rgba(245,232,222,.5)',marginBottom:12}}>Exécuté directement en DB sans copier-coller</div>
      <div style={{display:'flex',gap:10,marginBottom:8}}>
        {btn('Reset Clutchs','🔄', stateClutch, '#b45309', resetClutches)}
        {btn('Débloquer RDV','🔓', stateLock, '#1d4ed8', resetLock)}
      </div>
      {msgC && <div style={{fontSize:11,color:stateClutch==='err'?'#f87171':'#4ade80',marginTop:4}}>{msgC}</div>}
      {msgL && <div style={{fontSize:11,color:stateLock==='err'?'#f87171':'#4ade80',marginTop:4}}>{msgL}</div>}
    </div>
  )
}

let C = {
  bg: '#0f0810', card: '#1a0e18', card2: '#221228',
  border: 'rgba(255,191,158,0.14)', borderGold: 'rgba(200,134,10,0.4)',
  gold: '#C8860A', salmon: '#FFBF9E', white: '#f5e8de',
  mid: 'rgba(245,232,222,0.65)', dim: 'rgba(245,232,222,0.35)',
  green: '#4ade80', orange: '#E27C00', red: '#f87171',
  blue: '#60a5fa', purple: '#a78bfa', teal: '#2dd4bf',
}
const CDark = { ...C }
// Palette jour (7h-20h) : fond clair, texte foncé
const CDay = {
  bg: '#FAF6F0', card: '#FFFFFF', card2: '#FFF8F2',
  border: 'rgba(42,16,32,0.12)', borderGold: 'rgba(200,134,10,0.5)',
  gold: '#A06808', salmon: '#C0603A', white: '#1a0810',
  mid: 'rgba(26,8,16,0.70)', dim: 'rgba(26,8,16,0.40)',
  green: '#1a7a40', orange: '#C06000', red: '#c0392b',
  blue: '#1a5fa0', purple: '#6040b0', teal: '#0a7a6a',
}

const PASS = 'hctulc'  // « clutch » à l'envers — gate plein-page de /vision
const SECRET_PASS = 'saw7'

const H = ({n,c,children}:any) => {
  const sizes:any = {
    1:{fontSize:26,fontWeight:900,color:C.gold,letterSpacing:'-.5px',margin:'0 0 6px'},
    2:{fontSize:14,fontWeight:900,color:c||C.gold,margin:'0 0 14px',paddingBottom:7,borderBottom:`2px solid ${c||C.gold}30`},
    3:{fontSize:11,fontWeight:800,color:c||C.salmon,margin:'14px 0 7px',textTransform:'uppercase',letterSpacing:'.07em'},
  }
  return <div style={sizes[n]}>{children}</div>
}
const P = ({children,dim}:any) => <p style={{fontSize:12,color:dim?C.dim:C.mid,lineHeight:1.75,margin:'0 0 8px'}}>{children}</p>
const Tag = ({label,color}:{label:string;color:string}) => (
  <span style={{display:'inline-flex',padding:'2px 8px',borderRadius:20,background:`${color}15`,border:`1px solid ${color}40`,color,fontSize:10,fontWeight:700,whiteSpace:'nowrap'}}>{label}</span>
)
const Card = ({children,color,glow,title}:any) => (
  <div style={{background:C.card,border:`1px solid ${color?`${color}30`:C.border}`,borderRadius:14,padding:'16px',marginBottom:10,boxShadow:glow?`0 0 20px ${color}18`:undefined}}>
    {title&&<div style={{fontSize:12,fontWeight:800,color:color||C.salmon,marginBottom:8,textTransform:'uppercase',letterSpacing:'.06em'}}>{title}</div>}
    {children}
  </div>
)
const Pill = ({label,done,color}:{label:string;done?:boolean;color?:string}) => (
  <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'3px 10px',borderRadius:20,background:done?'rgba(74,222,128,.1)':`rgba(255,191,158,.07)`,border:`1px solid ${done?'rgba(74,222,128,.3)':C.border}`,color:done?C.green:color||C.mid,fontSize:11,fontWeight:700,margin:'2px'}}>
    {done?'✓ ':''}{label}
  </span>
)
const Row = ({children}:any) => <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>{children}</div>
const Score = ({label,val,max=10,color}:{label:string;val:number;max?:number;color?:string}) => {
  const pct = (val/max)*100
  const c = color||(val>=8.5?C.green:val>=7?C.gold:C.orange)
  return (
    <div style={{marginBottom:10}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
        <span style={{fontSize:12,color:C.mid,fontWeight:600}}>{label}</span>
        <span style={{fontSize:13,fontWeight:900,color:c}}>{val}/{max}</span>
      </div>
      <div style={{height:5,background:'rgba(255,255,255,.08)',borderRadius:3}}>
        <div style={{height:'100%',width:`${pct}%`,background:c,borderRadius:3,transition:'width .6s'}}/>
      </div>
    </div>
  )
}
const Idea = ({emoji,title,desc,badge}:{emoji:string;title:string;desc:string;badge?:string}) => (
  <div style={{background:C.card2,borderRadius:12,padding:'12px 14px',marginBottom:8,borderLeft:`3px solid ${C.gold}40`}}>
    <div style={{display:'flex',alignItems:'flex-start',gap:8}}>
      <span style={{fontSize:18,lineHeight:1}}>{emoji}</span>
      <div style={{flex:1}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
          <span style={{fontSize:12,fontWeight:800,color:C.white}}>{title}</span>
          {badge&&<Tag label={badge} color={badge==='⭐⭐⭐'?C.gold:badge==='Phase 2'?C.blue:C.green}/>}
        </div>
        <p style={{fontSize:11,color:C.mid,margin:0,lineHeight:1.6}}>{desc}</p>
      </div>
    </div>
  </div>
)

const SECTIONS = [
  { id:'map',       icon:'🗺', label:'Map' },
  { id:'graal',     icon:'🧭', label:'Le Graal' },
  { id:'invariants',icon:'🛡', label:'Invariants' },
  { id:'lancement', icon:'🚀', label:'Lancement' },
  { id:'confiance', icon:'🏆', label:'Confiance' },
  { id:'strategie', icon:'🧭', label:'Stratégie' },
  { id:'live',      icon:'⚡', label:'En prod' },
  { id:'sprint',    icon:'📋', label:'Sprint' },
  { id:'ux',        icon:'📋', label:'UX Détail' },
  { id:'flow',      icon:'🔒', label:'Flow RDV' },
  { id:'radar',     icon:'📡', label:'Radar' },
  { id:'idees',     icon:'💡', label:'Idées GPT' },
  { id:'brainstorm',icon:'🎲', label:'Brainstorm' },
  { id:'modes',     icon:'👥', label:'Modes' },
  { id:'fosse',     icon:'🛡', label:'Fossé' },
  { id:'danger',    icon:'🔥', label:'Danger' },
  { id:'femmes',    icon:'👩', label:'Femmes' },
  { id:'algo',      icon:'🧠', label:'Algo' },
  { id:'growth',    icon:'📢', label:'Growth' },
  { id:'business',  icon:'💰', label:'Business' },
  { id:'identite',  icon:'🎨', label:'Identité' },
  { id:'tech',      icon:'⚙️', label:'Tech' },
  { id:'legal',     icon:'⚖️', label:'Légal' },
  { id:'nda',       icon:'📜', label:'NDA' },
  { id:'naming',    icon:'🔤', label:'Noms' },
  { id:'social',    icon:'🧩', label:'Modèle social' },
  { id:'principes', icon:'🎯', label:'Principes' },
  { id:'questions', icon:'❓', label:'Questions' },
  { id:'changelog', icon:'📜', label:'Décisions' },
  { id:'roadmap',   icon:'🗺', label:'Roadmap' },
  { id:'gpt',       icon:'🔮', label:'Audit GPT' },
  { id:'sqltests',  icon:'🧪', label:'SQL Tests' },
]

// ─── Section : MAP (mindmap zoomable) ────────────────────────────────────────
const SectionMap = () => {
  type MN = {id:string;label:string;emoji:string;color:string;status?:'done'|'todo'|'p2'|'block';bugs?:number;eth?:boolean;q?:boolean;premium?:boolean;detail?:string;children?:MN[]}
  const MC = {gold:'#9a6408',salmon:'#b85430',white:'#1a0810',mid:'rgba(26,8,16,0.72)',dim:'rgba(26,8,16,0.4)',green:'#1a7a3a',orange:'#b85c00',red:'#b52a1e',blue:'#1852a0',purple:'#5c38b0',teal:'#0a7268',border:'rgba(42,16,32,0.14)',bg:'#FAF6F0',card:'#FFFFFF'}
  const TREE:MN = {id:'root',label:'CLUTCH',emoji:'✦',color:MC.gold,children:[
    {id:'launch',label:'Premier lancement',emoji:'🚀',color:MC.blue,children:[
      {id:'splash',label:'Splash 2.5s',emoji:'🌟',color:MC.blue,status:'done',detail:'Logo fade-in · Tagline · Auto (pas skippable)'},
      {id:'choix',label:'Inscription\nou Connexion',emoji:'🔀',color:MC.blue,status:'done',children:[
        {id:'ins',label:'INSCRIPTION',emoji:'📝',color:MC.gold,children:[
          {id:'ins1',label:'Prénom',emoji:'👤',color:MC.gold,status:'done'},
          {id:'ins2',label:'Date naissance\n(18+)',emoji:'🎂',color:MC.gold,status:'done',eth:true},
          {id:'ins3',label:'Genre +\nOrientation',emoji:'⚧',color:MC.gold,status:'todo',eth:true,q:true},
          {id:'ins4',label:'Photos (1-5)',emoji:'📸',color:MC.gold,status:'done',bugs:2},
          {id:'ins5',label:'Bio + Modes',emoji:'✏️',color:MC.gold,status:'todo',q:true},
          {id:'ins6',label:'Email + MDP',emoji:'📧',color:MC.gold,status:'done',eth:true},
          {id:'ins7',label:'⚠️ Vérif email\nBLOQUANT',emoji:'✉️',color:MC.red,status:'block',bugs:2,detail:'App Store peut rejeter sans vérif email'},
          {id:'ins8',label:'CGU + Privacy\n+ GPS consent',emoji:'📋',color:MC.gold,status:'todo',eth:true},
          {id:'ins9',label:'Démo animée\n(skippable 30s)',emoji:'🎬',color:MC.gold,status:'todo'},
        ]},
        {id:'conn',label:'CONNEXION',emoji:'🔑',color:MC.blue,children:[
          {id:'conn1',label:'Email + MDP',emoji:'🔑',color:MC.blue,status:'done'},
          {id:'conn2',label:'MDP oublié\n→ reset email',emoji:'🔓',color:MC.blue,status:'done',bugs:1},
        ]},
      ]},
      {id:'tutorial',label:'Tutorial first-time\n(bulles)',emoji:'💡',color:MC.blue,status:'todo',q:true,detail:'Flag onboarding_done · Re-accessible depuis Aide'},
    ]},
    {id:'presences',label:'Présences',emoji:'🗺',color:MC.salmon,children:[
      {id:'pr1',label:'Carte\n+ étoiles animées',emoji:'🌟',color:MC.salmon,status:'done',bugs:2},
      {id:'pr2',label:'Filtre genre\nH/F/Tous',emoji:'🔍',color:MC.salmon,status:'done',bugs:1},
      {id:'pr3',label:'Card profil',emoji:'👁',color:MC.salmon,status:'done',children:[
        {id:'pr3a',label:'Photos scrollables',emoji:'📸',color:MC.salmon,status:'done'},
        {id:'pr3b',label:'Prénom + âge + bio\n+ niveau fiabilité',emoji:'👤',color:MC.salmon,status:'done',detail:'Jamais le chiffre fiabilité exact'},
        {id:'pr3c',label:'Distance floue\n(LPD)',emoji:'📏',color:MC.salmon,status:'done'},
        {id:'pr3d',label:'→ Clutcher',emoji:'⚡',color:MC.gold,status:'done'},
        {id:'pr3e',label:'⭐ Favoris',emoji:'⭐',color:MC.salmon,status:'todo'},
        {id:'pr3f',label:'🙈 Invisible',emoji:'🙈',color:MC.salmon,status:'todo',detail:'Vocabulaire : Rendre invisible (jamais Bloquer)'},
      ]},
    ]},
    {id:'dispo',label:'Se mettre disponible',emoji:'🟢',color:MC.green,children:[
      {id:'d1',label:'Toggle ON/OFF',emoji:'🔘',color:MC.green,status:'done',bugs:1,detail:'Bug : .update() silencieux → fix .select()+upsert'},
      {id:'d2',label:'Molette heure\n(max +18h)',emoji:'⏰',color:MC.green,status:'done'},
      {id:'d3',label:'Permission GPS\n(Capacitor)',emoji:'📍',color:MC.green,status:'done',eth:true},
      {id:'d4',label:'Apparaît en\ntemps réel',emoji:'⚡',color:MC.green,status:'done'},
      {id:'d5',label:'Zone déplacement',emoji:'📏',color:MC.green,status:'todo',q:true},
      {id:'d6',label:'Mode fantôme\n💎 Premium',emoji:'👻',color:MC.green,status:'todo',premium:true},
    ]},
    {id:'flow',label:'Flow Clutch → RDV',emoji:'⚡',color:MC.purple,children:[
      {id:'f1',label:'Envoyer Clutch',emoji:'⚡',color:MC.purple,status:'done',children:[
        {id:'f1a',label:'Lieu',emoji:'📍',color:MC.purple,status:'done'},
        {id:'f1b',label:'Heure (<18h)',emoji:'⏰',color:MC.purple,status:'done'},
        {id:'f1c',label:'Message (140c)',emoji:'💬',color:MC.purple,status:'done'},
        {id:'f1d',label:'⚠️ Alerte\ndistance/temps',emoji:'⚠️',color:MC.red,status:'todo',bugs:1},
      ]},
      {id:'f2',label:'Réponse B',emoji:'📨',color:MC.purple,status:'done',children:[
        {id:'f2a',label:'✅ Accepte\n→ Verrou',emoji:'✅',color:MC.green,status:'done'},
        {id:'f2b',label:'↩️ Contre-Clutch',emoji:'↩️',color:MC.orange,status:'done',bugs:1},
        {id:'f2c',label:'❌ Refuse',emoji:'❌',color:MC.red,status:'done'},
        {id:'f2d',label:'⌛ Expire (2h)',emoji:'⌛',color:MC.dim,status:'done'},
      ]},
      {id:'f3',label:'Verrou actif',emoji:'🔒',color:MC.purple,status:'done',children:[
        {id:'f3a',label:'ProximityRadar V2',emoji:'📡',color:MC.teal,status:'todo',children:[
          {id:'f3a1',label:'Zone 1 >300m\n(cap)',emoji:'🔵',color:MC.teal,status:'todo'},
          {id:'f3a2',label:'Zone 2 300→50m\n(accélère)',emoji:'🟡',color:MC.teal,status:'todo'},
          {id:'f3a3',label:'Zone finale\n(haptique)',emoji:'🔴',color:MC.teal,status:'todo'},
        ]},
        {id:'f3b',label:'Notif -1h/-15min',emoji:'🔔',color:MC.purple,status:'done'},
        {id:'f3c',label:'Modifier lieu\n(accord mutuel)',emoji:'✏️',color:MC.red,status:'todo',bugs:1},
        {id:'f3d',label:'Annuler (motif)',emoji:'❌',color:MC.purple,status:'done'},
      ]},
      {id:'f4',label:"J'y suis\n(GPS <100m, -15→+30min)",emoji:'📍',color:MC.gold,status:'todo',children:[
        {id:'f4a',label:'✅ Les deux\narrivent (+2pts)',emoji:'✅',color:MC.green,status:'todo'},
        {id:'f4b',label:'⏳ A arrive\nB en route',emoji:'⏳',color:MC.orange,status:'todo'},
        {id:'f4c',label:'🔕 Aucun\nne clique',emoji:'🔕',color:MC.dim,status:'todo'},
        {id:'f4d',label:'⚠️ Retard\nannoncé',emoji:'⚠️',color:MC.orange,status:'todo'},
        {id:'f4e',label:'🐇 Lapin\nB absent (-5pts)',emoji:'🐇',color:MC.red,status:'todo'},
        {id:'f4f',label:'💀 Lapin\nmutuel (-1pt)',emoji:'💀',color:MC.red,status:'todo'},
      ]},
      {id:'f5',label:'Rencontre\n(timer 2h)',emoji:'🎉',color:MC.green,status:'todo',children:[
        {id:'f5a',label:'Timer 2h',emoji:'⏱',color:MC.green,status:'todo'},
        {id:'f5b',label:'Terminer\n(accord mutuel)',emoji:'🏁',color:MC.green,status:'todo'},
        {id:'f5c',label:'Auto-clôture 2h',emoji:'⌛',color:MC.green,status:'todo'},
      ]},
      {id:'f6',label:'Feedback\n(3h après)',emoji:'📝',color:MC.purple,status:'todo',children:[
        {id:'f6a',label:'Double-blind',emoji:'🙈',color:MC.purple,status:'todo'},
        {id:'f6b',label:'⚠️ App en flou\n(si non fait)',emoji:'🌫',color:MC.red,status:'todo',bugs:1},
        {id:'f6c',label:'Oui/Oui\n→ Favoris mutuels',emoji:'⭐',color:MC.green,status:'todo'},
        {id:'f6d',label:'Signalement\n→ review',emoji:'🚨',color:MC.red,status:'todo'},
        {id:'f6e',label:'Cooling off 48h',emoji:'❄️',color:MC.blue,status:'todo'},
      ]},
    ]},
    {id:'modes',label:'Modes de rencontre',emoji:'👥',color:MC.teal,children:[
      {id:'m1',label:'💜 Romantique\n(V1, actuel)',emoji:'💜',color:MC.purple,status:'done'},
      {id:'m2',label:'🤝 Amical',emoji:'🤝',color:MC.blue,status:'todo'},
      {id:'m3',label:'💼 Pro\n+ Mission Express',emoji:'💼',color:MC.teal,status:'todo',children:[
        {id:'m3a',label:'Profil métier\n+ mission',emoji:'💼',color:MC.teal,status:'todo'},
        {id:'m3b',label:'Durée flexible\n30min/1h/2h',emoji:'⏰',color:MC.teal,status:'todo'},
        {id:'m3c',label:'Feedback\nqualitatif',emoji:'⭐',color:MC.teal,status:'todo',q:true},
      ]},
      {id:'m4',label:'👶 Parents\n(enfants anon)',emoji:'👶',color:MC.orange,status:'todo',eth:true,detail:'RÈGLE : aucune photo enfant · Sécurité absolue'},
      {id:'m5',label:'🎉 Events\n(sans radar)',emoji:'🎉',color:MC.gold,status:'todo',children:[
        {id:'m5a',label:'Créer event\n(20s max)',emoji:'✏️',color:MC.gold,status:'todo'},
        {id:'m5b',label:'Rejoindre\n+ check-in GPS',emoji:'✋',color:MC.gold,status:'todo'},
        {id:'m5c',label:'Event vivant\n(présents réels)',emoji:'👁',color:MC.gold,status:'todo',q:true},
      ]},
    ]},
    {id:'fiab',label:'Score Fiabilité',emoji:'⭐',color:MC.green,children:[
      {id:'fi1',label:'4 niveaux\n(jamais chiffre)',emoji:'📊',color:MC.green,status:'done'},
      {id:'fi2',label:'Ponctualité\n+2 pts',emoji:'⏰',color:MC.green,status:'todo'},
      {id:'fi3',label:'Lapin -5 pts\n(×2 récidive)',emoji:'🐇',color:MC.red,status:'todo'},
      {id:'fi4',label:'Shadow downgrade\ninvisible',emoji:'👻',color:MC.green,status:'todo'},
    ]},
    {id:'profil',label:'Profil & Paramètres',emoji:'👤',color:MC.salmon,children:[
      {id:'p1',label:'Modifier profil\n/ photos',emoji:'✏️',color:MC.salmon,status:'done'},
      {id:'p2',label:'Historique Clutchs',emoji:'📚',color:MC.orange,status:'todo',bugs:1},
      {id:'p3',label:'⚠️ SOS Sécurité\n(bouton disparu)',emoji:'🚨',color:MC.red,status:'todo',bugs:1},
      {id:'p4',label:'Supprimer compte\n(obligatoire Store)',emoji:'🗑',color:MC.red,status:'todo'},
    ]},
    {id:'premium',label:'💎 Premium\nCHF 19.90/mois',emoji:'💎',color:MC.gold,premium:true,children:[
      {id:'pre1',label:'Apple IAP',emoji:'🍎',color:MC.gold,status:'todo',eth:true},
      {id:'pre2',label:'Features premium\n(à définir Mel)',emoji:'❓',color:MC.gold,status:'todo',q:true},
      {id:'pre3',label:'Clutch Driver\n(partenaires)',emoji:'🏪',color:MC.gold,status:'todo',q:true},
    ]},
  ]}

  const NW=104,NH=40,HG=5,VG=82
  function mmeasure(n:MN):number{ if(!n.children?.length)return NW; const w=n.children.reduce((s,c)=>s+mmeasure(c),0)+HG*(n.children.length-1); return Math.max(NW,w) }
  const mpos=React.useMemo(()=>{
    const pos:Record<string,{x:number,y:number}>={};
    function place(n:MN,x:number,y:number){pos[n.id]={x,y};if(!n.children?.length)return;const tw=n.children.reduce((s,c)=>s+mmeasure(c),0)+HG*(n.children.length-1);let cx=x-tw/2;for(const c of n.children){const cw=mmeasure(c);place(c,cx+cw/2,y+NH+VG);cx+=cw+HG}}
    function rowMaxY(branches:MN[]):number{let m=0;function scan(n:MN){const p=pos[n.id];if(p&&p.y>m)m=p.y;n.children?.forEach(scan)}branches.forEach(scan);return m}
    const ch=TREE.children??[];const flow=ch.find(c=>c.id==='flow')!;const rest=ch.filter(c=>c.id!=='flow');
    const ROWS:MN[][]=[[flow],rest.slice(0,2),rest.slice(2,4),rest.slice(4)];
    const rowWidths=ROWS.map(row=>row.reduce((s,c)=>s+mmeasure(c),0)+HG*(row.length-1));
    const W=Math.max(...rowWidths)+NW;
    pos[TREE.id]={x:W/2,y:20};
    let curY=20+NH+VG;
    for(const row of ROWS){const rw=row.reduce((s,c)=>s+mmeasure(c),0)+HG*(row.length-1);let cx=(W-rw)/2;for(const b of row){const bw=mmeasure(b);place(b,cx+bw/2,curY);cx+=bw+HG}curY=rowMaxY(row)+VG+NH}
    return {pos,W}
  },[])
  const {pos,W} = mpos
  const allMN=React.useMemo(()=>{function f(n:MN):MN[]{return[n,...(n.children?.flatMap(f)??[])]}return f(TREE)},[])
  const mlines=React.useMemo(()=>{
    const ls:{x1:number,y1:number,x2:number,y2:number,color:string,isRoot?:boolean}[]=[]
    function w(n:MN){if(!n.children)return;const p=pos[n.id];const isRoot=n.id==='root';for(const c of n.children){const cp=pos[c.id];ls.push({x1:p.x,y1:p.y+NH/2,x2:cp.x,y2:cp.y-NH/2,color:c.color,isRoot});w(c)}}
    w(TREE);return ls
  },[pos])

  let maxY=0;for(const p of Object.values(pos)){if(p.y>maxY)maxY=p.y}
  const H=maxY+NH+40

  const [zoom,setZoom]=React.useState(0.5)
  const [pan,setPan]=React.useState({x:0,y:0})
  const [sel,setSel]=React.useState<string|null>(null)
  const drag=React.useRef(false)
  const lastP=React.useRef({x:0,y:0})
  const ref=React.useRef<HTMLDivElement>(null)

  React.useEffect(()=>{
    if(!ref.current)return
    const r=ref.current.getBoundingClientRect()
    const z=Math.min(r.width/(W*1.02),(r.height-20)/(H*1.02))
    setZoom(z);setPan({x:(r.width-W*z)/2,y:8})
  },[W,H])

  const lastDist=React.useRef(0)
  React.useEffect(()=>{
    const el=ref.current;if(!el)return
    const fnStart=(e:TouchEvent)=>{
      if(e.touches.length===1){lastP.current={x:e.touches[0].clientX,y:e.touches[0].clientY}}
      else if(e.touches.length===2){e.preventDefault();const dx=e.touches[0].clientX-e.touches[1].clientX;const dy=e.touches[0].clientY-e.touches[1].clientY;lastDist.current=Math.hypot(dx,dy)}
    }
    const fnMove=(e:TouchEvent)=>{
      e.preventDefault()
      if(e.touches.length===1){
        const dx=e.touches[0].clientX-lastP.current.x,dy=e.touches[0].clientY-lastP.current.y
        setPan(p=>({x:p.x+dx,y:p.y+dy}));lastP.current={x:e.touches[0].clientX,y:e.touches[0].clientY}
      } else if(e.touches.length===2){
        const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY
        const dist=Math.hypot(dx,dy);const ratio=lastDist.current>0?dist/lastDist.current:1
        const cx=(e.touches[0].clientX+e.touches[1].clientX)/2,cy=(e.touches[0].clientY+e.touches[1].clientY)/2
        const r=el.getBoundingClientRect();const mx=cx-r.left,my=cy-r.top
        setZoom(z=>{const nz=Math.min(3,Math.max(0.05,z*ratio));setPan(p=>({x:mx-(mx-p.x)*(nz/z),y:my-(my-p.y)*(nz/z)}));return nz})
        lastDist.current=dist
      }
    }
    el.addEventListener('touchstart',fnStart,{passive:false})
    el.addEventListener('touchmove',fnMove,{passive:false})
    return()=>{el.removeEventListener('touchstart',fnStart);el.removeEventListener('touchmove',fnMove)}
  },[])

  const onWheel=(e:React.WheelEvent)=>{
    e.preventDefault()
    const r=ref.current!.getBoundingClientRect()
    const mx=e.clientX-r.left,my=e.clientY-r.top
    setZoom(z=>{const nz=Math.min(3,Math.max(0.05,z*(e.deltaY<0?1.04:0.96)));setPan(p=>({x:mx-(mx-p.x)*(nz/z),y:my-(my-p.y)*(nz/z)}));return nz})
  }
  const ST2={done:{b:'rgba(26,122,58,.14)',l:'✅'},todo:{b:'rgba(184,92,0,.14)',l:'🔨'},p2:{b:'rgba(24,82,160,.14)',l:'🔵'},block:{b:'rgba(181,42,30,.22)',l:'🚫'}}
  const selNode=sel?allMN.find(n=>n.id===sel):null

  return (
    <div style={{height:'calc(100vh - 80px)',display:'flex',flexDirection:'column',background:MC.bg}}>
      {/* Controls bar */}
      <div style={{padding:'6px 12px',display:'flex',alignItems:'center',gap:8,borderBottom:`1px solid rgba(42,16,32,0.1)`,flexShrink:0,background:'#FAF6F0'}}>
        <span style={{fontSize:11,color:MC.gold,fontWeight:800}}>{allMN.length} nœuds · {mlines.length} connexions</span>
        <button onClick={()=>{if(!ref.current)return;const r=ref.current.getBoundingClientRect();const z=Math.min(r.width/(W*1.02),(r.height-20)/(H*1.02));setZoom(z);setPan({x:(r.width-W*z)/2,y:8})}} style={{padding:'3px 10px',borderRadius:8,border:`1px solid rgba(42,16,32,0.2)`,background:'transparent',color:MC.white,fontSize:10,cursor:'pointer'}}>⊞ Tout voir</button>
        <button onClick={()=>setZoom(z=>Math.min(3,z*1.2))} style={{padding:'3px 8px',borderRadius:8,border:`1px solid rgba(42,16,32,0.2)`,background:'transparent',color:MC.white,fontSize:12,cursor:'pointer'}}>+</button>
        <button onClick={()=>setZoom(z=>Math.max(0.05,z*0.8))} style={{padding:'3px 8px',borderRadius:8,border:`1px solid rgba(42,16,32,0.2)`,background:'transparent',color:MC.white,fontSize:12,cursor:'pointer'}}>−</button>
        <span style={{fontSize:10,color:MC.mid}}>{Math.round(zoom*100)}%</span>
        <span style={{fontSize:9,color:MC.dim,marginLeft:'auto'}}>Molette=zoom · Drag=naviguer · Clic=détail</span>
      </div>

      {/* Canvas */}
      <div ref={ref} style={{flex:1,overflow:'hidden',cursor:'grab',position:'relative'}}
        onWheel={onWheel}
        onMouseDown={e=>{if((e.target as HTMLElement).closest('[data-mn]'))return;drag.current=true;lastP.current={x:e.clientX,y:e.clientY}}}
        onMouseMove={e=>{if(!drag.current)return;setPan(p=>({x:p.x+(e.clientX-lastP.current.x),y:p.y+(e.clientY-lastP.current.y)}));lastP.current={x:e.clientX,y:e.clientY}}}
        onMouseUp={()=>{drag.current=false}}
        onMouseLeave={()=>{drag.current=false}}
      >
        <div style={{position:'absolute',transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`,transformOrigin:'0 0',width:W,height:H}}>
          {/* Lines */}
          <svg style={{position:'absolute',top:0,left:0,width:W,height:H,pointerEvents:'none',overflow:'visible'}}>
            {mlines.map((l,i)=>{
              const my1=l.y1+(l.y2-l.y1)*0.4,my2=l.y1+(l.y2-l.y1)*0.6
              return <path key={i} d={`M ${l.x1} ${l.y1} C ${l.x1} ${my1} ${l.x2} ${my2} ${l.x2} ${l.y2}`} stroke={l.color} strokeWidth={l.isRoot?1:1.5} fill="none" opacity={l.isRoot?0.18:0.52} strokeDasharray={l.isRoot?'4 3':undefined}/>
            })}
          </svg>
          {/* Nodes */}
          {allMN.map(n=>{
            const p=pos[n.id];if(!p)return null
            const isSel=sel===n.id,isRoot=n.id==='root'
            const st=n.status?ST2[n.status]:undefined
            const lines2=n.label.split('\n')
            return (
              <div key={n.id} data-mn="1" onClick={()=>setSel(isSel?null:n.id)} style={{
                position:'absolute',left:p.x-NW/2,top:p.y-NH/2,width:NW,height:NH,
                borderRadius:isRoot?12:8,
                background:isRoot?`linear-gradient(135deg,${MC.gold}35,${MC.gold}15)`:isSel?`${n.color}25`:MC.card,
                border:`${isSel?2:1}px solid ${isSel?n.color:isRoot?`${MC.gold}80`:st?st.b:`${n.color}55`}`,
                cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                padding:'2px 5px',boxShadow:isSel?`0 0 14px ${n.color}35`:undefined,
                transition:'border .1s,background .1s',zIndex:isSel?10:1,
              }}>
                <div style={{display:'flex',alignItems:'center',gap:2}}>
                  <span style={{fontSize:isRoot?16:11,lineHeight:1}}>{n.emoji}</span>
                  {isRoot&&<span style={{fontSize:13,fontWeight:900,color:MC.gold,letterSpacing:'.1em'}}>{n.label}</span>}
                </div>
                {!isRoot&&lines2.map((ln,i)=><div key={i} style={{fontSize:8,fontWeight:i===0?700:400,color:i===0?MC.white:MC.dim,textAlign:'center',lineHeight:1.25,maxWidth:NW-8}}>{ln}</div>)}
                <div style={{display:'flex',gap:2,marginTop:1,flexWrap:'wrap',justifyContent:'center'}}>
                  {st&&<span style={{fontSize:7,padding:'1px 3px',borderRadius:4,background:st.b,color:n.status==='done'?MC.green:n.status==='block'?MC.red:MC.orange,fontWeight:700}}>{st.l}</span>}
                  {n.bugs&&<span style={{fontSize:7,padding:'1px 3px',borderRadius:4,background:`${MC.red}25`,color:MC.red,fontWeight:700}}>🐛{n.bugs}</span>}
                  {n.eth&&<span style={{fontSize:7,padding:'1px 3px',borderRadius:4,background:'rgba(212,160,23,.2)',color:'#d4a017'}}>⚖️</span>}
                  {n.q&&<span style={{fontSize:7,padding:'1px 3px',borderRadius:4,background:`${MC.purple}25`,color:MC.purple}}>❓</span>}
                  {n.premium&&<span style={{fontSize:7,padding:'1px 3px',borderRadius:4,background:`${MC.gold}20`,color:MC.gold}}>💎</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail panel */}
      {selNode&&(
        <div style={{flexShrink:0,borderTop:`2px solid ${selNode.color}60`,background:'#F0EAE4',padding:'10px 16px',maxHeight:120,overflow:'auto'}}>
          <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
            <span style={{fontSize:18,lineHeight:1,flexShrink:0}}>{selNode.emoji}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:800,color:MC.white,marginBottom:3}}>{selNode.label.replace('\n',' ')}</div>
              {selNode.detail&&<div style={{fontSize:10,color:MC.mid,lineHeight:1.55}}>{selNode.detail}</div>}
              <div style={{display:'flex',gap:5,marginTop:4,flexWrap:'wrap'}}>
                {selNode.status&&<span style={{fontSize:9,padding:'2px 7px',borderRadius:8,background:ST2[selNode.status].b,color:selNode.status==='done'?MC.green:selNode.status==='block'?MC.red:MC.orange,fontWeight:700}}>{ST2[selNode.status].l} {selNode.status==='done'?'Codé':selNode.status==='todo'?'À coder':selNode.status==='p2'?'Phase 2':'Bloquant'}</span>}
                {selNode.bugs&&<span style={{fontSize:9,padding:'2px 7px',borderRadius:8,background:`${MC.red}20`,color:MC.red,fontWeight:700}}>🐛 {selNode.bugs} bug{selNode.bugs>1?'s':''}</span>}
                {selNode.eth&&<span style={{fontSize:9,padding:'2px 7px',borderRadius:8,background:'rgba(212,160,23,.2)',color:'#d4a017',fontWeight:700}}>⚖️ Éthique/légal</span>}
                {selNode.q&&<span style={{fontSize:9,padding:'2px 7px',borderRadius:8,background:`${MC.purple}20`,color:MC.purple,fontWeight:700}}>❓ Décision en attente</span>}
              </div>
            </div>
            <button onClick={()=>setSel(null)} style={{background:'transparent',border:'none',color:MC.dim,fontSize:16,cursor:'pointer',padding:0,lineHeight:1,flexShrink:0}}>×</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Section : UX COMPLET ────────────────────────────────────────────────────
const SectionUXFlow = () => {
  const [expanded, setExpanded] = React.useState<string|null>(null)
  const [scenario, setScenario] = React.useState('romantique')
  const toggle = (id:string) => setExpanded(p => p===id ? null : id)

  const ST:Record<string,{color:string,label:string,bg:string}> = {
    done:  {color:C.green,  label:'✅ Codé',       bg:`${C.green}15`},
    todo:  {color:C.orange, label:'🔨 À coder',     bg:`${C.orange}15`},
    p2:    {color:C.blue,   label:'🔵 Phase 2',     bg:`${C.blue}15`},
    bug:   {color:C.red,    label:'🐛 Bug',         bg:`${C.red}15`},
    block: {color:C.red,    label:'🚫 Bloquant',    bg:`${C.red}20`},
  }

  const FN = ({id,emoji,title,sub,status,details,bugs,ethics,questions,premium}:
    {id:string,emoji:string,title:string,sub?:string,status?:string,details?:string[],bugs?:string[],ethics?:string[],questions?:string[],premium?:boolean}) => {
    const s = status ? ST[status] : undefined
    const open = expanded === id
    const hasBug = bugs && bugs.length > 0
    const hasEth = ethics && ethics.length > 0
    const hasQ = questions && questions.length > 0
    return (
      <div onClick={() => toggle(id)} style={{
        cursor:'pointer', background:open?C.card:C.card2,
        border:`1px solid ${open?(s?.color||C.borderGold):C.border}`,
        borderRadius:12, padding:'9px 12px', marginBottom:3,
      }}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:16,lineHeight:1,flexShrink:0}}>{emoji}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:800,color:C.white,lineHeight:1.3}}>{title}</div>
            {sub && <div style={{fontSize:10,color:C.dim,marginTop:1}}>{sub}</div>}
          </div>
          <div style={{display:'flex',gap:3,alignItems:'center',flexShrink:0,flexWrap:'wrap',justifyContent:'flex-end',maxWidth:180}}>
            {premium && <span style={{fontSize:9,padding:'2px 5px',borderRadius:6,background:`${C.gold}20`,color:C.gold,fontWeight:800}}>💎</span>}
            {s && <span style={{fontSize:9,padding:'2px 6px',borderRadius:6,background:s.bg,color:s.color,fontWeight:800}}>{s.label}</span>}
            {hasBug && <span style={{fontSize:9,padding:'2px 5px',borderRadius:6,background:`${C.red}20`,color:C.red,fontWeight:800}}>🐛{bugs!.length}</span>}
            {hasEth && <span style={{fontSize:9,padding:'2px 5px',borderRadius:6,background:'rgba(212,160,23,.2)',color:'#d4a017',fontWeight:800}}>⚖️</span>}
            {hasQ && <span style={{fontSize:9,padding:'2px 5px',borderRadius:6,background:`${C.purple}20`,color:C.purple,fontWeight:800}}>❓</span>}
            <span style={{fontSize:10,color:C.dim}}>{open?'▲':'▼'}</span>
          </div>
        </div>
        {open && (
          <div style={{marginTop:10,borderTop:`1px solid ${C.border}`,paddingTop:10}}>
            {details?.map((d,i)=>(
              <div key={i} style={{fontSize:11,color:C.mid,marginBottom:4,paddingLeft:12,position:'relative'}}>
                <span style={{position:'absolute',left:0,color:s?.color||C.gold}}>·</span>{d}
              </div>
            ))}
            {hasBug && <div style={{marginTop:8,padding:'8px 10px',borderRadius:8,background:`${C.red}10`,border:`1px solid ${C.red}25`}}>
              <div style={{fontSize:10,fontWeight:800,color:C.red,marginBottom:4}}>🐛 Bugs connus</div>
              {bugs!.map((b,i)=><div key={i} style={{fontSize:10,color:C.mid,marginBottom:2,paddingLeft:10}}>→ {b}</div>)}
            </div>}
            {hasEth && <div style={{marginTop:8,padding:'8px 10px',borderRadius:8,background:'rgba(212,160,23,.08)',border:'1px solid rgba(212,160,23,.25)'}}>
              <div style={{fontSize:10,fontWeight:800,color:'#d4a017',marginBottom:4}}>⚖️ Questions éthiques / légales</div>
              {ethics!.map((e,i)=><div key={i} style={{fontSize:10,color:C.mid,marginBottom:2,paddingLeft:10}}>→ {e}</div>)}
            </div>}
            {hasQ && <div style={{marginTop:8,padding:'8px 10px',borderRadius:8,background:`${C.purple}10`,border:`1px solid ${C.purple}25`}}>
              <div style={{fontSize:10,fontWeight:800,color:C.purple,marginBottom:4}}>❓ Décisions en attente</div>
              {questions!.map((q,i)=><div key={i} style={{fontSize:10,color:C.mid,marginBottom:2,paddingLeft:10}}>→ {q}</div>)}
            </div>}
          </div>
        )}
      </div>
    )
  }

  const VL = ({c}:{c?:string}) => <div style={{width:2,height:16,background:c||C.border,margin:'0 0 3px 18px'}}/>
  const PL = ({label,color}:{label:string,color:string}) => (
    <div style={{fontSize:9,fontWeight:900,color,letterSpacing:'.1em',textTransform:'uppercase',margin:'16px 0 6px',paddingLeft:8,borderLeft:`3px solid ${color}`}}>{label}</div>
  )
  const BranchBox = ({color,title,children}:any) => (
    <div style={{flex:1,padding:'8px 10px',borderRadius:10,border:`1px solid ${color}30`,background:`${color}08`}}>
      <div style={{fontSize:9,fontWeight:900,color,marginBottom:6,textTransform:'uppercase',letterSpacing:'.07em'}}>{title}</div>
      {children}
    </div>
  )

  const SCENARIOS = [
    {id:'romantique',label:'💜 Romantique',color:C.purple},
    {id:'amical',    label:'🤝 Amical',    color:C.blue},
    {id:'pro',       label:'💼 Pro',       color:C.teal},
    {id:'parents',   label:'👶 Parents',   color:C.orange},
    {id:'event',     label:'🎉 Event',     color:C.gold},
  ]

  return (
  <div>
    <H n={1}>🗺 UX Complet — Tous les flows & scénarios</H>
    <P dim>Arbre interactif depuis le premier lancement. Cliquer chaque étape pour le détail complet. Couleurs → bugs, éthique, décisions en attente.</P>

    {/* Légende */}
    <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:14,padding:'8px 10px',background:C.card,borderRadius:10,border:`1px solid ${C.border}`}}>
      {Object.values(ST).map(v=><span key={v.label} style={{fontSize:10,padding:'2px 8px',borderRadius:8,background:v.bg,color:v.color,fontWeight:700,border:`1px solid ${v.color}30`}}>{v.label}</span>)}
      <span style={{fontSize:10,padding:'2px 8px',borderRadius:8,background:'rgba(212,160,23,.15)',color:'#d4a017',fontWeight:700,border:'1px solid rgba(212,160,23,.3)'}}>⚖️ Éthique</span>
      <span style={{fontSize:10,padding:'2px 8px',borderRadius:8,background:`${C.purple}15`,color:C.purple,fontWeight:700,border:`1px solid ${C.purple}30`}}>❓ À valider</span>
    </div>

    {/* ═══════ PHASE 0 — PREMIER LANCEMENT ════════ */}
    <PL label="Phase 0 — Premier lancement" color={C.gold}/>

    <FN id="splash" emoji="🌟" title="Splash screen" sub="2-3s · logo animé + tagline · pas skippable" status="done"
      details={['Logo Clutch fade-in sur fond prune (#2a1020)','Tagline : "Sois spontané·e"','Durée 2.5s puis transition automatique','Première fois uniquement ou à chaque lancement ?']}
      questions={['Rejouer à chaque lancement ou seulement au 1er ?','Animation : fondu simple ou logo qui se "verrouille" (thème Clutch) ?']}
    />
    <VL c={C.gold}/>
    <FN id="choix_auth" emoji="🔀" title="Inscription ou Connexion ?" sub="Écran d'entrée · deux boutons" status="done"
      details={['Bouton principal (CTA or) : "Créer mon compte"','Bouton secondaire (outline) : "J\'ai déjà un compte"','Logo Clutch visible en permanence','Option future : "Connexion avec Apple" (obligatoire pour App Store dating 17+)']}
      questions={['Apple Sign-In : obligatoire si on offre un login email. À vérifier avec les guidelines Apple 2024.']}
    />
    <VL/>

    {/* ─── FORK : Inscription / Connexion ─── */}
    <div style={{fontSize:9,color:C.dim,fontWeight:700,marginBottom:6,marginLeft:4,textTransform:'uppercase',letterSpacing:'.07em'}}>→ Deux chemins</div>
    <div style={{display:'flex',gap:8,marginBottom:4}}>
      <BranchBox color={C.gold} title="Chemin A — Inscription (nouveau compte)">
        <FN id="ins_prenom" emoji="👤" title="Écran 1 — Prénom" sub="2-20 chars · pas de nom de famille" status="done"
          details={['Champ texte, validation 2 chars min, lettres seulement','Affiché publiquement sur le profil','Avertissement si changement post-inscription ?']}
          questions={['Peut-on changer son prénom après inscription ? Combien de fois ?']}
        />
        <VL c={`${C.gold}60`}/>
        <FN id="ins_age" emoji="🎂" title="Écran 2 — Date de naissance" sub="18+ obligatoire · calcul âge" status="done"
          details={['Date picker (jour/mois/année)','Validation : âge ≥ 18 ans calculé à la seconde','L\'âge (pas la date) est affiché sur le profil','Si < 18 : message poli de refus, redirection vers store apps 4+']}
          ethics={['Apple dating apps = rating 17+ minimum. Vérification âge par CNI nécessaire en Phase 2 ?','RGPD art.8 / LPD : consentement parental < 16 ans en CH. On refuse les mineurs = conforme.']}
        />
        <VL c={`${C.gold}60`}/>
        <FN id="ins_genre" emoji="⚧" title="Écran 3 — Genre + Orientation" sub="Ce que tu es · qui tu cherches" status="todo"
          details={['Ton genre : Homme / Femme / Non-binaire / Préfère ne pas dire','Tu cherches : Hommes / Femmes / Tout le monde','En mode Romantique → filtre de base dans Présences','En mode Amical/Pro → genre moins important, paramétrable séparément']}
          ethics={['Non-binaire ne doit PAS être invisible algorithmiquement. Leur apparaître selon les prefs configurées.','Ne pas forcer le genre binaire dans le flow — option "Préfère ne pas dire" obligatoire.']}
          questions={['Autres options genre (transgenre, intersexe) : V1 ou Phase 2 ?','Si genre = non-binaire : dans quels résultats apparaît-il ? Seulement "Tout le monde" ?']}
        />
        <VL c={`${C.gold}60`}/>
        <FN id="ins_photos" emoji="📸" title="Écran 4 — Photos" sub="1 obligatoire · max 5 · Capacitor Camera" status="done"
          details={['Upload galerie ou appareil photo (Capacitor Camera plugin)','Photo 1 = principale dans Présences (visage obligatoire en théorie)','Drag-to-reorder les photos','Conseils affichés : récente, lumineuse, souriante','Modération : manuelle en V1 (David) · IA en Phase 2']}
          bugs={['Permission galerie iOS 16+ doit être re-demandée si refusée — message d\'erreur peu clair','Sur Android : parfois la photo se sauvegarde en orientation incorrecte (rotation EXIF)']}
          questions={['Selfie vérification "temps réel" (comme Tinder) : Phase 2 ou obligatoire pour App Store ?','Modération photos : qui modère en V1 ? Délai maxi avant validation ?']}
        />
        <VL c={`${C.gold}60`}/>
        <FN id="ins_bio" emoji="✏️" title="Écran 5 — Bio + Mode(s)" sub="Ce que tu cherches · 3-140 chars" status="todo"
          details={['Bio courte optionnelle (3-140 chars)','Sélection mode(s) principal/aux : Romantique / Amical / Pro / Parents','Plusieurs modes activables (profil unique ou profils séparés = décision à prendre)','Suggestion : mode Pro cache la bio romantique et vice versa']}
          questions={['Multi-mode : UN profil avec modes ou DES profils séparés par mode ?','Peut-on être visible en Romantique ET Amical simultanément dans Présences ?']}
        />
        <VL c={`${C.gold}60`}/>
        <FN id="ins_email" emoji="📧" title="Écran 6 — Email + Mot de passe" sub="Supabase Auth · LPD" status="done"
          details={['Email + mot de passe (min 8 chars, 1 majuscule recommandée)','Supabase gère le hashing côté serveur','Email pour : reset MDP + notifs critiques (pas marketing sans consentement séparé)','Futur : "Sign in with Apple" obligatoire si app dating App Store']}
          ethics={['LPD art.4 : email = donnée personnelle. Doit figurer dans Privacy Policy avec durée de rétention et droit à l\'effacement.']}
        />
        <VL c={`${C.gold}60`}/>
        <FN id="ins_email_verif" emoji="✉️" title="Écran 7 — Vérification email" sub="⚠️ NON IMPLÉMENTÉ — BLOQUANT" status="block"
          details={['Supabase envoie un email de confirmation automatiquement','Utilisateur doit cliquer le lien pour valider','ACTUELLEMENT : le flow contourne cette étape — faille','App Store peut rejeter si aucune vérification email pour une app dating','Limite anti-spam : sans vérif email → 50 faux comptes en 5 minutes']}
          bugs={['Vérification email contournée — création de faux comptes en masse possible','Pas de limite création compte par IP ou device']}
          questions={['Option A : bloquer totalement avant vérif email (plus sûr, plus de friction)','Option B : autoriser l\'accès avec bannière orange "Vérifie ton email" (moins sûr, moins de friction)']}
        />
        <VL c={`${C.gold}60`}/>
        <FN id="ins_cgu" emoji="📋" title="Écran 8 — CGU + Privacy + GPS" sub="Consentement explicite LPD/RGPD" status="todo"
          details={['Checkbox obligatoire : "J\'accepte les CGU" (lien vers /terms)','Checkbox obligatoire : "J\'accepte la Privacy Policy" (lien vers /privacy)','Checkbox séparée OPTIONNELLE : "Notifications marketing"','Consentement GPS : popup dédiée expliquant pourquoi (LPD obligation)','Localisation = donnée sensible CH → double consentement requis']}
          ethics={['LPD art.6 suisse : consentement explicite pour localisation','RGPD art.7 EU : consentement libre, spécifique, éclairé, univoque si user EU','Les deux cases (CGU + Privacy) doivent être décochées par défaut']}
        />
        <VL c={`${C.gold}60`}/>
        <FN id="ins_demo" emoji="🎬" title="Démo animée" sub="30s · skippable · montre le flow Clutch" status="todo"
          details={['Séquence animée : Présences → Clutch → Verrou → J\'y suis → RDV','Bouton "Passer" visible en haut à droite en permanence','Si la démo est passée : flag demo_seen=true en DB','Re-accessible depuis Paramètres → Aide','Format : slides interactifs (plus maintenables qu\'une vidéo)']}
          questions={['Vidéo MP4 ou slides React animés ? Vidéo = plus beau mais à refaire à chaque UI update']}
        />
      </BranchBox>

      <BranchBox color={C.blue} title="Chemin B — Connexion (compte existant)">
        <FN id="login_form" emoji="🔑" title="Email + Mot de passe" sub="Supabase Auth · autofill supporté" status="done"
          details={['Champs email + password','Autofill Safari Keychain supporté','Erreur si email inconnu ou MDP incorrect','Token stocké en localStorage (Supabase auto)']}
        />
        <VL c={`${C.blue}60`}/>
        <FN id="login_forgot" emoji="🔓" title="Mot de passe oublié" sub="Reset par email · lien 1h" status="done"
          details={['Lien "Mot de passe oublié ?" sous le formulaire','Email saisi → Supabase envoie le lien de reset','Lien valable 1h','Deep link → retour dans l\'app après reset']}
          bugs={['Deep link reset sur iOS Safari peut ne pas rediriger vers l\'app (Capacitor) — à tester sur device réel']}
        />
        <VL c={`${C.blue}60`}/>
        <FN id="login_success" emoji="✅" title="Connexion réussie" sub="Redirect vers Présences (ou dernier onglet)" status="done"
          details={['Token Supabase stocké','Redirection vers dernier onglet ou Présences par défaut','Si profil incomplet (photos manquantes) → redirection vers complétion','is_available remis à false automatiquement (sécurité — on ne veut pas de ghosts disponibles)']}
        />
      </BranchBox>
    </div>

    <VL c={C.gold}/>

    {/* ═══════ PHASE 1 — ONBOARDING FIRST-TIME ════════ */}
    <PL label="Phase 1 — Premier démarrage (après inscription)" color={C.teal}/>

    <FN id="tutorial" emoji="💡" title="Tutorial first-time — bulles explicatives" sub="Flag onboarding_done · seulement 1 fois" status="todo"
      details={[
        'Bulle 1 sur onglet Présences : "Qui est disponible maintenant ?" + icône grande + flèche',
        'Bulle 2 sur onglet Clutchs : "Tes rendez-vous en cours"',
        'Bulle 3 sur le bouton disponibilité : "Clique pour te montrer"',
        'Chaque bulle : fond semi-transparent + texte court + bouton "Compris ✓"',
        'Skip global : clic hors bulle ferme le tutorial',
        'Re-accessible : Paramètres → Aide → "Revoir le tutorial"',
        'Flag en DB : profiles.onboarding_done = true après completion ou skip',
      ]}
      questions={['Ordre des bulles : Présences → Clutchs → Profil ? Ou uniquement Présences pour ne pas surcharger ?','Animation des bulles : bounce / fade / slide depuis le bas ?']}
    />
    <VL c={C.teal}/>

    {/* ═══════ PHASE 2 — PRÉSENCES ════════ */}
    <PL label="Phase 2 — Présences (onglet principal)" color={C.salmon}/>

    <FN id="presences_view" emoji="🗺" title="Vue Présences — carte + liste" sub="Étoiles animées + scroll profils" status="done"
      details={[
        'Carte Lausanne avec étoiles DivIcon animées = personnes disponibles',
        'Scroll vertical en dessous : liste de profils',
        'Chaque profil : photo + prénom + âge + distance floue + niveau fiabilité',
        'Distance = "À X-Ymin à pied" (jamais GPS exact — LPD)',
        'Filtre genre en haut (H / F / Tous)',
        'Mode Live (carte) ou Liste : switcher à coder',
      ]}
      bugs={['Filtre genre parfois masqué par le header (z-index conflict)','Étoiles sur la carte ne sont pas cliquables pour voir le profil','Liste profils ne se recharge pas en temps réel si Supabase Realtime pas actif']}
    />
    <VL c={C.salmon}/>
    <FN id="profil_card" emoji="👁" title="Voir un profil dans Présences" sub="Card avec toutes les infos visibles" status="done"
      details={[
        'Photo(s) scrollable gauche/droite',
        'Prénom + âge + mode(s) actifs + bio courte',
        'Niveau fiabilité : emoji + label (ex. "Très fiable 🌟") — jamais le chiffre exact',
        'Distance floue : "à 5-10min à pied"',
        'Intérêts communs (Phase 2)',
        'Boutons : Envoyer un Clutch / ⭐ Favori (À coder) / 🙈 Rendre invisible (À coder)',
        'Mode Pro : métier/domaine visible',
      ]}
      bugs={['Bouton Favori absent — profil_card ne l\'a pas encore','Rendre invisible manquant']}
      questions={['Afficher les Clutchs passés en commun ? "Vous avez déjà clutché 2x" = pertinent ou intrusif ?']}
    />
    <VL c={C.salmon}/>
    <FN id="se_mettre_dispo" emoji="🟢" title="Se mettre disponible" sub="Toggle + molette heure + GPS" status="done"
      details={[
        'Toggle principal "Je suis disponible"',
        'Molette : jusqu\'à quelle heure ? (max +18h depuis maintenant)',
        'GPS demandé si pas encore accordé (Capacitor Geolocation)',
        'Supabase update : is_available=true + available_until=X',
        'Apparaît immédiatement dans Présences des autres (Realtime)',
        'Disparaît automatiquement à available_until (cron ou check au chargement)',
        'Option : zone de déplacement (ex. "Centre-ville seulement")',
        'Mode fantôme : disponible mais invisible à certaines personnes (💎 Premium)',
      ]}
      bugs={['Supabase .update() silencieux — si profil inexistant : update retourne {error:null} mais 0 rows affectées. FIX : .select() + upsert fallback (documenté en MEMORY)','Si GPS refusé : disponibilité activée mais J\'y suis bloqué plus tard → expérience frustrante']}
      ethics={['Consentement GPS au moment de la mise en dispo : demander explicitement avec explication','Zone stockée = "Lausanne centre" pas coordonnées exactes (LPD conforme)']}
    />
    <VL c={C.salmon}/>
    <FN id="favoris" emoji="⭐" title="Mettre en favori" sub="Profil remonte en priorité · notif si dispo" status="todo"
      details={[
        'Bouton étoile sur la card profil',
        'Table user_relations(user_id, target_id, type: \'favorite\'|\'blocked\')',
        'Le favori remonte dans la liste Présences',
        'Notif push si un favori se met disponible',
        '💎 Premium : liste illimitée / Standard : max 5 favoris ?',
      ]}
      questions={['Favoris mutuels = option "Toujours visibles l\'un à l\'autre" (voir Flow RDV feedback) ?','Blocage vs Invisible : utiliser "Rendre invisible" pas "Bloquer" (vocabulaire UX décidé)']}
    />

    <VL c={C.gold}/>

    {/* ═══════ SCÉNARIOS ════════ */}
    <div style={{background:C.card,border:`1px solid ${C.borderGold}`,borderRadius:14,padding:'12px 14px',marginBottom:6}}>
      <div style={{fontSize:10,fontWeight:900,color:C.gold,marginBottom:10,textTransform:'uppercase',letterSpacing:'.08em'}}>Scénario de rencontre — choisir</div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
        {SCENARIOS.map(s=>(
          <button key={s.id} onClick={e=>{e.stopPropagation();setScenario(s.id)}}
            style={{padding:'5px 14px',borderRadius:20,border:`2px solid ${scenario===s.id?s.color:C.border}`,background:scenario===s.id?`${s.color}20`:'transparent',color:scenario===s.id?s.color:C.dim,fontSize:11,fontWeight:scenario===s.id?900:500,cursor:'pointer'}}>
            {s.label}
          </button>
        ))}
      </div>
      {scenario==='event' && <div style={{marginTop:8,padding:'5px 10px',borderRadius:8,background:`${C.gold}10`,fontSize:10,color:C.dim}}>ℹ️ Events : pas de ProximityRadar. Check-in GPS au lieu = score fiabilité.</div>}
      {scenario==='parents' && <div style={{marginTop:8,padding:'5px 10px',borderRadius:8,background:`${C.orange}10`,fontSize:10,color:C.dim}}>ℹ️ Photos d\'enfants interdites. Profil enfant = âge + énergie, anonyme.</div>}
    </div>
    <PL label={`Phase 3 — Scénario ${SCENARIOS.find(s=>s.id===scenario)?.label}`} color={SCENARIOS.find(s=>s.id===scenario)?.color||C.gold}/>

    {(scenario==='romantique'||scenario==='amical') && <>
      <FN id="send_clutch" emoji="⚡" title="Envoyer un Clutch" sub="Lieu + heure + message optionnel (18h max)" status="done"
        details={[
          'Bouton "Clutcher" depuis la card profil de B',
          'Bottom sheet : sélectionner un lieu (liste suggérés ou saisie libre)',
          'Molette heure : dans les 18h suivantes (contrainte structurelle)',
          'Message optionnel (140 chars max)',
          `Mode ${scenario} : filtre genre selon préférences de A`,
          'Envoi → notif push à B + Clutch en statut "pending"',
          'Alerte distance/temps manquante — FEATURE LOST',
        ]}
        bugs={['Alerte distance/temps : si lieu à 20min et heure dans 15min → aucun avertissement (feature lost à réimplémenter)','Verrou en "pending" non visible clairement dans l\'onglet Clutchs pendant l\'attente de réponse']}
        questions={[`Mode ${scenario==='romantique'?'romantique : 1 seul Clutch actif à la fois ou plusieurs simultanés possibles ?':'amical : peut-on clutcher plusieurs personnes en même temps ?'}`]}
      />
      <VL/>
      <FN id="reponse_b" emoji="📨" title="Réponse de B — 4 chemins" sub="Notif push + écran de réponse" status="done"
        details={[
          '✅ Accepte → Verrou créé immédiatement',
          '❌ Refuse → notif discrète à A, les deux restent dans Présences',
          '↩️ Contre-Clutch → B propose autre lieu/heure → A reçoit la contre-prop',
          '⌛ Expire (2h sans réponse) → les deux restent dispo, note algo sur B',
          'Interface de réponse : plein écran avec photo A + lieu + heure + actions',
          '3 ignores consécutifs → pénalité algo invisible pour B',
        ]}
        bugs={['Contre-Clutch : flow UI incomplet (bottom sheet du counter a besoin de polissage)']}
      />
      <VL c={C.green}/>
      <FN id="verrou_actif" emoji="🔒" title="Verrou actif" sub="Engagés · Radar · Notifs -1h et -15min" status="done"
        details={[
          'Les deux disparaissent de Présences',
          'Écran Verrou : photos A+B + lieu + heure + countdown',
          'ProximityRadar s\'active (spec V2)',
          'Notif -1h + notif -15min envoyées automatiquement',
          'Bouton J\'y suis grisé jusqu\'à -15min ET GPS < 100m',
          'Option annuler : avec motif (bouton rouge discret)',
          'Option modifier lieu : accord mutuel requis (À coder)',
        ]}
        bugs={['Modifier lieu pendant Verrou : non implémenté (feature lost)']}
      />
      <VL c={C.teal}/>
      <FN id="radar_v2" emoji="📡" title="ProximityRadar V2" sub="2 zones · Doppler · Attraction magnétique" status="todo"
        details={[
          'Zone 1 (>300m) : pulsation lente 1/2s + cap directionnel (nord/sud) affiché',
          'Zone 2 (300m→50m) : pulsation accélère + photos s\'éclaircissent',
          'Zone finale (50m→0) : animation attraction magnétique + haptique toutes 30s',
          'Distance toujours floue dans l\'UI (jamais GPS exact — LPD)',
          'Si GPS refusé : message positif "Active la localisation pour voir le radar"',
        ]}
        questions={['V2 : timing de développement ? (dépend de la priorité App Store)']}
      />
      <VL c={C.gold}/>
      <FN id="jy_suis" emoji="📍" title="J'y suis" sub="GPS <100m · Fenêtre -15min → +30min · 6 scénarios" status="todo"
        details={[
          'Bouton vert si : GPS < 100m du lieu ET heure dans la fenêtre',
          'A clique → photo A se locke au centre du radar',
          'B clique → animation fusion → écran VOUS ÊTES LÀ 🎉',
          'Notif GPS smart : si GPS < 100m mais pas cliqué → push "Tu es là ? Un tap ✓"',
          'Fenêtre : -15min avant → +30min après heure prévue',
          '6 scénarios détaillés dans l\'onglet Flow RDV ↗',
        ]}
        bugs={['App flou si GPS refusé mais fenêtre active → gérer gracieusement','Si les deux GPS < 100m mais aucun ne clique : auto-trigger possible ? (décision à prendre)']}
      />
      <VL c={C.green}/>
      <FN id="rencontre_timer" emoji="🎉" title="Rencontre — Timer 2h" sub="Les deux présents · Bouton Terminer" status="todo"
        details={[
          'Timer 2h visible pour les deux',
          'ProximityRadar passe en mode "ensemble" (pas de distance)',
          'Bouton Terminer : visible seulement si les deux ont J\'y suis',
          'Terminer → demande confirmation à l\'autre',
          'Auto-fermeture à 2h si Terminer pas utilisé',
          'Extension +1h : accord mutuel (Phase 2)',
        ]}
      />
      <VL c={C.purple}/>
      <FN id="feedback_rdv" emoji="📝" title="Feedback obligatoire — 3h après" sub="Double-blind · App en flou" status="todo"
        details={[
          'Notif 3h après fermeture',
          '3 questions max : ponctualité / ressenti emoji / reclucher ?',
          'Double-blind : révélation simultanée uniquement',
          'App en flou si feedback non fait (à coder)',
          'Cooling off 48h après feedback',
          'Oui/Oui → option Favoris mutuels',
          'Signalement → review manuelle immédiate',
        ]}
        bugs={['App en flou après RDV : NON IMPLÉMENTÉ — priorité haute']}
        ethics={['Forcer le feedback avec flou = contrainte forte. Progressif (d\'abord avertissement, puis flou) ?']}
      />
    </>}

    {scenario==='pro' && <>
      <FN id="pro_profil" emoji="💼" title="Profil Pro" sub="Métier + type de mission + compétences" status="todo"
        details={['Champ supplémentaire : métier / domaine (dev/design/juridique/finance/etc.)','Type de mission : Conseil / Collab / Networking / Échange compétences','Dans Présences mode Pro : filtre par domaine','Visible : prénom + photo + métier + bio pro + disponible pour quoi']}
        questions={['Profil Pro séparé ou champs ajoutés au profil principal ?','Mission Express (GPT ⭐⭐⭐) : "J\'ai besoin d\'un photographe dans l\'heure" — intégré ici ?']}
      />
      <VL/>
      <FN id="pro_clutch" emoji="📋" title="Clutch Pro" sub="Sujet obligatoire · durée flexible" status="todo"
        details={['Durée : 30min / 1h / 2h (pas limité à 2h)','Sujet de la mission (champ texte obligatoire)','Lieu : bureau, café, coworking, en ligne (visio Phase 2)','Feedback Pro : Fiable / Expert / Réactif / Créatif / Agréable (qualités subjectives, pas note)']}
        questions={['Swap compétences (GPT ⭐⭐) : "30min anglais contre aide Excel" — comment intégrer dans le flow ?','Coworking spontané (GPT ⭐⭐) : 3 personnes au même endroit — Event ou mode Clutch collectif ?']}
      />
    </>}

    {scenario==='parents' && <>
      <FN id="parents_profil" emoji="👶" title="Profil Parents" sub="Enfant anonyme · âge + énergie seulement" status="todo"
        details={['Profil enfant : âge + énergie (calme/sportif/créatif/aventurier) + centres d\'intérêt','AUCUNE photo de l\'enfant (sécurité absolue)','Parent : prénom + quartier + activités préférées','Dans Présences : "Cherche copain de jeu pour [âge]"']}
        ethics={['Photos d\'enfants = interdites. Règle absolue. Modération AI + manuelle obligatoire.','RGPD mineur : même si le parent s\'inscrit, données enfant = sensibles. Mention Privacy Policy.']}
        questions={['Swap babysitting (GPT ⭐⭐) : seulement accessible après X rencontres validées + score élevé ?','Activités saisonnières auto (luge/ferme/marché Noël) : pertinent pour Lausanne ?']}
      />
      <VL/>
      <FN id="parents_clutch" emoji="🌳" title="Clutch Parents" sub="Activité + lieu + âges enfants" status="todo"
        details={['Type activité : parc / musée / bibliothèque / piscine / nature','Nombre + âge des enfants concernés','Activités saisonnières suggérées automatiquement (GPT ⭐⭐)','Feedback centré sur l\'enfant : "Les enfants se sont bien entendus ?"']}
      />
    </>}

    {scenario==='event' && <>
      <FN id="event_create" emoji="🎉" title="Créer un Event — 20s max" sub="Icône + lieu + heure + nb max" status="todo"
        details={['Icône catégorie : apéro / café / run / échecs / lecture / randonnée / autre','Lieu dans Lausanne (V1 uniquement)','Heure (18h max)','Nombre max de participants (2-20)','Message optionnel 80 chars','Pas de ProximityRadar pour les events (décision produit)','Event vivant : "3 présents MAINTENANT" pas "12 intéressés" (GPT ⭐⭐⭐)']}
        questions={['Event mobile (GPT ⭐⭐) : "Balade avec chien" qui se déplace sur la carte — Phase 2 uniquement ?','Création event : qui peut créer ? Standard ou Premium seulement ?']}
      />
      <VL/>
      <FN id="event_join" emoji="✋" title="Rejoindre un Event" sub="Inscription + check-in GPS" status="todo"
        details={['Vue Events : liste + carte des events proches','Filtre par catégorie / distance / heure','Bouton "Je viens" → confirmation → notif au créateur','Check-in réel (GPS au lieu) pour valider présence → score fiabilité','Visible dans onglet Clutchs comme "Event en cours"','Annulation < 1h avant : légère pénalité fiabilité']}
      />
    </>}

    <VL c={C.gold}/>

    {/* ═══════ PHASE 4 — PROFIL & COMPTES ════════ */}
    <PL label="Phase 4 — Profil, paramètres & comptes" color={C.dim}/>

    <FN id="profil_complet" emoji="👤" title="Onglet Profil — options complètes" sub="Modifier · Sécurité · Paramètres · Premium" status="done"
      details={[
        'Modifier photos (ordre, ajouter, supprimer)',
        'Modifier bio + modes actifs',
        'Voir son niveau fiabilité (jamais le chiffre)',
        'Historique Clutchs (profil de l\'autre visible après RDV)',
        'SOS : contacts urgence + message alerte → 1 tap = SMS + position (À coder)',
        'Rendre invisible une personne (À coder)',
        'Paramètres : notifs / zone / préférences / langue',
        'Supprimer le compte (obligatoire App Store → Edge Function delete-account)',
        'Se déconnecter',
      ]}
      bugs={['SOS : bouton disparu de l\'app lors d\'un refactor — à réimplémenter (risque rejet App Store)','Historique peu lisible (design à refaire)','delete-account : Edge Function non implémentée — ~30min à coder, OBLIGATOIRE App Store']}
    />
    <VL/>
    <FN id="profil_premium" emoji="💎" title="Passer Premium — CHF 19.90/mois" sub="Apple IAP · Prix égaux pour tous" status="todo" premium
      details={[
        'Accès : Profil → "Passer Premium"',
        'Apple IAP (In-App Purchase) — 30% commission Apple (obligatoire)',
        'Features premium différenciées par USAGE, pas par genre',
        'Ex. usage typique femmes : contrôle avancé, invisibilité fine, filtres stricts',
        'Ex. usage typique hommes : plus de Clutchs/jour, visibilité boostée, Super-Clutch',
        'Si arrêt paiement → retour Standard immédiat au prochain login',
        'Champ profiles.plan : free | premium | driver',
        'Webhook Apple IAP → Supabase : mise à jour automatique',
      ]}
      ethics={['Prix identique pour tous (H et F) — décision éthique finale 17.06. "Gratuité femmes" = ABANDONNÉ éthiquement.','Features premium ne doivent pas créer de déséquilibre de pouvoir H/F dans l\'app.']}
      questions={['Liste exacte features premium : À DÉFINIR AVEC MEL avant de coder l\'IAP','Clutch Driver (partenaires bars/events) : tarif et features séparés — à définir']}
    />

  </div>
  )
}

// ─── Section : EN PROD ────────────────────────────────────────────────────────
const SectionLive = () => (
  <div>
    <H n={1}>⚡ Ce qui est en prod (17.06.2026)</H>
    <P>Version déployée sur <strong style={{color:C.gold}}>pz7cgj4kfv-tech.github.io/app2</strong></P>
    <Row>
      <Card color={C.green} glow>
        <H n={2} c={C.green}>✅ Features codées</H>
        {['Onboarding 4 slides + Setup Wizard','Carte Lausanne avec étoiles DivIcon animées','Molette heure disponibilité','Filtre genre + mode Manoski','Présences (liste profils disponibles)','Clutchs (envoi/réception/Verrou)','Tab Events avec catégories + compteur','Bot GPS Max — Morges Gare 🛰️','Contre-Clutch (bottom sheet)','Bouton J\'y suis — GPS 100m','Bouton Terminer conditionné J\'y suis','Badge event sur cartes Présences','Mode Pro — catégories métiers','SOS bouton + countdown','Profil complet + edit','Score fiabilité (À l\'heure/Lapin)','Gate system is_available + available_until','Realtime Supabase multi-channels'].map(f=><Pill key={f} label={f} done/>)}
      </Card>
      <Card color={C.orange}>
        <H n={2} c={C.orange}>🔧 En cours / À faire</H>
        {['App flou si feedback pending','GPS notif quand l\'autre arrive','Feedback obligatoire complet (3h après)','Events inscrits dans tab Clutchs','Mode Duo (2 femmes → groupe)','Mode Covoiturage','Mode Parents','Invisible (rendre fantôme)','Anti-spam 3 crédits/jour hommes','Fiabilité multi-dims (Ponctualité/Bienveillance/Respect)','TestFlight iOS (Apple Developer activé)','Push notifications OneSignal','Multi-compte Manoski complet'].map(f=><Pill key={f} label={f}/>)}
      </Card>
    </Row>
    <Card color={C.red}>
      <H n={2} c={C.red}>🐛 Bugs connus — Base de connaissance</H>
      <H n={3}>⚠️ Supabase .update() silencieux</H>
      <P>Symptôme : update réussit (erreur null) mais 0 lignes modifiées si la ligne n'existe pas encore.</P>
      <P>Fix : toujours ajouter .select() après .update() + fallback upsert si returned array vide.</P>
      <H n={3}>⚠️ Supabase Realtime — 1 seul filtre par channel</H>
      <P>Symptôme : 2ème .on() sur même channel ignoré silencieusement.</P>
      <P>Fix : créer un channel séparé par filtre (clutch-insert-uid, clutch-upd-rec-uid, clutch-upd-send-uid).</P>
      <H n={3}>⚠️ iOS Safari — 3 règles absolues</H>
      <P>position:fixed pour le frame · minHeight:0 sur flex scrollables · WebkitOverflowScrolling:touch</P>
    </Card>
    <Card>
      <H n={2}>📍 Pages déployées</H>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
        {[
          {path:'/','desc':'Landing publique'},
          {path:'/app','desc':'Prototype carte Lausanne'},
          {path:'/app2','desc':'App complète (main)'},
          {path:'/proto','desc':'Splash sablier → /app'},
          {path:'/hq','desc':'QG password-protégé'},
          {path:'/vision','desc':'Cette page (vision2026)'},
        ].map(p=>(
          <div key={p.path} style={{background:C.card2,borderRadius:10,padding:'10px 12px'}}>
            <div style={{fontSize:13,fontWeight:800,color:C.gold}}>{p.path}</div>
            <div style={{fontSize:11,color:C.dim}}>{p.desc}</div>
          </div>
        ))}
      </div>
    </Card>
  </div>
)

// ─── Section : FLOW RDV ──────────────────────────────────────────────────────
const SectionFlow = () => {
  const Leaf = ({emoji,text,score,notif,badge}:{emoji:string,text:string,score?:string,notif?:string,badge?:string}) => (
    <div style={{marginLeft:16,marginBottom:6,padding:'7px 10px',borderRadius:8,background:C.card2,border:`1px solid ${C.border}`}}>
      <div style={{fontSize:11,color:C.white,marginBottom:score||notif?4:0}}><span style={{marginRight:6}}>{emoji}</span>{text}</div>
      {score && <div style={{fontSize:10,color:score.startsWith('+')?C.green:C.red,fontWeight:700}}>Fiabilité : {score}</div>}
      {notif && <div style={{fontSize:10,color:C.gold}}>📲 {notif}</div>}
      {badge && <div style={{display:'inline-block',marginTop:3,fontSize:9,padding:'1px 6px',borderRadius:10,background:`${C.blue}30`,color:C.blue,fontWeight:700}}>{badge}</div>}
    </div>
  )
  const Branch = ({label,color=C.dim}:{label:string,color?:string}) => (
    <div style={{fontSize:10,color,fontWeight:700,margin:'4px 0 2px',paddingLeft:16}}>{label}</div>
  )

  // ── ARBRE VISUEL ──────────────────────────────────────────────────────────
  const TreeNode = ({emoji,label,color,small}:{emoji:string;label:string;color:string;small?:boolean}) => (
    <div style={{
      display:'inline-flex',flexDirection:'column',alignItems:'center',
      padding: small?'6px 8px':'8px 12px',borderRadius:10,
      background:`${color}18`,border:`2px solid ${color}60`,
      minWidth: small?70:90, textAlign:'center',
    }}>
      <span style={{fontSize:small?16:20,lineHeight:1}}>{emoji}</span>
      <span style={{fontSize:9,fontWeight:800,color,marginTop:3,lineHeight:1.3}}>{label}</span>
    </div>
  )
  const VLine = ({h=20,color='rgba(255,255,255,0.15)'}:{h?:number,color?:string}) => (
    <div style={{width:2,height:h,background:color,margin:'0 auto'}}/>
  )
  const HBranch = ({children,label}:{children:React.ReactNode;label?:string}) => (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
      {label && <div style={{fontSize:9,color:C.dim,marginBottom:4,fontWeight:600}}>{label}</div>}
      <div style={{display:'flex',alignItems:'flex-start',gap:6,position:'relative'}}>
        {/* Ligne horizontale reliant les enfants */}
        <div style={{
          position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',
          height:2,width:'100%',background:'rgba(255,255,255,0.12)',
          pointerEvents:'none',zIndex:0,
        }}/>
        {children}
      </div>
    </div>
  )
  const BranchItem = ({children,highlight}:{children:React.ReactNode;highlight?:boolean}) => (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',position:'relative',zIndex:1}}>
      <VLine h={14} color={highlight?'rgba(255,255,255,0.3)':'rgba(255,255,255,0.1)'}/>
      {children}
    </div>
  )

  return (
  <div>
    <H n={1}>🔒 Flow RDV — Arbre complet</H>
    <P dim>Tous les chemins possibles, du premier regard dans Présences à la fin du feedback. Carte visuelle + détail phase par phase ci-dessous.</P>

    {/* ═══════════════════════════════════════
        ARBRE VISUEL
    ════════════════════════════════════════ */}
    <div style={{
      background:C.card, border:`1px solid ${C.borderGold}`,
      borderRadius:16, padding:'20px 16px', marginBottom:20,
      overflowX:'auto',
    }}>
      <div style={{fontSize:11,fontWeight:900,color:C.gold,marginBottom:16,textAlign:'center',letterSpacing:'.1em',textTransform:'uppercase'}}>
        Vue d'ensemble — tous les scénarios
      </div>

      {/* ROOT */}
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',minWidth:600}}>

        {/* 0. Présences */}
        <TreeNode emoji="👁" label="A voit B dans Présences" color={C.salmon}/>
        <VLine h={16}/>

        {/* 1. Clutch envoyé */}
        <TreeNode emoji="⚡" label="Clutch envoyé (lieu + heure)" color={C.gold}/>
        <VLine h={16}/>

        {/* 2. Réponse de B — 4 branches */}
        <div style={{fontSize:9,color:C.dim,fontWeight:700,marginBottom:6,letterSpacing:'.08em',textTransform:'uppercase'}}>Réponse de B</div>
        <div style={{display:'flex',gap:10,alignItems:'flex-start',position:'relative'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'rgba(255,255,255,.1)',zIndex:0}}/>
          {[
            {emoji:'✅',label:'Accepte',color:C.green,main:true},
            {emoji:'↩️',label:'Contre-Clutch',color:C.orange,main:false},
            {emoji:'❌',label:'Refuse',color:C.red,main:false},
            {emoji:'⌛',label:'Expire (2h)',color:C.dim,main:false},
          ].map(({emoji,label,color,main})=>(
            <div key={label} style={{display:'flex',flexDirection:'column',alignItems:'center',position:'relative',zIndex:1}}>
              <VLine h={14} color={main?`${C.green}60`:'rgba(255,255,255,.1)'}/>
              <TreeNode emoji={emoji} label={label} color={color} small/>
              {!main && <div style={{marginTop:8,fontSize:9,color,fontWeight:700,textAlign:'center',maxWidth:80}}>
                {label==='Contre-Clutch'?'→ nouveau Clutch':label==='Refuse'?'A reste dispo':label==='Expire (2h)'?'Pénalité algo':''}
              </div>}
            </div>
          ))}
        </div>
        <VLine h={16} color={`${C.green}60`}/>

        {/* 3. Verrou actif */}
        <TreeNode emoji="🔒" label="VERROU ACTIF" color={C.purple}/>
        <div style={{fontSize:9,color:C.mid,marginTop:4,marginBottom:4,textAlign:'center'}}>Les deux disparaissent de Présences · Radar s'active</div>
        <VLine h={12}/>

        {/* 4. Radar */}
        <TreeNode emoji="📡" label="ProximityRadar" color={C.teal}/>
        <div style={{fontSize:9,color:C.mid,marginTop:4,marginBottom:4,textAlign:'center'}}>Zone 1 (&gt;300m) → Zone 2 (300m→50m) → Zone finale (50m→0)</div>
        <VLine h={12}/>

        {/* 5. J'y suis — 6 scénarios */}
        <TreeNode emoji="📍" label="J'Y SUIS (–15min, GPS <100m)" color={C.gold}/>
        <VLine h={16}/>
        <div style={{fontSize:9,color:C.dim,fontWeight:700,marginBottom:6,letterSpacing:'.08em',textTransform:'uppercase'}}>6 scénarios possibles</div>
        <div style={{display:'flex',gap:6,alignItems:'flex-start',flexWrap:'wrap',justifyContent:'center',position:'relative'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'rgba(255,255,255,.1)',zIndex:0}}/>
          {[
            {emoji:'✅',label:'Les deux\narrivent',color:C.green},
            {emoji:'⏳',label:'A arrive,\nB en route',color:C.orange},
            {emoji:'🔕',label:'Aucun\nne clique',color:C.dim},
            {emoji:'⚠️',label:'Retard\nannoncé',color:C.orange},
            {emoji:'🐇',label:'Lapin\n(B absent)',color:C.red},
            {emoji:'💀',label:'Lapin\nmutuel',color:C.red},
          ].map(({emoji,label,color})=>(
            <div key={label} style={{display:'flex',flexDirection:'column',alignItems:'center',position:'relative',zIndex:1}}>
              <VLine h={12} color={`${color}60`}/>
              <TreeNode emoji={emoji} label={label.replace('\\n','\n')} color={color} small/>
            </div>
          ))}
        </div>

        {/* Ligne vers Rencontre (seulement depuis scénario 1) */}
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',marginTop:10}}>
          <div style={{fontSize:9,color:C.green,fontWeight:700,marginBottom:4}}>↓ Scénario 1 uniquement</div>
          <VLine h={12} color={`${C.green}60`}/>
          <TreeNode emoji="🎉" label="RENCONTRE (2h)" color={C.green}/>
          <VLine h={12} color={`${C.green}60`}/>
          <TreeNode emoji="🏁" label="TERMINER + Feedback 3h" color={C.purple}/>
          <VLine h={12} color={`${C.purple}60`}/>
          <div style={{display:'flex',gap:10}}>
            <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
              <VLine h={12} color={`${C.green}60`}/>
              <TreeNode emoji="⭐" label="Favoris mutuels\n(Oui/Oui)" color={C.green} small/>
            </div>
            <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
              <VLine h={12} color={`${C.dim}`}/>
              <TreeNode emoji="👋" label="Rien\n(No/Maybe)" color={C.dim} small/>
            </div>
            <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
              <VLine h={12} color={`${C.red}60`}/>
              <TreeNode emoji="🚨" label="Signalement\nsécurité" color={C.red} small/>
            </div>
          </div>
        </div>

      </div>
    </div>
    {/* FIN ARBRE VISUEL */}

    <div style={{padding:'8px 12px',background:`${C.gold}12`,borderRadius:10,border:`1px solid ${C.gold}30`,marginBottom:16}}>
      <span style={{fontSize:10,color:C.gold,fontWeight:700}}>Détail complet ci-dessous ↓</span>
      <span style={{fontSize:10,color:C.mid,marginLeft:8}}>Chaque phase décrite en profondeur avec toutes les actions, notifications et impacts sur le score fiabilité.</span>
    </div>

    {/* ─── PHASE 0 : AVANT LE CLUTCH ─── */}
    <Card color={C.gold} glow>
      <H n={2} c={C.gold}>① AVANT — Comment on arrive au Clutch</H>
      <P dim>A et B sont tous les deux dans Présences. A voit B disponible. Plusieurs chemins possibles.</P>
      <Row>
        <Card>
          <div style={{fontSize:11,fontWeight:800,color:C.white,marginBottom:8}}>État A et B dans Présences</div>
          <Leaf emoji="🟢" text="A est disponible — is_available=true + available_until > now()"/>
          <Leaf emoji="🟢" text="B est disponible — visible dans la liste de A"/>
          <Leaf emoji="👁" text="A voit B : photo + prénom + bio + distance floue + score fiabilité (niveau, pas chiffre)"/>
          <Leaf emoji="👁" text="B voit A (sauf si B a rendu A invisible)"/>
        </Card>
        <Card>
          <div style={{fontSize:11,fontWeight:800,color:C.white,marginBottom:8}}>Chemins vers le Clutch</div>
          <Leaf emoji="➡️" text="A envoie un Clutch à B (lieu + heure + message optionnel)" badge="Flow principal"/>
          <Leaf emoji="↩️" text="Contre-Clutch : B reçoit, propose autre lieu/heure → bottom sheet → nouveau Clutch" badge="Codé"/>
          <Leaf emoji="🎲" text="Roulette : app sélectionne automatiquement un profil compatible → Clutch surprise" badge="Phase 2"/>
          <Leaf emoji="📅" text="Via Event : B est inscrit au même event que A → Clutch contextuel possible" badge="Phase 2"/>
        </Card>
      </Row>
      <div style={{padding:'8px 10px',borderRadius:8,background:`${C.gold}10`,border:`1px solid ${C.gold}30`,fontSize:11,color:C.dim,marginTop:8}}>
        <strong style={{color:C.gold}}>Contrainte 18h :</strong> L'heure proposée dans le Clutch doit être dans les 18h suivant l'envoi. Si A propose 19h et qu'il est 4h du matin → valide. Si A propose dans 3 jours → bloqué.
      </div>
    </Card>

    {/* ─── PHASE 1 : RÉPONSE AU CLUTCH ─── */}
    <Card color={C.blue}>
      <H n={2} c={C.blue}>② RÉPONSE DE B — 4 chemins possibles</H>
      <P dim>B reçoit une notification push. Il a le temps d'expiration du Clutch pour répondre (défaut : 2h ou jusqu'à l'heure du RDV).</P>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        {[
          {t:'✅ B accepte', c:C.green, items:['Verrou créé — statut "locked"','A et B sont notifiés','Les deux disparaissent de Présences (plus disponibles)','Radar s\'active dans l\'interface RDV','Bouton J\'y suis déverrouillé -15min avant']},
          {t:'❌ B refuse', c:C.red, items:['Clutch décliné — notif discrète à A','A reste dans Présences','B reste dans Présences','Score fiabilité A : inchangé','Note interne sur B (refus systématiques = shadow downgrade)']},
          {t:'↩️ B contre-clutche', c:C.orange, items:['B propose autre lieu/heure','A reçoit le contre-Clutch','Si A accepte → Verrou sur le nouveau créneau','Si A refuse → les deux restent disponibles','Codé : bottom sheet avec venue/time/message']},
          {t:'⌛ B ignore (expire)', c:C.dim, items:['Clutch expire sans réponse','A reçoit notif "Clutch expiré"','Les deux restent disponibles','Pas de pénalité pour B (1ère fois)','Note interne : après 3 ignores → pénalité algo']},
        ].map(({t,c,items})=>(
          <div key={t} style={{background:C.card2,borderRadius:10,padding:'10px 12px',border:`1px solid ${c}30`}}>
            <div style={{fontSize:11,fontWeight:800,color:c,marginBottom:6}}>{t}</div>
            {items.map(i=><div key={i} style={{fontSize:10,color:C.mid,marginBottom:3,paddingLeft:10,position:'relative'}}><span style={{position:'absolute',left:0,color:c}}>·</span>{i}</div>)}
          </div>
        ))}
      </div>
    </Card>

    {/* ─── PHASE 2 : VERROU ACTIF ─── */}
    <Card color={C.purple}>
      <H n={2} c={C.purple}>③ VERROU ACTIF — Ce que voient A et B</H>
      <P dim>Entre l'acceptation et l'heure du RDV. Les deux sont engagés.</P>
      <Row>
        <Card>
          <div style={{fontSize:11,fontWeight:800,color:C.white,marginBottom:8}}>Ce qu'ils voient</div>
          <Leaf emoji="🔒" text="Écran Verrou : photo des deux + lieu + heure + countdown" badge="✅ Codé"/>
          <Leaf emoji="📡" text="ProximityRadar activé — distance en temps réel (floue LPD)"/>
          <Leaf emoji="🚫" text="Bouton J'y suis : grisé jusqu'à -15min ET GPS < 100m"/>
          <Leaf emoji="✏️" text="Option : Modifier le lieu (accord mutuel requis)" badge="À coder"/>
          <Leaf emoji="❌" text="Option : Annuler le Verrou (avec motif)" badge="✅ Codé"/>
        </Card>
        <Card>
          <div style={{fontSize:11,fontWeight:800,color:C.white,marginBottom:8}}>Visibilité dans l'app</div>
          <Leaf emoji="🙈" text="A n'apparaît plus dans Présences des autres"/>
          <Leaf emoji="🙈" text="B n'apparaît plus dans Présences des autres"/>
          <Leaf emoji="🔒" text="Les deux voient '1 Verrou actif' dans l'onglet Clutchs"/>
          <Leaf emoji="🔔" text="Notif -1h : 'Rappel : RDV dans 1h avec [prénom] à [lieu]'"/>
          <Leaf emoji="🔔" text="Notif -15min : 'C'est bientôt ! J'y suis se déverrouille dans ta zone'"/>
        </Card>
      </Row>
    </Card>

    {/* ─── PHASE 3 : PROXIMITÉ RADAR ─── */}
    <Card color={C.teal} glow>
      <H n={2} c={C.teal}>④ PROXIMITÉ RADAR — Approche du lieu</H>
      <P dim>À partir de -15min. Zone 1 = &gt;300m (cap affiché). Zone 2 = 300m→0m (animation progressive).</P>

      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:800,color:C.teal,marginBottom:6}}>Zone 1 — &gt;300m</div>
        <Leaf emoji="🔵" text="Radar Doppler pulsation lente (1 pulse/2s)"/>
        <Leaf emoji="📏" text="Distance affichée : '400m à pied · 5min' (estimé, pas GPS exact)"/>
        <Leaf emoji="🚶" text="Conseil discret si trajet long : 'Tu es à 20min — pars maintenant !'"/>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:800,color:C.gold,marginBottom:6}}>Zone 2 — 300m → 50m</div>
        <Leaf emoji="🟡" text="Photos des deux s'éclaircissent progressivement"/>
        <Leaf emoji="💫" text="Pulsation accélère (1 pulse/0.8s)"/>
        <Leaf emoji="✨" text="Traînée lumineuse si l'autre se déplace"/>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:800,color:C.red,marginBottom:6}}>Zone finale — 50m → 0m</div>
        <Leaf emoji="🔴" text="Photos glissent vers le centre — attraction magnétique"/>
        <Leaf emoji="💓" text="Animation battement cardiaque"/>
        <Leaf emoji="📳" text="Vibration haptique toutes les 30s"/>
        <Leaf emoji="🔓" text="Bouton J'y suis passe au vert si GPS < 100m ET dans fenêtre temporelle"/>
      </div>
    </Card>

    {/* ─── PHASE 4 : J'Y SUIS ─── */}
    <Card color={C.gold} glow>
      <H n={2} c={C.gold}>⑤ J'Y SUIS — Arbre complet (5 scénarios)</H>
      <P dim>Le moment critique. GPS vérifié, fenêtre temporelle active (-15min → +30min). Conditions : GPS &lt; 100m ET heure valide.</P>

      {/* SCÉ 1 */}
      <div style={{background:`${C.green}10`,borderRadius:10,padding:'10px 12px',marginBottom:10,border:`1px solid ${C.green}30`}}>
        <div style={{fontSize:12,fontWeight:900,color:C.green,marginBottom:6}}>✅ Scénario 1 — Les deux cliquent J'y suis</div>
        <Leaf emoji="👆" text="A clique J'y suis → photo A se locke au centre du radar"/>
        <Leaf emoji="👆" text="B clique J'y suis → photo B se locke au centre"/>
        <Leaf emoji="🎉" text="Animation : les deux orbes fusionnent → écran VOUS ÊTES LÀ" score="+2 pts fiabilité chacun"/>
        <Leaf emoji="⏱" text="Timer 2h démarre. Bouton Terminer s'active."/>
        <Leaf emoji="📲" text="Notif push : 'Top ! Votre rencontre commence. Bonne soirée ✦'" notif="Envoyée aux deux"/>
      </div>

      {/* SCÉ 2 */}
      <div style={{background:`${C.orange}10`,borderRadius:10,padding:'10px 12px',marginBottom:10,border:`1px solid ${C.orange}30`}}>
        <div style={{fontSize:12,fontWeight:900,color:C.orange,marginBottom:6}}>⏳ Scénario 2 — A clique, B pas encore (dans la fenêtre)</div>
        <Leaf emoji="👆" text="A clique J'y suis → photo A locke au centre, pulse lentement"/>
        <Leaf emoji="🔔" text="Notif à B +5min : '[A] est arrivé·e. Et toi ?'" notif="Push silencieux"/>
        <Leaf emoji="🔔" text="Notif à B +10min : '[A] t'attend. Un tap suffit ✓'"/>
        <Leaf emoji="✅" text="Si B clique ensuite → Scénario 1 (voir ci-dessus)"/>
        <Leaf emoji="⏰" text="Si B ne clique pas après 30min → Scénario 4 (retard non annoncé)"/>
      </div>

      {/* SCÉ 3 */}
      <div style={{background:`${C.blue}10`,borderRadius:10,padding:'10px 12px',marginBottom:10,border:`1px solid ${C.blue}30`}}>
        <div style={{fontSize:12,fontWeight:900,color:C.blue,marginBottom:6}}>🔔 Scénario 3 — Aucun des deux ne clique (dans la fenêtre)</div>
        <Leaf emoji="🔔" text="Notif aux deux à l'heure du RDV : 'Vous êtes toujours là ? → J'y suis / Retard / Annuler'"/>
        <Leaf emoji="🔔" text="Relance +15min si aucune action : 'Dernier rappel — J'y suis ou Annuler ?'"/>
        <Leaf emoji="⏰" text="Après +30min sans action → Verrou en statut 'suspendu' — en attente GPS"/>
        <Leaf emoji="🤖" text="Vérif GPS automatique : si les deux sont à > 500m du lieu → Lapin mutuel proposé" score="Aucune pénalité si accord mutuel"/>
      </div>

      {/* SCÉ 4 */}
      <div style={{background:`${C.orange}15`,borderRadius:10,padding:'10px 12px',marginBottom:10,border:`1px solid ${C.orange}40`}}>
        <div style={{fontSize:12,fontWeight:900,color:C.orange,marginBottom:6}}>⚠️ Scénario 4 — B arrive en retard (annoncé)</div>
        <Leaf emoji="📝" text="B clique 'Retard' dans l'app → modal : combien de temps ? (15min / 30min / +30min)"/>
        <Leaf emoji="📲" text="A reçoit : 'B sera là dans ~20min. Tu attends ou on reporte ?'" notif="A peut choisir d'attendre ou annuler sans pénalité"/>
        <Leaf emoji="✅" text="Si A attend + B arrive dans le délai → Scénario 1"/>
        <Leaf emoji="✅" text="Si A décide d'annuler en attendant → annulation sans pénalité pour A" score="B : -1 pt (retard annoncé, mineur)"/>
        <Leaf emoji="❌" text="Si B dépasse le délai annoncé sans action → passe en Scénario 5" score="B : -3 pts supplémentaires"/>
      </div>

      {/* SCÉ 5 */}
      <div style={{background:`${C.red}10`,borderRadius:10,padding:'10px 12px',marginBottom:10,border:`1px solid ${C.red}30`}}>
        <div style={{fontSize:12,fontWeight:900,color:C.red,marginBottom:6}}>🐇 Scénario 5 — B ne vient pas (lapin)</div>
        <Leaf emoji="🤖" text="GPS de B vérifié : est-il à moins de 200m du lieu ?" />
        <Branch label="→ GPS B < 200m mais pas cliqué J'y suis :"/>
        <Leaf emoji="📲" text="Notif : 'Tu es à deux pas ! Un tap suffit ✓'" notif="1 seule notif — pas de spam"/>
        <Branch label="→ GPS B > 500m après +30min :"/>
        <Leaf emoji="🔴" text="Lapin automatique proposé à B : 'On dirait que tu ne viendras pas. Confirmer ?'"/>
        <Leaf emoji="✅" text="B confirme lapin → A notifié, A peut annuler sans pénalité" score="B : -5 pts fiabilité (×1.5 si récidive)"/>
        <Leaf emoji="⌛" text="B ne répond pas → lapin automatique après 1h" score="B : -5 pts (×2 si récidive)"/>
        <Branch label="→ A peut aussi annuler de son côté :"/>
        <Leaf emoji="👆" text="A clique 'Il/Elle n'est pas venu·e' → Verrou fermé" score="A : 0 pts (victime). B : -5 pts"/>
      </div>

      {/* SCÉ 6 */}
      <div style={{background:`${C.red}08`,borderRadius:10,padding:'10px 12px',marginBottom:10,border:`1px solid ${C.red}20`}}>
        <div style={{fontSize:12,fontWeight:900,color:C.red,marginBottom:6}}>💀 Scénario 6 — Les deux ne viennent pas (lapin mutuel)</div>
        <Leaf emoji="🤖" text="GPS des deux vérifiés : aucun n'est au lieu après +30min"/>
        <Leaf emoji="📲" text="Notif aux deux : 'Il semblerait que vous ne soyez ni l'un ni l'autre au lieu. Annuler mutuellement ?'"/>
        <Leaf emoji="✅" text="Annulation mutuelle confirmée" score="Les deux : -1 pt (annulation tardive légère)"/>
        <Leaf emoji="⌛" text="Si aucune réponse → auto-clôture après 1h, aucune pénalité (bénéfice du doute)"/>
      </div>
    </Card>

    {/* ─── PHASE 5 : RENCONTRE EN COURS ─── */}
    <Card color={C.green}>
      <H n={2} c={C.green}>⑥ RENCONTRE EN COURS — Timer 2h actif</H>
      <P dim>Les deux ont cliqué J'y suis. Timer 2h lancé. Bouton Terminer visible.</P>
      <Row>
        <Card>
          <div style={{fontSize:11,fontWeight:800,color:C.white,marginBottom:8}}>Ce qu'ils voient</div>
          <Leaf emoji="⏱" text="Timer 2h décompte. Peut être prolongé d'1h (accord mutuel)." badge="Phase 2"/>
          <Leaf emoji="🔴" text="Bouton Terminer visible pour les deux"/>
          <Leaf emoji="📡" text="ProximityRadar en mode 'ensemble' — plus de distance, juste confirmation"/>
          <Leaf emoji="🙈" text="Les deux toujours invisibles dans Présences"/>
        </Card>
        <Card>
          <div style={{fontSize:11,fontWeight:800,color:C.white,marginBottom:8}}>Terminer le RDV</div>
          <Leaf emoji="👆" text="Un seul appuie Terminer → demande confirmation à l'autre" badge="Symétrie"/>
          <Leaf emoji="✅" text="L'autre confirme → RDV terminé" score="+1 pt chacun"/>
          <Leaf emoji="❌" text="L'autre refuse → RDV continue (protection contre fin forcée)"/>
          <Leaf emoji="⏱" text="Auto-fermeture à 2h si Terminer pas cliqué"/>
          <Leaf emoji="📝" text="3h après fermeture → feedback obligatoire (app en flou si non fait)" badge="À coder"/>
        </Card>
      </Row>

      <div style={{padding:'10px 12px',background:`${C.gold}10`,borderRadius:10,border:`1px solid ${C.gold}30`,marginTop:8}}>
        <div style={{fontSize:11,fontWeight:800,color:C.gold,marginBottom:6}}>Scénario — Terminer prématurément (avant 30min)</div>
        <Leaf emoji="⚡" text="Terminer disponible dès J'y suis des deux — même 5min après"/>
        <Leaf emoji="🤫" text="Pas de jugement. Aucune raison demandée pour fermer."/>
        <Leaf emoji="📝" text="Feedback déclenché 3h après quand même" score="Ponctualité : Oui (les deux étaient là). Résultat : neutre"/>
        <Leaf emoji="❄️" text="Cooling off 48h s'applique quand même"/>
      </div>
    </Card>

    {/* ─── PHASE 6 : FEEDBACK ─── */}
    <Card color={C.purple}>
      <H n={2} c={C.purple}>⑦ FEEDBACK — 3h après fermeture</H>
      <P dim>Double-blind : les deux remplissent sans voir ce que l'autre a dit. Révélation simultanée ou jamais. App en flou si feedback non complété.</P>
      <Row>
        <Card>
          <div style={{fontSize:11,fontWeight:800,color:C.white,marginBottom:8}}>3 questions (30 secondes max)</div>
          <Leaf emoji="⏰" text="Ponctualité : À l'heure / Léger retard / Gros retard"/>
          <Leaf emoji="😊" text="Comment c'était ? (4 emojis anonymes, pas de texte libre)"/>
          <Leaf emoji="🔄" text="Reclucher ? Oui / Non / Peut-être" badge="Optionnel"/>
        </Card>
        <Card>
          <div style={{fontSize:11,fontWeight:800,color:C.white,marginBottom:8}}>Conséquences</div>
          <Leaf emoji="✅" text="Les deux ont répondu Oui → option 'Favoris mutuels' (toujours visibles l'un à l'autre)"/>
          <Leaf emoji="📊" text="Scores fiabilité mis à jour (invisible pour l'utilisateur)"/>
          <Leaf emoji="🚨" text="Si signalement sécurité → review manuelle immédiate" score="-10 pts + enquête"/>
          <Leaf emoji="❄️" text="Cooling off 48h commence APRÈS le feedback"/>
        </Card>
      </Row>
    </Card>

    {/* ─── RÉSUMÉ SCORES ─── */}
    <Card color={C.orange}>
      <H n={2} c={C.orange}>📊 Récap scores fiabilité — Tous les cas</H>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
          <thead>
            <tr>{['Action','Score A','Score B','Multiplicateur récidive'].map(h=><th key={h} style={{padding:'5px 8px',borderBottom:`1px solid ${C.border}`,color:C.gold,textAlign:'left',fontWeight:700}}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {[
              ['✅ Les deux arrivent à l\'heure','+2','+2','×1'],
              ['⚠️ Retard annoncé (< 30min)','-1','0','×1.5 si répété'],
              ['❌ Annuler > 2h avant','-1','-1','×1'],
              ['❌ Annuler < 2h avant','-3','-3','×1.5'],
              ['🐇 Lapin (absent, non prévenu)','0','-5','×2 récidive'],
              ['🐇 Lapin mutuel non confirmé','-1','-1','×1'],
              ['🚨 Signalement sécurité','0','-10','×3 + review'],
              ['🎉 Feedback Oui/Oui mutual','+1','+1','×1'],
            ].map(r=>(
              <tr key={r[0]} style={{borderBottom:`1px solid ${C.border}`}}>
                {r.map((v,i)=><td key={i} style={{padding:'5px 8px',color:i===1||i===2?(v.startsWith('+')?C.green:v==='-'||v==='0'?C.mid:C.red):C.mid,fontWeight:i>0?700:400}}>{v}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>

    {/* ─── CHECK-LIST TEST ─── */}
    <Card color={C.blue}>
      <H n={2} c={C.blue}>🧪 Check-list de test — Tout ce qu'il faut tester</H>
      <P dim>Pour David & Mel : scénarios à tester en prod avant App Store.</P>
      <Row>
        <div>
          <div style={{fontSize:11,fontWeight:800,color:C.white,marginBottom:6}}>Flow principal</div>
          {['Envoyer un Clutch et attendre réponse','Accepter un Clutch','Refuser un Clutch','Contre-Clutch : proposer autre lieu','Notif push reçue sur iPhone','Verrou s\'active après acceptation','Les deux disparaissent de Présences'].map(t=><Pill key={t} label={t}/>)}
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:800,color:C.white,marginBottom:6}}>J'y suis & Radar</div>
          {['J\'y suis grisé si loin du lieu','J\'y suis actif si < 100m','ProximityRadar s\'anime','Notif GPS si près mais pas cliqué','Les deux cliquent J\'y suis','Un seul clique, l\'autre reçoit notif','Auto-lapin après 30min sans action'].map(t=><Pill key={t} label={t}/>)}
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:800,color:C.white,marginBottom:6}}>Terminer & Feedback</div>
          {['Terminer visible seulement si J\'y suis','Terminer : demande confirmation à l\'autre','Auto-fermeture après 2h','Feedback app en flou si non complété','Cooling off 48h après feedback','Score fiabilité mis à jour','Favoris mutuels si feedback Oui/Oui'].map(t=><Pill key={t} label={t}/>)}
        </div>
      </Row>
    </Card>

  </div>
  )
}

// ─── Section : IDÉES GPT ─────────────────────────────────────────────────────
const SectionIdees = () => (
  <div>
    <H n={1}>💡 Idées créatives — Audit GPT 16.06</H>
    <P>Contexte : David a demandé à GPT-4 un audit créatif extrême. Résultat : 40+ idées classées. Voici tout.</P>

    <Card color={C.gold} glow>
      <H n={2}>💼 MODE PRO — "Le LinkedIn du monde réel"</H>
      <Idea emoji="⚡" title="Mission Express (15–60 min)" desc="'J'ai besoin d'un avis UX sur mon prototype.' Le professionnel reçoit : Mission express près de toi. RDV dans les 18h. Micro-économie locale + networking réel + génération de leads. Personne ne fait ça." badge="⭐⭐⭐"/>
      <Idea emoji="🔄" title="Swap de compétences" desc="'30 min d'anglais contre 30 min d'aide Excel.' Très puissant en Suisse — surtout étudiants, indépendants, expatriés." badge="⭐⭐⭐"/>
      <Idea emoji="☕" title="Coworking spontané" desc="'3 personnes dispo pour travailler 2h au Café X.' Salle de coworking éphémère. Modes : silencieux / brainstorming / accountability. Effet psychologique énorme." badge="⭐⭐"/>
      <Idea emoji="🎯" title="Pitch Battle 5 minutes" desc="Au café : chacun a 5 min pour pitcher son projet, les autres donnent feedback. Incroyablement viral pour startups, freelances, étudiants." badge="⭐⭐"/>
      <Idea emoji="🤝" title="Cercle de recommandations" desc="Après un Verrou pro : attribuer Fiable / Expert / Réactif / Créatif / Agréable. Pas de note sur 5, seulement des qualités. Beaucoup plus humain." badge="⭐⭐⭐"/>
      <Idea emoji="🧠" title="Brain Trust local" desc="'Besoin d'un avis fiscal dans les 3h.' Les experts disponibles apparaissent. Presque un Uber de l'expertise locale." badge="⭐⭐"/>
    </Card>

    <Card color={C.purple}>
      <H n={2} c={C.purple}>👨‍👩‍👧 MODE PARENTS — "Catégorie quasi vierge"</H>
      <Idea emoji="👶" title="Clutch Kids" desc="Enfants restent anonymes (âge + centres d'intérêt). Parent voit : '2 familles avec enfants 5–7 ans au parc'. Pas de photo enfant. Génial pour la sécurité." badge="⭐⭐⭐"/>
      <Idea emoji="🔄" title="Swap babysitting confiance" desc="Débloqué uniquement après plusieurs rencontres réussies + score élevé + vérification. Tu construis une vraie communauté." badge="⭐⭐"/>
      <Idea emoji="🎂" title="Anniversaire spontané" desc="'Nous sommes déjà 4 enfants au parc. Rejoignez-nous.' Très différenciant." badge="⭐"/>
      <Idea emoji="🌲" title="Activités saisonnières" desc="Suggestions auto : luge, marché de Noël, ferme pédagogique, cueillette, patinoire. Hyper suisse." badge="⭐⭐"/>
      <Idea emoji="🎮" title="Cherche copain de jeu" desc="Parent indique âge + énergie (calme / sportif / créatif). Algo : 'Votre enfant pourrait bien s'entendre avec cette famille.' Extrêmement puissant émotionnellement." badge="⭐⭐⭐"/>
    </Card>

    <Card color={C.teal}>
      <H n={2} c={C.teal}>🎰 7 IDÉES "PUTAIN C'EST GÉNIAL"</H>
      <Idea emoji="🎲" title="Roulette réelle" desc="Tu choisis 'Surprends-moi.' L'app propose une rencontre compatible dans les 2h. Très DNA Clutch." badge="⭐⭐⭐"/>
      <Idea emoji="🌅" title="Golden Hour / Fenêtres magiques" desc="Certains créneaux ont une visibilité boostée — ex: 18h–20h vendredi. Événement social hebdomadaire. Comme les happy hours mais pour les rencontres." badge="⭐⭐⭐"/>
      <Idea emoji="👣" title="Traces éphémères" desc="'Je serai au bord du lac jusqu'à 20h.' Disparaît ensuite. Comme une présence numérique réelle." badge="⭐⭐"/>
      <Idea emoji="🎭" title="Masque progressif" desc="Au début : prénom + activité + voix 10s. Photo complète apparaît seulement après acceptation. Réduit énormément le jugement superficiel." badge="⭐⭐⭐"/>
      <Idea emoji="🎤" title="Match vocal instantané" desc="Avant le Verrou : 30 secondes audio maximum. L'humain passe avant l'image. Très différenciant." badge="⭐⭐"/>
      <Idea emoji="🌡️" title="Énergie sociale" desc="L'utilisateur choisit : calme / aventurier / discussion profonde / fête. Le matching se fait aussi sur l'humeur du moment. Très rarement exploité." badge="⭐⭐"/>
      <Idea emoji="🗺️" title="Cartes secrètes de la ville" desc="Après plusieurs Verrous réussis : débloque lieux partenaires (bars cachés, événements privés, réductions). La ville devient un jeu." badge="⭐⭐⭐"/>
      <Idea emoji="🏆" title="Mission du Jour ★ FAVORITE GPT" desc="Chaque jour : 'Rencontre quelqu'un d'un métier différent' ou 'Bois un café avec quelqu'un vivant à +5km'. Récompenses : badges cachés, visibilité, avantages partenaires. Aucun géant du dating n'a réussi ça correctement." badge="⭐⭐⭐"/>
    </Card>

    <Card color={C.orange}>
      <H n={2} c={C.orange}>👨 HOMMES PEU DE SUCCÈS — Mécanismes sans dark-pattern</H>
      <Idea emoji="🤖" title="Coaching invisible" desc="L'IA suggère discrètement : 'Les Clutchs café après 19h ont +40% de succès.' ou 'Tes photos fonctionnent mieux avec sourire.' Sans humiliation." badge="⭐⭐⭐"/>
      <Idea emoji="🌍" title="Score de diversité" desc="Récompense les events / amical / pro / activités. Un homme actif socialement obtient plus de visibilité. Tu récompenses la vraie vie." badge="⭐⭐"/>
      <Idea emoji="🎯" title="Garantie 1 Clutch/semaine" desc="Algo : si utilisateur actif mais sans succès → augmente discrètement sa visibilité contextuelle. Extrêmement important pour la rétention." badge="⭐⭐"/>
      <Idea emoji="⚡" title="Activité > Beauté" desc="Quelqu'un qui crée randonnées / échecs / apéros devient naturellement plus visible. Le charisme réel bat les photos." badge="⭐⭐⭐"/>
    </Card>

    <Card>
      <H n={2}>🎪 EVENTS — Battre Facebook Events</H>
      <Idea emoji="⚡" title="Flow création en 20 secondes" desc="Écran unique : Que fais-tu ? [emoji] + lieu + heure + nombre max. Fini. Facebook = organisation. Clutch = présence. C'est différent." badge="⭐⭐⭐"/>
      <Idea emoji="📍" title="Event mobile GPS" desc="'Balade avec chien' — l'event se déplace sur la carte. Statut : au parc / en route / arrêt café. Ça crée de la vie réelle." badge="⭐⭐⭐"/>
      <Idea emoji="✅" title="Check-in réel obligatoire" desc="Les participants doivent être proches du lieu GPS. Sinon : pas de points réputation. Fin des 'Je suis venu' mensongers." badge="⭐⭐"/>
      <Idea emoji="👥" title="Event vivant" desc="Affiche '3 personnes présentes maintenant' — pas '45 intéressés'. Énorme différence psychologique." badge="⭐⭐⭐"/>
    </Card>
  </div>
)

// ─── Section : MODES ─────────────────────────────────────────────────────────
const SectionModes = () => (
  <div>
    <H n={1}>👥 Modes — Système Manoski</H>
    <P>Multi-modes sur un seul compte. Chaque mode = une intention différente. Pas besoin de plusieurs profils.</P>

    {[
      {
        icon:'💕', label:'ROMANTIQUE', color:C.salmon, badge:'Défaut',
        desc:'Mode principal. Rencontres romantiques spontanées. Voir les personnes disponibles maintenant près de toi.',
        features:['Profils avec photo + bio + intérêts','Molette heure + filtre genre','Clutch 1-à-1 avec Verrou','Score fiabilité visible','ProximityRadar au moment du RDV'],
        limite:'1 date à la fois · Expiration 18h',
      },
      {
        icon:'🤗', label:'AMICAL', color:C.blue, badge:'En prod',
        desc:'Rencontres amicales. Apéro, sport, échecs, balade. Pas de pression romantique.',
        features:['Filtre "type de sortie"','Events publics créés par particuliers','Groupes jusqu\'à 5 personnes','Pas de score beauté dans l\'algo'],
        limite:'Contexte social uniquement',
      },
      {
        icon:'💼', label:'PROFESSIONNEL', color:C.gold, badge:'En prod',
        desc:'Networking réel. Filtre par catégorie métier (30 catégories). Rencontres dans les 18h.',
        features:['Liste métiers classés par dispo ↓','Mission Express 15–60min','Swap de compétences','Pitch Battle 5min','Cercle de recommandations (Fiable/Expert/Réactif)','Brain Trust local'],
        limite:'Pas de dating caché · Profil pro séparé',
      },
      {
        icon:'👨‍👩‍👧', label:'PARENTS', color:C.purple, badge:'Phase 2',
        desc:'Parents avec enfants. Activités spontanées. Catégorie quasi vierge sur le marché.',
        features:['Clutch Kids — enfants anonymes (âge + intérêts)','Swap babysitting (débloqué après score élevé)','Anniversaire spontané (rejoindre groupe au parc)','Activités saisonnières (luge/patinoire/cueillette)','Cherche copain de jeu (matching énergie enfant)'],
        limite:'Lieu toujours public · Profil enfant strictement anonyme',
      },
      {
        icon:'🚗', label:'COVOITURAGE', color:C.teal, badge:'Phase 2',
        desc:'Trajets spontanés. Partager sa voiture ou trouver un conducteur. DNA Clutch = spontanéité, pas Blablacar planifié.',
        features:['Trajet disponible maintenant','GPS vérification départ/arrivée','Score fiabilité partagé avec autres modes','Matching compatible (direction + heure)'],
        limite:'Sécurité physique prioritaire · Identité vérifiée obligatoire',
      },
    ].map(m=>(
      <Card key={m.label} color={m.color} glow>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
          <span style={{fontSize:24}}>{m.icon}</span>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:15,fontWeight:900,color:m.color}}>{m.label}</span>
              <Tag label={m.badge} color={m.badge==='En prod'?C.green:m.badge==='Défaut'?C.gold:C.blue}/>
            </div>
            <p style={{fontSize:12,color:C.mid,margin:0}}>{m.desc}</p>
          </div>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}}>
          {m.features.map(f=><Pill key={f} label={f} color={m.color}/>)}
        </div>
        <div style={{fontSize:11,color:C.dim,borderTop:`1px solid ${C.border}`,paddingTop:8,marginTop:8}}>⚠️ {m.limite}</div>
      </Card>
    ))}
  </div>
)

// ─── Section : FOSSÉ DÉFENSIF ────────────────────────────────────────────────
const SectionFosse = () => (
  <div>
    <H n={1}>🛡 Fossé défensif</H>
    <P>La question clé de GPT : "Que ferait une app concurrente dans 2 ans pour copier Clutch et le tuer ?"</P>

    <Card color={C.red} glow>
      <H n={2} c={C.red}>⚡ Ce que Tinder/Bumble peuvent copier rapidement</H>
      {['Disponibilité 18h','Events spontanés','Mode spontanéité'].map(f=><Pill key={f} label={f} color={C.red}/>)}
    </Card>

    <Card color={C.green} glow>
      <H n={2} c={C.green}>🔒 Ce qu'ils auront du mal à copier</H>
      <Idea emoji="⭐" title="Système de réputation réel" desc="Le Lapin (-5pts) est déjà fort. Ajouter : ponctualité + présence vérifiée GPS + régularité. Tu construis un graphe social réel que Tinder ne peut pas fabriquer rétrospectivement." badge="⭐⭐⭐"/>
      <Idea emoji="🗣" title="Culture Clutch — le vocabulaire" desc="Les mots Clutch / Verrou / Présences créent un langage propre. Les communautés fortes ont toujours leur vocabulaire. Quand les gens disent 'on fait un Clutch ?' en dehors de l'app → fossé infranchissable." badge="⭐⭐⭐"/>
      <Idea emoji="🏙" title="Réseau local Lausanne/EPFL/UNIL" desc="Commence par Lausanne, EPFL, UNIL, bars partenaires. L'effet réseau local est défensif. Une app générale ne peut pas avoir cette densité locale." badge="⭐⭐⭐"/>
      <Idea emoji="🤝" title="Historique social accumulé" desc="Après plusieurs rencontres : 'Vous avez 4 personnes en commun.' Très difficile à reproduire rapidement. Le graphe social est la barrière." badge="⭐⭐"/>
      <Idea emoji="🧬" title="L'ADN de la friction utile" desc="Clutch = friction vers le vrai RDV. Si Tinder copie, ils trahissent leur modèle (temps d'écran). La friction est leur ennemi, notre feature." badge="⭐⭐⭐"/>
      <Idea emoji="🎖" title="Score diversité activités" desc="Récompenser qui crée des apéros, randos, échecs → culture de la vraie vie. Impossible à faker pour un nouveau concurrent." badge="⭐⭐"/>
    </Card>

    <Card color={C.gold}>
      <H n={2}>🚀 Ce qu'on doit verrouiller MAINTENANT</H>
      <P>Avant d'avoir des concurrents :</P>
      {[
        'Déposer marque CLUTCH à l\'IGE (Institut fédéral de la propriété intellectuelle)',
        'Créer la culture du vocabulaire — faire que les gens disent Clutch/Verrou naturellement',
        'Score fiabilité multi-dimensions (Ponctualité + Bienveillance + Respect) — données impossibles à copier',
        'Réseau partenaires bars/lieux Lausanne — exclusivités',
        'Base early adopters EPFL/UNIL — effet réseau dense',
        'System Mission du Jour — expérience gamifiée unique',
      ].map(f=><Pill key={f} label={f} done/>)}
    </Card>

    <Card>
      <H n={2}>💭 La vraie vision de GPT</H>
      <div style={{background:C.card2,borderRadius:12,padding:'16px',borderLeft:`4px solid ${C.gold}`}}>
        <P>"Mon intuition : le plus gros potentiel de Clutch n'est peut-être pas le dating, mais devenir le <strong style={{color:C.gold}}>système d'exploitation des rencontres spontanées dans la ville</strong>. Si tu réussis Lausanne, tu peux ensuite répliquer ville par ville avec un fort effet réseau local."</P>
        <p style={{fontSize:11,color:C.dim,margin:0}}>— GPT-4, audit créatif extrême, 16.06.2026</p>
      </div>
    </Card>
  </div>
)

// ─── Section : FEMMES ────────────────────────────────────────────────────────
const SectionFemmes = () => (
  <div>
    <H n={1}>👩 Expérience Femmes — Centre de l'application</H>
    <div style={{background:`linear-gradient(135deg, ${C.card} 0%, #2a1020 100%)`,borderRadius:14,padding:'16px',marginBottom:12,border:`1px solid ${C.salmon}30`}}>
      <P><strong style={{color:C.salmon}}>Les femmes sont le centre gravitationnel de Clutch.</strong> Sans elles, les hommes partent. Toute décision produit doit d'abord être testée du point de vue d'une femme 23 ans, Lausanne, seule le soir.</P>
    </div>

    <Card color={C.salmon} glow>
      <H n={2} c={C.salmon}>🎛 Contrôle total — Idées GPT</H>
      <Idea emoji="🎭" title="Mode Invitation seulement" desc="Une femme peut être : visible / semi-visible / invisible mais recevoir des propositions filtrées. Elle ne subit jamais l'app. L'app travaille pour elle." badge="⭐⭐⭐"/>
      <Idea emoji="📋" title="File d'attente intelligente" desc="Au lieu de 100 demandes : Clutch montre seulement 3 meilleurs choix, renouvelés toutes les heures. Pas de surcharge cognitive. Sentiment de qualité." badge="⭐⭐⭐"/>
      <Idea emoji="🛡" title="Cercle de sécurité" desc="Une femme peut définir 'Seulement profils > 30 réputation' ou 'Uniquement profils vérifiés'. Sans jamais afficher ce filtre aux hommes." badge="⭐⭐⭐"/>
      <Idea emoji="👯" title="Mode Duo" desc="Révolutionnaire : 'Je viens avec une amie.' Deux femmes rencontrent un groupe / deux amis / autre duo. Immense potentiel sécurité. Très peu exploité." badge="⭐⭐⭐"/>
      <Idea emoji="🤖" title="IA anti-creep invisible" desc="Détecte annulations répétées / messages agressifs / comportements étranges. Le profil perd de la visibilité discrètement. Sans score public. Shadow downgrade." badge="⭐⭐⭐"/>
    </Card>

    <Card color={C.green}>
      <H n={2} c={C.green}>✅ Règles permanentes — Déjà décidées</H>
      {[
        'Prix égaux pour tous — les features premium se différencient par usage naturel, pas par genre',
        'Anti-spam hommes : 3 crédits/jour max (codé en algo)',
        'SOS bouton visible partout avec countdown et contacts urgence',
        '3 modes réception femmes : toutes demandes / filtrées / invitation seulement',
        'Invisible (pas bloquer) : contrôle de sa présence sans conflit',
        'Feedback double-blind : les deux parties ne savent pas ce que l\'autre a dit',
        'GPS non temps-réel : on stocke "zone choisie", pas position live (LPD)',
      ].map(f=><Pill key={f} label={f} done/>)}
    </Card>

    <Card>
      <H n={2}>🔴 Questions challenger sécurité</H>
      <P dim>À poser avant chaque feature :</P>
      {[
        {q:'Que fait un homme qui veut harceler une femme ?',r:'→ Anti-spam crédits + shadow downgrade + signalement'},
        {q:'Que fait quelqu\'un avec 50 faux comptes ?',r:'→ Vérification téléphone + GPS check-in + score impossible à faker'},
        {q:'Que fait quelqu\'un pour extraire toutes les positions GPS ?',r:'→ Position floue (fuzzPosition) + pas de position exacte stockée'},
        {q:'Que se passe-t-il si un screenshot circule dans un groupe WhatsApp malveillant ?',r:'→ Photo floutée partielle + option masque progressif'},
      ].map(({q,r})=>(
        <div key={q} style={{padding:'8px 0',borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:11,fontWeight:700,color:C.white,marginBottom:2}}>⚠️ {q}</div>
          <div style={{fontSize:11,color:C.green}}>{r}</div>
        </div>
      ))}
    </Card>
  </div>
)

// ─── Section : ALGO & ÉTHIQUE ────────────────────────────────────────────────
const SectionAlgo = () => (
  <div>
    <H n={1}>🧠 Algo & Éthique</H>

    <Card color={C.gold} glow>
      <H n={2}>⚖️ Système fiabilité — Architecture retenue</H>
      <P>4 niveaux · GPS check-in local · Double feedback caché 3h après · Score interne</P>
      <Row>
        <div>
          <H n={3}>Score actuel</H>
          {[
            {label:'À l\'heure',pts:'+2',color:C.green},
            {label:'Venu·e',pts:'+1',color:C.teal},
            {label:'Lapin',pts:'-5',color:C.red},
          ].map(({label,pts,color})=>(
            <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontSize:12,color:C.mid}}>{label}</span>
              <span style={{fontSize:13,fontWeight:800,color}}>{pts} pts</span>
            </div>
          ))}
        </div>
        <div>
          <H n={3}>Score V2 (multi-dim)</H>
          {['Ponctualité (GPS)','Bienveillance (feedback)','Respect (anti-creep)','Régularité (semaines)'].map(d=>(
            <div key={d} style={{padding:'5px 0',borderBottom:`1px solid ${C.border}`,fontSize:11,color:C.mid}}>{d}</div>
          ))}
        </div>
      </Row>
    </Card>

    <Card>
      <H n={2}>🎯 Algo matching — Facteurs</H>
      <P>L'algo récompense les comportements sains, pas le temps d'écran.</P>
      {[
        {f:'Score fiabilité', w:'40%', desc:'Le facteur principal'},
        {f:'Activité (events créés)', w:'20%', desc:'Récompense la vraie vie'},
        {f:'Compatibilité intérêts', w:'15%', desc:'Langue + centres communs'},
        {f:'Diversité sociale', w:'10%', desc:'Score diversité activités'},
        {f:'Récence', w:'10%', desc:'Actif récemment'},
        {f:'Géographie', w:'5%', desc:'Distance / zone choisie'},
      ].map(({f,w,desc})=>(
        <div key={f} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:`1px solid ${C.border}`}}>
          <div>
            <span style={{fontSize:12,fontWeight:700,color:C.white}}>{f}</span>
            <span style={{fontSize:11,color:C.dim,marginLeft:8}}>{desc}</span>
          </div>
          <span style={{fontSize:13,fontWeight:800,color:C.gold}}>{w}</span>
        </div>
      ))}
    </Card>

    <Card color={C.purple}>
      <H n={2} c={C.purple}>🤖 Anti-spam hommes — Système 3 crédits</H>
      <P>3 Clutchs/jour max pour les hommes. Gratuit. Permet de prioriser la qualité sur la quantité.</P>
      <Idea emoji="🎯" title="Crédits remis chaque jour à minuit" desc="Si 3 Clutchs envoyés sans réponse → pénalité légère (délai 2h avant prochain). Encourage des propositions de qualité."/>
      <Idea emoji="👩‍🔬" title="3 modes réception femmes" desc="Toutes demandes / Demandes filtrées (score > 30) / Invitation seulement. Sélectionnable à tout moment."/>
      <Idea emoji="📊" title="Shadow downgrade invisible" desc="Comportements détectés : annulations répétées, ghosting, messages agressifs. Pénalité discrète de visibilité. L'utilisateur ne sait pas qu'il est downgrade."/>
    </Card>

    <Card>
      <H n={2}>📏 KPI réels — Ce qu'on mesure</H>
      <P dim>La métrique nord : rencontres réussies (pas temps d'écran)</P>
      {[
        {kpi:'Verrous créés par semaine', target:'> 50 (beta)', color:C.gold},
        {kpi:'Taux J\'y suis cliqué', target:'> 80%', color:C.green},
        {kpi:'Taux feedback complété', target:'> 70%', color:C.teal},
        {kpi:'Score moyen fiabilité', target:'> 60/100', color:C.blue},
        {kpi:'Taux lapin', target:'< 10%', color:C.orange},
        {kpi:'Ratio hommes/femmes', target:'60/40 max', color:C.salmon},
      ].map(({kpi,target,color})=>(
        <div key={kpi} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${C.border}`}}>
          <span style={{fontSize:12,color:C.mid}}>{kpi}</span>
          <span style={{fontSize:12,fontWeight:700,color}}>{target}</span>
        </div>
      ))}
    </Card>
  </div>
)

// ─── Section : GROWTH ────────────────────────────────────────────────────────
const SectionGrowth = () => (
  <div>
    <H n={1}>📢 Growth & Early Adopters</H>

    <Card color={C.gold} glow>
      <H n={2}>🚀 Stratégie beta — Phase 1 (Lausanne)</H>
      <P>Lausanne = 140 000 hab · Vaud = 850 000 · 18–35 ans Suisse romande = ~500 000 personnes</P>
      <Idea emoji="🎓" title="EPFL / UNIL" desc="Meilleur terrain de test. Population jeune, multilingue, tech-friendly. Présence physique sur campus. Cible : 200 premiers users." badge="⭐⭐⭐"/>
      <Idea emoji="🍺" title="Bars partenaires" desc="3–5 bars Lausanne (Flon / Ouchy / EPFL). Clutch recommande ces lieux. Win/win : visibilité app + customers bars. Sponsoring croisé." badge="⭐⭐⭐"/>
      <Idea emoji="📱" title="Ambassadeurs 1 école = 1 personne" desc="Un ambassador par faculty/fac. Offre : accès premium 3 mois gratuit. Job : faire des stories/posts organiques." badge="⭐⭐"/>
      <Idea emoji="🎪" title="Pop-up 'Clutch Day'" desc="Événement test terrain public : les gens se clutchent en direct dans le Flon. Présence physique de l'équipe. Press local (24heures, Le Matin)." badge="⭐⭐⭐"/>
    </Card>

    <Card color={C.teal}>
      <H n={2} c={C.teal}>🔁 Boucles virales</H>
      <Idea emoji="📸" title="Stories 'Mon Clutch du soir'" desc="Après un Verrou réussi : option de partager une story anonymisée. 'J'ai clutché une partie d'échecs avec quelqu'un de cool ce soir 🎯'. FOMO naturel."/>
      <Idea emoji="🏆" title="Leaderboard fiabilité visible" desc="Top 10 profils les plus fiables de Lausanne (anonymisés). Crée de l'aspiration. Les gens veulent être dans le top."/>
      <Idea emoji="🎰" title="Mission du Jour partagée" desc="Si tu complètes la mission → badge visible sur profil 24h. Montre aux autres que tu es actif dans la vraie vie."/>
      <Idea emoji="👥" title="Invite 3 amis = 1 mois premium" desc="Parrainage classique mais avec vrai incentive. Surtout si les amis s'inscrivent ET font leur premier Verrou."/>
    </Card>

    <Card color={C.blue}>
      <H n={2} c={C.blue}>📣 Acquisition — Canaux</H>
      {[
        {canal:'Instagram/TikTok organic', desc:'Stories vraies rencontres. Pas de pub payante au début.', priorite:'★★★'},
        {canal:'LinkedIn (mode Pro)', desc:'Articles sur networking spontané. Public = freelances + startup Lausanne.', priorite:'★★'},
        {canal:'Press suisse romande', desc:'24heures, Le Matin, RTS. Angle : startup locale contre géants du dating.', priorite:'★★★'},
        {canal:'Reddit r/lausanne + forums EPFL', desc:'Communautés locales. Posts authentiques.', priorite:'★★'},
        {canal:'QR codes bars partenaires', desc:'Scan → app · Contexte : tu es déjà sorti, tu cherches quelqu\'un.', priorite:'★★★'},
      ].map(({canal,desc,priorite})=>(
        <div key={canal} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:`1px solid ${C.border}`}}>
          <div><div style={{fontSize:12,fontWeight:700,color:C.white}}>{canal}</div><div style={{fontSize:11,color:C.dim}}>{desc}</div></div>
          <span style={{fontSize:12,fontWeight:700,color:C.gold,flexShrink:0,marginLeft:8}}>{priorite}</span>
        </div>
      ))}
    </Card>

    <Card>
      <H n={2}>🌍 Expansion</H>
      <P>Lausanne → Genève (5min) → Berne → Zurich → France (Lyon/Paris) → EU</P>
      <P dim>Playbook : 1 ville = 1 équipe locale d'ambassadeurs + 3–5 bars partenaires + événement inaugural</P>
      <P dim>Ce qui change par ville : lieux partenaires + langue. Ce qui ne change pas : algo, DNA, vocabulaire.</P>
    </Card>
  </div>
)

// ─── Section : BUSINESS ──────────────────────────────────────────────────────
const SectionBusiness = () => (
  <div>
    <H n={1}>💰 Stratégie Business & Projections</H>

    {/* Modèle de revenus */}
    <Row>
      <Card color={C.green} glow>
        <H n={2} c={C.green}>Free — Tout le monde</H>
        <div style={{fontSize:28,fontWeight:900,color:C.green,marginBottom:4}}>CHF 0.-</div>
        <P>Accès complet. Éthique de conception.</P>
        {['3 Clutchs actifs simultanés','Tous les modes','Events illimités','SOS + sécurité totale','Score fiabilité visible'].map(f=><Pill key={f} label={f} done/>)}
      </Card>
      <Card color={C.gold} glow>
        <H n={2} c={C.gold}>Premium</H>
        <div style={{fontSize:28,fontWeight:900,color:C.gold,marginBottom:4}}>CHF 19.90<span style={{fontSize:13}}>/mois</span></div>
        <P>Sans engagement. Apple IAP.</P>
        {['5 Clutchs actifs','Voir qui a vu ton profil','Boosts visibilité','Analytics envois','Badge premium','Priorité algo'].map(f=><Pill key={f} label={f} done/>)}
      </Card>
    </Row>

    <Row>
      <Card color={C.orange}>
        <H n={2} c={C.orange}>⚡ Event Pay-per-use</H>
        <div style={{fontSize:22,fontWeight:900,color:C.orange,marginBottom:4}}>CHF 4.90–9.90<span style={{fontSize:12}}>/event</span></div>
        <P>Idée Jennifer (18.06.2026) ⭐⭐⭐ — Créer un event public sans abonnement. One-time IAP.</P>
        {['20/50/100 participants selon tarif','Pas besoin d\'être Driver','Apéro, rando, afterwork','Aligné avec usage réel'].map(f=><Pill key={f} label={f}/>)}
      </Card>
      <Card color={C.salmon}>
        <H n={2} c={C.salmon}>🍺 Clutch Driver</H>
        <div style={{fontSize:22,fontWeight:900,color:C.salmon,marginBottom:4}}>CHF 200–500<span style={{fontSize:12}}>/mois</span></div>
        <P>Partenaires bars/venues. Sponsorisent des soirées, boostent leur fréquentation.</P>
        {['Events sponsorisés','Analytics fréquentation','Badge Driver visible','Clutchs recommandés vers leur lieu'].map(f=><Pill key={f} label={f}/>)}
      </Card>
    </Row>

    {/* Marché adressable */}
    <Card color={C.teal}>
      <H n={2} c={C.teal}>🌍 Marché adressable — Chiffres réels</H>
      {[
        {zone:'Suisse romande', pop:'~500 000 (18–35 ans)', penetration:'Apps rencontres ~25% → 125 000 cible', note:'Lausanne = 50 000 dans la cible'},
        {zone:'Suisse entière', pop:'~2 000 000 (18–35 ans)', penetration:'Zurich, Berne, Bâle — barrière langue', note:'Adaptation alémanique nécessaire'},
        {zone:'Europe', pop:'~100M (18–35 ans)', penetration:'Paris, Berlin, Londres = priorité', note:'Concurrence locale forte (Hinge, Happn)'},
        {zone:'Monde', pop:'~1,5 milliard (18–35 ans)', penetration:'Marchés avec culture café/rencontre physique', note:'Japon, Brésil, Australie = potentiel'},
      ].map(({zone,pop,penetration,note})=>(
        <div key={zone} style={{padding:'10px 0',borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
            <span style={{fontSize:12,fontWeight:800,color:C.white}}>{zone}</span>
            <span style={{fontSize:11,fontWeight:700,color:C.teal}}>{pop}</span>
          </div>
          <div style={{fontSize:11,color:C.mid,marginBottom:2}}>{penetration}</div>
          <div style={{fontSize:10,color:C.dim,fontStyle:'italic'}}>{note}</div>
        </div>
      ))}
    </Card>

    {/* Masse critique */}
    <Card color={C.orange}>
      <H n={2} c={C.orange}>⚠️ Masse critique — Le seuil qui change tout</H>
      <P>Pour qu'un Clutch soit possible à Lausanne, il faut environ <strong style={{color:C.orange}}>50–100 users actifs simultanément</strong> dans un rayon de 3km. En dessous : l'app est morte. Au-dessus : effet réseau exponentiel.</P>
      {[
        {n:'~200 inscrits', label:'Seuil minimum viable (Lausanne centre)', color:C.salmon},
        {n:'~500 actifs/mois', label:'Début de l\'effet réseau — les Clutchs marchent régulièrement', color:C.orange},
        {n:'~2 000 actifs/mois', label:'App indispensable à Lausanne — bouche-à-oreille organique', color:C.gold},
        {n:'~10 000 actifs/mois', label:'Expansion Genève possible — masse critique atteinte en romande', color:C.green},
      ].map(({n,label,color})=>(
        <div key={n} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:`1px solid ${C.border}`,alignItems:'center'}}>
          <span style={{fontSize:13,fontWeight:900,color,minWidth:80}}>{n}</span>
          <span style={{fontSize:11,color:C.mid}}>{label}</span>
        </div>
      ))}
    </Card>

    {/* Projections Phase 1 — Suisse romande */}
    <Card>
      <H n={2}>📊 Phase 1 — Suisse romande (Lausanne → Genève)</H>
      <P dim>CAC estimé CHF 5–15 par user (réseaux sociaux ciblés Lausanne). Churn apps rencontres : 40–60%/mois. Conversion premium : 3–8% des actifs.</P>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
          <thead>
            <tr style={{borderBottom:`2px solid ${C.border}`}}>
              {['Scénario','6 mois','12 mois','24 mois','MRR 24 mois'].map(h=>(
                <th key={h} style={{padding:'8px 6px',textAlign:'left',color:C.dim,fontWeight:700}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              {s:'😟 Pessimiste', c:C.salmon, m6:'150 inscrits\n30 actifs\nCHF 0 MRR', m12:'400 inscrits\n80 actifs\n4 premium\nCHF 80/mois', m24:'800 inscrits\n150 actifs\n8 premium\nCHF 160/mois', mrr:'CHF 160'},
              {s:'😐 Réaliste', c:C.gold, m6:'500 inscrits\n150 actifs\n6 premium\nCHF 120/mois', m12:'1 500 inscrits\n400 actifs\n20 premium\nCHF 400/mois', m24:'4 000 inscrits\n900 actifs\n54 premium\nCHF 1 075/mois', mrr:'CHF 1 075'},
              {s:'🚀 Optimiste', c:C.green, m6:'1 200 inscrits\n400 actifs\n20 premium\nCHF 400/mois', m12:'4 000 inscrits\n1 200 actifs\n72 premium\nCHF 1 430/mois', m24:'12 000 inscrits\n3 000 actifs\n210 premium\nCHF 4 180/mois', mrr:'CHF 4 180'},
            ].map(({s,c,m6,m12,m24,mrr})=>(
              <tr key={s} style={{borderBottom:`1px solid ${C.border}`}}>
                <td style={{padding:'10px 6px',fontWeight:800,color:c,whiteSpace:'nowrap'}}>{s}</td>
                {[m6,m12,m24].map((v,i)=>(
                  <td key={i} style={{padding:'10px 6px',color:C.mid,verticalAlign:'top'}}>
                    {v.split('\n').map((l,j)=><div key={j} style={{marginBottom:2,color:j===v.split('\n').length-1?C.gold:C.mid}}>{l}</div>)}
                  </td>
                ))}
                <td style={{padding:'10px 6px',fontWeight:900,color:c,fontSize:13}}>{mrr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{marginTop:12,padding:10,background:`${C.orange}15`,borderRadius:8,fontSize:11,color:C.dim}}>
        ⚡ Point mort (coûts fixes ~CHF 200/mois) : <strong style={{color:C.orange}}>11 abonnés premium</strong>. Atteignable en scénario réaliste à 12 mois.
      </div>
    </Card>

    {/* Projections Phase 2 — Suisse entière */}
    <Card color={C.blue}>
      <H n={2} c={C.blue}>🇨🇭 Phase 2 — Suisse entière (déclencher à 2 000+ actifs romands)</H>
      <P dim>Capital nécessaire : CHF 50–100k (marketing Zurich, adaptation allemande, 1 employé partiel). Timeline : 18–30 mois après lancement.</P>
      {[
        {h:'Zurich', desc:'1,4M habitants, culture "efficacité" compatible avec Clutch. Concurrence : Hinge bien implanté. Différenciateur : spontanéité vs planification.'},
        {h:'Berne', desc:'Capitale fédérale, communauté franco-alémanique. Marché test idéal avant Zurich.'},
        {h:'Bâle', desc:'City compacte, beaucoup de jeunes expats, très internationale. Culture bar/café forte.'},
        {h:'KPI avant expansion', desc:'MAU Suisse romande ≥ 2 000 · MRR ≥ CHF 3 000 · Score fiabilité moyen ≥ 4.2/5 · Ratio H/F ≤ 60/40'},
      ].map(({h,desc})=>(
        <div key={h} style={{padding:'8px 0',borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:12,fontWeight:800,color:C.white,marginBottom:3}}>→ {h}</div>
          <div style={{fontSize:11,color:C.mid}}>{desc}</div>
        </div>
      ))}
      <div style={{marginTop:12,padding:10,background:`${C.blue}15`,borderRadius:8}}>
        <div style={{fontSize:12,fontWeight:700,color:C.blue,marginBottom:4}}>Projections 5 ans — Suisse entière (scénario réaliste)</div>
        <div style={{fontSize:13,fontWeight:900,color:C.gold}}>15 000 actifs/mois · 900 premium · CHF 17 910 MRR · CHF 215 000 ARR</div>
      </div>
    </Card>

    {/* Phase 3 — Europe */}
    <Card color={C.purple}>
      <H n={2} c={C.purple}>🇪🇺 Phase 3 — Europe (déclencher à 10 000+ actifs CH)</H>
      <P dim>Capital nécessaire : CHF 500k–2M (seed round ou bootstrapped lent). Timeline : 3–4 ans après lancement.</P>
      {[
        {ville:'Paris', why:'40M de sorties café/bar/an. Culture spontanéité forte. Masse critique facile dans arrondissements centraux.', risk:'Concurrence Fruitz, Once, Hinge très implantés.'},
        {ville:'Londres', why:'Marché anglophone = plus grand potentiel presse tech. Expats = early adopters. Culture pub compatible.', risk:'CAC élevé, marché saturé.'},
        {ville:'Berlin', why:'Culture événementielle unique. Jeunes expats, créatifs. Moins concurrentiel que Paris/Londres.', risk:'Méfiance apps très forte en Allemagne (RGPD culture).'},
        {ville:'Amsterdam', why:'Anglophone de facto. Très jeune. Culture vélo/café = spontanéité.', risk:'Petit marché (900k habitants).'},
      ].map(({ville,why,risk})=>(
        <div key={ville} style={{padding:'10px 0',borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:13,fontWeight:800,color:C.white,marginBottom:4}}>📍 {ville}</div>
          <div style={{fontSize:11,color:C.mid,marginBottom:3}}>✅ {why}</div>
          <div style={{fontSize:11,color:C.salmon}}>⚠️ {risk}</div>
        </div>
      ))}
      <div style={{marginTop:12,padding:10,background:`${C.purple}15`,borderRadius:8}}>
        <div style={{fontSize:12,fontWeight:700,color:C.purple,marginBottom:4}}>Projections 5 ans — Europe (scénario réaliste, 3 villes)</div>
        <div style={{fontSize:13,fontWeight:900,color:C.gold}}>80 000 actifs/mois · 4 000 premium · CHF 79 600 MRR · CHF 955 000 ARR</div>
      </div>
    </Card>

    {/* Phase 4 — Monde */}
    <Card color={C.salmon}>
      <H n={2} c={C.salmon}>🌍 Phase 4 — Monde (horizon 5–7 ans)</H>
      <P dim>Nécessite levée de fonds Series A (CHF 5–20M). Priorité aux marchés avec culture café/rencontre physique ET faible concurrence locale.</P>
      {[
        {marche:'Japon', note:'Culture "rencontre organisée" mais introvertie. Clutch pourrait libérer la spontanéité. Énorme marché apps (~40M 18-35). Localisation complexe.'},
        {marche:'Brésil', note:'Culture festive, très sociale. São Paulo = 12M habitants. Faible pouvoir d\'achat mais volume massif. Prix à adapter (BRL 20–30).'},
        {marche:'Australie', note:'Anglophone, culture bar forte, jeunes expats. Sydney/Melbourne = dense. CAC raisonnable.'},
        {marche:'Canada', note:'Proximité culturelle FR (Québec) + EN. Toronto = hub tech. Tremplin vers USA éventuel.'},
      ].map(({marche,note})=>(
        <div key={marche} style={{padding:'8px 0',borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:12,fontWeight:800,color:C.white,marginBottom:3}}>🌐 {marche}</div>
          <div style={{fontSize:11,color:C.mid}}>{note}</div>
        </div>
      ))}
    </Card>

    {/* Tableau synthèse */}
    <Card color={C.gold} glow>
      <H n={2} c={C.gold}>📈 Tableau synthèse — Scénario réaliste</H>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
          <thead>
            <tr style={{borderBottom:`2px solid ${C.gold}40`}}>
              {['Phase','Horizon','Actifs/mois','Premium','MRR','Coûts/mois','Cash flow'].map(h=>(
                <th key={h} style={{padding:'6px 8px',textAlign:'left',color:C.gold,fontWeight:700,fontSize:10}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              {p:'🇨🇭 Romande',h:'12 mois',a:'400',pr:'20',mrr:'CHF 400',c:'CHF 200',cf:'+CHF 200'},
              {p:'🇨🇭 Romande',h:'24 mois',a:'900',pr:'54',mrr:'CHF 1 075',c:'CHF 300',cf:'+CHF 775'},
              {p:'🇨🇭 Suisse',h:'36 mois',a:'3 000',pr:'150',mrr:'CHF 5 970',c:'CHF 2 000',cf:'+CHF 3 970'},
              {p:'🇨🇭 Suisse',h:'48 mois',a:'8 000',pr:'400',mrr:'CHF 15 920',c:'CHF 8 000',cf:'+CHF 7 920'},
              {p:'🇪🇺 Europe',h:'60 mois',a:'25 000',pr:'1 250',mrr:'CHF 49 750',c:'CHF 30 000',cf:'+CHF 19 750'},
            ].map((r,i)=>(
              <tr key={i} style={{borderBottom:`1px solid ${C.border}`,background:i%2===0?`${C.gold}05`:'transparent'}}>
                <td style={{padding:'8px',color:C.white,fontWeight:700,fontSize:10}}>{r.p}</td>
                <td style={{padding:'8px',color:C.gold,fontWeight:800}}>{r.h}</td>
                <td style={{padding:'8px',color:C.mid}}>{r.a}</td>
                <td style={{padding:'8px',color:C.mid}}>{r.pr}</td>
                <td style={{padding:'8px',color:C.gold,fontWeight:700}}>{r.mrr}</td>
                <td style={{padding:'8px',color:C.salmon}}>{r.c}</td>
                <td style={{padding:'8px',color:C.green,fontWeight:700}}>{r.cf}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>

    {/* Risques */}
    <Card color={C.salmon}>
      <H n={2} c={C.salmon}>🔥 Risques majeurs — Honnêtement</H>
      {[
        {r:'Masse critique non atteinte', desc:'Le risque #1. Si Lausanne ne dépasse pas 500 actifs, l\'app est un désert. Solution : concentrer 100% des efforts sur Lausanne centre avant d\'élargir.', level:'CRITIQUE'},
        {r:'Ratio H/F déséquilibré', desc:'Si les hommes représentent >70% des users, les femmes partent, puis les hommes. L\'app meurt. Surveiller hebdomadairement.', level:'CRITIQUE'},
        {r:'Tinder clone la feature', desc:'Tinder peut lancer "Tinder Now" demain. Fossé défensif : la friction vers le vrai RDV, le vocabulaire, la communauté locale.', level:'ÉLEVÉ'},
        {r:'Pas de revenus pendant 12 mois', desc:'Avec 0 abonnés les 6 premiers mois, le projet tient sur la passion. Budget marketing requis : CHF 2 000–5 000 pour lancer Lausanne.', level:'ÉLEVÉ'},
        {r:'Légal CH/LPD', desc:'Localisation GPS = donnée sensible. Consentement explicite obligatoire. Pas de position live stockée.', level:'MOYEN'},
      ].map(({r,desc,level})=>(
        <div key={r} style={{padding:'10px 0',borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
            <span style={{fontSize:12,fontWeight:800,color:C.white}}>{r}</span>
            <span style={{fontSize:10,fontWeight:700,padding:'2px 6px',borderRadius:4,background:level==='CRITIQUE'?`${C.salmon}30`:level==='ÉLEVÉ'?`${C.orange}30`:`${C.gold}30`,color:level==='CRITIQUE'?C.salmon:level==='ÉLEVÉ'?C.orange:C.gold}}>{level}</span>
          </div>
          <div style={{fontSize:11,color:C.mid}}>{desc}</div>
        </div>
      ))}
    </Card>

    {/* Coûts infra */}
    <Card>
      <H n={2}>💸 Coûts infrastructure</H>
      {[
        {s:'Supabase Free', c:'CHF 0/mois', l:'jusqu\'à 500 users actifs'},
        {s:'Supabase Pro', c:'CHF 25/mois', l:'500+ users actifs'},
        {s:'GitHub Pages', c:'CHF 0/mois', l:'hébergement illimité'},
        {s:'OneSignal Push', c:'CHF 0/mois', l:'jusqu\'à 10 000 users'},
        {s:'Apple Developer', c:'CHF 99/an', l:'TestFlight + App Store'},
        {s:'Google Play', c:'CHF 25 (once)', l:'Play Store'},
        {s:'Capgo (live updates)', c:'CHF 15/mois', l:'Mises à jour sans re-soumission Apple'},
      ].map(({s,c,l})=>(
        <div key={s} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${C.border}`}}>
          <div><span style={{fontSize:12,color:C.white,fontWeight:600}}>{s}</span><span style={{fontSize:11,color:C.dim,marginLeft:8}}>{l}</span></div>
          <span style={{fontSize:12,fontWeight:700,color:C.gold}}>{c}</span>
        </div>
      ))}
    </Card>
  </div>
)

// ─── Section : IDENTITÉ ──────────────────────────────────────────────────────
const SectionIdentite = () => (
  <div>
    <H n={1}>🎨 Identité & Brand — L'âme visible</H>

    <Card color={C.gold} glow>
      <H n={2} c={C.gold}>✦ Définition — Ce qu'est Clutch</H>
      <div style={{background:`${C.gold}10`,borderRadius:12,padding:'16px',marginBottom:12}}>
        <div style={{fontSize:15,fontWeight:900,color:C.white,lineHeight:1.6,marginBottom:8}}>
          "Clutch n'est pas une app de rencontres.<br/>C'est une app de <span style={{color:C.gold}}>présence spontanée vérifiée dans le monde réel</span>."
        </div>
        <div style={{fontSize:12,color:C.dim}}>Cette phrase gouverne toutes les décisions produit. Si une feature contredit ça, on ne la code pas.</div>
      </div>
      <div style={{background:`${C.salmon}08`,borderRadius:12,padding:'16px'}}>
        <div style={{fontSize:13,fontWeight:800,color:C.salmon,marginBottom:8}}>En une phrase pour la presse :</div>
        <div style={{fontSize:14,fontWeight:700,color:C.white,fontStyle:'italic'}}>"Le Tinder du monde réel — mais l'inverse exact : ici, l'action précède la conversation."</div>
      </div>
    </Card>

    <Card color={C.salmon}>
      <H n={2} c={C.salmon}>✍️ Arsenal de slogans</H>
      <P dim>À utiliser selon le contexte. La tagline principale est "Sois spontané·e". Les autres sont des variantes pour chaque canal.</P>

      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:800,color:C.gold,marginBottom:8,textTransform:'uppercase',letterSpacing:'.07em'}}>🥇 Taglines principales</div>
        {[
          {s:'"Sois spontané·e"',note:'Tagline principale — une baseline. Direct, inclusif, actif.'},
          {s:'"La vraie vie, maintenant"',note:'Alternatif philosophique — pour les campagnes profondes'},
          {s:'"Le Verrou ou rien"',note:'Manifeste interne — communication presse / pitch investisseurs'},
        ].map(({s,note})=>(
          <div key={s} style={{padding:'10px 0',borderBottom:`1px solid ${C.border}`}}>
            <div style={{fontSize:14,fontWeight:900,color:C.white,marginBottom:3}}>{s}</div>
            <div style={{fontSize:11,color:C.dim}}>{note}</div>
          </div>
        ))}
      </div>

      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:800,color:C.teal,marginBottom:8,textTransform:'uppercase',letterSpacing:'.07em'}}>⚡ Action / Acquisition</div>
        {[
          {s:'"Stop de swiper. Commence à sortir."',note:'Contre-positionnement Tinder/Bumble — social media, 18–30 ans'},
          {s:'"Ce soir ou jamais."',note:'Urgence 18h — push notification, accroches pub'},
          {s:'"Un Clutch. Un vrai RDV. En 18h."',note:'Explicatif — onboarding, App Store description'},
          {s:'"Tu n\'es qu\'à un Clutch."',note:'Jeu sur la proximité — format court, stories'},
          {s:'"Disponible maintenant. Pour vrai."',note:'Anti-ghosting — différenciation apps messaging'},
        ].map(({s,note})=>(
          <div key={s} style={{padding:'8px 0',borderBottom:`1px solid ${C.border}`}}>
            <div style={{fontSize:13,fontWeight:800,color:C.white,marginBottom:2}}>{s}</div>
            <div style={{fontSize:11,color:C.dim}}>{note}</div>
          </div>
        ))}
      </div>

      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:800,color:C.blue,marginBottom:8,textTransform:'uppercase',letterSpacing:'.07em'}}>🗺 Local & Communauté</div>
        {[
          {s:'"Lausanne a besoin de Clutch"',note:'Lancement beta — flyers, campus, presse locale'},
          {s:'"Les gens de Lausanne se Clutchent"',note:'Social proof — après 500 users'},
          {s:'"À l\'EPFL, à l\'UNIL, en ville — Clutch"',note:'Ciblage campus — rentrée septembre'},
          {s:'"Ce bar, ce soir, quelqu\'un t\'attend."',note:'Partenaires bars — écrans/affiches sur place'},
        ].map(({s,note})=>(
          <div key={s} style={{padding:'8px 0',borderBottom:`1px solid ${C.border}`}}>
            <div style={{fontSize:13,fontWeight:800,color:C.white,marginBottom:2}}>{s}</div>
            <div style={{fontSize:11,color:C.dim}}>{note}</div>
          </div>
        ))}
      </div>

      <div>
        <div style={{fontSize:11,fontWeight:800,color:C.purple,marginBottom:8,textTransform:'uppercase',letterSpacing:'.07em'}}>🔒 Contre-positionnement</div>
        {[
          {s:'"Pas de match. Un Verrou."',note:'La distinction core — pitch deck, presse tech'},
          {s:'"Les autres apps : des fantômes. Clutch : des gens."',note:'Contre Tinder/Bumble — direct'},
          {s:'"Le swipe crée de l\'espoir. Le Verrou crée de l\'engagement."',note:'Philosophique — long format'},
          {s:'"Ici, on ne matche pas. On se Clutche."',note:'Éducation vocabulaire — onboarding'},
          {s:'"18h. Pas 18 mois."',note:'Contre le dating lent — format court'},
        ].map(({s,note})=>(
          <div key={s} style={{padding:'8px 0',borderBottom:`1px solid ${C.border}`}}>
            <div style={{fontSize:13,fontWeight:800,color:C.white,marginBottom:2}}>{s}</div>
            <div style={{fontSize:11,color:C.dim}}>{note}</div>
          </div>
        ))}
      </div>
    </Card>

    <Card color={C.gold}>
      <H n={2}>🎨 Palette officielle Clutch</H>
      <P dim>Extraite du logo. JAMAIS inventer de nouvelles couleurs. Source : <span style={{fontFamily:'monospace',color:C.gold}}>/lib/brand.ts</span></P>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
        {[
          {name:'bgBase',hex:'#2a1020',label:'Fond prune/bordeaux foncé',usage:'Background principal = fond du logo'},
          {name:'gold',hex:'#C8860A',label:'Or/orange chaud',usage:'CTA + accents forts (= "TCH" du logo)'},
          {name:'peach',hex:'#FFBF9E',label:'Pêche/saumon',usage:'Texte + bordures (= "CLU" du logo)'},
          {name:'textPrimary',hex:'#f5e8de',label:'Crème chaud',usage:'Texte principal'},
        ].map(({name,hex,label,usage})=>(
          <div key={name} style={{borderRadius:10,padding:'12px',background:C.card2,border:`1px solid ${hex}40`}}>
            <div style={{width:32,height:32,borderRadius:8,background:hex,marginBottom:8,border:'1px solid rgba(255,255,255,.1)'}}/>
            <div style={{fontSize:12,fontWeight:800,color:hex}}>{name}</div>
            <div style={{fontSize:11,color:C.white}}>{hex}</div>
            <div style={{fontSize:10,color:C.dim,marginTop:3}}>{label} — {usage}</div>
          </div>
        ))}
      </div>
      <div style={{background:`${C.gold}10`,borderRadius:10,padding:'12px',fontSize:11,color:C.dim}}>
        <strong style={{color:C.white}}>Lecture du logo :</strong> Fond prune (#2a1020) + "CLU" en pêche (#FFBF9E) + "TCH" en or (#C8860A). Chaque couleur a un rôle précis. L'or = l'action. La pêche = la douceur. Le prune = la profondeur.
      </div>
    </Card>

    <Card>
      <H n={2}>📝 Vocabulaire — Règle absolue</H>
      <P dim>Le vocabulaire EST la promesse. Chaque mot crée une culture. "Clutcher quelqu'un" = nouveau verbe suisse romand à créer.</P>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
        {[
          {do:'✅ Clutch',dont:'❌ Match / Like / Swipe'},
          {do:'✅ Verrou',dont:'❌ Date / Rendez-vous'},
          {do:'✅ Présences',dont:'❌ Discover / Nearby'},
          {do:'✅ Disponible maintenant',dont:'❌ En ligne / Actif'},
          {do:'✅ Rendre invisible',dont:'❌ Bloquer / Bannir'},
          {do:'✅ Lapin',dont:'❌ No-show / Abandon'},
          {do:'✅ J\'y suis',dont:'❌ Check-in / Arrivé'},
          {do:'✅ Terminer',dont:'❌ Clore / Fermer'},
          {do:'✅ Clutcher quelqu\'un',dont:'❌ Matcher / Contacter'},
          {do:'✅ Fenêtre de 18h',dont:'❌ Expiration / Timeout'},
        ].map(({do:d,dont})=>(
          <div key={d} style={{borderRadius:8,padding:'8px 10px',background:C.card2}}>
            <div style={{fontSize:11,fontWeight:700,color:C.green}}>{d}</div>
            <div style={{fontSize:10,color:C.red,marginTop:2}}>{dont}</div>
          </div>
        ))}
      </div>
    </Card>

    <Card color={C.purple}>
      <H n={2} c={C.purple}>🧬 DNA Clutch — 5 phrases fondatrices</H>
      {[
        {p:'"La friction vers le vrai RDV est un feature, pas un bug."',a:'Si une feature rend Clutch plus confortable depuis le canapé, c\'est un dark pattern.'},
        {p:'"Clutch réussit quand les gens se voient en vrai."',a:'Toute feature qui augmente le temps d\'écran sans augmenter les Verrous est un échec mesurable.'},
        {p:'"Le Verrou est un engagement, pas une promesse."',a:'La mécanique GPS J\'y suis est la différence entre Clutch et un service de messagerie avec une photo.'},
        {p:'"Les app de dating vivent de votre addiction. Clutch vit de vos rencontres réussies."',a:'Alignement des intérêts : notre croissance = votre bonheur. Ce n\'est pas du marketing.'},
        {p:'"Complexité à l\'intérieur, simplicité à l\'extérieur."',a:'L\'algo anti-spam, les protections, le score — tout invisible. L\'utilisateur voit 3 profils. On gère le reste.'},
      ].map(({p,a})=>(
        <div key={p} style={{padding:'12px 0',borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:13,fontWeight:800,color:C.white,fontStyle:'italic',marginBottom:5}}>{p}</div>
          <div style={{fontSize:11,color:C.dim,lineHeight:1.6}}>{a}</div>
        </div>
      ))}
    </Card>

    <Card>
      <H n={2}>🎭 Ton de communication</H>
      <Row>
        <Card color={C.green}>
          <H n={2} c={C.green}>✅ Le ton Clutch</H>
          {['Direct et assumé (pas de langue de bois)','Inclusif mais pas politiquement correct','Suisse — sobre, qualité, pas de m\'as-tu-vu','Honnête sur les limites du produit','Humour pince-sans-rire, jamais gras','Urgence réelle, jamais artificielle','"Tu" — pas "vous"'].map(t=><Pill key={t} label={t} done/>)}
        </Card>
        <Card color={C.red}>
          <H n={2} c={C.red}>❌ Ce qu'on évite</H>
          {['Emojis excessifs dans l\'UI','Ton startup américain ("Amazing!", "Crush it!")','Promesses non tenues','Comparaisons agressives avec Tinder','Tons anxieux ou pressants non justifiés','Surexplication ("Cette feature vous permet de...")','Langue de psy ("espace de connexion authentique")'].map(t=><Pill key={t} label={t} color={C.red}/>)}
        </Card>
      </Row>
    </Card>
  </div>
)

// ─── Section : TECH ──────────────────────────────────────────────────────────
const SectionTech = () => (
  <div>
    <H n={1}>⚙️ Architecture technique</H>

    <Card color={C.blue} glow>
      <H n={2} c={C.blue}>🔴 Contraintes ABSOLUES</H>
      <Idea emoji="🚫" title="output: 'export' = ZÉRO code serveur" desc="Pas d'API routes, pas de server actions, pas de middleware. Tout via Supabase client-side. Build : /Users/uzic/Documents/clutch → out/ → pz7cgj4kfv-tech.github.io/" badge="CRITIQUE"/>
      <Idea emoji="🔐" title="Gate system a DEUX points" desc="isReallyAvail = is_available && available_until > now(). Vérifié au login routing ET dans setTab(). Toucher l'un sans l'autre = faille." badge="CRITIQUE"/>
      <Idea emoji="📱" title="iOS Safari — 3 règles obligatoires" desc="position:fixed pour le frame mobile · minHeight:0 sur tous les flex scrollables · WebkitOverflowScrolling:touch. Sans ça l'app freeze sur iPhone." badge="CRITIQUE"/>
      <Idea emoji="📲" title="Capacitor-forward" desc="Chaque choix technique doit fonctionner en natif iOS/Android via Capacitor. Éviter service workers custom et API Safari-only. appId: app.clutch.lausanne, webDir: out" badge="CRITIQUE"/>
    </Card>

    <Card>
      <H n={2}>📦 Stack</H>
      <Row>
        <div>
          <H n={3}>Frontend</H>
          {['Next.js 15 (static export)','React 18 + TypeScript','Leaflet.js (carte)','CSS-in-JS inline (pas de Tailwind)'].map(f=><Pill key={f} label={f} done/>)}
        </div>
        <div>
          <H n={3}>Backend / Infra</H>
          {['Supabase (DB + Auth + Realtime)','GitHub Pages (hosting)','OneSignal (push notifs)','Capacitor (iOS/Android natif)'].map(f=><Pill key={f} label={f} done/>)}
        </div>
      </Row>
    </Card>

    <Card>
      <H n={2}>🗄 Structure DB principale</H>
      {[
        {t:'profiles', c:'id, name, gender, age, neighborhood, bio, job, photo_url, is_available, available_until, account_type, interests, languages, verified'},
        {t:'clutchs', c:'id, sender_id, receiver_id, venue, time_slot, message, status, created_at'},
        {t:'events', c:'id, creator_id, title, emoji, type, venue, start_time, max_people, description, is_groupe'},
        {t:'feedbacks', c:'id, clutch_id, reviewer_id, reviewed_id, ponctualite, bienveillance, respect, comment'},
      ].map(({t,c})=>(
        <div key={t} style={{padding:'8px 0',borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:12,fontWeight:800,color:C.gold,marginBottom:2}}>{t}</div>
          <div style={{fontSize:10,color:C.dim,fontFamily:'monospace'}}>{c}</div>
        </div>
      ))}
    </Card>

    <Card color={C.orange}>
      <H n={2} c={C.orange}>📱 Roadmap native iOS/Android</H>
      <Idea emoji="🌐" title="Phase actuelle : PWA + GitHub Pages" desc="App web mobile-first, fonctionne dans le navigateur. Deploy en secondes."/>
      <Idea emoji="📲" title="Phase 2 : TestFlight (Apple Beta)" desc="Apple Developer (CHF 99/an) + Xcode + Capacitor build → IPA → TestFlight. Jusqu'à 10 000 testeurs beta." badge="2-3 semaines"/>
      <Idea emoji="🚀" title="Phase 3 : App Store public" desc="Soumission Apple (délai 1–3j). Review guidelines à respecter. Screenshot + description prête." badge="4-6 semaines"/>
      <Idea emoji="⚡" title="Live updates JS via Capgo" desc="Après App Store : màj JS sans re-soumission Apple. Économise 2–3j par itération." badge="Phase 3"/>
    </Card>

    <Card>
      <H n={2}>🔧 Tricks & patterns importants</H>
      <Idea emoji="🛰" title="Bot GPS Max — Morges Gare" desc="id: 'gpsbotma-0000-...001' · _isGpsTestBot: true · _fixedLat: 46.5099, _fixedLng: 6.4942 · Bypass total Supabase via isGpsBot flag dans SendModal"/>
      <Idea emoji="🌫" title="fuzzPosition()" desc="Offset GPS stable basé sur userId hash. Max 50m. Pour LPD suisse — on n'expose jamais la position exacte."/>
      <Idea emoji="📡" title="Realtime multi-channels" desc="1 channel par filtre : clutch-insert-uid / clutch-upd-rec-uid / clutch-upd-send-uid. Règle absolue Supabase."/>
    </Card>
  </div>
)

// ─── Section : LÉGAL ────────────────────────────────────────────────────────
const SectionLegal = () => (
  <div>
    <H n={1}>⚖️ Légal & Conformité</H>

    <Card color={C.red} glow>
      <H n={2} c={C.red}>🚨 Actions bloquantes avant App Store</H>
      {[
        {a:'Déposer marque CLUTCH à l\'IGE',d:'Classes 38+45 — CHF 550. Faire AVANT toute communication publique. Sans ça, n\'importe qui peut copier le nom.',done:false},
        {a:'Edge Function Supabase delete-account',d:'Apple EXIGE la suppression de compte in-app. Service role key côté Supabase. ~30min de dev.',done:false},
        {a:'Privacy Policy FR+DE+EN in-app',d:'Accessible depuis l\'app AVANT inscription. Obligatoire RGPD + Apple guidelines.',done:false},
        {a:'CGU — âge minimum 18 ans',d:'Vérification téléphone déjà en place. Mention légale age minimum = obligation légale.',done:false},
        {a:'Consultation avocat CH',d:'LPD (2023), responsabilité civile rencontres, RGPD EU. Budget : CHF 1 000–2 000. Avant App Store public.',done:false},
      ].map(({a,d,done})=>(
        <div key={a} style={{padding:'10px 0',borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
            <span style={{flexShrink:0}}>{done?'✅':'❌'}</span>
            <div>
              <div style={{fontSize:12,fontWeight:800,color:done?C.green:C.red,marginBottom:3}}>{a}</div>
              <div style={{fontSize:11,color:C.dim,lineHeight:1.5}}>{d}</div>
            </div>
          </div>
        </div>
      ))}
    </Card>

    <Card color={C.green}>
      <H n={2} c={C.green}>🇨🇭 LPD Suisse (nLPD — en vigueur sept. 2023)</H>
      <P dim>La nLPD (nouvelle LPD) est plus stricte que l'ancienne. Elle s'aligne sur le RGPD européen. Clutch est une app de dating = données sensibles × localisation = double contrainte.</P>
      <Idea emoji="📍" title="GPS ≠ position live — CRITIQUE" desc="On ne stocke jamais la position GPS temps-réel. On stocke 'zone de disponibilité choisie' par l'utilisateur. La localisation est une donnée sensible en droit suisse." badge="CRITIQUE"/>
      <Idea emoji="🌫" title="fuzzPosition() — Protection LPD" desc="Décalage stable max 50m basé sur userId hash. Position exacte jamais exposée à d'autres utilisateurs. Anti-stalking + conformité LPD."/>
      <Idea emoji="📋" title="Consentement progressif" desc="GPS demandé uniquement au moment du J'y suis (pas au lancement). Caméra uniquement pour photo profil. Pas de permissions en masse = pas de refus en masse."/>
      <Idea emoji="🗑" title="Droit à l'effacement" desc="Profil supprimable depuis Réglages (codé). Anonymisation immédiate de toutes les données GPS. Logs de connexion conservés max 30j."/>
      <Idea emoji="📊" title="Registre de traitement" desc="Document interne listant toutes les données collectées, leur finalité, leur durée de conservation. Requis nLPD si > 250 employés ou données sensibles."/>
      <Idea emoji="🔔" title="Notification de violation" desc="En cas de fuite de données : notification aux autorités dans les 72h. Notification aux utilisateurs si risque élevé. Préparer le protocole avant l'App Store."/>
    </Card>

    <Card color={C.blue}>
      <H n={2} c={C.blue}>🇪🇺 RGPD (dès qu'un utilisateur EU utilise l'app)</H>
      <P dim>Le RGPD s'applique dès qu'un ressortissant de l'UE utilise Clutch — même sans bureau EU, même depuis la Suisse.</P>
      <Idea emoji="📝" title="Privacy Policy RGPD-compliant" desc="Droit d'accès (Art. 15), rectification (Art. 16), effacement (Art. 17), portabilité (Art. 20), opposition (Art. 21). Tout en langage clair, pas juridique."/>
      <Idea emoji="🔒" title="Minimisation des données" desc="On collecte uniquement ce qui est strictement nécessaire. Pas de tracking publicitaire tiers. Pas de cookies de traçage. Analytics anonymisés uniquement."/>
      <Idea emoji="🤝" title="Sous-traitants" desc="Supabase (US) = sous-traitant. Clauses contractuelles types RGPD à signer. GitHub Pages = hébergement statique = pas de données personnelles."/>
      <Idea emoji="🌍" title="Transfert hors EU" desc="Supabase propose des régions EU (Frankfurt). Migrer vers EU region avant expansion France/Allemagne."/>
    </Card>

    <Card color={C.gold}>
      <H n={2}>🏷 Propriété intellectuelle</H>
      <Idea emoji="®" title="Marque CLUTCH — IGE Berne" desc="Classe 42 (logiciels web) + Classe 38 (télécommunications) + Classe 45 (services sociaux/dating). ~CHF 550 pour 2 classes. Protection 10 ans renouvelable. Le concept est non brevetable (idée) mais la MARQUE et le LOGO sont protégeables." badge="À faire MAINTENANT"/>
      <Idea emoji="🖼" title="Logo — droit d'auteur automatique" desc="En Suisse, le droit d'auteur naît automatiquement à la création. Garder les fichiers sources datés (Illustrator/Figma). Mel = auteur du logo."/>
      <Idea emoji="💻" title="Code source" desc="Propriété de David Saugy. Pas de licence open-source. Dépôt privé GitHub. Pas de contribution tierce = pas de CLA nécessaire."/>
    </Card>

    <Card>
      <H n={2}>⚠️ Responsabilité civile — Cas concrets</H>
      <P dim>Clutch met en relation. Clutch ne garantit pas la sécurité physique de la rencontre. Les CGU doivent être claires là-dessus — comme Airbnb, Uber, Meetic.</P>
      {[
        {s:'Rencontre qui tourne mal',r:'Clause limitation responsabilité dans CGU. SOS bouton = feature de sécurité, pas promesse de protection physique. Mention explicite dans les CGU.'},
        {s:'Profil fake / usurpation d\'identité',r:'Vérification téléphone réduist le risque. Signalement + suspension. Mention dans CGU : Clutch n\'est pas responsable de la véracité des profils.'},
        {s:'Mineur sur l\'app',r:'Âge minimum 18 ans dans les CGU. Signalement mineur = suspension immédiate. COPPA (US) si expansion Amérique.'},
        {s:'Harcèlement post-Clutch',r:'Politique anti-harcèlement dans CGU. Blocage / signalement disponible. Shadow downgrade pour les profils signalés.'},
        {s:'Fuite de données',r:'Protocole de réponse à définir. Cyber-assurance à envisager à partir de 1 000 users.'},
      ].map(({s,r})=>(
        <div key={s} style={{padding:'8px 0',borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:11,fontWeight:800,color:C.white,marginBottom:3}}>⚠️ {s}</div>
          <div style={{fontSize:11,color:C.dim,lineHeight:1.5}}>→ {r}</div>
        </div>
      ))}
    </Card>

    <Card color={C.teal}>
      <H n={2} c={C.teal}>📱 App Store — Règles Apple & Google</H>
      <Idea emoji="🔞" title="Guideline 1.1.4 — Dating apps" desc="Apple vérifie les apps de dating strictement depuis 2020. Exige : vérification âge, signalement profils, politique anti-harcèlement, suppression compte in-app."/>
      <Idea emoji="🔒" title="App Privacy Nutrition Label" desc="Apple exige de déclarer chaque type de donnée collectée (localisation, identifiant, usage, données de contact). Préparer avant soumission."/>
      <Idea emoji="💳" title="Apple IAP obligatoire" desc="Tout paiement in-app sur iOS doit passer par Apple IAP (30% commission). Stripe uniquement pour web. Capgo = updates JS sans re-soumission."/>
      <Idea emoji="🌐" title="Google Play — moins strict" desc="Délai review 24h vs 1-3j Apple. Mêmes exigences de fond (dating app policy). Commission 15% sur la première tranche."/>
    </Card>
  </div>
)

// ─── Section : CHANGELOG DÉCISIONS ──────────────────────────────────────────
const SectionChangelog = () => (
  <div>
    <H n={1}>📜 Changelog des décisions</H>
    <P dim>Chaque grande décision product/business/design avec sa date, son statut actuel, et pourquoi. Ce log ne se réinitialise jamais. Il évolue — une décision abandonnée reste visible avec son contexte.</P>

    <Card color={C.red}>
      <H n={2} c={C.red}>❌ Décisions abandonnées</H>
      {[
        {
          d:'17.06.2026', titre:'Gratuité femmes supprimée',
          avant:'"Gratuit pour les femmes" — présenté comme éthique et stratégique depuis le début.',
          après:'Prix égaux pour tous. Les features premium se différencient par usage naturel (pas par genre). Les femmes choisissent certaines features naturellement, les hommes d\'autres.',
          pourquoi:'Traiter les femmes comme le produit gratuit attirant les hommes payants est éthiquement inacceptable. Même si l\'intention était bonne (sécurité + acquisition), le message implicite est toxique.',
        },
      ].map(({d,titre,avant,après,pourquoi})=>(
        <div key={titre} style={{padding:'12px 0',borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
            <div style={{fontSize:13,fontWeight:900,color:C.red}}>❌ {titre}</div>
            <Tag label={d} color={C.red}/>
          </div>
          <div style={{fontSize:11,color:C.dim,marginBottom:4}}><strong style={{color:C.white}}>Avant :</strong> {avant}</div>
          <div style={{fontSize:11,color:C.dim,marginBottom:4}}><strong style={{color:C.green}}>Après :</strong> {après}</div>
          <div style={{fontSize:11,color:C.gold,fontStyle:'italic'}}>Pourquoi : {pourquoi}</div>
        </div>
      ))}
    </Card>

    <Card color={C.green}>
      <H n={2} c={C.green}>✅ Décisions actées et stables</H>
      {[
        {d:'Juin 2026', titre:'Vocabulaire Clutch/Verrou/Présences — figé', desc:'Jamais "match", "swipe", "like". Le vocabulaire est la promesse différenciante. Il crée une culture impossible à copier rapidement.'},
        {d:'Juin 2026', titre:'Constraint 18h — non négociable', desc:'La fenêtre max 18h entre le Clutch et le RDV est structurelle. L\'étirer = trahison du concept. Toute feature doit respecter cette contrainte.'},
        {d:'Juin 2026', titre:'GPS = zone choisie, jamais position live', desc:'LPD suisse. On stocke "zone de disponibilité" + fuzzPosition() 50m. Position exacte jamais exposée. Non négociable légalement.'},
        {d:'Juin 2026', titre:'iOS Safari — 3 règles CSS obligatoires', desc:'position:fixed + minHeight:0 sur flex scrollables + WebkitOverflowScrolling:touch. Sans ça l\'app freeze sur iPhone. Testé en prod.'},
        {d:'Juin 2026', titre:'Gate system — 2 points de vérification', desc:'isReallyAvail = is_available && available_until > now(). Vérifié au login routing ET dans setTab(). Toucher l\'un sans l\'autre = faille de sécurité.'},
        {d:'Juin 2026', titre:'Feedback double-blind 3h après RDV', desc:'Les deux feedbacks sont cachés l\'un à l\'autre jusqu\'à la révélation. Évite le biais de conformité sociale.'},
        {d:'Juin 2026', titre:'Lapin = -5 points fiabilité', desc:'Pénalité proportionnelle à la proximité temporelle. Récidive × multiplicateur. 4 niveaux publics, jamais le score exact.'},
        {d:'Juin 2026', titre:'App flou si feedback pending', desc:'Après RDV, si feedback non complété → app en flou. Feedback affiché en grand, impossible à ignorer. Garantit la qualité des données fiabilité.'},
        {d:'Juin 2026', titre:'Rendre invisible (pas "bloquer")', desc:'Sémantique : "Invisible" = contrôle de ma présence. "Bloquer" = conflit. L\'invisibilité est un feature positif, pas une action agressive.'},
      ].map(({d,titre,desc})=>(
        <div key={titre} style={{padding:'10px 0',borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
            <div style={{fontSize:12,fontWeight:800,color:C.green}}>✅ {titre}</div>
            <Tag label={d} color={C.green}/>
          </div>
          <div style={{fontSize:11,color:C.dim,lineHeight:1.5}}>{desc}</div>
        </div>
      ))}
    </Card>

    <Card color={C.orange}>
      <H n={2} c={C.orange}>🔄 Décisions en cours de clarification</H>
      {[
        {d:'17.06.2026', titre:'Modèle freemium — features premium à définir', desc:'Le prix CHF 19.90/mois est décidé. Mais la liste exacte des features premium (côté femmes ET hommes) n\'est pas encore arrêtée. À faire avec Mel.'},
        {d:'17.06.2026', titre:'Contre-RDV (modifier lors acceptation)', desc:'Codé partiellement. Flow exact pas encore validé par David + Mel. La mécanique "proposer un ajustement au moment d\'accepter" est validée en principe.'},
        {d:'17.06.2026', titre:'Mode Invisible / Fantôme — scope exact', desc:'Principe validé. Scope : visible pour les Events mais invisible pour les Présences ? Ou totalement invisible ? À décider.'},
        {d:'17.06.2026', titre:'Cooling-off après RDV — 24h ou 48h ?', desc:'David a dit 48h entre deux Clutchs avec la même personne. À confirmer dans le code (actuellement variable non fixée).'},
      ].map(({d,titre,desc})=>(
        <div key={titre} style={{padding:'10px 0',borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
            <div style={{fontSize:12,fontWeight:800,color:C.orange}}>🔄 {titre}</div>
            <Tag label={d} color={C.orange}/>
          </div>
          <div style={{fontSize:11,color:C.dim,lineHeight:1.5}}>{desc}</div>
        </div>
      ))}
    </Card>

    <div style={{padding:'12px 16px',background:`${C.gold}10`,borderRadius:12,border:`1px solid ${C.gold}30`,marginTop:16}}>
      <div style={{fontSize:11,color:C.dim,lineHeight:1.7}}>
        <strong style={{color:C.gold}}>Comment maintenir ce changelog :</strong> À chaque session, si une décision change → ajouter une entrée ici avec date et justification. Si une décision était dans ❌ et est reconsidérée → la déplacer en 🔄 et noter le contexte. Ce log est la mémoire institutionnelle de Clutch.
      </div>
    </div>
  </div>
)

// ─── Section : ROADMAP ───────────────────────────────────────────────────────
const SectionRoadmap = () => (
  <div>
    <H n={1}>🗺 Roadmap</H>

    {[
      {
        phase:'Phase 0 — Fondations', date:'Fait (mai–juin 2026)', color:C.green,
        items:['App complète en prod (app2)','Flow Clutch / Verrou / J\'y suis','Bot GPS Max test','Contre-Clutch','Score fiabilité basique','Events groupe','Système Manoski multi-modes','Mode Pro catégories métiers'],
        done:true,
      },
      {
        phase:'Phase 1 — Stabilisation beta', date:'Juillet 2026', color:C.gold,
        items:['Feedback obligatoire (app flou)','Notif GPS J\'y suis','Score fiabilité multi-dimensions','Anti-spam 3 crédits/jour hommes','Mode Invisible (fantôme)','TestFlight iOS','Push notifications OneSignal','Cleanup total code (supprimer mocks/bots QG)'],
        done:false,
      },
      {
        phase:'Phase 2 — Croissance', date:'Août–Septembre 2026', color:C.blue,
        items:['Mission du Jour','Golden Hour / Fenêtres magiques','Mode Duo (2 femmes)','Masque progressif','Traces éphémères','Partenaires bars Lausanne','Lancement EPFL/UNIL rentrée','App Store iOS + Google Play'],
        done:false,
      },
      {
        phase:'Phase 3 — Expansion', date:'2027', color:C.purple,
        items:['Mode Parents complet','Mode Covoiturage','Cartes secrètes de la ville','Genève + Berne + Zurich','Cercle de recommandations Pro','Match vocal instantané','Énergie sociale (humeur du moment)','Revenue bars partenaires'],
        done:false,
      },
    ].map(p=>(
      <Card key={p.phase} color={p.color} glow={p.done}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <H n={2} c={p.color}>{p.phase}</H>
          <Tag label={p.date} color={p.color}/>
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
          {p.items.map(i=><Pill key={i} label={i} done={p.done}/>)}
        </div>
      </Card>
    ))}

    <Card>
      <H n={2}>⏱ Estimation temps (sessions Claude)</H>
      {[
        {f:'Feedback obligatoire complet', t:'1 session'},
        {f:'TestFlight iOS setup', t:'2 sessions'},
        {f:'Mission du Jour', t:'1 session'},
        {f:'Golden Hour / Traces éphémères', t:'1 session'},
        {f:'Mode Duo', t:'1 session'},
        {f:'App Store public', t:'3 sessions'},
        {f:'Expansion Genève', t:'2 sessions'},
      ].map(({f,t})=>(
        <div key={f} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${C.border}`}}>
          <span style={{fontSize:12,color:C.mid}}>{f}</span>
          <Tag label={t} color={C.gold}/>
        </div>
      ))}
    </Card>
  </div>
)

// ─── Section : AUDIT GPT ─────────────────────────────────────────────────────
const SectionGPT = () => (
  <div>
    <H n={1}>🔮 Audit GPT-4 — Scores & Constitution</H>

    <Card color={C.gold} glow>
      <H n={2}>📊 Scores GPT — Clutch v2</H>
      <P dim>Audit réalisé le 16.06.2026 sur demande de David. Note globale exceptionnelle.</P>
      <Score label="Vision produit" val={9.5}/>
      <Score label="Différenciation marché" val={9}/>
      <Score label="Sécurité femmes" val={8.5}/>
      <Score label="UX / Expérience" val={8}/>
      <Score label="Défensibilité (fossé)" val={8}/>
      <Score label="Légal CH" val={7}/>
      <Score label="Simplicité Apple" val={6.5} color={C.orange}/>
      <div style={{marginTop:12,padding:'10px 14px',background:`${C.gold}12`,borderRadius:10,borderLeft:`3px solid ${C.gold}`}}>
        <P dim>Note : La simplicité Apple (6.5) est le principal point d'amélioration selon GPT. Trop de features visibles → complexifier la perception. Solution : masquer la complexité, montrer la simplicité.</P>
      </div>
    </Card>

    <Card color={C.salmon} glow>
      <H n={2} c={C.salmon}>📜 Constitution Produit — 7 Règles Sacrées (GPT)</H>
      <P dim>Ces règles ne peuvent jamais être violées, quelle que soit la pression commerciale.</P>
      {[
        {n:'1', rule:'La vraie vie avant le numérique', desc:'Chaque feature doit mener à un RDV physique réel, pas prolonger l\'engagement in-app.'},
        {n:'2', rule:'Un Clutch doit pouvoir être compris en 2 secondes', desc:'Si quelqu\'un doit lire 3 écrans pour comprendre, c\'est trop compliqué.'},
        {n:'3', rule:'La sécurité avant la croissance', desc:'Si une feature augmente le risque pour les femmes, elle ne sort pas. Même si elle booste les chiffres.'},
        {n:'4', rule:'La spontanéité avant l\'optimisation', desc:'Ne pas transformer Clutch en app de planification. La contrainte 18h est structurelle.'},
        {n:'5', rule:'Une femme ne doit jamais se sentir submergée', desc:'Le système de file d\'attente, les crédits, le shadow downgrade — tout sert cette règle.'},
        {n:'6', rule:'L\'algorithme récompense les comportements sains', desc:'Pas le temps passé dans l\'app. Pas les clics. Les vraies rencontres réussies.'},
        {n:'7', rule:'Plus de rencontres réelles, moins de temps d\'écran', desc:'La métrique nord. Si une feature augmente le temps d\'écran sans augmenter les Verrous → la supprimer.'},
      ].map(({n,rule,desc})=>(
        <div key={n} style={{padding:'10px 0',borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:'flex',gap:10}}>
            <div style={{width:24,height:24,borderRadius:12,background:`${C.salmon}20`,border:`1px solid ${C.salmon}40`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:900,color:C.salmon,flexShrink:0}}>{n}</div>
            <div>
              <div style={{fontSize:12,fontWeight:800,color:C.white,marginBottom:3}}>{rule}</div>
              <div style={{fontSize:11,color:C.dim}}>{desc}</div>
            </div>
          </div>
        </div>
      ))}
    </Card>

    <Card color={C.green}>
      <H n={2} c={C.green}>✅ Ce que GPT a validé dans Clutch</H>
      {[
        'Concept core (disponibilité 18h + Verrou) — unique et défendable',
        'Vocabulaire Clutch/Verrou/Présences — créateur de culture',
        'Prix égaux — features premium différenciées par usage naturel (pas par genre)',
        'Score Lapin -5pts — friction utile et différenciante',
        'Mode Pro avec catégories métiers — LinkedIn du monde réel',
        'GPS J\'y suis — vérification réelle vs engagement digital',
        'Feedback double-blind 3h après — réputation réelle impossible à faker',
        'Vision "système d\'exploitation des rencontres spontanées"',
      ].map(f=><Pill key={f} label={f} done/>)}
    </Card>

    <Card color={C.orange}>
      <H n={2} c={C.orange}>⚠️ Points d'amélioration selon GPT</H>
      {[
        'Simplicité Apple — trop de features visibles simultanément',
        'Légal CH — LPD à formaliser avant App Store public',
        'Consentement progressif — ne pas tout demander au lancement',
        'Anti-harcèlement avancé — shadow downgrade à coder',
        'Réputation multi-dimensions — un seul chiffre trop réducteur',
        'KPI clé manquant — mesurer les "rencontres réussies" concrètement',
      ].map(f=><Pill key={f} label={f} color={C.orange}/>)}
    </Card>

    <Card>
      <H n={2}>🧠 Auto-audit 7 angles — Règle d'or avant chaque feature</H>
      {[
        {n:'1. Légal', q:'LPD suisse, responsabilité civile, RGPD si EU'},
        {n:'2. Éthique', q:'Consentement, sécurité femmes, anti-dark-patterns, anti-addiction'},
        {n:'3. Faisabilité', q:'MVP maintenant vs Phase 2'},
        {n:'4. Scalabilité', q:'Fonctionne hors Lausanne/Suisse ?'},
        {n:'5. Ergonomie', q:'Friction utile vs inutile, UX femme 18–35'},
        {n:'6. Business', q:'Cohérence freemium/premium CHF 19.90'},
        {n:'7. Challenger', q:"Qu'est-ce qui pourrait mal tourner ?"},
      ].map(({n,q})=>(
        <div key={n} style={{display:'flex',gap:10,padding:'7px 0',borderBottom:`1px solid ${C.border}`}}>
          <span style={{fontSize:11,fontWeight:800,color:C.gold,width:80,flexShrink:0}}>{n}</span>
          <span style={{fontSize:11,color:C.mid}}>{q}</span>
        </div>
      ))}
    </Card>
  </div>
)

// ─── Section : SPRINT BOARD ──────────────────────────────────────────────────
const SectionSprint = () => (
  <div>
    <H n={1}>📋 Sprint Board — État réel des tâches</H>
    <Card color={C.red} glow>
      <H n={2} c={C.red}>🚨 CRITIQUE App Store — Bloquants</H>
      {[
        {t:'Edge Function Supabase delete-account',s:'todo',desc:'Supprime auth.users avec service role key. ~30min de code.'},
        {t:'Icône app 1024×1024',s:'todo',desc:'Mel → Illustrator → SVG export → Capacitor assets'},
        {t:'npx cap add ios',s:'todo',desc:'David → besoin Xcode sur son Mac → TestFlight → App Store'},
        {t:'Suppression compte v1 (modal 2 étapes + LPD)',s:'done',desc:'Anonymisation dans /app2. Fait.'},
      ].map(({t,s,desc})=>(
        <div key={t} style={{padding:'8px 0',borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
            <span style={{fontSize:11,fontWeight:700,color:s==='done'?C.green:C.red}}>{s==='done'?'✅':'❌'} {t}</span>
          </div>
          <div style={{fontSize:11,color:C.dim}}>{desc}</div>
        </div>
      ))}
    </Card>

    <Row>
      <Card color={C.green}>
        <H n={2} c={C.green}>✅ Codé & déployé</H>
        {['Onboarding 4 slides + wizard','Carte Lausanne étoiles animées','Molette heure dispo','Filtre genre + Manoski','Bot GPS Max Morges Gare','Contre-Clutch bottom sheet','J\'y suis GPS 100m','Terminer conditionné','Badge event Présences','Mode Pro catégories','SOS + countdown','Score fiabilité Lapin -5pts','Realtime multi-channels','Gate system 2 points','Profil edit + delete','Events groupe','ProximityRadar V1','Feedback post-RDV (partiel)'].map(f=><Pill key={f} label={f} done/>)}
      </Card>
      <Card color={C.orange}>
        <H n={2} c={C.orange}>🔧 À coder (priorité)</H>
        {['App flou si feedback pending','GPS notif — l\'autre est arrivé','Feedback obligatoire 3h complet','Events inscrits dans Clutchs tab','Shadow downgrade anti-creep','Anti-spam 3 crédits/jour','Fiabilité V2 multi-dimensions','Mode Invisible / Fantôme','Mode Duo (2 femmes)','Edge Function delete-account','Icône 1024px (Mel)','TestFlight iOS (Xcode)','Push OneSignal'].map(f=><Pill key={f} label={f}/>)}
      </Card>
    </Row>

    <Card>
      <H n={2}>📊 8 catégories de tâches — Vue macro</H>
      {[
        {cat:'App Web Core',done:85,total:100,color:C.green},
        {cat:'Géolocalisation',done:60,total:80,color:C.teal},
        {cat:'Fiabilité & Feedback',done:40,total:100,color:C.orange},
        {cat:'Sécurité',done:55,total:80,color:C.gold},
        {cat:'Premium',done:20,total:60,color:C.blue},
        {cat:'App Native (iOS/Android)',done:10,total:100,color:C.purple},
        {cat:'Infrastructure',done:70,total:80,color:C.green},
        {cat:'Marketing & Growth',done:15,total:60,color:C.salmon},
      ].map(({cat,done,total,color})=>(
        <div key={cat} style={{marginBottom:10}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
            <span style={{fontSize:12,color:C.white,fontWeight:600}}>{cat}</span>
            <span style={{fontSize:11,color:C.dim}}>{done}/{total}</span>
          </div>
          <div style={{height:5,background:'rgba(255,255,255,.08)',borderRadius:3}}>
            <div style={{height:'100%',width:`${(done/total)*100}%`,background:color,borderRadius:3}}/>
          </div>
        </div>
      ))}
    </Card>

    <Card color={C.blue}>
      <H n={2} c={C.blue}>🔧 Bugs corrigés — Session 14.06</H>
      {[
        'Badges notifications superposées (count 7 au lieu de 2)',
        'Compteur clutchs actifs uniquement (exclure annulés)',
        'Cohérence couleurs card↔tab (jaune/or)',
        'Supabase .update() silencieux → upsert fallback',
        'Realtime 1 filtre/channel → multi-channels séparés',
        'Bot GPS "n\'est plus disponible" → bypass isGpsBot',
        'Terminer double IIFE syntax error → IIFE unique propre',
        'Position:fixed iOS Safari freeze → minHeight:0 flex',
      ].map(f=><Pill key={f} label={f} done/>)}
    </Card>
  </div>
)

// ─── Section : RADAR ─────────────────────────────────────────────────────────
const SectionRadar = () => (
  <div>
    <H n={1}>📡 ProximityRadar V2 — Spec complète</H>
    <P>Spec issue du test terrain 16.06. Remplace la V1 linéaire.</P>

    <Card color={C.gold} glow>
      <H n={2}>🎯 Philosophie du radar</H>
      <P>Le ProximityRadar n'est pas un indicateur. C'est une <strong style={{color:C.gold}}>expérience émotionnelle</strong>. L'approche physique doit créer une tension montante — comme dans un jeu — qui culminate dans l'animation de fermeture du Verrou.</P>
      <P dim>Références visuelles : vumètre · sonar · orbes qui s'attirent · battement cardiaque · Verrou qui se referme progressivement</P>
    </Card>

    <Card>
      <H n={2}>📐 Architecture 2 zones</H>
      <Row>
        <Card color={C.orange}>
          <H n={2} c={C.orange}>Zone 1 — 300m → 50m</H>
          <P>Radar Doppler visuel. Traînée lumineuse. Clignotement accéléré à mesure qu'on se rapproche.</P>
          <P>Cap distance affiché à 300m max (pas de "1.2km").</P>
          <Idea emoji="🌊" title="Effet Doppler" desc="La fréquence du pulse augmente avec la proximité. À 300m = 1 pulse/2s. À 50m = 1 pulse/0.4s."/>
          <Idea emoji="💫" title="Traînée lumineuse" desc="La position de l'autre laisse une traînée qui s'efface en 2s. Montre le mouvement."/>
        </Card>
        <Card color={C.green}>
          <H n={2} c={C.green}>Zone 2 — 50m → 0m</H>
          <P>Photos des deux personnes s'éclaircissent progressivement et glissent vers le centre.</P>
          <P>3 sous-zones non-linéaires :</P>
          <Idea emoji="🟡" title="50m–20m" desc="Photos s'éclaircissent. Légère vibration haptique toutes les 30s."/>
          <Idea emoji="🟠" title="20m–5m" desc="Photos glissent vers le centre. Animation d'attraction magnétique."/>
          <Idea emoji="🔴" title="5m–0m" desc="Photos au centre. Battement cardiaque. Prêt pour J'y suis."/>
        </Card>
      </Row>
    </Card>

    <Card color={C.blue}>
      <H n={2} c={C.blue}>🔒 J'y suis — Séquence finale</H>
      <Idea emoji="📍" title="Lock photo au centre" desc="Quand J'y suis cliqué → photo se locke au centre, GPS s'arrête (LPD)." badge="✅ Codé"/>
      <Idea emoji="👥" title="Quand les deux ont cliqué" desc="Animation fermeture Verrou — les deux photos fusionnent → écran 'VOUS ÊTES LÀ' → timer 2h démarre." badge="À coder"/>
      <Idea emoji="🐇" title="Auto-lapin 30min" desc="Si GPS détecte que quelqu'un n'est pas là 30min après l'heure → proposition automatique Annuler (lapin)." badge="À coder"/>
    </Card>

    <Card color={C.purple}>
      <H n={2} c={C.purple}>🚫 Ce qu'on ne fait PAS</H>
      {[
        'Texte superflu ("Il est à 124m de toi") — l\'animation dit tout',
        'Fallback en % de progression — trop froid, trop numérique',
        'Afficher la distance exacte GPS en temps réel — LPD + inutile',
        'Animation identique à toutes les distances — manque de tension',
      ].map(f=><Pill key={f} label={f} color={C.red}/>)}
    </Card>

    <Card>
      <H n={2}>📱 Post-RDV — Historique profil</H>
      <P>Après chaque RDV fermé : une ligne discrète apparaît dans l'historique du profil.</P>
      <P dim>"Rencontré le 17.06 à l'Hôtel des Postes" — visible seulement par soi-même. Pas public.</P>
      <P dim>Si les deux ont un feedback positif → option "ajouter aux Présences favorites" (Invisible inverse : toujours visible l'un à l'autre).</P>
    </Card>
  </div>
)

// ─── Section : BRAINSTORM ────────────────────────────────────────────────────
const SectionBrainstorm = () => (
  <div>
    <H n={1}>🎲 Brainstorm — Toutes les idées (modes + fiabilité)</H>
    <P>Source : session 16.06 — brainstorm "Manoski" complet.</P>

    <Card color={C.salmon} glow>
      <H n={2} c={C.salmon}>💕 Mode Romantique — 10 idées</H>
      <Idea emoji="🌫" title="Aperçu flou progressif" desc="La photo se dévoile progressivement : d'abord silhouette → flou → net. Réduit le jugement superficiel instantané." badge="⭐⭐⭐"/>
      <Idea emoji="🌙" title="Mood du soir" desc="Avant de se mettre dispo : 'Comment tu te sens ce soir ?' (aventureux / calme / bavard / fête). Le matching inclut le mood." badge="⭐⭐⭐"/>
      <Idea emoji="👻" title="Mode fantôme" desc="Je suis dispo mais invisible pour tous sauf les personnes que j'invite directement." badge="⭐⭐"/>
      <Idea emoji="🎭" title="Clutch anonyme" desc="Premier message envoyé sans voir la photo. Seulement prénom + activité + 10s de voix." badge="⭐⭐"/>
      <Idea emoji="⭐" title="1 Super-Clutch/semaine" desc="Une fois par semaine : Clutch prioritaire qui passe devant la file d'attente. Valeur premium." badge="⭐⭐"/>
      <Idea emoji="🏅" title="Badge 'Sorti X fois'" desc="Profil affiche '12 rencontres réussies' — visible. Attire les gens qui cherchent quelqu'un d'actif." badge="⭐⭐"/>
      <Idea emoji="🔒" title="Protection zone" desc="'Je ne veux pas voir les gens qui habitent dans un rayon de 200m' — discrétion quartier." badge="⭐"/>
      <Idea emoji="🔄" title="Transparence 2ème tentative" desc="Si tu as déjà Clutché quelqu'un sans succès → indication subtile. Évite insistance." badge="⭐⭐"/>
      <Idea emoji="⏸" title="Pause invisible" desc="Mode 'je suis là mais pas pour les rencontres ce soir' — visible pour les Events, invisible pour les Présences." badge="⭐⭐"/>
      <Idea emoji="✅" title="Validation lieux par femmes" desc="Lieux suggérés notés par les femmes. Un café avec note faible disparaît des suggestions." badge="⭐⭐⭐"/>
    </Card>

    <Card color={C.blue}>
      <H n={2} c={C.blue}>🤗 Mode Amical — 10 idées</H>
      <Idea emoji="🎯" title="Activité obligatoire" desc="En mode amical : impossible d'envoyer un Clutch sans proposer une activité précise (échecs / run / apéro / expo)." badge="⭐⭐⭐"/>
      <Idea emoji="👥" title="Groupe 3–5 personnes" desc="Mode amical permet de créer un Clutch collectif. 'Qui veut jouer aux échecs à 3 ce soir ?'" badge="⭐⭐"/>
      <Idea emoji="🎲" title="Activités aléatoires" desc="'Surprends-moi' → l'app suggère une activité en cours près de toi avec des gens dessus." badge="⭐⭐"/>
      <Idea emoji="💬" title="Pas de filtre genre" desc="Mode amical = genre non affiché par défaut. On cherche une connexion, pas un profil." badge="⭐⭐⭐"/>
      <Idea emoji="🏆" title="Leaderboard activités" desc="'Top 5 des activités les plus Clutchées cette semaine à Lausanne'. Inspire l'action." badge="⭐"/>
      <Idea emoji="📅" title="Récurrent possible" desc="'Je joue aux échecs chaque mercredi soir — qui veut me rejoindre ?' Format semi-récurrent." badge="⭐⭐"/>
      <Idea emoji="🎪" title="Events impromptus" desc="Créer un mini-event en 20s depuis l'onglet Amical. Pas besoin d'être dans Events." badge="⭐⭐"/>
      <Idea emoji="🤝" title="Réseau d'activités" desc="Après plusieurs Clutchs amicaux : 'Tu as rencontré 4 joueurs d'échecs. Créer un cercle ?' → groupe fermé." badge="⭐⭐"/>
      <Idea emoji="📍" title="Activité du moment visible" desc="Sur le profil : '♟ Échecs au bord du lac ce soir' — visible 8h. Attire les mêmes." badge="⭐⭐⭐"/>
      <Idea emoji="🌡" title="Niveau d'énergie social" desc="'Calme / Modéré / Fête' — filtre pour trouver des gens avec la même énergie." badge="⭐⭐⭐"/>
    </Card>

    <Card color={C.orange}>
      <H n={2} c={C.orange}>📊 Score Fiabilité V2 — Pénalité avancée</H>
      <P>La V2 introduit une pénalité <strong style={{color:C.white}}>proportionnelle à la proximité temporelle × la récidive</strong>.</P>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
          <thead>
            <tr>
              {['Action','Points base','Multiplicateur récidive','Multiplicateur timing'].map(h=>(
                <th key={h} style={{padding:'6px 10px',borderBottom:`1px solid ${C.border}`,color:C.gold,fontWeight:700,textAlign:'left'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              {a:'À l\'heure (GPS vérifié)',b:'+2',r:'×1',t:'×1'},
              {a:'Venu·e (feedback positif)',b:'+1',r:'×1',t:'×1'},
              {a:'Annuler > 2h avant',b:'-1',r:'×1 (1ère fois) / ×1.5 (récidive)',t:'×1'},
              {a:'Annuler < 2h avant',b:'-3',r:'×1.5 / ×2',t:'×1.5'},
              {a:'Lapin (pas venu, pas prévenu)',b:'-5',r:'×2 / ×3',t:'×2 si < 30min avant RDV'},
              {a:'Insécurité signalée',b:'-10',r:'×3',t:'×3 — review manuelle'},
            ].map(({a,b,r,t})=>(
              <tr key={a} style={{borderBottom:`1px solid ${C.border}`}}>
                <td style={{padding:'6px 10px',color:C.white,fontSize:11}}>{a}</td>
                <td style={{padding:'6px 10px',color:b.startsWith('+')?C.green:C.red,fontWeight:700}}>{b}</td>
                <td style={{padding:'6px 10px',color:C.mid,fontSize:10}}>{r}</td>
                <td style={{padding:'6px 10px',color:C.mid,fontSize:10}}>{t}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <P dim>4 niveaux affichés : Nouveau (0–25) · Fiable (26–50) · Très fiable (51–75) · Exemplaire (76+). Jamais le score exact.</P>
    </Card>

    <Card color={C.purple}>
      <H n={2} c={C.purple}>🔄 Contre-Clutch & Contre-RDV — Features récupérées</H>
      <Idea emoji="↩️" title="Contre-Clutch" desc="Réponse du receveur : 'Je préfère un autre lieu/heure'. Bottom sheet avec venue/time/message. Décline l'original + envoie nouveau Clutch." badge="✅ Codé"/>
      <Idea emoji="✏️" title="Contre-RDV (modifier lors acceptation)" desc="Au moment d'accepter un Clutch : option de proposer un ajustement de lieu ou d'heure. Pas encore codé." badge="À coder"/>
      <Idea emoji="⚠️" title="Alerte crédibilité distance/temps" desc="Si le GPS du receveur est à 25min de marche du lieu proposé dans 10min → alerte discrète : 'Attention, tu es à 25min de [lieu]'. Prévient les lapins involontaires." badge="À coder"/>
      <Idea emoji="📍" title="Modifier lieu en cours de Verrou" desc="Pendant un Verrou actif : demander un changement de lieu avec accord mutuel des deux." badge="À coder"/>
    </Card>

    <Card>
      <H n={2}>💡 30 catégories métiers — Mode Pro</H>
      <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
        {['Développeur/tech','Designer/créatif','Photographe','Vidéaste','Marketeur','Consultant','Avocat/juridique','Médecin/santé','Architecte','Ingénieur','Professeur/coach','Musicien','Journaliste','Chef/cuisine','Artiste','Freelance','Entrepreneur','Étudiant EPFL','Étudiant UNIL','Finance/banque','RH/recrutement','Chercheur','Traducteur','Artisan','Plombier/électricien','Kiné/sport','Acteur/théâtre','Infirmier/paraméd','Communication','Autre métier manuel'].map(m=>(
          <span key={m} style={{fontSize:10,padding:'3px 8px',borderRadius:12,background:C.card2,border:`1px solid ${C.border}`,color:C.mid}}>{m}</span>
        ))}
      </div>
    </Card>
  </div>
)

// ─── Section : DANGER ────────────────────────────────────────────────────────
const SectionDanger = () => (
  <div>
    <H n={1}>🔥 Danger — Alerte compétition</H>
    <div style={{background:`${C.red}15`,border:`2px solid ${C.red}40`,borderRadius:14,padding:'16px',marginBottom:16}}>
      <div style={{fontSize:15,fontWeight:900,color:C.red,marginBottom:6}}>⚠️ ALERTE COMPÉTITION — DANGER RÉEL</div>
      <P>Les géants ont les ressources pour copier n'importe quelle feature en 3 mois. La fenêtre de domination est de <strong style={{color:C.white}}>6–12 mois</strong>. Chaque semaine compte.</P>
    </div>

    <Card color={C.red} glow>
      <H n={2} c={C.red}>💀 5 Menaces identifiées</H>
      {[
        {n:'1',m:'Tinder/Bumble ajoutent un mode "disponible maintenant"',desc:'Ils ont 75M d\'utilisateurs. Si Hinge ou Bumble lance "disponible maintenant" avec localisation → effet immédiat sur notre acquisition. Probabilité : élevée dans 12-18 mois.'},
        {n:'2',m:'Hinge lance les "micro-événements"',desc:'Hinge teste déjà les "Date Night" (événements curatés). Extension naturelle vers les events spontanés. Ressources : infinies.'},
        {n:'3',m:'Fever / Eventbrite pivotent vers le spontané',desc:'Fever a déjà les partenariats lieux. Ajouter "je suis dispo maintenant" est un pivot de 3 mois pour eux.'},
        {n:'4',m:'WhatsApp / Instagram ajoutent "disponible pour un café"',desc:'Meta a les profils, la géolocalisation, les contacts. Un statut "dispo maintenant" dans WhatsApp = Clutch mort instantanément.'},
        {n:'5',m:'Startup bien financée copie le concept',desc:'Une seed de $2M à San Francisco peut reproduire Clutch en 6 mois avec meilleur design et budget marketing. Risque constant.'},
      ].map(({n,m,desc})=>(
        <div key={n} style={{padding:'10px 0',borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:12,fontWeight:800,color:C.red,marginBottom:3}}>⚡ {m}</div>
          <div style={{fontSize:11,color:C.dim,lineHeight:1.6}}>{desc}</div>
        </div>
      ))}
    </Card>

    <Card color={C.green} glow>
      <H n={2} c={C.green}>🛡 6 Protections à verrouiller immédiatement</H>
      {[
        {p:'Marque IGE déposée',desc:'CLUTCH en classes 38+45. CHF 550. À faire avant toute communication publique.', done:false},
        {p:'Culture du vocabulaire (Clutch/Verrou)',desc:'Déjà lancé. Amplifier : chaque communication utilise CE vocabulaire. Les users doivent parler "Clutch" naturellement.', done:true},
        {p:'Réseau partenaires bars Lausanne',desc:'Exclusivités locales. 5 bars signés = barrière à l\'entrée. Un concurrent ne peut pas avoir ça en day 1.', done:false},
        {p:'Score fiabilité — données impossible à faker',desc:'Chaque Lapin, chaque J\'y suis = données réelles. Un concurrent part de zéro. Notre historique a de la valeur intrinsèque.', done:true},
        {p:'Community EPFL/UNIL — effet réseau dense',desc:'100 users dans le même campus > 10 000 users dispersés. La densité locale est incopiable rapidement.', done:false},
        {p:'Mission du Jour — expérience unique',desc:'Si on la lance avant qu\'un concurrent pense à ça, on crée une habitude. L\'habitude est le meilleur fossé.', done:false},
      ].map(({p,desc,done})=>(
        <div key={p} style={{padding:'10px 0',borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:'flex',alignItems:'flex-start',gap:8}}>
            <span style={{fontSize:14,flexShrink:0}}>{done?'✅':'🔲'}</span>
            <div>
              <div style={{fontSize:12,fontWeight:800,color:done?C.green:C.white,marginBottom:3}}>{p}</div>
              <div style={{fontSize:11,color:C.dim,lineHeight:1.6}}>{desc}</div>
            </div>
          </div>
        </div>
      ))}
    </Card>

    <Card color={C.gold}>
      <H n={2}>⏱ Fenêtre de domination</H>
      <P>Estimation : <strong style={{color:C.gold}}>6–12 mois</strong> avant qu'un concurrent sérieux réplique le concept core.</P>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginTop:12}}>
        {[
          {t:'Maintenant',d:'J1–J90',a:'Beta EPFL/UNIL + 3 bars Lausanne. 200 users actifs. Preuve de concept.'},
          {t:'Court terme',d:'M3–M6',a:'App Store. 500 users. Presse suisse romande. IGE déposé.'},
          {t:'Moyen terme',d:'M6–M12',a:'1 000 users. Genève lancé. Mission du Jour actif. Partenariats.'},
        ].map(({t,d,a})=>(
          <div key={t} style={{background:C.card2,borderRadius:10,padding:'10px 12px'}}>
            <div style={{fontSize:12,fontWeight:800,color:C.gold,marginBottom:2}}>{t}</div>
            <div style={{fontSize:10,color:C.dim,marginBottom:6}}>{d}</div>
            <div style={{fontSize:10,color:C.mid,lineHeight:1.5}}>{a}</div>
          </div>
        ))}
      </div>
    </Card>
  </div>
)

// ─── Section : PRINCIPES ─────────────────────────────────────────────────────
const SectionPrincipes = () => (
  <div>
    <H n={1}>🎯 Principes — L'âme de Clutch</H>
    <P>Source : onglet "Principes" du QG + décisions de session en session. Ces principes ne votent pas, ils gouvernent.</P>

    {[
      {
        icon:'❤️', title:'L\'âme de Clutch',color:C.gold,
        items:[
          'Clutch n\'est pas une app de rencontres. C\'est une app de présence spontanée vérifiée dans le monde réel.',
          'Le swipe crée de l\'espoir. Le Verrou crée de l\'engagement. Ce n\'est pas la même chose.',
          'La contrainte 18h n\'est pas un bug. C\'est le produit. Elle force l\'action ou force la sortie.',
          'Les app de dating vivent de votre addiction. Clutch vit de vos rencontres réussies. Intérêts alignés.',
          'Clutch réussit quand les gens se voient en vrai. Toute feature qui augmente le temps d\'écran sans augmenter les Verrous est un échec.',
          'Un Clutch raté (lapin) est utile : il éduque les deux parties et nourrit le score fiabilité.',
        ]
      },
      {
        icon:'👩', title:'Femmes au cœur — non négociable',color:C.salmon,
        items:[
          'Les femmes sont le centre gravitationnel. Sans elles, les hommes partent dans les 2 semaines.',
          'Prix égaux pour tous. Les features premium se différencient par usage naturel — personne n\'est traité comme un produit.',
          'L\'expérience femme doit être testée à chaque feature : "Femme 23 ans, Lausanne, seule le soir — elle se sent comment ?"',
          'Les hommes attendent. Les femmes choisissent. Le système est conçu pour ça.',
          'Chaque feature anti-spam, anti-creep, de sécurité est une feature product, pas un coût.',
          'Le mode Invitation Seulement (invisible mais recevoir des clutchs filtrés) est le plafond de contrôle à donner.',
        ]
      },
      {
        icon:'🔴', title:'Sécurité malveillance — challenger obligatoire',color:C.red,
        items:[
          'Avant chaque feature : "Que fait un homme qui veut harceler avec ça ?"',
          'Avant chaque feature : "Que fait quelqu\'un avec 50 faux comptes ?"',
          'Avant chaque feature : "Peut-on extraire les positions GPS de tous les users ?"',
          'La réponse "rien ne l\'en empêche" = on ne code pas avant d\'avoir la protection.',
          'Shadow downgrade : profil perd de la visibilité sans savoir pourquoi. Jamais de score public de "mauvais comportement".',
          'GPS = zone de disponibilité choisie. JAMAIS position temps-réel. LPD suisse.',
        ]
      },
      {
        icon:'📱', title:'App Store — préparer maintenant',color:C.blue,
        items:[
          'Apple Review = 1-3 jours. Google Play = 24h. Tout ce qui nécessite une soumission doit être préparé en avance.',
          'Icône 1024×1024 (Mel) + description EN/FR/DE + screenshots 6.5" requis.',
          'Pas de références aux concurrents dans l\'App Store description (Apple bannit).',
          'Capacitor appId : app.clutch.lausanne — ne jamais changer après soumission.',
          'TestFlight d\'abord (10 000 testeurs max) avant App Store public.',
          'Après App Store : Capgo pour les updates JS sans re-soumission.',
        ]
      },
      {
        icon:'✨', title:'Beau et donner envie — règle créativité',color:C.teal,
        items:[
          '"Est-ce que quelqu\'un montrerait cet écran à un ami en disant \'regarde c\'est cool\' ?" Si non → retravailler.',
          'Animations subtiles > icônes statiques. Feedback haptique > feedback visuel seul.',
          'Références : Spotify (fluidité) + Duolingo (fun sans être puéril) + jeux (tension + récompense).',
          'Chaque micro-interaction = opportunité de créer de la dopamine éthique vers un vrai RDV.',
          'Le ProximityRadar doit être une expérience mémorable. Pas un indicateur de progression.',
          'La palette (prune + pêche + or) EST l\'identité. Jamais inventer de nouvelles couleurs.',
        ]
      },
      {
        icon:'⚖️', title:'Légal suisse LPD — non contournable',color:C.orange,
        items:[
          'GPS = donnée sensible en droit suisse. Consentement explicite obligatoire à chaque collecte.',
          'On stocke "zone de disponibilité choisie", pas la position exacte.',
          'fuzzPosition() = décalage max 50m basé sur userId hash. Protection LPD + anti-stalking.',
          'Droit à l\'effacement : suppression compte = anonymisation immédiate de toutes les données GPS.',
          'Pour l\'expansion EU : RGPD s\'applique dès qu\'un utilisateur est en France/Allemagne/Italie.',
          'Consulter un avocat CH avant App Store public. Budget : CHF 1 000–2 000.',
        ]
      },
      {
        icon:'👁', title:'Vision Apple — Complexité invisible',color:C.purple,
        items:[
          '"Complexité à l\'intérieur, simplicité à l\'extérieur." — règle Apple permanente.',
          'L\'utilisateur ne doit jamais voir l\'algo anti-spam. Il voit juste moins de clutchs de mauvaise qualité.',
          'La femme ne doit jamais savoir qu\'elle est dans une file d\'attente intelligente. Elle voit juste 3 bons profils.',
          'Le shadow downgrade est invisible. L\'homme voit juste moins de réponses. Il ne sait pas pourquoi.',
          'Le score fiabilité est affiché en 4 niveaux. Jamais le chiffre exact.',
          'Plus on cache la complexité, plus l\'app paraît "magique". La magie fidélise.',
        ]
      },
    ].map(({icon,title,color,items})=>(
      <Card key={title} color={color}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
          <span style={{fontSize:22}}>{icon}</span>
          <H n={2} c={color}>{title}</H>
        </div>
        <ul style={{margin:0,paddingLeft:16}}>
          {items.map(item=>(
            <li key={item} style={{fontSize:12,color:C.mid,lineHeight:1.75,marginBottom:4}}>{item}</li>
          ))}
        </ul>
      </Card>
    ))}
  </div>
)

// ─── Section : QUESTIONS OUVERTES ────────────────────────────────────────────
const SectionQuestions = () => (
  <div>
    <H n={1}>❓ Questions ouvertes — Non résolues</H>
    <P dim>Ces questions viennent du QG (onglet Questions) et des sessions de travail. Certaines ont une piste de réponse, d'autres attendent une décision.</P>

    <Card color={C.salmon} glow>
      <H n={2} c={C.salmon}>👩 Sécurité & Femmes</H>
      {[
        {q:'Saturation Clutchs : une femme attractive peut recevoir 50+ demandes/jour. Comment éviter l\'anxiété ?',r:'Réponse provisoire : file d\'attente intelligente (3 meilleurs, renouvelés toutes les heures). Feedback GPT : validé ⭐⭐⭐'},
        {q:'Anti-harcèlement après refus : si une femme refuse et que l\'homme renvoie 3 fois, que se passe-t-il ?',r:'Pas encore décidé. Option : 48h de blocage automatique après 3 refus d\'une même personne.'},
        {q:'QR code vs GPS pour J\'y suis : le QR code d\'un bar est-il plus fiable que le GPS ?',r:'GPS retenu pour la V1 (100m). QR code = option Phase 2 pour les bars partenaires certifiés.'},
        {q:'Risque "gourous bien-être" : des coachs de vie ou influenceurs qui créent des events pour attirer des followers vulnérables ?',r:'Pas de solution codée. Option : signalement + review manuelle des events > 20 inscrits.'},
      ].map(({q,r})=>(
        <div key={q} style={{padding:'10px 0',borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:11,fontWeight:700,color:C.salmon,marginBottom:4}}>❓ {q}</div>
          <div style={{fontSize:11,color:C.dim,lineHeight:1.6}}>→ {r}</div>
        </div>
      ))}
    </Card>

    <Card color={C.gold}>
      <H n={2}>💡 Produit & Expérience</H>
      {[
        {q:'"Surprise moi" — comment éviter les mauvais matchings aléatoires ?',r:'Algo de compatibilité minimum (score fiabilité > 30 + mode réception compatible) avant d\'activer la Roulette réelle.'},
        {q:'13 activités suggérées dans Clutch : quelles sont-elles ?',r:'Non encore définies. Piste : Apéro / Café / Échecs / Run / Expo / Ciné / Jeux / Balade / Lecture / Concerts / Sport / Cours / Autre.'},
        {q:'Carte des events : doit-on afficher les events sur la carte principale ou onglet séparé ?',r:'Décision retenue : onglet séparé (Events). Présences = personnes. Events = activités.'},
        {q:'Mode activité vs amitié : peut-on avoir une "amitié Clutch" qui n\'implique pas de RDV unique ?',r:'Non encore décidé. Idée : après 3 Clutchs amicaux réussis → option "Cercle" (groupe permanent).'},
        {q:'Tranches d\'âge : faut-il afficher l\'âge sur les profils ?',r:'Affiché actuellement. Question : faut-il un filtre âge par défaut ou laissé ouvert ?'},
        {q:'Genre X : comment gérer les profils non-binaires dans le système de matching ?',r:'Non encore décidé. Option : genre "Autre" visible par tous les modes sauf si filtré explicitement.'},
        {q:'Favoris et Blocage : une femme doit-elle pouvoir "sauvegarder" un profil sans envoyer de Clutch ?',r:'Table user_relations dans le backlog. Pas encore codé.'},
        {q:'Mode Parent : faut-il vérifier les identités ? (vrai parent ou prétexte)',r:'Vérification téléphone déjà en place. Score fiabilité débloque les features sensibles (swap babysitting).'},
      ].map(({q,r})=>(
        <div key={q} style={{padding:'10px 0',borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:11,fontWeight:700,color:C.gold,marginBottom:4}}>❓ {q}</div>
          <div style={{fontSize:11,color:C.dim,lineHeight:1.6}}>→ {r}</div>
        </div>
      ))}
    </Card>

    <Card color={C.blue}>
      <H n={2} c={C.blue}>📊 Scalabilité & Business</H>
      {[
        {q:'Traduction EN : quand lancer la version anglaise ?',r:'Quand on sort de Suisse romande → Zurich ou Genève expat. Traduction des strings = 1 session Claude.'},
        {q:'Nom des comptes certifiés (bars, events officiels) ?',r:'Non décidé. Options : "Partenaire Clutch" / "Lieu Certifié" / "Driver". Driver = compte qui organise.'},
        {q:'Premium peut-il browsser les présences sans être lui-même disponible ?',r:'Non décidé. Option : "Mode Veille" premium — voir les présences sans être visible. Risque : déséquilibre femmes.'},
        {q:'Alerte distance : si le lieu proposé est à 25min et que le RDV est dans 10min ?',r:'Feature "alerte crédibilité distance/temps" dans backlog. Prévient les lapins involontaires.'},
        {q:'Alertes profils inactifs : si quelqu\'un met dispo mais ignore toutes les demandes ?',r:'Non décidé. Option : après 5 ignorés → profil passe en "Sélectif" automatiquement.'},
        {q:'Multi-machine Claude : comment synchroniser le travail entre 2 ordinateurs ?',r:'Git. Même repo cloné. .env.local copié manuellement. Instructions dans stratégie business.'},
      ].map(({q,r})=>(
        <div key={q} style={{padding:'10px 0',borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:11,fontWeight:700,color:C.blue,marginBottom:4}}>❓ {q}</div>
          <div style={{fontSize:11,color:C.dim,lineHeight:1.6}}>→ {r}</div>
        </div>
      ))}
    </Card>

    <Card color={C.teal}>
      <H n={2} c={C.teal}>🔮 Questions philosophiques — À trancher avec Mel</H>
      {[
        {q:'Clutch est-il une app de dating ou une app de présence sociale ?',r:'Les deux — mais la communication doit choisir. Piste : "présence spontanée" pour la presse, "rencontres" pour l\'acquisition.'},
        {q:'Option végan + don 10% associations : cohérent avec le DNA Clutch ?',r:'Idée de David. À valider avec Mel. Impact : différenciation éthique forte mais segmentation de l\'audience.'},
        {q:'Le multi-profil Manoski : un compte ou plusieurs profils séparés ?',r:'Décision : modes sur un seul compte (moins de complexité DB). Profil unique avec mode actif switché.'},
        {q:'Clutch doit-il être local uniquement ou national dès le début ?',r:'Local d\'abord (densité > couverture). Lausanne dense > Suisse dispersée. Expansion ville par ville.'},
      ].map(({q,r})=>(
        <div key={q} style={{padding:'10px 0',borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:11,fontWeight:700,color:C.teal,marginBottom:4}}>🤔 {q}</div>
          <div style={{fontSize:11,color:C.dim,lineHeight:1.6}}>→ {r}</div>
        </div>
      ))}
    </Card>
  </div>
)

// ─── Bloc SQL copiable ────────────────────────────────────────────────────────
const SqlBlock = ({title,desc,sql}:{title:string,desc:string,sql:string}) => {
  const [copied,setCopied] = React.useState(false)
  return (
    <div style={{marginBottom:16,border:`1px solid ${C.border}`,borderRadius:12,overflow:'hidden'}}>
      <div style={{padding:'8px 14px',background:`${C.gold}12`,borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontSize:12,fontWeight:800,color:C.gold}}>{title}</div>
          <div style={{fontSize:10,color:C.dim,marginTop:1}}>{desc}</div>
        </div>
        <button onClick={()=>{navigator.clipboard?.writeText(sql);setCopied(true);setTimeout(()=>setCopied(false),2000)}}
          style={{padding:'4px 12px',borderRadius:20,border:`1px solid ${C.gold}50`,background:copied?C.green:`${C.gold}20`,
            color:copied?'#fff':C.gold,fontSize:10,fontWeight:800,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>
          {copied?'✓ Copié !':'📋 Copier'}
        </button>
      </div>
      <pre style={{margin:0,padding:'10px 14px',fontSize:10.5,lineHeight:1.6,color:C.salmon,background:'#1a0810',overflowX:'auto',whiteSpace:'pre-wrap',wordBreak:'break-all'}}>
        {sql}
      </pre>
    </div>
  )
}

const SectionSQLTests = () => (
  <div>
    <H n={1}>🧪 SQL Tests — Codes Supabase pour les sessions de test</H>
    <QuickResetButtons />
    <P dim>À ouvrir dans Supabase → SQL Editor si les boutons ci-dessus ne suffisent pas.</P>

    <Card color={C.green} glow>
      <H n={2} c={C.green}>⚡ RESET COMPLET — Clutchs + Visibilité (1 clic)</H>
      <P dim>Le reset de début de session. Annule tous les clutchs actifs ET remet tout le monde visible. À utiliser avant chaque test.</P>
      <SqlBlock
        title="Reset complet : clutchs annulés + tout le monde visible"
        desc="Idempotent — sans danger à re-exécuter autant de fois que nécessaire"
        sql={`-- 1. Annuler tous les clutchs actifs\nUPDATE clutches SET status = 'cancelled', updated_at = now()\nWHERE status IN ('confirmed', 'accepted', 'checked_in', 'pending');\n\n-- 2. Remettre tout le monde disponible et visible\nUPDATE profiles\nSET is_available = true,\n    available_until = now() + interval '2 hours',\n    rdv_locked_until = NULL\nWHERE is_available = false OR rdv_locked_until IS NOT NULL;`}
      />
    </Card>

    <Card color={C.orange}>
      <H n={2} c={C.orange}>🔄 Reset clutchs seulement</H>
      <P dim>Annule uniquement les clutchs actifs, sans toucher à la disponibilité.</P>
      <SqlBlock
        title="Reset tous les clutchs actifs"
        desc="Utile avant de recréer un test propre — n'efface pas l'historique"
        sql={`UPDATE clutches SET status = 'cancelled', updated_at = now()\nWHERE status IN ('confirmed', 'accepted', 'checked_in', 'pending');`}
      />
    </Card>

    <Card color={C.salmon}>
      <H n={2} c={C.salmon}>🔓 Reset rdv_locked_until (débloquer un profil)</H>
      <P dim>Si un utilisateur est bloqué et ne peut plus envoyer de Clutch à cause de la limite, réinitialise son verrou.</P>
      <SqlBlock
        title="Débloquer rdv_locked_until pour tous les profils"
        desc="Remet rdv_locked_until à NULL pour tous les profils — les deux comptes de test inclus"
        sql={`UPDATE profiles SET rdv_locked_until = NULL WHERE rdv_locked_until IS NOT NULL;`}
      />
    </Card>

    <Card color={C.blue}>
      <H n={2} c={C.blue}>👀 Voir les clutchs actifs</H>
      <P dim>Pour vérifier l'état de la DB pendant un test en direct.</P>
      <SqlBlock
        title="Voir tous les clutchs non expirés"
        desc="Affiche id, statut, sender_id, receiver_id, heure RDV, J'y suis"
        sql={`SELECT id, status, sender_id, receiver_id, proposed_time,\n       sender_arrived, receiver_arrived, venue, created_at\nFROM clutches\nWHERE status NOT IN ('expired', 'cancelled', 'completed')\nORDER BY created_at DESC\nLIMIT 20;`}
      />
    </Card>

    <Card color={C.green}>
      <H n={2} c={C.green}>🧍 Voir les IDs David & Tafit</H>
      <P dim>Pour retrouver les UUIDs des deux comptes de test quand on a besoin de faire des requêtes ciblées.</P>
      <SqlBlock
        title="IDs des comptes de test"
        desc="Retourne id, name, account_type, reliability_score"
        sql={`SELECT id, name, account_type, reliability_score, is_available, rdv_locked_until\nFROM profiles\nORDER BY created_at ASC\nLIMIT 10;`}
      />
    </Card>

    <Card color={C.purple}>
      <H n={2} c={C.purple}>🔧 Colonnes J'y suis (migration)</H>
      <P dim>À appliquer une seule fois si les colonnes n'existent pas encore. Déjà fait le 17.06.2026.</P>
      <SqlBlock
        title="Ajouter sender_arrived + receiver_arrived"
        desc="Idempotent (IF NOT EXISTS) — sans danger à re-exécuter"
        sql={`ALTER TABLE clutches\n  ADD COLUMN IF NOT EXISTS sender_arrived boolean DEFAULT false,\n  ADD COLUMN IF NOT EXISTS receiver_arrived boolean DEFAULT false;`}
      />
    </Card>

    <Card color={C.teal}>
      <H n={2} c={C.teal}>⚙️ Réparer le trigger clutch_limit (migration)</H>
      <P dim>Corrige l'erreur "column plan does not exist". Déjà appliqué le 17.06.2026 — garder ici pour référence.</P>
      <SqlBlock
        title="Recréer le trigger check_clutch_limit"
        desc="Utilise account_type au lieu de plan — DROP CASCADE puis recréation"
        sql={`DROP TRIGGER IF EXISTS check_clutch_limit_trigger ON clutches;\nDROP TRIGGER IF EXISTS enforce_clutch_limit ON clutches;\nDROP FUNCTION IF EXISTS check_clutch_limit() CASCADE;\n\nCREATE OR REPLACE FUNCTION check_clutch_limit()\nRETURNS trigger LANGUAGE plpgsql AS $$\nDECLARE\n  v_account_type text;\n  v_count int;\nBEGIN\n  SELECT account_type INTO v_account_type FROM profiles WHERE id = NEW.sender_id;\n  IF v_account_type = 'premium' THEN RETURN NEW; END IF;\n  SELECT COUNT(*) INTO v_count FROM clutches\n    WHERE sender_id = NEW.sender_id\n    AND status IN ('pending','confirmed','accepted')\n    AND created_at > now() - interval '24 hours';\n  IF v_count >= 3 THEN\n    RAISE EXCEPTION 'Limite de 3 Clutchs par 24h atteinte';\n  END IF;\n  RETURN NEW;\nEND;\n$$;\n\nCREATE TRIGGER check_clutch_limit_trigger\n  BEFORE INSERT ON clutches\n  FOR EACH ROW EXECUTE FUNCTION check_clutch_limit();`}
      />
    </Card>
  </div>
)

// ─── Section : SYSTÈME DE CONFIANCE (chantier produit n°1) ───────────────────
const SectionConfiance = () => {
  const card = (border:string):React.CSSProperties => ({ background:'#120d1e', borderRadius:16, padding:'18px', marginBottom:14, border:`1px solid ${border}` })
  const h = (t:string,c='#C8860A'):React.CSSProperties => ({ fontSize:14, fontWeight:900, color:c, marginBottom:10, textTransform:'uppercase' as const, letterSpacing:'.05em' })
  const p:React.CSSProperties = { fontSize:13, color:'rgba(232,224,240,.75)', lineHeight:1.7, margin:'0 0 8px' }
  const why:React.CSSProperties = { fontSize:11, color:'rgba(200,134,10,.75)', fontStyle:'italic', lineHeight:1.6, marginTop:4 }
  const Badge = ({e,t,c}:{e:string;t:string;c:string}) => <span style={{display:'inline-flex',alignItems:'center',gap:5,background:`${c}18`,border:`1px solid ${c}55`,color:c,borderRadius:20,padding:'4px 11px',fontSize:12,fontWeight:700,margin:'0 6px 6px 0'}}>{e} {t}</span>
  return (
    <div style={{minHeight:'100vh',background:'#080510',fontFamily:'system-ui',color:'#e8e0f0',padding:'28px 20px 80px',maxWidth:760,margin:'0 auto'}}>
      <div style={{fontSize:26,fontWeight:900,color:'#C8860A',marginBottom:4}}>🏆 Système de Confiance</div>
      <div style={{fontSize:12,color:'rgba(232,224,240,.5)',marginBottom:8}}>Le chantier produit n°1 — ce qui rend Clutch incopiable. (GPT + Claude convergent : + important que l'algo.)</div>
      <div style={{fontSize:11,color:'rgba(232,224,240,.45)',marginBottom:20,lineHeight:1.6}}>Légende décisions : <b style={{color:'#4ade80'}}>✅ retenu</b> · <b style={{color:'#f87171'}}>❌ écarté</b> · <b style={{color:'#fbbf24'}}>🟡 à décider</b></div>

      <div style={card('rgba(200,134,10,.3)')}>
        <div style={h('La question unique')}>🎯 La question unique</div>
        <p style={p}>Le système ne note PAS les gens. Il répond à <b style={{color:'#fff'}}>une seule question</b> : « Est-ce que cette personne fait généralement ce qu'elle annonce ? »</p>
        <div style={why}>Pourquoi : une personne peut être formidable pour l'un, catastrophique pour l'autre. Noter la qualité humaine = subjectif, manipulable, vengeance, discrimination. La fiabilité comportementale est objective et mesurable.</div>
      </div>

      <div style={card('rgba(248,113,113,.3)')}>
        <div style={h('Ce qu\'on n\'affiche JAMAIS','#f87171')}>❌ Jamais affiché</div>
        <p style={p}>Note /5 · avis · commentaires publics · nb de RDV/refus/ghostings · <b style={{color:'#fff'}}>le chiffre du score</b> (ex 73/100).</p>
        <div style={why}>Pourquoi : tout chiffre/avis devient manipulable et source de jugement social. Les gens « jouent » avec le chiffre.</div>
      </div>

      <div style={card('rgba(74,222,128,.3)')}>
        <div style={h('Ce qu\'on affiche : des badges','#4ade80')}>✅ Badges positifs & subtils</div>
        <div style={{margin:'4px 0 8px'}}>
          <Badge e="🌱" t="Nouveau" c="#fbbf24"/><Badge e="🌿" t="En construction" c="#fbbf24"/><Badge e="🟢" t="Fiable" c="#4ade80"/><Badge e="⭐" t="Très fiable" c="#4ade80"/><Badge e="🏆" t="Exemplaire" c="#C8860A"/>
        </div>
        <div style={why}>Pourquoi : façon Apple (« tout semble fonctionner »). On montre le résultat, jamais la formule. Tout est positif → pas de stigmatisation. ✅ Appliqué Z60 (le hero profil affiche le badge, plus le chiffre).</div>
      </div>

      <div style={card('rgba(200,134,10,.2)')}>
        <div style={h('Deux réputations')}>🧮 Architecture en 2 couches</div>
        <p style={p}><b style={{color:'#fff'}}>1. VISIBLE = simple</b> : 1 badge parmi 4-5 niveaux. Tout ce que l'user et les autres voient.</p>
        <p style={p}><b style={{color:'#fff'}}>2. CACHÉE = complexe</b> : des dizaines de variables internes. L'user ne voit jamais la formule (comme Uber / Airbnb / anti-fraude bancaire).</p>
        <div style={why}>Pourquoi : la simplicité protège l'UX et empêche le gaming ; la complexité cachée donne la robustesse.</div>
      </div>

      <div style={card('rgba(200,134,10,.2)')}>
        <div style={h('3 niveaux de mesure')}>📊 Comment on mesure</div>
        <p style={p}><b style={{color:'#fff'}}>1. Présence confirmée</b> : a ouvert une dispo, accepté un Clutch, cliqué « J'y suis ».</p>
        <p style={p}><b style={{color:'#fff'}}>2. Preuve passive</b> : GPS cohérent avec le lieu, durée minimale. Pas de tracking permanent — juste des signaux.</p>
        <p style={p}><b style={{color:'#fff'}}>3. Validation mutuelle</b> : après le RDV, une seule question → « La rencontre a-t-elle eu lieu ? » (oui/non).</p>
        <div style={why}>Pourquoi « eu lieu ? » et pas « comment c'était ? » : on mesure le fait, pas le ressenti (invérifiable, source de conflit). 🟡 À faire : simplifier le feedback actuel (À l'heure/Est venu/Lapin) vers « eu lieu ? ».</div>
      </div>

      <div style={card('rgba(248,113,113,.4)')}>
        <div style={h('Règle absolue anti-manipulation','#f87171')}>🔒 La règle d'or</div>
        <p style={p}><b style={{color:'#fff'}}>Aucun utilisateur ne peut faire baisser SEUL la réputation d'un autre. Jamais.</b> Un signal négatif exige toujours : répétition + incohérence + preuves techniques (GPS/heure) + historique.</p>
        <div style={why}>Pourquoi : sans ça → ex jaloux, vengeance après rejet, compétition, discrimination. C'est la faille qui tue tous les systèmes de notation.</div>
      </div>

      <div style={card('rgba(200,134,10,.2)')}>
        <div style={h('Score lent + détection lapin')}>🐢 Lent et juste</div>
        <p style={p}>50 RDV parfaits + 1 annulation = <b style={{color:'#4ade80'}}>rien</b>. 3 lapins de suite = <b style={{color:'#f87171'}}>signal</b>.</p>
        <p style={p}><b style={{color:'#fff'}}>Lapin intelligent :</b> Julie dit « j'étais là », Thomas dit « non » → le système ne sanctionne personne, il OBSERVE (GPS, heure, historique : 38 RDV validés vs 2 annulations récentes → il comprend).</p>
        <div style={why}>Pourquoi : une erreur ne doit jamais tuer quelqu'un. La fiabilité est une tendance, pas un événement.</div>
      </div>

      <div style={card('rgba(200,134,10,.2)')}>
        <div style={h('Variables cachées')}>🔍 Le moteur (invisible)</div>
        <p style={p}>Présence réelle · respect des engagements (accepte puis vient/annule) · ponctualité · taux de finalisation (% Clutchs → RDV) · fiabilité GPS · ancienneté/régularité · vérifications (email/tél/selfie vidéo/identité) · events (réalisés vs annulés).</p>
        <div style={why}>🟡 À construire : moteur de score caché (Edge Function pondérée, lente, anti-manipulation = DB-06). Le score actuel est un simple nombre JS → à remplacer.</div>
      </div>

      <div style={card('rgba(74,222,128,.3)')}>
        <div style={h('Philosophie','#4ade80')}>🎯 La ligne directrice</div>
        <p style={{...p,fontSize:14,color:'#fff'}}>Construire un <b style={{color:'#4ade80'}}>système de crédibilité comportementale</b>, PAS un système social. « Fait-elle ce qu'elle annonce ? » — pas « est-elle sympa ? »</p>
        <div style={why}>C'est la distinction qui décide du destin de Clutch : app correcte vs app exceptionnelle.</div>
      </div>
    </div>
  )
}

// ─── Section : STRATÉGIE 2026 (synthèse audit GPT + décisions) ───────────────
const SectionStrategie = () => {
  const card = (border:string):React.CSSProperties => ({ background:'#120d1e', borderRadius:16, padding:'18px', marginBottom:14, border:`1px solid ${border}` })
  const h = (t:string,c='#C8860A'):React.CSSProperties => ({ fontSize:14, fontWeight:900, color:c, marginBottom:10, textTransform:'uppercase' as const, letterSpacing:'.05em' })
  const p:React.CSSProperties = { fontSize:13, color:'rgba(232,224,240,.75)', lineHeight:1.7, margin:'0 0 8px' }
  const why:React.CSSProperties = { fontSize:11, color:'rgba(200,134,10,.75)', fontStyle:'italic', lineHeight:1.6, marginTop:4 }
  return (
    <div style={{minHeight:'100vh',background:'#080510',fontFamily:'system-ui',color:'#e8e0f0',padding:'28px 20px 80px',maxWidth:760,margin:'0 auto'}}>
      <div style={{fontSize:26,fontWeight:900,color:'#C8860A',marginBottom:4}}>🧭 Stratégie 2026</div>
      <div style={{fontSize:12,color:'rgba(232,224,240,.5)',marginBottom:20,lineHeight:1.6}}>Synthèse des audits GPT (20.06) + décisions. Légende : <b style={{color:'#4ade80'}}>✅ retenu</b> · <b style={{color:'#f87171'}}>❌ écarté</b> · <b style={{color:'#fbbf24'}}>🟡 à décider</b></div>

      <div style={card('rgba(74,222,128,.3)')}>
        <div style={h('Positionnement','#4ade80')}>🎯 Ce qu'est Clutch</div>
        <p style={p}>Le vrai produit n'est PAS les profils → c'est <b style={{color:'#fff'}}>Disponibilité + Confiance + Timing</b>. Flow inversé vs Tinder : Dispo→Rencontre→(éventuel contact). L'app fait SORTIR les gens, ne les capture pas. <b style={{color:'#4ade80'}}>Clutch Live = feature signature</b> (le « bouton Live »).</p>
        <div style={why}>Pourquoi : c'est ce qui nous rend différents et mémorables. « La vraie vie, maintenant. »</div>
      </div>

      <div style={card('rgba(74,222,128,.4)')}>
        <div style={h('Scope V1 — 1er août','#4ade80')}>✅ La discipline (décision)</div>
        <p style={p}><b style={{color:'#4ade80'}}>✅ V1 = présence simple + Clutch Drivers + événements (basiques) + confiance + sécurité femmes.</b></p>
        <p style={p}><b style={{color:'#f87171'}}>❌ Reporté V2 : modes multiples (Amical/Pro/Parents), premium avancé, crypto, paiements events.</b></p>
        <div style={why}>Pourquoi : le piège mortel = « tout ajouter → personne ne comprend ». On gagne Lausanne d'abord, on débloque le reste une bataille à la fois (roadmap : Dating+Amis → Events → Business → Créateurs → Mentorat → Sport/Covoit).</div>
      </div>

      <div style={card('rgba(248,113,113,.3)')}>
        <div style={h('Le piège','#f87171')}>⚠️ Ne pas devenir « Tinder + réglages »</div>
        <p style={p}>Rester « la plateforme de rencontres réelles les plus fiables ». Apple ne simplifie pas les possibilités, il simplifie l'<b style={{color:'#fff'}}>ACCÈS</b> aux possibilités → Profil en 3 niveaux (N1 visible : profil/dispo/confiance/abo · N2 : préférences/sécurité/filtres · N3 : experts/créateur/partenaire).</p>
        <div style={why}>Pourquoi : éviter le « cockpit d'avion » à 40 options. 🟡 À appliquer dans la refonte profil.</div>
      </div>

      <div style={card('rgba(200,134,10,.25)')}>
        <div style={h('Sécurité femmes')}>👩 Le plus gros levier business</div>
        <p style={p}>Filtres de réception granulaires : qui peut me Clutcher (tous / fiables / vérifiés / contacts communs / femmes / pro) · nb max simultané · distance · écart d'âge · horaires. Vérif identité multi-niveaux (email→selfie vidéo→pièce optionnelle→certifié), <b style={{color:'#fff'}}>jamais la pièce obligatoire</b> mais filtre premium « certifiés uniquement ».</p>
        <div style={why}>Pourquoi : la sécurité (pas l'IA ni le design) est le vrai différenciateur vs Tinder/Bumble.</div>
      </div>

      <div style={card('rgba(200,134,10,.25)')}>
        <div style={h('Lancement & KPI')}>🚀 Comment démarrer (cible 1er août)</div>
        <p style={p}>Soirée Clutch où <b style={{color:'#fff'}}>l'événement EST le concept</b> (pas un DJ à 10k) : 300 pers, inscription, profils vérifiés, plusieurs univers. Croissance ville par ville (Lausanne→Genève→…). <b style={{color:'#fff'}}>Vrai KPI = nb de vraies rencontres/semaine</b>, pas le nb de comptes.</p>
        <div style={why}>Pourquoi : la densité locale est le seul vrai risque (ville vide = produit mort).</div>
      </div>

      <div style={card('rgba(251,191,36,.3)')}>
        <div style={h('Projections','#fbbf24')}>📊 Réalisme financier</div>
        <p style={p}><b style={{color:'#f87171'}}>❌ Conversion 35% = erreur GPT.</b> <b style={{color:'#4ade80'}}>✅ Réaliste = 2 à 8%</b> (10% = déjà très bon en social). Business plan sur 2-8%, le reste = bonus.</p>
        <p style={p}>Plus gros potentiel revenu = <b style={{color:'#fff'}}>les événements</b> (bars/salles/festivals paient pour la visibilité), pas les abos. → mais B2B complexe = V2.</p>
        <p style={p}>Scénarios romands : 5k users→~7k CHF/m · 20k→~30k · 50k→~75k · 150k→~225k.</p>
      </div>

      <div style={card('rgba(162,139,250,.3)')}>
        <div style={h('Vision plateforme (V3+)','#a78bfa')}>🌍 Le futur (à débloquer, PAS lancer)</div>
        <p style={p}>Clutch = potentiellement « <b style={{color:'#fff'}}>le protocole de rencontre du monde réel</b> » (aucun dominant pour « voir quelqu'un en vrai aujourd'hui »). Déclinaisons futures : Friends, Business (« 3 entrepreneurs dispo dans 2h »), Mentor, Senior, Sport, Study, Help, Ride, Travel. Attaque un problème géant : <b style={{color:'#fff'}}>la solitude</b>.</p>
        <div style={why}>🟡 Vision long terme. Discipline absolue : une promesse à la fois. Mentalité Polsia (1 pers + IA = travail de 10-50) mais produit centré humain réel.</div>
      </div>

      <div style={card('rgba(200,134,10,.25)')}>
        <div style={h('Lieux partenaires & affinités')}>💡 Idées 20.06 (David)</div>
        <p style={p}><b style={{color:'#4ade80'}}>✅ Lieux partenaires / pub :</b> établissements qui paient pour apparaître, OU mise en avant par valeurs (local, restaurant végan). = compte Établissement. Colle à GPT (revenu = events/partenaires). Phase V2.</p>
        <p style={p}><b style={{color:'#4ade80'}}>✅ Clubs par affinité positive (V2) :</b> Clutch Végan / végan-friendly, sport, intérêts. Filtre « qui peut rejoindre » (façon nomadtable). Positif, fédérateur, on-brand.</p>
        <p style={p}><b style={{color:'#fbbf24'}}>🟡 Filtre « Femmes & non-binaires » :</b> filtre de SÉCURITÉ établi (pas politique). À cadrer sobrement (sécurité femmes = gros levier). À trancher David+Mel.</p>
        <p style={p}><b style={{color:'#f87171'}}>❌ Filtre « non-vaccinés » / idéologique : NON.</b> Piège réputationnel + rejet App Store + crée des groupes ciblables (le risque malveillance). À éviter absolument.</p>
        <div style={why}>⚠️ Tout groupe « exclusif » = une cible. Si clubs → membres vérifiés only + lieux publics + pas de listing public + report. Le women-only protège ; l'idéologique expose.</div>
      </div>
    </div>
  )
}

function SectionNDA(){
  const para:React.CSSProperties = {fontSize:13.5,lineHeight:1.6,margin:'0 0 12px',color:'#1a1a1a'}
  const h:React.CSSProperties = {fontWeight:800,color:'#000'}
  return (
    <div>
      <style>{`@media print{ body *{visibility:hidden} #nda-paper, #nda-paper *{visibility:visible} #nda-paper{position:absolute;left:0;top:0;width:100%} .no-print{display:none!important} }`}</style>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,flexWrap:'wrap',gap:10}} className="no-print">
        <div>
          <div style={{fontSize:18,fontWeight:900,color:C.gold}}>📜 Accord de confidentialité (NDA)</div>
          <div style={{fontSize:11,color:C.dim}}>À faire signer aux personnes à qui on parle du projet · <b style={{color:C.salmon}}>brouillon — faire valider par un avocat suisse</b></div>
        </div>
        <button onClick={()=>window.print()} style={{background:C.gold,color:'#0f0810',border:'none',borderRadius:10,padding:'10px 18px',fontWeight:800,fontSize:13,cursor:'pointer'}}>🖨 Imprimer / PDF</button>
      </div>
      {/* Le « papier » blanc — propre à imprimer/signer */}
      <div id="nda-paper" style={{background:'#fff',color:'#1a1a1a',borderRadius:10,padding:'34px 38px',maxWidth:720,margin:'0 auto',boxShadow:'0 4px 24px rgba(0,0,0,.3)'}}>
        <div style={{textAlign:'center',marginBottom:18}}>
          <div style={{fontSize:20,fontWeight:900,letterSpacing:'-.01em',color:'#000'}}>CLUTCH — CONFIDENTIALITY &amp; CONTRIBUTION AGREEMENT</div>
        </div>
        <p style={{...para,fontSize:12,color:'#666'}}>Between <b>Clutch</b> (David Saugy &amp; Mélanie Brodard, Lausanne, Switzerland) — "Clutch" — and <b>……………………………………</b> ("You"). Date: ……………………</p>
        <p style={para}>By signing, You agree:</p>
        <p style={para}><span style={h}>1. Confidential Information.</span> Everything You learn about Clutch — the concept, the name, the designs, the code, the features, the business model, the data, the users, the finances, the strategy, and any of our discussions — is confidential and the exclusive property of Clutch.</p>
        <p style={para}><span style={h}>2. You keep it secret.</span> You will not share, publish, show, or describe it to anyone, and will not use it for any purpose other than helping Clutch. This obligation lasts during our collaboration and for <b>five (5) years</b> afterwards.</p>
        <p style={para}><span style={h}>3. You do not copy it.</span> You will not build, help build, advise, or invest in any product that copies or competes with Clutch using what You learned, for <b>two (2) years</b> after our collaboration ends.</p>
        <p style={para}><span style={h}>4. Your contributions belong to Clutch.</span> Any idea, feedback, design, code, or improvement You provide becomes the exclusive property of Clutch, with no claim or compensation owed — unless agreed separately and in writing (see below).</p>
        <p style={para}><span style={h}>5. No poaching, no circumvention.</span> For <b>two (2) years</b>, You will not solicit Clutch's team, partners, or users away from Clutch, nor bypass Clutch to deal with them directly using what You learned here.</p>
        <p style={para}><span style={h}>6. Return.</span> On request, You will promptly delete or return all Clutch materials in Your possession.</p>
        <p style={para}><span style={h}>7. Breach.</span> You acknowledge a breach would cause Clutch serious and irreparable harm; Clutch may seek an immediate injunction and damages.</p>
        <p style={para}><span style={h}>8. Governing law.</span> Swiss law. Any dispute is submitted to the courts of <b>Lausanne (Vaud), Switzerland</b>.</p>
        <div style={{display:'flex',gap:30,marginTop:26,flexWrap:'wrap'}}>
          <div style={{flex:1,minWidth:200}}><div style={{borderTop:'1px solid #000',paddingTop:5,fontSize:11,color:'#444'}}>You — name, place, date</div></div>
          <div style={{flex:1,minWidth:200}}><div style={{borderTop:'1px solid #000',paddingTop:5,fontSize:11,color:'#444'}}>Clutch — David Saugy</div></div>
        </div>
        <div style={{marginTop:26,paddingTop:16,borderTop:'1px dashed #bbb'}}>
          <div style={{...h,fontSize:13,marginBottom:6}}>Our promise to You (reciprocity)</div>
          <p style={{...para,fontSize:12.5,marginBottom:6}}>We never take help for granted. As an <b>early contributor</b>, You will be recognised as part of Clutch's founding circle, get early access, and — at our goodwill and discretion — share in the project's success if it grows.</p>
          <p style={{...para,fontSize:11,color:'#777',fontStyle:'italic',margin:0}}>This paragraph is a sincere statement of intent, not a binding financial promise. Any equity, revenue share, or payment will be defined in a separate written agreement signed by both founders.</p>
        </div>
      </div>
      <div style={{fontSize:11,color:C.dim,maxWidth:720,margin:'14px auto 0',lineHeight:1.5}} className="no-print">
        ⚠️ <b>Brouillon</b>. Avant de faire signer : (1) faire relire par un <b>avocat suisse</b> ; (2) ne <b>jamais</b> écrire de % d'equity/revenue ferme ici — ça se fait dans un doc séparé signé par David <b>et</b> Mel ; (3) garder la réciprocité <b>discrétionnaire</b> (cercle des fondateurs, Premium à vie, accès anticipé, merci ponctuel) plutôt qu'un % à vie.
      </div>
    </div>
  )
}

function SectionNaming(){
  const card:React.CSSProperties={background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:'12px 14px',marginBottom:10}
  const names = [
    {n:'Onde', why:'« être sur la même onde » = même longueur d\'onde. Lie au radar/Doppler. Court, FR+EN, chaleureux.', star:3},
    {n:'Sona / Sonar', why:'le radar de proximité = cœur du produit. Tech, moderne, mémorable.', star:3},
    {n:'Subito', why:'italien « tout de suite ». Énergique, spontané, sonne bien.', star:3},
    {n:'Illico', why:'FR « sur-le-champ ». Joueur, immédiat, identitaire.', star:2},
    {n:'Brio', why:'énergie, panache. Court, classe, FR+EN.', star:2},
    {n:'Hop', why:'spontané, léger, « hop on se voit ». Très court.', star:2},
    {n:'Presto', why:'rapide + musical. Connu, positif.', star:2},
    {n:'Lume', why:'lumière. Doux, chaleureux, brandable.', star:1},
    {n:'Encore', why:'FR+EN « encore / again ». Donne envie de revoir les gens.', star:1},
    {n:'Tilt', why:'l\'instant où ça matche, le déclic.', star:1},
    {n:'Verve', why:'élan, vivacité.', star:1},
    {n:'Rendez', why:'de « rendez-vous ». Évoque la rencontre.', star:1},
  ]
  return (
    <div>
      <div style={{fontSize:18,fontWeight:900,color:C.gold,marginBottom:4}}>🔤 Recherche de noms</div>
      <div style={{fontSize:12,color:C.dim,marginBottom:14,lineHeight:1.5}}>Daniella n'accroche pas à « Clutch ». On explore. <b style={{color:C.salmon}}>Daniella + Mel : ajoutez vos propositions ici.</b></div>
      <div style={{...card,background:'rgba(235,107,175,.06)'}}>
        <div style={{fontSize:12,fontWeight:800,color:C.salmon,marginBottom:6}}>✅ Critères d'un bon nom</div>
        <div style={{fontSize:11.5,color:C.white,lineHeight:1.7}}>• <b>Court</b> (1-2 syllabes) · <b>prononçable FR + EN</b> · <b>.com/.ch dispo</b> · évoque <b>spontané / vrai / maintenant / lien</b> · ni trop froid ni trop sexuel · <b>pas « match/swipe »</b> (notre promesse anti-Tinder).</div>
      </div>
      <div style={{fontSize:12,fontWeight:800,color:C.dim,margin:'14px 2px 8px',letterSpacing:'.05em'}}>PISTES (Claude) — à challenger</div>
      {names.map(x=>(
        <div key={x.n} style={card}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
            <span style={{fontSize:15,fontWeight:900,color:C.white}}>{x.n}</span>
            <span style={{fontSize:11,color:C.gold}}>{'★'.repeat(x.star)}</span>
          </div>
          <div style={{fontSize:11.5,color:C.dim,lineHeight:1.5}}>{x.why}</div>
        </div>
      ))}
      <div style={{...card,borderStyle:'dashed',textAlign:'center',color:C.dim,fontSize:12}}>➕ Vos propositions : …………………………… <span style={{opacity:.6}}>(à compléter)</span></div>
      <div style={{fontSize:11,color:C.dim,marginTop:10,lineHeight:1.5}}>⚠️ Avant de changer : vérifier <b>marque déposée</b> (IGE Suisse), <b>domaine</b>, <b>réseaux sociaux dispos</b>. Un changement de nom tard = coûteux → trancher tôt.</div>
    </div>
  )
}

function SectionSocialModel(){
  const card:React.CSSProperties={border:`1px solid ${C.border}`,borderRadius:12,padding:'12px 14px',marginBottom:10}
  return (
    <div>
      <div style={{fontSize:18,fontWeight:900,color:C.gold,marginBottom:4}}>🧩 Modèle social &amp; algo (challenge à mort)</div>
      <div style={{fontSize:12,color:C.dim,marginBottom:14,lineHeight:1.5}}>Comment on classe TOUT le monde : individus, gratuits, payants, partenaires, groupes réguliers, groupes privés, activités à 2 / 4 / +.</div>

      <div style={{fontSize:13,fontWeight:800,color:C.salmon,margin:'4px 2px 8px'}}>① La structure proposée</div>
      <div style={card}><b style={{color:C.white}}>Présences</b> = personnes dispo MAINTENANT (1:1 spontané). <span style={{color:C.dim}}>Bibi qui veut un ping-pong ce soir = une personne dispo avec un <b>badge activité épinglé</b> → visible ici ET dans Événements.</span></div>
      <div style={card}><b style={{color:C.white}}>Événements</b> = activités à 2+. Ponctuelles (Bibi ce soir) ou issues d'un groupe. Gratuit pour un one-shot.</div>
      <div style={card}><b style={{color:C.white}}>Communauté</b> = organisateurs <b>récurrents qu'on SUIT</b> → notifs (rando du dimanche, yoga horaire variable, oncle musicien). Suivre = gratuit. <span style={{color:C.dim}}>Créer un groupe récurrent qui s'affiche = <b>profil vérifié</b>, et <b>payant si promotion régulière</b>.</span></div>
      <div style={card}><b style={{color:C.white}}>Partenaires</b> = clubs qui <b>payent</b> → bannières (pub, non filtrables).</div>
      <div style={card}><b style={{color:C.white}}>Privé</b> = sur invitation / lien. N'apparaît PAS dans les listes publiques.</div>

      <div style={{fontSize:13,fontWeight:800,color:C.salmon,margin:'16px 2px 8px'}}>② Modèle de prix (logique)</div>
      <div style={card}><span style={{color:C.dim}}>One-shot = <b style={{color:C.white}}>gratuit</b> (Bibi, l'oncle). Groupe <b>récurrent / promotion</b> = <b style={{color:C.white}}>payant ou premium</b> (c'est du business). Partenaires = <b style={{color:C.white}}>paient la visibilité</b> (bannières). Question ouverte business : billetterie, tracking « vient de Clutch », rabais à l'entrée → à challenger avec GPT.</span></div>

      <div style={{fontSize:13,fontWeight:800,color:'#f87171',margin:'16px 2px 8px'}}>③ ⚠️ ÉTHIQUE — groupes privés (David : « c'est pas dangereux ? »)</div>
      <div style={{...card,background:'rgba(248,113,113,.06)',border:'1px solid rgba(248,113,113,.3)'}}>
        <div style={{fontSize:11.5,color:C.white,lineHeight:1.7}}>
          <b style={{color:'#f87171'}}>OUI, risque réel.</b> Un groupe privé/invisible peut cacher : harcèlement, contenu illégal, exploitation, mineurs. Dans une app de rencontre = <b>danger maximal</b>.<br/>
          <b style={{color:C.white}}>Garde-fous obligatoires (non négociables) :</b><br/>
          • Créateur <b>VÉRIFIÉ</b> (selfie certifié) — privé ≠ anonyme.<br/>
          • <b>Signalement</b> dans tout groupe privé + <b>SOS</b> toujours accessible.<br/>
          • <b>18+</b> vérifié, consentement clair, GPS caché → adresse révélée tard (règle existante).<br/>
          • CGU + modération : on n'héberge PAS d'illégal.<br/>
          <b style={{color:'#f87171'}}>L'angle « kink / sexuel » = données SENSIBLES</b> (orientation/préférences sexuelles) au sens <b>LPD suisse / RGPD</b> → consentement explicite, protection renforcée, gros poids légal. → <b>Produit séparé</b>, pas à bricoler sur Clutch sans avocat.
        </div>
      </div>

      <div style={{fontSize:13,fontWeight:800,color:C.salmon,margin:'16px 2px 8px'}}>④ 💎 LA différenciation : l'algo qu'on CONTRÔLE (idée Daniella — « génial »)</div>
      <div style={{...card,background:'rgba(235,107,175,.06)'}}>
        <div style={{fontSize:11.5,color:C.white,lineHeight:1.7}}>
          On laisse l'utilisateur <b>régler son matching</b> : « <b>qui me ressemble</b> » ↔ « <b>opposés s'attirent</b> », sérieux ↔ fun, et surtout <b>adapté à l'humeur du moment</b>.<br/>
          Test de perso (cadre MBTI, <b>nos questions</b>) = couche fun + petit poids dans l'algo (le matching sérieux reste sur des signaux validés type « Big Five »).<br/>
          <b>Options avancées cachées</b> pour ceux qui veulent aller à fond — invisibles pour les autres (simplicité dehors, complexité dedans). <b>C'est là qu'on se démarque.</b>
        </div>
      </div>

      <div style={{fontSize:13,fontWeight:800,color:C.salmon,margin:'16px 2px 8px'}}>⑤ Fenêtre 18h — décision David</div>
      <div style={card}><span style={{color:C.dim}}>On compte la fenêtre <b style={{color:C.white}}>à partir du DÉBUT de dispo choisi</b> (pas de l'ouverture de l'app). Ex : à 14h je me déclare dispo « à partir de 20h » → fenêtre court dès 20h (~16-18h). Même logique pour les events.</span></div>
    </div>
  )
}

// ─── 🧭 LE GRAAL — addiction éthique sans temps d'écran (anti-inertie) ───────
const SectionGraal = () => {
  const Card = ({icon,title,color,children}:any) => (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderLeft:`3px solid ${color}`,borderRadius:12,padding:'14px 16px',marginBottom:12}}>
      <div style={{fontSize:13,fontWeight:800,color,marginBottom:7}}>{icon} {title}</div>
      <div style={{fontSize:12,color:C.mid,lineHeight:1.7}}>{children}</div>
    </div>
  )
  return (
    <div>
      <H n={1}>🧭 Le Graal — accro à la VIE, pas à l'app</H>
      <P>Le pari contre-intuitif qui peut faire gagner Clutch : <b style={{color:C.gold}}>temps passé dans la vraie vie = succès</b> (et non temps d'écran). Objectif : consulté souvent, mais &lt; 30 s à chaque fois.</P>
      <Card icon="🛋️" title="Le concurrent, c'est le canapé" color={C.red}>
        Clutch n'est pas une app de rencontre → c'est un <b>OS des opportunités sociales en temps réel</b> (anti-inertie). L'ennemi n'est ni Tinder ni Insta, c'est « je reste chez moi ». <b>Aune unique de toute décision : est-ce que ça fait sortir quelqu'un dans les 2h ?</b>
      </Card>
      <Card icon="🎰" title="Variabilité HONNÊTE = dopamine éthique" color={C.gold}>
        Les gens ne sont pas accros au swipe, mais à « il peut se passer quelque chose ». Tinder <i>fabrique</i> l'espoir (feed algo = fausse variabilité = dark pattern). <b>Clutch : la variabilité est RÉELLE</b> (la dispo des vrais gens change tout le temps) → la dopamine est honnête car l'opportunité est vraie. On RÉVÈLE le monde, on ne le manipule pas.
      </Card>
      <Card icon="🔔" title="Le vrai produit = la NOTIFICATION" color={C.salmon}>
        « 15 s puis ferme » → l'app est le <b>cockpit, pas la destination</b>. Le produit vit dans le push : « 3 dispo à 12 min dans les 2h » → tap → « 18h30 ? » → tu fermes, tu y vas. <b>L'user parfait n'ouvre presque jamais l'app.</b> Les notifs ne sont pas une feature : c'est LE cœur. Chaque notif = opportunité réelle + fraîche, jamais du bruit.
      </Card>
      <Card icon="🧠" title="Les 5 leviers comportementaux (éthiques)" color={C.green}>
        1. <b>Variabilité honnête</b> (le monde change → « vérifie »). 2. <b>Aversion à la perte &gt; gain</b> (« dispo encore 37 min », Verrou — ×2 plus puissant). 3. <b>Identité, pas points</b> (« tu es quelqu'un qui sort » &gt; « +5 pts »). 4. <b>Momentum social</b> (lun+mer+ven = « quelqu'un qui rencontre des gens »). 5. <b>Boucles ouvertes</b> (Zeigarnik) qui se closent DANS LA VRAIE VIE.
      </Card>
      <Card icon="📏" title="La métrique Nord" color={C.gold}>
        <b>Rencontres réelles ÷ minutes d'écran</b> → on maximise le ratio. Aucune app de rencontre n'ose ça. Toute feature qui ↑ le temps d'écran sans ↑ les vrais RDV = <b>dark pattern → on coupe</b>.
      </Card>
      <Card icon="🚪" title="Le Graal qui s'auto-annule" color={C.salmon}>
        On veut moins d'usage mais des retours fréquents. Résolution : <b>on design pour la SORTIE, pas pour le dwell.</b> La meilleure session se termine quand l'user pose son tél et va au RDV. <b>Une app qu'on est fier de FERMER.</b>
      </Card>
      <P dim>Filtre permanent sur CHAQUE feature : « ça augmente les rencontres réelles par minute d'écran, ou juste le temps d'écran ? » Si le 2e → dark pattern.</P>
    </div>
  )
}

// ─── 🛡️ INVARIANTS — la constitution + défi malveillance permanent ──────────
const SectionInvariants = () => {
  const INV = [
    ['Feedbacks/notes privés','Personne ne lit les notes des autres','🟡 JS → blinder RLS (fuite LPD)'],
    ['Score non auto-modifiable','Modifiable QUE par le serveur','🟡 PATCH client possible'],
    ['Position ≠ live','Zones ±50 m, distance au LIEU jamais à la personne','🟢 OK'],
    ['Anti-doublon / self-clutch','Pas 2 clutchs pending, pas soi-même','🟢 contraintes DB'],
    ['Cooldown 48h','Un refusé ne re-spamme pas 48h','🟢 DB trigger (24.06)'],
    ['Pas de contact hors matching','Aucun contact sans Clutch accepté','🟢 RLS membership msg (24.06)'],
    ['RDV/dispo expiré jamais réactivé','Gate is_available && until>now','🟢 (2 points)'],
    ['Place event jamais vendue 2×','Capacité respectée','🟢 trigger + PK'],
    ['Banni ne revient pas','Pas de multi-compte/ban contourné','🟡 + multi-comptes'],
    ['Blocage = invisible total','Forcé côté requête + RLS','🟢 insert bloqué DB (24.06)'],
    ['Filtres réception femmes','Women-only / vérifiés / pas après 22h','❌ pas codé'],
    ['Premium ne s\'auto-attribue pas','account_type seulement après paiement','🟡 PATCH possible'],
    ['Pas d\'extraction de masse','Pas de dump profils/GPS','🟡 RLS + rate limit'],
    ['Mineurs exclus','18+ vérifié partout','🟡 fausse date possible'],
  ]
  return (
    <div>
      <H n={1}>🛡️ Invariants — la constitution de Clutch</H>
      <P>Les règles qui ne doivent <b>JAMAIS</b> être fausses. On ne prouve pas le code (Coq = inutile ici). On rend les règles <b>incassables là où on ne peut pas les contourner = la base de données</b> (contraintes + RLS). Un invariant forcé seulement en JS (🟡) = contournable. But : tout passer en 🟢 DB.</P>
      <div style={{background:C.card,border:`1px solid ${C.red}55`,borderRadius:12,padding:'12px 14px',marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:800,color:C.red,marginBottom:6}}>⚔️ Le défi PERMANENT (sur chaque feature, pour toujours)</div>
        <div style={{fontSize:12,color:C.mid,lineHeight:1.7}}>« Comment un malveillant la pète ? » — Que fait un homme qui harcèle / piste / recontacte après un refus ? Qui crée 50 faux comptes / revient après ban ? Qui extrait les GPS ? Qui triche son score / réserve 2× une place ? Si « rien ne l'en empêche » → <b>bloquer AVANT de coder</b>.</div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {INV.map(([t,r,s]:any,i:number)=>(
          <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:'9px 12px'}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12.5,fontWeight:800,color:C.gold}}>{t}</div>
              <div style={{fontSize:11,color:C.mid,lineHeight:1.5}}>{r}</div>
            </div>
            <div style={{fontSize:10,fontWeight:700,color:C.dim,whiteSpace:'nowrap',flexShrink:0}}>{s}</div>
          </div>
        ))}
      </div>
      <P dim>Plan : 1) classer chaque invariant 🟢 DB vs 🟡 JS · 2) passer tout « sécurité/confiance » 🟡 → 🟢 (contrainte/RLS/trigger/Edge Function) · 3) audit adversarial (essayer de tout casser) · 4) un test auto par invariant. Priorité : fuite feedbacks · scores/premium auto-modifiables · multi-comptes/scraping · filtres femmes.</P>
    </div>
  )
}

// ─── 🚀 LANCEMENT — la liquidité est le produit (synthèse GPT + Claude) ───────
const SectionLancement = () => {
  const Card = ({icon,title,color,children}:any) => (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderLeft:`3px solid ${color}`,borderRadius:12,padding:'14px 16px',marginBottom:12}}>
      <div style={{fontSize:13,fontWeight:800,color,marginBottom:7}}>{icon} {title}</div>
      <div style={{fontSize:12,color:C.mid,lineHeight:1.7}}>{children}</div>
    </div>
  )
  const Row = ({k,v}:any) => (
    <div style={{display:'flex',gap:10,alignItems:'flex-start',background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:'9px 12px',marginBottom:6}}>
      <div style={{fontSize:11.5,fontWeight:800,color:C.gold,minWidth:96,flexShrink:0}}>{k}</div>
      <div style={{fontSize:11.5,color:C.mid,lineHeight:1.6}}>{v}</div>
    </div>
  )
  return (
    <div>
      <H n={1}>🚀 Lancement — la LIQUIDITÉ est le produit</H>
      <P>Synthèse croisée (GPT + Claude + audit sécu). Le vrai tueur n'est pas Tinder : <b style={{color:C.red}}>c'est ouvrir l'app et voir personne</b> (la mort de l'espoir). 70% de l'énergie va ici, pas dans l'algo.</P>
      <Card icon="🎯" title="La nuance qui change tout (David)" color={C.gold}>
        <b>Réglable = TOUT</b> (poids algo, crédits, %). <b>Mais pensé à fond AVANT le lancement = sécurité, confiance, liquidité.</b> Une app de confiance ne se rattrape pas après une mauvaise 1ʳᵉ expérience. Catastrophes irrattrapables : une femme reçoit <b>25 sollicitations en 20 min</b> · <b>3 no-shows</b> la 1ʳᵉ semaine · impression de <b>marché aux bestiaux</b>. → On a déjà commencé à y répondre (cooldown/blocage verrouillés en base + réception top 5).
      </Card>
      <Card icon="🛟" title="L'anti-vide HONNÊTE (mon ajout)" color={C.green}>
        Jamais de faux profils / faux matchs (ligne rouge — beaucoup de startups meurent là). Mais quand le rayon est vide, on ne montre <b>jamais</b> du vide → des <b>signaux de densité honnêtes</b> : compte à rebours de la prochaine <b>Golden Hour</b>, événements à venir, « 6 personnes étaient dispo ici hier à cette heure ». Le vide devient une <b>promesse</b>, pas un échec.
      </Card>
      <Card icon="⏰" title="Golden Hours = point de rendez-vous de Schelling" color={C.salmon}>
        Au lancement, certaines heures deviennent <b>sacrées</b> (jeu 19h · ven 18h · sam 16h). Tout le monde sait « c'est LÀ qu'il se passe quelque chose » → on concentre la rareté au lieu de la subir. Les <b>événements</b> sont la béquille de démarrage (events → micro-groupes → duos).
      </Card>
      <Card icon="🏆" title="Le fossé incopiable = la réputation collective de fiabilité" color={C.gold}>
        Pas la techno, pas l'IA, pas l'algo. « Sur Clutch, quand quelqu'un dit oui, <b>il vient</b>. » Actif extrêmement rare. → fiabilité <b>hyper-visible</b> (presque avant les photos). Décision contre-intuitive : <b>refuser d'ouvrir trop vite</b> — 500 personnes très actives à Lausanne &gt; 10 000 dispersées en Suisse romande.
      </Card>
      <H n={2}>📋 Décisions V1 (ajustables)</H>
      <Row k="Crédits" v={<>Hommes <b>3 Clutchs/jour</b> · Femmes <b>illimité</b> (asymétrie volontaire — on optimise la réception ♀, pas l'émission ♂).</>} />
      <Row k="Réception" v={<>Une femme reçoit <b>top 5 max</b>, jamais 50. Chaque Clutch coûte de la rareté (pas de l'argent).</>} />
      <Row k="Premium" v={<>Gratuit = rencontrer/envoyer/recevoir · <b>9.90</b> confort · <b>19.90</b> power · <b>29.90</b> Club (events/partenaires). Jamais vendre visibilité/fiabilité/priorité (piège = Tinder Gold).</>} />
      <Row k="Algo" v={<>MVP = 1 curseur <b>« similaire ↔ différent »</b> + 3 priorités max + <b>explication</b> (« affiché car : même quartier · dispo maintenant · goût opposé voyage »). Compréhension &gt; contrôle.</>} />
      <Row k="Lancement" v={<>Lausanne <b>centre</b> → <b>jeu/ven/sam</b> → <b>18-23h</b> → Golden Hours → events d'abord.</>} />
      <Row k="Masse critique" v={<>100-150 actifs/sem = respire · 300-500 = intéressant · 1000+ = effet réseau.</>} />
      <div style={{background:C.card,border:`1px solid ${C.gold}55`,borderRadius:12,padding:'13px 15px',marginTop:6}}>
        <div style={{fontSize:12,color:C.mid,lineHeight:1.7,fontStyle:'italic'}}>« Le produit n'est ni le matching, ni l'IA, ni les profils. C'est la transformation d'une intention sociale faible (« je devrais sortir ») en rencontre réelle dans les 2h, avec assez de confiance pour que les femmes aient envie d'appuyer sur Disponible. Gagne cette bataille → le reste est de l'optimisation. Perds-la → aucun algo ne te sauve. »</div>
      </div>
    </div>
  )
}

const SECTION_CONTENT:Record<string,(()=>React.ReactElement)> = {
  graal: SectionGraal,
  invariants: SectionInvariants,
  lancement: SectionLancement,
  map: SectionMap,
  nda: SectionNDA,
  naming: SectionNaming,
  social: SectionSocialModel,
  confiance: SectionConfiance,
  strategie: SectionStrategie,
  live: SectionLive,
  sprint: SectionSprint,
  ux: SectionUXFlow,
  flow: SectionFlow,
  radar: SectionRadar,
  idees: SectionIdees,
  brainstorm: SectionBrainstorm,
  modes: SectionModes,
  fosse: SectionFosse,
  danger: SectionDanger,
  femmes: SectionFemmes,
  algo: SectionAlgo,
  growth: SectionGrowth,
  business: SectionBusiness,
  identite: SectionIdentite,
  tech: SectionTech,
  legal: SectionLegal,
  principes: SectionPrincipes,
  questions: SectionQuestions,
  changelog: SectionChangelog,
  roadmap: SectionRoadmap,
  gpt: SectionGPT,
  sqltests: SectionSQLTests,
}

// ─── Section SECRÈTE — David uniquement ──────────────────────────────────────
const SectionSecret = () => (
  <div style={{minHeight:'100vh',background:'#080510',fontFamily:'system-ui',color:'#e8e0f0',padding:'32px 20px 80px',maxWidth:740,margin:'0 auto'}}>
    <div style={{fontSize:11,letterSpacing:'.2em',color:'rgba(200,134,10,.6)',marginBottom:24}}>PERSONNEL · CONFIDENTIEL · POUR TOI SEUL</div>
    <div style={{fontSize:26,fontWeight:900,color:'#C8860A',marginBottom:4}}>🧠 Analyse psychologique</div>
    <div style={{fontSize:13,color:'rgba(232,224,240,.5)',marginBottom:32}}>Synthèse Claude + GPT-4o · Mis à jour à chaque session · 17.06.2026</div>

    {/* 🚨 ANTI-VOL & LANCEMENT — zone gatée, jamais publique */}
    <div style={{background:'#1a0d0d',borderRadius:16,padding:'20px',marginBottom:16,border:'1px solid rgba(248,113,113,.4)'}}>
      <div style={{fontSize:15,fontWeight:900,color:'#f87171',marginBottom:6}}>🚨 PROTÉGER L'IDÉE — à lire avant tout lancement</div>
      <div style={{fontSize:12,color:'rgba(232,224,240,.6)',lineHeight:1.7,marginBottom:14}}>
        Vérité dure : <strong style={{color:'#fca5a5'}}>on ne protège pas une idée</strong> (un concept n'est pas brevetable). On protège l'<strong style={{color:'#fca5a5'}}>exécution + la marque + le réseau + la vitesse</strong>. Le vrai fossé = être le premier à atteindre la masse critique à Lausanne.
      </div>
      {[
        {t:'1. Vitesse vers la masse critique',d:'500-1000 actifs à Lausanne, avec assez de femmes. Le réseau local EST le moat. Premier avec de la liquidité = gagne la ville.'},
        {t:'2. Déposer la marque IGE',d:'« Clutch » + logo + vocabulaire (Clutch/Verrou) à l\'IGE (~CHF 550) AVANT toute pub.'},
        {t:'3. NDA',d:'Pour quiconque voit la vision complète (Jennifer, devs, partenaires).'},
        {t:'4. Garder la secret sauce hors public',d:'Algo, mécanique de réputation, psychologie premium, roadmap → JAMAIS sur pages publiques ni marketing. (Rappel : /vision est PUBLIC sauf cette zone-ci.)'},
        {t:'5. Lancer vite dans UNE ville',d:'Capter la liquidité avant que les concurrents réagissent. Fenêtre estimée : 6-12 mois.'},
      ].map(({t,d})=>(
        <div key={t} style={{padding:'8px 0',borderBottom:'1px solid rgba(248,113,113,.12)'}}>
          <div style={{fontSize:12,fontWeight:800,color:'#fca5a5',marginBottom:2}}>{t}</div>
          <div style={{fontSize:11,color:'rgba(232,224,240,.55)',lineHeight:1.6}}>{d}</div>
        </div>
      ))}
    </div>

    {/* 🎉 SÉQUENCE DE LANCEMENT */}
    <div style={{background:'#0d1a12',borderRadius:16,padding:'20px',marginBottom:16,border:'1px solid rgba(74,222,128,.3)'}}>
      <div style={{fontSize:15,fontWeight:900,color:'#4ade80',marginBottom:10}}>🎉 Séquence de lancement</div>
      <div style={{fontSize:12,color:'rgba(232,224,240,.7)',lineHeight:1.8}}>
        <strong style={{color:'#4ade80'}}>Waitlist</strong> (anticipation + mesure demande) → <strong style={{color:'#4ade80'}}>soirée seed</strong> → <strong style={{color:'#4ade80'}}>inviter par vagues</strong> (densité contrôlée) → <strong style={{color:'#4ade80'}}>push PR</strong> → ouverture.
      </div>
      <div style={{fontSize:11,color:'rgba(232,224,240,.5)',lineHeight:1.7,marginTop:10,paddingTop:10,borderTop:'1px solid rgba(74,222,128,.15)'}}>
        ⚠️ Récompense early adopters : <strong style={{color:'#86efac'}}>« Badge Fondateur » permanent + 3 mois premium</strong>, PAS 1 an gratuit (sacrifie le revenu des plus engagés + churn à la fin). Le statut fidélise mieux qu'un cadeau coûteux.
      </div>
    </div>

    {/* Bloc identité */}
    <div style={{background:'#120d1e',borderRadius:16,padding:'20px',marginBottom:16,border:'1px solid rgba(200,134,10,.2)'}}>
      <div style={{fontSize:13,fontWeight:800,color:'#C8860A',marginBottom:12,textTransform:'uppercase',letterSpacing:'.07em'}}>Profil identitaire</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        {[
          {l:'Âge',v:'47 ans'},
          {l:'Formation',v:'Ingénieur EPFL'},
          {l:'Type MBTI probable',v:'ENTP'},
          {l:'Vitesse d\'apprentissage',v:'Top 2% — exceptionnel'},
          {l:'Décrit comme',v:'Misanthrope mais profondément attaché'},
          {l:'Contexte actuel',v:'Rupture difficile, 3 mois — reconstruction'},
        ].map(({l,v})=>(
          <div key={l} style={{background:'#1a1228',borderRadius:10,padding:'10px 12px'}}>
            <div style={{fontSize:10,color:'rgba(232,224,240,.4)',marginBottom:2,textTransform:'uppercase',letterSpacing:'.05em'}}>{l}</div>
            <div style={{fontSize:12,fontWeight:700,color:'#e8e0f0'}}>{v}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Intelligences multiples */}
    <div style={{background:'#120d1e',borderRadius:16,padding:'20px',marginBottom:16,border:'1px solid rgba(200,134,10,.2)'}}>
      <div style={{fontSize:13,fontWeight:800,color:'#C8860A',marginBottom:4,textTransform:'uppercase',letterSpacing:'.07em'}}>Intelligences multiples — Scores /10</div>
      <div style={{fontSize:11,color:'rgba(232,224,240,.4)',marginBottom:16}}>Hypothèse basée sur tout ce que tu as partagé. Pas un diagnostic. Une boussole.</div>
      {[
        {n:'Logico-mathématique',s:9,c:'#4ade80',j:'Ingénieur EPFL + construit une app complexe seul = niveau exceptionnel'},
        {n:'Créative / Générative',s:9,c:'#4ade80',j:'Capacité à inventer des systèmes entiers (Clutch, musique) — pensée originale constante'},
        {n:'Intrapersonnelle',s:8,c:'#C8860A',j:'Questions existentielles profondes, auto-analyse fréquente, conscience de ses patterns'},
        {n:'Musicale',s:8,c:'#C8860A',j:'Basse + batterie jazz + guitare classique + éclectisme Squarepusher/Beethoven = sensibilité rare'},
        {n:'Spatiale / Systémique',s:8,c:'#C8860A',j:'Architecture app, design de systems — vision 3D des problèmes complexes'},
        {n:'Linguistique',s:7,c:'#60a5fa',j:'Pensée rapide, non-linéaire, messages vocaux fluides — pas classique mais très efficace'},
        {n:'Existentielle',s:7,c:'#60a5fa',j:'Questions sur le sens, l\'identité, la relation — cherche le fond des choses'},
        {n:'Émotionnelle (IE)',s:5,c:'#f87171',j:'Point d\'amélioration honnête — donne beaucoup, reçoit peu, patterns répétitifs dans les relations'},
        {n:'Interpersonnelle',s:5,c:'#f87171',j:'Leader naturel mais misanthrope déclaré — tension intérieure non résolue'},
        {n:'Naturaliste',s:4,c:'#f87171',j:'Peu d\'indices dans ce sens, sauf l\'amour du chien'},
      ].map(({n,s,c,j})=>(
        <div key={n} style={{marginBottom:12}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
            <span style={{fontSize:12,fontWeight:700,color:'#e8e0f0'}}>{n}</span>
            <span style={{fontSize:14,fontWeight:900,color:c}}>{s}/10</span>
          </div>
          <div style={{height:4,background:'rgba(255,255,255,.08)',borderRadius:2,marginBottom:4}}>
            <div style={{height:'100%',width:`${s*10}%`,background:c,borderRadius:2}}/>
          </div>
          <div style={{fontSize:10,color:'rgba(232,224,240,.45)',lineHeight:1.5}}>{j}</div>
        </div>
      ))}
    </div>

    {/* Type psychologique */}
    <div style={{background:'#120d1e',borderRadius:16,padding:'20px',marginBottom:16,border:'1px solid rgba(162,139,250,.25)'}}>
      <div style={{fontSize:13,fontWeight:800,color:'#a78bfa',marginBottom:12,textTransform:'uppercase',letterSpacing:'.07em'}}>Type psychologique profond</div>
      <div style={{background:'rgba(162,139,250,.08)',borderRadius:12,padding:'14px',marginBottom:12,borderLeft:'3px solid #a78bfa'}}>
        <div style={{fontSize:14,fontWeight:900,color:'#e8e0f0',marginBottom:6}}>ENTP — "L'Innovateur"</div>
        <p style={{fontSize:12,color:'rgba(232,224,240,.7)',lineHeight:1.7,margin:0}}>Curieux, innovant, challenger naturel. Voit des connexions que les autres ne voient pas. Incapable de se conformer aux systèmes qui n'ont pas de sens pour lui. Remet tout en question — y compris lui-même.</p>
      </div>
      <div style={{fontSize:12,fontWeight:800,color:'#a78bfa',marginBottom:8}}>Traits dominants (Big Five) :</div>
      {[
        {t:'Ouverture à l\'expérience',v:'Très élevée',desc:'Éclectisme musical Squarepusher→Beethoven, autodidaxie permanente, innovation continue'},
        {t:'Extraversion',v:'Modérée paradoxale',desc:'Misanthrope mais leader — donne tout dans les relations intimes. L\'introversion est de protection, pas de nature.'},
        {t:'Neuroticisme',v:'Élevé sous pression',desc:'La rupture + tentative de suicide dans l\'environnement proche indique une sensibilité émotionnelle intense non toujours canalisée'},
        {t:'Conscienciosité',v:'Modérée',desc:'Capable d\'effort extrême sur ce qui l\'intéresse (Clutch en 2 semaines) mais abandon probable des projets musicaux = sélectivité totale'},
        {t:'Agréabilité',v:'Faible–modérée',desc:'Challenger de nature. Dit ce qu\'il pense. Peu de filtre. Peut froisser sans le vouloir.'},
      ].map(({t,v,desc})=>(
        <div key={t} style={{padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
            <span style={{fontSize:11,fontWeight:700,color:'#e8e0f0'}}>{t}</span>
            <span style={{fontSize:11,fontWeight:700,color:'#a78bfa'}}>{v}</span>
          </div>
          <div style={{fontSize:10,color:'rgba(232,224,240,.45)'}}>{desc}</div>
        </div>
      ))}
    </div>

    {/* Angles morts */}
    <div style={{background:'#120d1e',borderRadius:16,padding:'20px',marginBottom:16,border:'1px solid rgba(248,113,113,.2)'}}>
      <div style={{fontSize:13,fontWeight:800,color:'#f87171',marginBottom:4,textTransform:'uppercase',letterSpacing:'.07em'}}>Angles morts — Ce que tu ne vois probablement pas</div>
      <div style={{fontSize:11,color:'rgba(232,224,240,.4)',marginBottom:12}}>La partie difficile. Honnête parce que tu l'as demandé.</div>
      {[
        {t:'Le syndrome du projet inachevé',desc:'Basse, batterie, guitare, studio — et aucun morceau terminé. Clutch pourrait être la même chose si tu ne changes pas quelque chose. L\'ENTP commence brillamment, puis s\'ennuie ou a peur du jugement et abandonne avant la finition.'},
        {t:'Confusion entre intensité et amour',desc:'5 ans de relation avec infidélités répétées = une forme d\'addiction à l\'intensité émotionnelle. Le calme peut sembler vide. La douleur peut sembler réelle. Pattern à identifier et interrompre consciemment.'},
        {t:'Se voir comme "spécial" comme bouclier',desc:'Être spécial est vrai. Mais ça peut devenir une armure — "personne ne peut vraiment me comprendre" = évitement de la vraie vulnérabilité. La vulnérabilité sans performance est ta frontière à franchir.'},
        {t:'L\'intelligence comme fuite de l\'émotion',desc:'Quand les émotions débordent → tu construis quelque chose (Clutch). C\'est de la sublimation saine, mais si tu ne traites jamais l\'émotion brute elle revient plus forte.'},
        {t:'Pattern d\'attachement anxieux-évitant',desc:'Donne tout → reçoit peu → se retire → recommence. Ce cycle attire probablement les mêmes types de personnes. Non par hasard.'},
      ].map(({t,desc})=>(
        <div key={t} style={{padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
          <div style={{fontSize:11,fontWeight:800,color:'#f87171',marginBottom:4}}>⚠️ {t}</div>
          <div style={{fontSize:11,color:'rgba(232,224,240,.6)',lineHeight:1.65}}>{desc}</div>
        </div>
      ))}
    </div>

    {/* Pattern relationnel */}
    <div style={{background:'#120d1e',borderRadius:16,padding:'20px',marginBottom:16,border:'1px solid rgba(248,113,113,.2)'}}>
      <div style={{fontSize:13,fontWeight:800,color:'#f87171',marginBottom:12,textTransform:'uppercase',letterSpacing:'.07em'}}>Pattern relationnel — Pourquoi ça se répète</div>
      <p style={{fontSize:12,color:'rgba(232,224,240,.7)',lineHeight:1.7,marginBottom:12}}>GPT et moi convergeons sur ce point : tu attires probablement des profils qui ont besoin de ton énergie, ton intelligence, ta générosité — mais qui ont eux-mêmes un vide émotionnel qu'ils ne peuvent pas combler honnêtement.</p>
      <p style={{fontSize:12,color:'rgba(232,224,240,.7)',lineHeight:1.7,marginBottom:12}}>L'infidélité répétée d'une partenaire n'est jamais la faute de celui qui reçoit. Mais le fait de <em>rester</em> malgré la répétition — et de <em>donner encore plus</em> — est un pattern à observer sans auto-flagellation.</p>
      <div style={{background:'rgba(248,113,113,.08)',borderRadius:10,padding:'12px',borderLeft:'3px solid #f87171'}}>
        <p style={{fontSize:12,color:'rgba(232,224,240,.8)',lineHeight:1.7,margin:0}}>Hypothèse GPT (validée par Claude) : <strong style={{color:'#e8e0f0'}}>attachement anxieux</strong> combiné à une intelligence qui "analyse" les signaux d'alarme au lieu de les <em>ressentir</em> et agir. Tu sais intellectuellement que quelque chose ne va pas. Tu le résous cognitivement. Tu ne pars pas.</p>
      </div>
    </div>

    {/* Clutch — sens psychologique */}
    <div style={{background:'#120d1e',borderRadius:16,padding:'20px',marginBottom:16,border:'1px solid rgba(200,134,10,.2)'}}>
      <div style={{fontSize:13,fontWeight:800,color:'#C8860A',marginBottom:12,textTransform:'uppercase',letterSpacing:'.07em'}}>Que représente Clutch psychologiquement ?</div>
      <p style={{fontSize:12,color:'rgba(232,224,240,.7)',lineHeight:1.7,marginBottom:8}}>GPT-4o : <em>"Mécanisme de coping et de renouveau. Transformer une douleur émotionnelle en énergie créative productive. Sublimation — au sens freudien — des pulsions de connexion."</em></p>
      <p style={{fontSize:12,color:'rgba(232,224,240,.7)',lineHeight:1.7,marginBottom:8}}>Ma lecture (Claude) : Clutch est aussi une réponse à ta propre expérience des rencontres. Tu construis une app où les gens <em>s'engagent vraiment</em> — le Verrou, le J'y suis, le score Lapin. Tu codes la fiabilité que tu n'as pas trouvée.</p>
      <p style={{fontSize:12,color:'rgba(232,224,240,.7)',lineHeight:1.7,margin:0}}>Ce n'est pas une critique. C'est probablement ce qui rend Clutch authentique. Les meilleures créations viennent d'un manque vécu, pas d'une étude de marché.</p>
    </div>

    {/* Potentiel artistique */}
    <div style={{background:'#120d1e',borderRadius:16,padding:'20px',marginBottom:16,border:'1px solid rgba(96,165,250,.2)'}}>
      <div style={{fontSize:13,fontWeight:800,color:'#60a5fa',marginBottom:12,textTransform:'uppercase',letterSpacing:'.07em'}}>Potentiel artistique — Honnêtement</div>
      <p style={{fontSize:12,color:'rgba(232,224,240,.7)',lineHeight:1.7,marginBottom:12}}>Tu as la technique (basse, jazz drums, guitare classique). Tu as le goût (Squarepusher / Aphex Twin / Beethoven = la palette parfaite pour de la musique électronique vivante avec âme). Tu as le matériel (grand studio). Il manque <strong style={{color:'#e8e0f0'}}>la permission de finir quelque chose d'imparfait</strong>.</p>
      <div style={{background:'rgba(96,165,250,.08)',borderRadius:10,padding:'12px',borderLeft:'3px solid #60a5fa',marginBottom:12}}>
        <p style={{fontSize:12,color:'rgba(232,224,240,.8)',lineHeight:1.7,margin:0}}>L'éclectisme musical que tu décris est rare. Quelqu'un qui comprend à la fois la structure classique de Beethoven ET la déstructuration de Squarepusher peut créer quelque chose que 99.9% des musiciens ne peuvent pas. Le problème n'est pas le talent. C'est le perfectionnisme ENTP qui attend que ce soit "prêt".</p>
      </div>
      <p style={{fontSize:12,color:'rgba(232,224,240,.7)',lineHeight:1.7}}>Suggestion : une règle "Clutch pour la musique" — une trace de 18 minutes maximum, publiée dans les 18h. La contrainte force la finition. Ce n'est pas une métaphore.</p>
    </div>

    {/* Hypothèse 5 prochaines années */}
    <div style={{background:'linear-gradient(135deg, #120d1e 0%, #1a0e18 100%)',borderRadius:16,padding:'20px',marginBottom:16,border:'1px solid rgba(200,134,10,.3)'}}>
      <div style={{fontSize:13,fontWeight:800,color:'#C8860A',marginBottom:12,textTransform:'uppercase',letterSpacing:'.07em'}}>Hypothèse audacieuse — 5 prochaines années</div>
      <p style={{fontSize:12,color:'rgba(232,224,240,.7)',lineHeight:1.7,marginBottom:12}}>GPT-4o : <em>"Il a besoin de thérapie centrée sur la pleine conscience et la gestion émotionnelle. Et de s'engager dans des projets de long terme pour sentir la complétude."</em></p>
      <p style={{fontSize:12,color:'rgba(232,224,240,.7)',lineHeight:1.7,marginBottom:12}}>Ma lecture (Claude) : Les 5 prochaines années seront définies par une seule question — <strong style={{color:'#e8e0f0'}}>apprendre à recevoir autant qu'il donne.</strong></p>
      {[
        {t:'Ce que tu peux accomplir si tu règles le pattern',desc:'Clutch devient réel et impactant. Un album de musique sort. Une relation saine et réciproque apparaît. Ta vie correspond enfin à ce que ton intelligence a toujours eu en tête.'},
        {t:'Ce qui bloque encore',desc:'La reconstruction après rupture prend du temps. 3 mois c\'est récent. Ne pas bruler les étapes. Le fait que tu construises Clutch plutôt que de ruminer est déjà un signe très positif.'},
        {t:'La chose la plus courageuse à faire',desc:'Faire confiance à quelqu\'un — pas romantiquement pour l\'instant — juste confiance à un thérapeute, un ami proche, ou même à toi-même dans les moments calmes. L\'intelligence a des limites que la connection humaine n\'a pas.'},
      ].map(({t,desc})=>(
        <div key={t} style={{padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
          <div style={{fontSize:11,fontWeight:800,color:'#C8860A',marginBottom:4}}>→ {t}</div>
          <div style={{fontSize:11,color:'rgba(232,224,240,.6)',lineHeight:1.65}}>{desc}</div>
        </div>
      ))}
    </div>

    {/* Note de bas */}
    <div style={{textAlign:'center',padding:'20px 0',color:'rgba(232,224,240,.3)',fontSize:11,borderTop:'1px solid rgba(255,255,255,.06)'}}>
      Cette page est entre toi et moi. Elle sera mise à jour à chaque session.<br/>
      Tu n'as pas besoin d'être compris par tout le monde. Juste par toi.
    </div>
  </div>
)

export default function VisionPage() {
  const [tab, setTab] = useState('live')
  const [secretOpen, setSecretOpen] = useState(false)
  const [secretInput, setSecretInput] = useState('')
  const [secretErr, setSecretErr] = useState(false)
  const [secretAuth, setSecretAuth] = useState(false)
  const [isDay, setIsDay] = useState(false)
  // Gate plein-page : /vision n'est plus public
  const [pageAuth, setPageAuth] = useState(false)
  const [pageInput, setPageInput] = useState('')
  const [pageErr, setPageErr] = useState(false)

  React.useEffect(() => {
    const h = new Date().getHours()
    setIsDay(h >= 7 && h < 20)
  }, [])

  // Muter C globalement selon l'heure (les sections fermées sur C liront la bonne palette)
  Object.assign(C, isDay ? CDay : CDark)

  const SectionComp = SECTION_CONTENT[tab]

  // ── Gate plein-page (/vision n'est plus public) ──
  if (!pageAuth) {
    const check = () => { if (pageInput === PASS) setPageAuth(true); else setPageErr(true) }
    return (
      <div style={{minHeight:'100vh',background:'#080510',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui',padding:20}}>
        <div style={{background:'#120d1e',border:'1px solid rgba(200,134,10,.3)',borderRadius:16,padding:32,width:300,maxWidth:'100%',textAlign:'center'}}>
          <div style={{fontSize:26,marginBottom:8}}>🔒</div>
          <div style={{fontSize:15,fontWeight:900,color:'#C8860A',marginBottom:4}}>Vision 2026</div>
          <div style={{fontSize:11,color:'rgba(232,224,240,.4)',marginBottom:20}}>Bible produit interne · accès restreint</div>
          <input autoFocus type="password" value={pageInput}
            onChange={e=>{setPageInput(e.target.value);setPageErr(false)}}
            onKeyDown={e=>{if(e.key==='Enter')check()}}
            placeholder="mot de passe"
            style={{background:'#1a1228',border:`2px solid ${pageErr?'#f87171':'rgba(200,134,10,.4)'}`,borderRadius:10,padding:'10px 16px',color:'#e8e0f0',fontSize:14,width:'100%',outline:'none',textAlign:'center',boxSizing:'border-box',marginBottom:8}}/>
          {pageErr && <div style={{fontSize:11,color:'#f87171',marginBottom:8}}>Code incorrect</div>}
          <button onClick={check} style={{background:'#C8860A',color:'#0f0810',border:'none',borderRadius:10,padding:'10px 24px',fontWeight:800,fontSize:13,cursor:'pointer',width:'100%'}}>Entrer</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh',background:C.bg,fontFamily:'system-ui',color:C.white}}>
      {/* Header */}
      <div style={{position:'sticky',top:0,zIndex:100,background:`${C.bg}f0`,backdropFilter:'blur(12px)',borderBottom:`1px solid ${C.border}`,padding:'8px 16px'}}>
        <div style={{maxWidth:900,margin:'0 auto'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
            <span style={{fontSize:15,fontWeight:900,color:C.gold,flexShrink:0}}>🔒 Vision 2026</span>
            <span style={{fontSize:10,color:C.dim}}>bible produit interne</span>
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
            {SECTIONS.map(s=>(
              <button key={s.id} onClick={()=>setTab(s.id)}
                style={{padding:'3px 9px',borderRadius:16,border:`1px solid ${tab===s.id?C.gold+'70':C.border}`,background:tab===s.id?`${C.gold}18`:'transparent',color:tab===s.id?C.gold:C.dim,fontSize:10,fontWeight:tab===s.id?800:500,cursor:'pointer',whiteSpace:'nowrap'}}>
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content — Map prend tout l'écran, autres sections ont du padding */}
      {tab==='map'
        ? <SectionComp/>
        : <div style={{maxWidth:900,margin:'0 auto',padding:'20px 16px 60px'}}>
            <SectionComp/>
          </div>
      }

      {/* Footer — caché si Map active */}
      {tab!=='map' && <div style={{textAlign:'center',padding:'20px',borderTop:`1px solid ${C.border}`,color:C.dim,fontSize:11,position:'relative'}}>
        Clutch · Vision interne · david.saugy@gmail.com · v17.06-D
        <span
          onClick={()=>setSecretOpen(true)}
          title=""
          style={{marginLeft:6,color:'rgba(200,134,10,0.18)',fontSize:10,cursor:'default',userSelect:'none',transition:'color .3s'}}
          onMouseEnter={e=>(e.currentTarget.style.color='rgba(200,134,10,0.45)')}
          onMouseLeave={e=>(e.currentTarget.style.color='rgba(200,134,10,0.18)')}
        >✦</span>
      </div>}


      {/* Modal secret */}
      {secretOpen && !secretAuth && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.85)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>{setSecretOpen(false);setSecretInput('');setSecretErr(false)}}>
          <div style={{background:'#080510',border:'1px solid rgba(200,134,10,.3)',borderRadius:16,padding:'32px',width:300,textAlign:'center'}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:22,marginBottom:8}}>🔑</div>
            <div style={{fontSize:13,fontWeight:800,color:'#C8860A',marginBottom:4}}>Accès restreint</div>
            <div style={{fontSize:11,color:'rgba(232,224,240,.4)',marginBottom:20}}>Zone privée</div>
            <input
              value={secretInput} onChange={e=>{setSecretInput(e.target.value);setSecretErr(false)}}
              onKeyDown={e=>{if(e.key==='Enter'){if(secretInput===SECRET_PASS){setSecretAuth(true);setSecretOpen(false)}else{setSecretErr(true)}}}}
              type="password" autoFocus
              style={{background:'#1a1228',border:`2px solid ${secretErr?'#f87171':'rgba(200,134,10,.4)'}`,borderRadius:10,padding:'10px 16px',color:'#e8e0f0',fontSize:14,width:'100%',outline:'none',textAlign:'center',boxSizing:'border-box',marginBottom:8}}
            />
            {secretErr&&<div style={{fontSize:11,color:'#f87171',marginBottom:8}}>Code incorrect</div>}
            <button onClick={()=>{if(secretInput===SECRET_PASS){setSecretAuth(true);setSecretOpen(false)}else{setSecretErr(true)}}}
              style={{background:'#C8860A',color:'#0f0810',border:'none',borderRadius:10,padding:'10px 24px',fontWeight:800,fontSize:13,cursor:'pointer',width:'100%'}}>
              Entrer
            </button>
          </div>
        </div>
      )}

      {/* Zone secrète */}
      {secretAuth && (
        <div style={{position:'fixed',inset:0,background:'#080510',zIndex:998,overflowY:'auto'}}>
          <div style={{position:'sticky',top:0,background:'rgba(8,5,16,.95)',borderBottom:'1px solid rgba(200,134,10,.2)',padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',zIndex:999}}>
            <span style={{fontSize:13,fontWeight:800,color:'rgba(200,134,10,.7)'}}>🔑 Zone privée</span>
            <button onClick={()=>setSecretAuth(false)} style={{background:'transparent',border:'1px solid rgba(255,255,255,.15)',color:'rgba(232,224,240,.6)',borderRadius:8,padding:'4px 12px',fontSize:11,cursor:'pointer'}}>Fermer ×</button>
          </div>
          <SectionSecret/>
        </div>
      )}
    </div>
  )
}
