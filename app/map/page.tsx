'use client'
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg:'#0a060e', card:'#140c18', card2:'#1c1024',
  gold:'#C8860A', salmon:'#FFBF9E', white:'#f5e8de',
  mid:'rgba(245,232,222,0.7)', dim:'rgba(245,232,222,0.35)',
  green:'#4ade80', orange:'#f59e0b', red:'#f87171',
  blue:'#60a5fa', purple:'#a78bfa', teal:'#2dd4bf',
  pink:'#f472b6', border:'rgba(255,191,158,0.12)',
}

// ─── Node type ─────────────────────────────────────────────────────────────────
type N = {
  id:string; label:string; emoji:string; color:string
  status?:'done'|'todo'|'p2'|'block'; bugs?:number
  eth?:boolean; q?:boolean; premium?:boolean
  detail?:string; children?:N[]
}

// ─── Tree data ─────────────────────────────────────────────────────────────────
const TREE:N = {
  id:'root', label:'CLUTCH', emoji:'✦', color:C.gold,
  children:[
    // ── 1. PREMIER LANCEMENT ──────────────────────────────────────────────
    { id:'launch', label:'Premier lancement', emoji:'🚀', color:C.blue,
      children:[
        { id:'splash', label:'Splash 2.5s\nLogo animé', emoji:'🌟', color:C.blue, status:'done',
          detail:'Logo Clutch fade-in · Tagline "Sois spontané·e" · Pas skippable (trop court)' },
        { id:'choix', label:'Inscription\nou Connexion ?', emoji:'🔀', color:C.blue, status:'done',
          children:[
            // ── INSCRIPTION ──
            { id:'ins', label:'INSCRIPTION', emoji:'📝', color:C.gold,
              children:[
                { id:'ins1', label:'Prénom', emoji:'👤', color:C.gold, status:'done',
                  detail:'2-20 chars · lettres seulement · affiché publiquement' },
                { id:'ins2', label:'Date naissance\n(18+ obligatoire)', emoji:'🎂', color:C.gold, status:'done',
                  detail:'Date picker · validation âge ≥18 · âge affiché, pas la date', eth:true },
                { id:'ins3', label:'Genre +\nOrientation', emoji:'⚧', color:C.gold, status:'todo',
                  detail:'Genre : H/F/Non-binaire/Préfère ne pas dire · Tu cherches : H/F/Tout', eth:true, q:true },
                { id:'ins4', label:'Photos (1-5)', emoji:'📸', color:C.gold, status:'done', bugs:2,
                  detail:'Upload galerie ou caméra (Capacitor) · Photo 1 = principale · Modération manuelle V1' },
                { id:'ins5', label:'Bio + Modes', emoji:'✏️', color:C.gold, status:'todo',
                  detail:'Bio 3-140 chars optionnelle · Modes : Romantique/Amical/Pro/Parents', q:true },
                { id:'ins6', label:'Email + MDP', emoji:'📧', color:C.gold, status:'done',
                  detail:'Supabase Auth · min 8 chars · email = donnée personnelle LPD', eth:true },
                { id:'ins7', label:'⚠️ Vérif email\nNON IMPLÉMENTÉ', emoji:'✉️', color:C.red, status:'block', bugs:2,
                  detail:'BLOQUANT App Store · Faux comptes possibles · Option A: bloquer · Option B: bannière' },
                { id:'ins8', label:'CGU + Privacy\n+ Consentement GPS', emoji:'📋', color:C.gold, status:'todo',
                  detail:'2 checkboxes obligatoires · 1 optionnelle (marketing) · GPS = donnée sensible LPD art.6', eth:true },
                { id:'ins9', label:'Démo animée\n(skippable, 30s)', emoji:'🎬', color:C.gold, status:'todo',
                  detail:'Présence → Clutch → Verrou → J\'y suis · Bouton "Passer" permanent · Re-accessible dans Aide' },
              ]
            },
            // ── CONNEXION ──
            { id:'conn', label:'CONNEXION', emoji:'🔑', color:C.blue,
              children:[
                { id:'conn1', label:'Email + MDP', emoji:'🔑', color:C.blue, status:'done',
                  detail:'Autofill Safari Keychain · Supabase token en localStorage' },
                { id:'conn2', label:'MDP oublié\n→ reset email', emoji:'🔓', color:C.blue, status:'done', bugs:1,
                  detail:'Lien Supabase valable 1h · Deep link iOS à tester sur device réel' },
              ]
            },
          ]
        },
        { id:'tutorial', label:'Tutorial first-time\n(bulles explicatives)', emoji:'💡', color:C.blue, status:'todo', q:true,
          detail:'Bulle Présences → Bulle Clutchs → Bulle disponibilité · Flag onboarding_done en DB · Re-accessible Aide' },
      ]
    },

    // ── 2. PRÉSENCES ──────────────────────────────────────────────────────
    { id:'presences', label:'Présences', emoji:'🗺', color:C.salmon,
      children:[
        { id:'pr_carte', label:'Carte Lausanne\nétoiles animées', emoji:'🌟', color:C.salmon, status:'done', bugs:2,
          detail:'DivIcon animées · étoiles non cliquables (bug) · Realtime Supabase' },
        { id:'pr_filtre', label:'Filtre genre\nH / F / Tous', emoji:'🔍', color:C.salmon, status:'done', bugs:1,
          detail:'Bug : parfois masqué par header (z-index conflict)' },
        { id:'pr_card', label:'Card profil', emoji:'👁', color:C.salmon, status:'done',
          children:[
            { id:'pr_photos', label:'Photos scrollables', emoji:'📸', color:C.salmon, status:'done' },
            { id:'pr_info', label:'Prénom + âge + bio\n+ niveau fiabilité', emoji:'👤', color:C.salmon, status:'done',
              detail:'Niveau fiabilité = emoji + label, JAMAIS le chiffre exact · Distance floue (LPD)' },
            { id:'pr_clutcher', label:'→ Envoyer Clutch', emoji:'⚡', color:C.gold, status:'done' },
            { id:'pr_favori', label:'⭐ Mettre en favori', emoji:'⭐', color:C.salmon, status:'todo',
              detail:'Table user_relations · remonte dans la liste · notif si favori se met dispo' },
            { id:'pr_invisible', label:'🙈 Rendre invisible', emoji:'🙈', color:C.salmon, status:'todo',
              detail:'Vocabulaire : "Rendre invisible" jamais "Bloquer" · Réversible dans paramètres' },
          ]
        },
      ]
    },

    // ── 3. SE METTRE DISPONIBLE ───────────────────────────────────────────
    { id:'dispo', label:'Se mettre disponible', emoji:'🟢', color:C.green,
      children:[
        { id:'d_toggle', label:'Toggle ON/OFF', emoji:'🔘', color:C.green, status:'done', bugs:1,
          detail:'Bug connu : Supabase .update() silencieux si profil inexistant → fix : .select() + upsert fallback' },
        { id:'d_heure', label:'Molette heure\n(max +18h)', emoji:'⏰', color:C.green, status:'done',
          detail:'Contrainte structurelle Clutch : 18h max depuis maintenant · pas de RDV dans 3 jours' },
        { id:'d_gps', label:'Permission GPS\n(Capacitor)', emoji:'📍', color:C.green, status:'done',
          detail:'GPS refusé → disponibilité OK mais J\'y suis bloqué plus tard → gérer gracieusement', eth:true },
        { id:'d_realtime', label:'Apparaît en temps réel\ndans Présences des autres', emoji:'⚡', color:C.green, status:'done' },
        { id:'d_zone', label:'Zone déplacement', emoji:'📏', color:C.green, status:'todo', q:true,
          detail:'"Centre-ville seulement" · "Tout Lausanne" · Option premium : rayon étendu ?' },
        { id:'d_fantome', label:'Mode fantôme\n💎 Premium', emoji:'👻', color:C.green, status:'todo', premium:true,
          detail:'Disponible mais invisible à certaines personnes · Contrôle avancé = feature premium naturelle pour femmes' },
      ]
    },

    // ── 4. FLOW CLUTCH → RDV ──────────────────────────────────────────────
    { id:'flow', label:'Flow Clutch → RDV', emoji:'⚡', color:C.purple,
      children:[
        // Envoyer
        { id:'f_send', label:'Envoyer un Clutch', emoji:'⚡', color:C.purple, status:'done',
          children:[
            { id:'fs_lieu', label:'Lieu\n(liste suggérés + libre)', emoji:'📍', color:C.purple, status:'done' },
            { id:'fs_heure', label:'Heure\n(<18h contrainte)', emoji:'⏰', color:C.purple, status:'done' },
            { id:'fs_msg', label:'Message\n(140 chars optionnel)', emoji:'💬', color:C.purple, status:'done' },
            { id:'fs_alerte', label:'⚠️ Alerte distance/temps\nnon implémentée', emoji:'⚠️', color:C.red, status:'todo', bugs:1,
              detail:'Si lieu à 20min et heure dans 15min → aucun avertissement · Feature lost à réimplémenter' },
          ]
        },
        // Réponse
        { id:'f_reponse', label:'Réponse de B\n(4 chemins)', emoji:'📨', color:C.purple, status:'done',
          children:[
            { id:'fr_ok', label:'✅ Accepte\n→ Verrou créé', emoji:'✅', color:C.green, status:'done' },
            { id:'fr_contre', label:'↩️ Contre-Clutch\nautre lieu/heure', emoji:'↩️', color:C.orange, status:'done', bugs:1,
              detail:'Codé mais UI à polir · bottom sheet sur le Clutch reçu' },
            { id:'fr_non', label:'❌ Refuse\nA reste dispo', emoji:'❌', color:C.red, status:'done' },
            { id:'fr_exp', label:'⌛ Expire (2h)\npénalité algo ×3', emoji:'⌛', color:C.dim, status:'done',
              detail:'3 ignores consécutifs → shadow downgrade invisible' },
          ]
        },
        // Verrou
        { id:'f_verrou', label:'Verrou actif', emoji:'🔒', color:C.purple, status:'done',
          children:[
            { id:'fv_radar', label:'ProximityRadar V2', emoji:'📡', color:C.teal, status:'todo',
              children:[
                { id:'fvr1', label:'Zone 1 >300m\ncap directionnel', emoji:'🔵', color:C.teal, status:'todo' },
                { id:'fvr2', label:'Zone 2 300→50m\nphotos s\'éclaircissent', emoji:'🟡', color:C.teal, status:'todo' },
                { id:'fvr3', label:'Zone finale 50→0\nhaptique · attraction', emoji:'🔴', color:C.teal, status:'todo' },
              ]
            },
            { id:'fv_notif', label:'Notif -1h\n+ notif -15min', emoji:'🔔', color:C.purple, status:'done' },
            { id:'fv_modifier', label:'Modifier lieu\n(accord mutuel)', emoji:'✏️', color:C.red, status:'todo', bugs:1,
              detail:'Feature lost à réimplémenter · Cas réel : "le café est fermé"' },
            { id:'fv_annuler', label:'Annuler\n(avec motif)', emoji:'❌', color:C.purple, status:'done' },
          ]
        },
        // J'y suis
        { id:'f_jysuis', label:"J'y suis\nGPS <100m · -15min→+30min", emoji:'📍', color:C.gold, status:'todo',
          children:[
            { id:'fj1', label:'✅ Les deux arrivent\n+2 pts fiabilité', emoji:'✅', color:C.green, status:'todo',
              detail:'Animation fusion orbes → écran VOUS ÊTES LÀ · Timer 2h démarre' },
            { id:'fj2', label:'⏳ A arrive\nB en route', emoji:'⏳', color:C.orange, status:'todo',
              detail:'Photo A locke au centre · Notif push à B +5min et +10min' },
            { id:'fj3', label:'🔕 Aucun\nne clique', emoji:'🔕', color:C.dim, status:'todo',
              detail:'Notif aux deux à l\'heure du RDV · Relance +15min · Vérif GPS auto' },
            { id:'fj4', label:'⚠️ Retard\nannoncé', emoji:'⚠️', color:C.orange, status:'todo',
              detail:'B clique Retard → modal durée → A choisit d\'attendre ou annuler · -1pt B' },
            { id:'fj5', label:'🐇 Lapin\nB absent', emoji:'🐇', color:C.red, status:'todo',
              detail:'GPS B vérifié · Si > 500m après 30min → lapin proposé · -5pts B (×2 récidive)' },
            { id:'fj6', label:'💀 Lapin\nmutuel', emoji:'💀', color:C.red, status:'todo',
              detail:'GPS des deux loin du lieu · Annulation mutuelle proposée · -1pt chacun' },
          ]
        },
        // Rencontre
        { id:'f_rencontre', label:'Rencontre\n(timer 2h)', emoji:'🎉', color:C.green, status:'todo',
          children:[
            { id:'fren1', label:'Timer 2h visible\npour les deux', emoji:'⏱', color:C.green, status:'todo' },
            { id:'fren2', label:'Bouton Terminer\n(accord mutuel)', emoji:'🏁', color:C.green, status:'todo',
              detail:'Un seul appuie → demande confirmation à l\'autre · Si refus : RDV continue' },
            { id:'fren3', label:'Auto-clôture 2h\nsi pas utilisé', emoji:'⌛', color:C.green, status:'todo' },
          ]
        },
        // Feedback
        { id:'f_feedback', label:'Feedback\n(3h après fermeture)', emoji:'📝', color:C.purple, status:'todo',
          children:[
            { id:'ff1', label:'Double-blind\nrévélation simultanée', emoji:'🙈', color:C.purple, status:'todo' },
            { id:'ff2', label:'⚠️ App en flou\nsi non fait', emoji:'🌫', color:C.red, status:'todo', bugs:1,
              detail:'NON IMPLÉMENTÉ · Priorité haute avant App Store' },
            { id:'ff3', label:'3 questions\n(ponctualité/emoji/reclucher)', emoji:'❓', color:C.purple, status:'todo' },
            { id:'ff4', label:'Oui/Oui\n→ Favoris mutuels', emoji:'⭐', color:C.green, status:'todo' },
            { id:'ff5', label:'Signalement\n→ review manuelle', emoji:'🚨', color:C.red, status:'todo' },
            { id:'ff6', label:'Cooling off 48h\naprès feedback', emoji:'❄️', color:C.blue, status:'todo' },
          ]
        },
      ]
    },

    // ── 5. MODES DE RENCONTRE ──────────────────────────────────────────────
    { id:'modes', label:'Modes de rencontre', emoji:'👥', color:C.teal,
      children:[
        { id:'mo_rom', label:'💜 Romantique\n(actuel, V1)', emoji:'💜', color:C.purple, status:'done' },
        { id:'mo_ami', label:'🤝 Amical\n(même flow)', emoji:'🤝', color:C.blue, status:'todo' },
        { id:'mo_pro', label:'💼 Pro\n+ Mission Express', emoji:'💼', color:C.teal, status:'todo',
          children:[
            { id:'mp1', label:'Profil métier\n+ type mission', emoji:'💼', color:C.teal, status:'todo' },
            { id:'mp2', label:'Durée flexible\n30min/1h/2h', emoji:'⏰', color:C.teal, status:'todo' },
            { id:'mp3', label:'Feedback qualitatif\n(pas de note sur 5)', emoji:'⭐', color:C.teal, status:'todo', q:true },
          ]
        },
        { id:'mo_par', label:'👶 Parents\n(enfants anonymes)', emoji:'👶', color:C.orange, status:'todo', eth:true,
          children:[
            { id:'mpar1', label:'Profil enfant\nâge + énergie (PAS photo)', emoji:'🚫', color:C.orange, status:'todo', eth:true,
              detail:'RÈGLE ABSOLUE : aucune photo enfant · Sécurité by design' },
            { id:'mpar2', label:'Activités saisonnières\nauto-suggérées', emoji:'🌿', color:C.orange, status:'todo', q:true },
          ]
        },
        { id:'mo_evt', label:'🎉 Events\n(sans ProximityRadar)', emoji:'🎉', color:C.gold, status:'todo',
          children:[
            { id:'mev1', label:'Créer event\n(20s max : icône+lieu+heure)', emoji:'✏️', color:C.gold, status:'todo',
              detail:'GPT ⭐⭐⭐ : "Event vivant" = 3 présents MAINTENANT pas 12 intéressés' },
            { id:'mev2', label:'Rejoindre\n+ check-in GPS', emoji:'✋', color:C.gold, status:'todo' },
            { id:'mev3', label:'Event vivant\n(présents réels)', emoji:'👁', color:C.gold, status:'todo', q:true },
          ]
        },
      ]
    },

    // ── 6. SCORE FIABILITÉ ─────────────────────────────────────────────────
    { id:'fiab', label:'Score Fiabilité', emoji:'⭐', color:C.green,
      children:[
        { id:'fi1', label:'4 niveaux\n(jamais le chiffre)', emoji:'📊', color:C.green, status:'done',
          detail:'Niveau = emoji + label ex. "Très fiable 🌟" · Le score exact est interne uniquement' },
        { id:'fi2', label:'Ponctualité\n+2 pts', emoji:'⏰', color:C.green, status:'todo' },
        { id:'fi3', label:'Lapin -5 pts\n(×2 récidive)', emoji:'🐇', color:C.red, status:'todo' },
        { id:'fi4', label:'Shadow downgrade\ninvisible (algo)', emoji:'👻', color:C.green, status:'todo',
          detail:'3 ignores consécutifs → visibilité réduite en silence · Jamais affiché' },
        { id:'fi5', label:'Annulation tardive\n-3 pts (<2h avant)', emoji:'❌', color:C.orange, status:'todo' },
      ]
    },

    // ── 7. PROFIL & PARAMÈTRES ────────────────────────────────────────────
    { id:'profil', label:'Profil & Paramètres', emoji:'👤', color:C.salmon,
      children:[
        { id:'pp1', label:'Modifier\nprofil / photos', emoji:'✏️', color:C.salmon, status:'done' },
        { id:'pp2', label:'Historique Clutchs\n(profil visible)', emoji:'📚', color:C.orange, status:'todo', bugs:1,
          detail:'Design peu lisible · Profil de l\'autre doit rester même si compte supprimé (anonymiser)' },
        { id:'pp3', label:'⚠️ SOS Sécurité\n1 tap → SMS + position', emoji:'🚨', color:C.red, status:'todo', bugs:1,
          detail:'BOUTON DISPARU lors d\'un refactor · Risque rejet App Store · Contacts urgence à configurer' },
        { id:'pp4', label:'Liste personnes\ninvisibles', emoji:'🙈', color:C.salmon, status:'todo' },
        { id:'pp5', label:'⚠️ Supprimer compte\n(obligatoire App Store)', emoji:'🗑', color:C.red, status:'todo',
          detail:'Edge Function delete-account · ~30min à coder · OBLIGATOIRE pour soumission' },
        { id:'pp6', label:'Paramètres\nnotifs / zone / prefs', emoji:'⚙️', color:C.salmon, status:'done' },
      ]
    },

    // ── 8. PREMIUM ────────────────────────────────────────────────────────
    { id:'premium', label:'💎 Premium\nCHF 19.90/mois', emoji:'💎', color:C.gold, premium:true,
      children:[
        { id:'pre1', label:'Apple IAP\n(30% commission)', emoji:'🍎', color:C.gold, status:'todo',
          detail:'Obligatoire App Store · Prix IDENTIQUES H et F (décision éthique 17.06)' },
        { id:'pre2', label:'Features premium\n(à définir avec Mel)', emoji:'❓', color:C.gold, status:'todo', q:true,
          detail:'Différenciées par USAGE naturel, pas par genre · Ex: femmes → contrôle · hommes → volume' },
        { id:'pre3', label:'Clutch Driver\n(partenaires bars)', emoji:'🏪', color:C.gold, status:'todo', q:true },
        { id:'pre4', label:'Webhook Apple IAP\n→ update plan Supabase', emoji:'🔄', color:C.gold, status:'todo' },
      ]
    },
  ]
}

// ─── Layout ────────────────────────────────────────────────────────────────────
const NW = 136, NH = 50, HG = 14, VG = 72

function measure(n:N):number {
  if (!n.children?.length) return NW
  const w = n.children.reduce((s,c)=>s+measure(c),0) + HG*(n.children.length-1)
  return Math.max(NW, w)
}

type Pos = {x:number,y:number}

function buildLayout(root:N):{pos:Record<string,Pos>,W:number,H:number} {
  const pos:Record<string,Pos> = {}
  let maxY = 0

  function place(n:N, x:number, y:number) {
    pos[n.id] = {x, y}
    if (y > maxY) maxY = y
    if (!n.children?.length) return
    const tw = n.children.reduce((s,c)=>s+measure(c),0) + HG*(n.children.length-1)
    let cx = x - tw/2
    for (const c of n.children) {
      const cw = measure(c)
      place(c, cx+cw/2, y+NH+VG)
      cx += cw+HG
    }
  }

  const W = measure(root)
  place(root, W/2, 30)
  return {pos, W, H: maxY+NH+40}
}

function flatNodes(n:N):N[] {
  return [n, ...(n.children?.flatMap(flatNodes)??[])]
}

function collectLines(n:N, pos:Record<string,Pos>):{x1:number,y1:number,x2:number,y2:number,color:string}[] {
  const lines:{x1:number,y1:number,x2:number,y2:number,color:string}[] = []
  function walk(node:N) {
    if (!node.children) return
    const p = pos[node.id]
    for (const c of node.children) {
      const cp = pos[c.id]
      lines.push({x1:p.x, y1:p.y+NH/2, x2:cp.x, y2:cp.y-NH/2, color:c.color})
      walk(c)
    }
  }
  walk(n)
  return lines
}

// ─── Status config ─────────────────────────────────────────────────────────────
const ST = {
  done:  {label:'✅',   bg:'rgba(74,222,128,.15)',  border:'rgba(74,222,128,.4)'},
  todo:  {label:'🔨',   bg:'rgba(245,158,11,.12)',  border:'rgba(245,158,11,.35)'},
  p2:    {label:'🔵',   bg:'rgba(96,165,250,.12)',  border:'rgba(96,165,250,.35)'},
  block: {label:'🚫',   bg:'rgba(248,113,113,.18)', border:'rgba(248,113,113,.5)'},
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function MapPage() {
  const {pos, W, H} = useMemo(()=>buildLayout(TREE),[])
  const lines = useMemo(()=>collectLines(TREE,pos),[pos])
  const allNodes = useMemo(()=>flatNodes(TREE),[])

  const [zoom, setZoom] = useState(0.55)
  const [pan, setPan] = useState<Pos>({x:0,y:0})
  const [selected, setSelected] = useState<string|null>(null)
  const dragging = useRef(false)
  const lastMouse = useRef<Pos>({x:0,y:0})
  const lastTouch = useRef<Pos>({x:0,y:0})
  const containerRef = useRef<HTMLDivElement>(null)

  // Initial centering
  useEffect(()=>{
    const vw = window.innerWidth, vh = window.innerHeight
    const z = Math.min(0.65, vw/(W*1.1), vh/(H*1.1))
    setZoom(z)
    setPan({x:(vw-W*z)/2, y:20})
  },[W,H])

  const onWheel = useCallback((e:React.WheelEvent)=>{
    e.preventDefault()
    const delta = e.deltaY<0?1.12:0.89
    const rect = containerRef.current!.getBoundingClientRect()
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
    setZoom(z=>{
      const nz = Math.min(3,Math.max(0.1,z*delta))
      setPan(p=>({x: mx-(mx-p.x)*(nz/z), y: my-(my-p.y)*(nz/z)}))
      return nz
    })
  },[])

  const onMouseDown = useCallback((e:React.MouseEvent)=>{
    if ((e.target as HTMLElement).closest('[data-node]')) return
    dragging.current=true; lastMouse.current={x:e.clientX,y:e.clientY}
  },[])
  const onMouseMove = useCallback((e:React.MouseEvent)=>{
    if (!dragging.current) return
    setPan(p=>({x:p.x+(e.clientX-lastMouse.current.x), y:p.y+(e.clientY-lastMouse.current.y)}))
    lastMouse.current={x:e.clientX,y:e.clientY}
  },[])
  const onMouseUp = useCallback(()=>{dragging.current=false},[])

  const onTouchStart = useCallback((e:React.TouchEvent)=>{
    lastTouch.current={x:e.touches[0].clientX, y:e.touches[0].clientY}
  },[])
  const onTouchMove = useCallback((e:React.TouchEvent)=>{
    e.preventDefault()
    setPan(p=>({x:p.x+(e.touches[0].clientX-lastTouch.current.x), y:p.y+(e.touches[0].clientY-lastTouch.current.y)}))
    lastTouch.current={x:e.touches[0].clientX, y:e.touches[0].clientY}
  },[])

  const fitScreen = ()=>{
    const vw=window.innerWidth, vh=window.innerHeight
    const z=Math.min(0.65,vw/(W*1.1),vh/(H*1.1))
    setZoom(z); setPan({x:(vw-W*z)/2, y:20})
  }

  const selectedNode = selected ? allNodes.find(n=>n.id===selected) : null

  return (
    <div style={{position:'fixed',inset:0,background:C.bg,fontFamily:'system-ui',overflow:'hidden',userSelect:'none'}}>

      {/* Controls */}
      <div style={{position:'fixed',top:12,left:12,zIndex:100,display:'flex',gap:8,alignItems:'center'}}>
        <div style={{background:'rgba(10,6,14,.9)',backdropFilter:'blur(12px)',border:`1px solid ${C.border}`,borderRadius:12,padding:'8px 14px',display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:15,fontWeight:900,color:C.gold}}>✦ CLUTCH</span>
          <span style={{fontSize:10,color:C.dim}}>Map complète</span>
        </div>
        <button onClick={fitScreen} style={{background:'rgba(10,6,14,.9)',border:`1px solid ${C.border}`,borderRadius:10,padding:'7px 12px',color:C.mid,fontSize:11,cursor:'pointer',backdropFilter:'blur(8px)'}}>⊞ Fit</button>
        <button onClick={()=>setZoom(z=>Math.min(3,z*1.2))} style={{background:'rgba(10,6,14,.9)',border:`1px solid ${C.border}`,borderRadius:10,padding:'7px 10px',color:C.mid,fontSize:13,cursor:'pointer'}}>+</button>
        <button onClick={()=>setZoom(z=>Math.max(0.1,z*0.8))} style={{background:'rgba(10,6,14,.9)',border:`1px solid ${C.border}`,borderRadius:10,padding:'7px 10px',color:C.mid,fontSize:13,cursor:'pointer'}}>−</button>
        <span style={{fontSize:10,color:C.dim,background:'rgba(10,6,14,.8)',padding:'5px 8px',borderRadius:8,border:`1px solid ${C.border}`}}>{Math.round(zoom*100)}%</span>
      </div>

      {/* Legend */}
      <div style={{position:'fixed',top:12,right:12,zIndex:100,background:'rgba(10,6,14,.9)',backdropFilter:'blur(12px)',border:`1px solid ${C.border}`,borderRadius:12,padding:'10px 14px',display:'flex',flexDirection:'column',gap:5}}>
        <div style={{fontSize:9,fontWeight:800,color:C.gold,letterSpacing:'.08em',marginBottom:2}}>LÉGENDE</div>
        {Object.entries(ST).map(([k,v])=>(
          <div key={k} style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:11}}>{v.label}</span>
            <span style={{fontSize:9,color:C.dim,textTransform:'capitalize'}}>{k==='done'?'Codé':k==='todo'?'À coder':k==='p2'?'Phase 2':'Bloquant'}</span>
          </div>
        ))}
        <div style={{height:1,background:C.border,margin:'3px 0'}}/>
        <div style={{display:'flex',alignItems:'center',gap:6}}><span style={{fontSize:10}}>⚖️</span><span style={{fontSize:9,color:C.dim}}>Éthique/légal</span></div>
        <div style={{display:'flex',alignItems:'center',gap:6}}><span style={{fontSize:10}}>❓</span><span style={{fontSize:9,color:C.dim}}>À valider</span></div>
        <div style={{display:'flex',alignItems:'center',gap:6}}><span style={{fontSize:10}}>🐛</span><span style={{fontSize:9,color:C.dim}}>Bugs connus</span></div>
        <div style={{display:'flex',alignItems:'center',gap:6}}><span style={{fontSize:10}}>💎</span><span style={{fontSize:9,color:C.dim}}>Premium</span></div>
        <div style={{height:1,background:C.border,margin:'3px 0'}}/>
        <div style={{fontSize:9,color:C.dim}}>Molette = zoom</div>
        <div style={{fontSize:9,color:C.dim}}>Drag = naviguer</div>
        <div style={{fontSize:9,color:C.dim}}>Clic nœud = détail</div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        style={{position:'absolute',inset:0,cursor:dragging.current?'grabbing':'grab'}}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove as any}
      >
        <div style={{
          position:'absolute',
          transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
          transformOrigin:'0 0',
          width:W, height:H,
        }}>
          {/* SVG lines */}
          <svg style={{position:'absolute',top:0,left:0,width:W,height:H,pointerEvents:'none',overflow:'visible'}}>
            <defs>
              {allNodes.map(n=>(
                <marker key={n.id} id={`arrow-${n.id}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill={n.color} opacity={0.4}/>
                </marker>
              ))}
            </defs>
            {lines.map((l,i)=>{
              const mx = (l.x1+l.x2)/2
              const my1 = l.y1+(l.y2-l.y1)*0.35
              const my2 = l.y1+(l.y2-l.y1)*0.65
              return (
                <path key={i}
                  d={`M ${l.x1} ${l.y1} C ${l.x1} ${my1} ${l.x2} ${my2} ${l.x2} ${l.y2}`}
                  stroke={l.color} strokeWidth="1.5" fill="none" opacity={0.3}
                  strokeDasharray={undefined}
                />
              )
            })}
          </svg>

          {/* Nodes */}
          {allNodes.map(n=>{
            const p = pos[n.id]
            if (!p) return null
            const isSelected = selected===n.id
            const st = n.status ? ST[n.status] : undefined
            const isRoot = n.id==='root'
            const lines2 = n.label.split('\n')

            return (
              <div
                key={n.id}
                data-node="1"
                onClick={()=>setSelected(isSelected?null:n.id)}
                style={{
                  position:'absolute',
                  left:p.x - NW/2, top:p.y - NH/2,
                  width:NW, height:NH,
                  borderRadius:isRoot?14:10,
                  background:isRoot?`linear-gradient(135deg,${C.gold}30,${C.gold}15)`:isSelected?`${n.color}22`:C.card,
                  border:`${isSelected?2:1}px solid ${isSelected?n.color:isRoot?`${C.gold}60`:st?st.border:`${n.color}30`}`,
                  cursor:'pointer',
                  display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                  padding:'3px 6px',
                  boxShadow:isSelected?`0 0 16px ${n.color}40`:isRoot?`0 0 24px ${C.gold}30`:undefined,
                  transition:'border .15s, box-shadow .15s, background .15s',
                  zIndex:isSelected?10:1,
                }}
              >
                {/* Main label */}
                <div style={{display:'flex',alignItems:'center',gap:3,marginBottom:lines2.length>1?0:1}}>
                  <span style={{fontSize:isRoot?18:13,lineHeight:1}}>{n.emoji}</span>
                  {isRoot && <span style={{fontSize:14,fontWeight:900,color:C.gold,letterSpacing:'.12em'}}>{n.label}</span>}
                </div>
                {!isRoot && lines2.map((line,i)=>(
                  <div key={i} style={{fontSize:9,fontWeight:i===0?700:500,color:i===0?C.white:C.dim,textAlign:'center',lineHeight:1.3,maxWidth:NW-8}}>{line}</div>
                ))}
                {/* Badges row */}
                <div style={{display:'flex',gap:2,marginTop:2,flexWrap:'wrap',justifyContent:'center'}}>
                  {st && <span style={{fontSize:8,padding:'1px 4px',borderRadius:5,background:st.bg,color:n.status==='done'?C.green:n.status==='block'?C.red:C.orange,fontWeight:700}}>{st.label}</span>}
                  {n.bugs && <span style={{fontSize:8,padding:'1px 4px',borderRadius:5,background:`${C.red}20`,color:C.red,fontWeight:700}}>🐛{n.bugs}</span>}
                  {n.eth && <span style={{fontSize:8,padding:'1px 3px',borderRadius:5,background:'rgba(212,160,23,.2)',color:'#d4a017'}}>⚖️</span>}
                  {n.q && <span style={{fontSize:8,padding:'1px 3px',borderRadius:5,background:`${C.purple}20`,color:C.purple}}>❓</span>}
                  {n.premium && <span style={{fontSize:8,padding:'1px 3px',borderRadius:5,background:`${C.gold}20`,color:C.gold}}>💎</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail panel */}
      {selectedNode && (
        <div style={{
          position:'fixed',bottom:16,left:'50%',transform:'translateX(-50%)',
          background:'rgba(10,6,14,.95)',backdropFilter:'blur(16px)',
          border:`1px solid ${selectedNode.color}50`,borderRadius:16,
          padding:'14px 18px',maxWidth:500,width:'calc(100% - 32px)',zIndex:200,
          boxShadow:`0 4px 32px ${selectedNode.color}20`,
        }}>
          <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
            <span style={{fontSize:22,lineHeight:1,flexShrink:0}}>{selectedNode.emoji}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:800,color:C.white,marginBottom:4}}>{selectedNode.label.replace('\n',' ')}</div>
              {selectedNode.detail && <div style={{fontSize:11,color:C.mid,lineHeight:1.6}}>{selectedNode.detail}</div>}
              <div style={{display:'flex',gap:6,marginTop:8,flexWrap:'wrap'}}>
                {selectedNode.status && <span style={{fontSize:10,padding:'2px 8px',borderRadius:8,background:ST[selectedNode.status].bg,color:selectedNode.status==='done'?C.green:selectedNode.status==='block'?C.red:C.orange,fontWeight:700}}>{ST[selectedNode.status].label} {selectedNode.status==='done'?'Codé':selectedNode.status==='todo'?'À coder':selectedNode.status==='p2'?'Phase 2':'Bloquant'}</span>}
                {selectedNode.bugs && <span style={{fontSize:10,padding:'2px 8px',borderRadius:8,background:`${C.red}20`,color:C.red,fontWeight:700}}>🐛 {selectedNode.bugs} bug{selectedNode.bugs>1?'s':''}</span>}
                {selectedNode.eth && <span style={{fontSize:10,padding:'2px 8px',borderRadius:8,background:'rgba(212,160,23,.2)',color:'#d4a017',fontWeight:700}}>⚖️ Question éthique/légale</span>}
                {selectedNode.q && <span style={{fontSize:10,padding:'2px 8px',borderRadius:8,background:`${C.purple}20`,color:C.purple,fontWeight:700}}>❓ Décision en attente</span>}
                {selectedNode.premium && <span style={{fontSize:10,padding:'2px 8px',borderRadius:8,background:`${C.gold}20`,color:C.gold,fontWeight:700}}>💎 Premium</span>}
              </div>
            </div>
            <button onClick={()=>setSelected(null)} style={{background:'transparent',border:'none',color:C.dim,fontSize:18,cursor:'pointer',flexShrink:0,padding:0,lineHeight:1}}>×</button>
          </div>
        </div>
      )}

      {/* Node count footer */}
      <div style={{position:'fixed',bottom:12,right:12,fontSize:9,color:C.dim,zIndex:100}}>
        {allNodes.length} nœuds · {lines.length} connexions
      </div>
    </div>
  )
}
