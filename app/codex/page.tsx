'use client'
import { useState, useEffect } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// CODEX CLUTCH — la "Bible" : l'Histoire (roman), l'Architecture, les Algorithmes,
// le Lexique du code, les Paramètres réglables, et le Journal brut.
// Page isolée, protégée par mot de passe. N'affecte JAMAIS l'app (aucun import app2).
// Vivant : on l'enrichit à chaque grande étape. Demandé par David le 25.06.
// ─────────────────────────────────────────────────────────────────────────────

const PWD = 'clutch2026!'
const C = {
  bg: '#2A0F22', card: '#3a1830', cardSoft: 'rgba(255,255,255,.04)',
  salmon: '#FFBF9E', orange: '#E27C00', text: '#F5E8DE', mid: 'rgba(245,232,222,.62)',
  green: '#77BC1F', border: 'rgba(255,191,158,.15)', revel: '#E27C00', todo: '#77BC1F',
}

function Lock({ onUnlock }: { onUnlock: () => void }) {
  const [val, setVal] = useState(''); const [err, setErr] = useState(false)
  const check = () => { if (val === PWD) { try { localStorage.setItem('codex_ok', '1') } catch {} onUnlock() } else { setErr(true); setVal(''); setTimeout(() => setErr(false), 900) } }
  return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'-apple-system,sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:30, fontWeight:900, letterSpacing:'-.05em', marginBottom:8 }}><span style={{color:C.salmon}}>CLU</span><span style={{color:C.orange}}>TCH</span> <span style={{fontSize:15,color:'rgba(255,191,158,.4)'}}>CODEX</span></div>
        <div style={{ color:C.mid, fontSize:12, marginBottom:28 }}>La Bible du code, des algorithmes et de l'histoire</div>
        <input autoFocus type="password" value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>e.key==='Enter'&&check()} placeholder="mot de passe"
          style={{ background: err?'#450a0a':'#3D1A33', border:`1px solid ${err?'#ef4444':C.border}`, borderRadius:12, padding:'12px 20px', fontSize:16, color:C.text, outline:'none', textAlign:'center', width:220, fontFamily:'inherit' }} />
        <div style={{ marginTop:16 }}><button onClick={check} style={{ background:C.orange, color:'#fff', border:'none', borderRadius:10, padding:'10px 30px', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>Entrer</button></div>
      </div>
    </div>
  )
}

// ── Petits composants de mise en page ──
const H = ({children}:{children:any}) => <h2 style={{fontSize:19,fontWeight:900,color:C.salmon,margin:'26px 0 10px',letterSpacing:'-.01em'}}>{children}</h2>
const P = ({children,style}:{children:any,style?:any}) => <p style={{fontSize:14.5,lineHeight:1.72,color:C.text,margin:'0 0 12px',...style}}>{children}</p>
const Revel = ({children}:{children:any}) => <div style={{background:'linear-gradient(135deg,rgba(226,124,0,.16),rgba(226,124,0,.05))',border:`1px solid ${C.revel}55`,borderLeft:`3px solid ${C.revel}`,borderRadius:12,padding:'13px 16px',margin:'14px 0',fontSize:14.5,lineHeight:1.65,color:C.text}}><span style={{fontWeight:900,color:C.orange}}>💡 Révélation — </span>{children}</div>
const Todo = ({children}:{children:any}) => <div style={{background:'rgba(119,188,31,.08)',border:`1px dashed ${C.todo}77`,borderRadius:12,padding:'11px 15px',margin:'10px 0',fontSize:13.5,lineHeight:1.6,color:C.text}}><span style={{fontWeight:900,color:C.green}}>⏳ À implémenter — </span>{children}</div>
const Code = ({children}:{children:any}) => <pre style={{background:'#1c0a16',border:`1px solid ${C.border}`,borderRadius:10,padding:'12px 14px',fontSize:12.5,color:C.salmon,overflowX:'auto',margin:'10px 0',fontFamily:'ui-monospace,Menlo,monospace',lineHeight:1.5}}>{children}</pre>
const Def = ({mot,children}:{mot:string,children:any}) => <div style={{margin:'0 0 14px',padding:'12px 15px',background:C.cardSoft,borderRadius:12,border:`1px solid ${C.border}`}}><div style={{fontWeight:900,color:C.orange,fontSize:14.5,marginBottom:3}}>{mot}</div><div style={{fontSize:13.5,lineHeight:1.6,color:C.text}}>{children}</div></div>

// ════════════════════════ CONTENU DES ONGLETS ════════════════════════

function Histoire() {
  return (<div>
    <H>L'histoire de la Forteresse</H>
    <P><i style={{color:C.mid}}>Comment, en une nuit, Clutch a dompté son problème le plus profond.</i></P>
    <P>Tout commence par une angoisse de David, dictée à voix haute : <b>« Si je verrouille un Clutch, et qu'une autre personne m'en envoie un au même moment, qu'est-ce qui se passe ? Il y a une infinité de possibilités, ça devient pénible. Tout seul je n'y arriverai pas. »</b></P>
    <P>Le problème réel, derrière les mots : <b>un être humain ne peut pas être à deux endroits en même temps.</b> Et une app de rencontre spontanée, où chacun envoie et reçoit des invitations qui se chevauchent dans le temps, fait exploser le nombre de cas à gérer. Les coder un par un, à la main, = la garantie d'en oublier et de tout casser.</P>
    <Revel>David a eu l'intuition juste en évoquant <b>Coq</b> (un outil de preuve mathématique suggéré par son ami Dom) : il fallait <b>formaliser</b> les états et <b>prouver</b> qu'un état impossible ne peut jamais arriver. Coq lui-même était trop lourd — mais l'idée était la bonne.</Revel>
    <P>La traduction « start-up » de cette intuition tient en trois briques : une <b>machine à états</b> (la liste finie de ce qu'un Clutch peut être), des <b>invariants</b> (des règles qui doivent TOUJOURS être vraies), et un <b>fuzzer</b> (un robot qui joue des milliers de scénarios au hasard pour trouver les failles à notre place).</P>
    <Revel>Le déclic : on a <b>arrêté de raisonner en « Clutchs »</b> pour raisonner en <b>« engagements temporels »</b>. Un Clutch verrouillé et un événement accepté occupent tous les deux un créneau — c'est le <b>même moteur</b>. À partir de là, l'infini s'est effondré en une table et une règle.</Revel>
    <P>On a challengé l'architecture chez GPT (un panel de 3 experts qui se contredisent). Il a apporté la pièce maîtresse : faire de l'occupation du temps un <b>objet de premier rang dans la base de données</b>, avec une contrainte Postgres (<code>EXCLUDE</code>) qui rend le chevauchement <b>impossible par construction</b> — pas par du code qu'on espère, mais par une loi physique de la base.</P>
    <Revel>Le fuzzer a prouvé sa valeur deux fois. D'abord en validant <b>800 000 actions aléatoires → 0 faille</b>. Puis, quand on a ajouté le « buffer de 1h avant le RDV », il a <b>attrapé un vrai bug</b> qu'on s'apprêtait à livrer (la vérification regardait la mauvaise plage horaire). Le robot pense pour nous.</Revel>
    <P>En une nuit : un moteur pur testé, une migration appliquée en production, le bouton Verrouiller qui gère les conflits en douceur, et les invitations qui se mettent « en pause » puis « revivent » toutes seules. <b>La fondation que David croyait infinie tient en une table, une contrainte et ~230 lignes testées.</b></P>
    <P style={{color:C.mid,fontSize:13,marginTop:18}}>→ Détail technique dans l'onglet Architecture. Décisions horodatées dans le Journal.</P>
  </div>)
}

function Architecture() {
  return (<div>
    <H>L'architecture, expliquée simplement</H>
    <P><i style={{color:C.mid}}>Lisible par quelqu'un qui ne code pas (Mel), assez précise pour une autre IA.</i></P>
    <H>① Le principe</H>
    <P>On ne stocke pas « qui aime qui ». On gère <b>du temps</b>. Chaque rendez-vous confirmé crée une <b>occupation</b> : « cette personne est prise de telle heure à telle heure ». Deux occupations qui se chevauchent pour la même personne = interdit.</P>
    <H>② Les deux dimensions (ne jamais mélanger)</H>
    <P>• <b>L'engagement</b> : où en est le Clutch ? (en attente → verrouillé → terminé, ou refusé / expiré / annulé). <br/>• <b>La présence</b> : la personne est-elle physiquement arrivée ? (le « J'y suis »). C'est une <b>autre</b> dimension, séparée — sinon le nombre d'états explose.</P>
    <H>③ La table des occupations</H>
    <P>Une table <code>occupancies</code> : pour chaque rendez-vous confirmé, une ligne par participant (« user X, de 19h à 22h »). Elle est <b>dérivée</b> automatiquement : on ne l'écrit jamais à la main. Quand un Clutch se verrouille, un déclencheur (trigger) la remplit ; quand il s'annule, elle se vide. Sinon, on aurait des « occupations fantômes » qui bloqueraient quelqu'un à vie.</P>
    <H>④ La loi physique : la contrainte EXCLUDE</H>
    <P>Une seule ligne de configuration Postgres rend <b>impossible</b> l'insertion de deux occupations qui se croisent pour la même personne. Si deux personnes confirment au même millième de seconde, <b>une réussit, une échoue</b> — jamais les deux. C'est la base de données qui tranche, pas le téléphone (qu'on pourrait pirater).</P>
    <Code>{`occupancies : user_id | start_at | end_at | source (clutch/event)
   ↑ contrainte EXCLUDE : pas 2 plages qui se chevauchent par user`}</Code>
    <H>⑤ « En pause » et « revival »</H>
    <P>Une invitation reçue qui tombe sur une heure déjà prise n'est pas supprimée : elle passe <b>« en pause »</b> (calmée, sortie des actions urgentes). Ce n'est jamais stocké — c'est <b>calculé</b>. Donc si on annule le rendez-vous qui bloquait, l'invitation <b>revit toute seule</b>, sans qu'on ait rien réécrit.</P>
    <H>⑥ Sans serveur</H>
    <P>Clutch n'a pas de serveur à lui (site statique). Tout passe par Supabase (la base de données), appelée directement depuis l'app. La forteresse vit donc <b>dans la base</b> — exactement là où il faut, pour qu'elle soit incontournable.</P>
    <Todo><b>Phase 2 — Événements.</b> Les events n'ont pas encore d'horaire exploitable par la machine (juste un texte). À faire : leur donner un vrai <code>starts_at</code> + durée, puis les brancher sur le même moteur d'occupation (migration prête : <code>20260626_events_occupancy.sql</code>).</Todo>
  </div>)
}

function Algorithmes() {
  return (<div>
    <H>Les algorithmes de Clutch</H>
    <P><i style={{color:C.mid}}>On a plusieurs « cerveaux ». Voici lesquels, et la solution trouvée pour chacun.</i></P>

    <H>1. L'anti-conflit (la Forteresse) — <span style={{color:C.green}}>fait</span></H>
    <P><b>Problème :</b> empêcher qu'une personne soit à deux endroits à la fois.<br/><b>Solution :</b> 7 <b>invariants</b> (règles toujours vraies), garantis par la base de données. Le plus important : aucune occupation qui se chevauche par personne. La fenêtre bloquée d'un RDV = <b>[heure − 1h de prépa, heure + durée]</b>.</P>
    <P style={{fontWeight:800,color:C.salmon,marginTop:8}}>Les 7 invariants :</P>
    <P style={{fontSize:13.5}}>1. Pas de chevauchement (Clutch + event) · 2. On ne se clutche pas soi-même · 3. Pas 2 conversations actives entre les mêmes 2 personnes · 4. Un event accepté occupe un créneau · 5. Un RDV terminé ne « re-vit » jamais · 6. Le début est toujours avant la fin · 7. Les transitions sont à sens unique (pas de marche arrière illogique).</P>

    <H>2. Le tri des présences (compatibilité) — <span style={{color:C.green}}>fait</span></H>
    <P>Classe les profils visibles par <b>compatibilité</b> (centres d'intérêt communs), <b>proximité</b> et <b>fiabilité</b>. Pondéré, ajustable.</P>

    <H>3. Le thermostat de densité — <span style={{color:C.green}}>fait</span></H>
    <P>Quand il y a <b>beaucoup</b> de monde, le filtre devient plus sévère ; quand il y a <b>peu</b> de monde, plus souple. L'algo s'adapte à la foule.</P>

    <H>4. L'algo auto-apprenant (cooldown & bienveillance) — <span style={{color:C.green}}>à concevoir</span></H>
    <Todo><b>Cooldown après refus.</b> Si B refuse A, A ne peut plus re-clutcher B pendant <b>48h</b> (configurable). À chaque nouveau refus, le délai <b>double</b> (48h → 96h → …). Au-delà de 3 refus, l'algo <b>ne propose plus</b> A à B. Un clutch simplement <b>expiré</b> (pas vu) n'entraîne <b>pas</b> de cooldown.</Todo>
    <Todo><b>Aider les laissés-pour-compte.</b> Détecter quelqu'un qui ne reçoit JAMAIS de clutch → boost de visibilité + coaching doux (« ajoute une photo », « commence par un événement de groupe »). Cœur de la « forteresse bienveillante ».</Todo>

    <H>Comment on teste : le fuzzer</H>
    <P>Un robot joue des dizaines de milliers de scénarios aléatoires et vérifie qu'aucun invariant ne casse, après chaque action. Si une faille apparaît, il crache la séquence exacte pour la reproduire. C'est notre filet de sécurité contre « l'infinité de cas ».</P>
    <Code>{`npm run fuzz
→ 800 000 actions jouées · 0 violation. La forteresse tient.`}</Code>
  </div>)
}

function Lexique() {
  return (<div>
    <H>Le lexique du code</H>
    <P><i style={{color:C.mid}}>Les mots qu'on emploie quand on parle programmation. Pour qu'on parle la même langue.</i></P>
    <Def mot="Invariant">Une règle qui doit être vraie À TOUT MOMENT, quoi qu'il arrive. Ex. « personne n'est à deux endroits à la fois ». Si un invariant casse, c'est un bug grave.</Def>
    <Def mot="Machine à états">La liste FINIE des situations possibles d'une chose, et des passages autorisés de l'une à l'autre. Un Clutch est : en attente → verrouillé → terminé (ou refusé/expiré/annulé).</Def>
    <Def mot="Fuzzer">Un robot de test qui balance des milliers d'actions AU HASARD pour trouver les cas qu'un humain n'aurait pas imaginés. « Fuzz » = bruit aléatoire.</Def>
    <Def mot="Timestamp">Un instant précis (date + heure), lisible par la machine. Ex. « 2026-06-25 20:00 ». Sert à calculer les chevauchements.</Def>
    <Def mot="Occupation (occupancy)">Une plage de temps pendant laquelle une personne est « prise » par un RDV confirmé. C'est l'unité de base de la forteresse.</Def>
    <Def mot="Contrainte EXCLUDE (gist)">Une loi posée dans la base de données qui REFUSE physiquement deux plages de temps qui se chevauchent pour la même personne. Imparable.</Def>
    <Def mot="Trigger (déclencheur)">Un bout de code dans la base qui s'exécute TOUT SEUL quand une donnée change. Ex. « quand un Clutch se verrouille → crée son occupation ».</Def>
    <Def mot="RPC (appel de fonction distante)">L'app demande à la base d'exécuter une fonction précise (ex. « verrouille ce Clutch »), de façon atomique et sûre, sans serveur intermédiaire.</Def>
    <Def mot="Pending (en attente)">Un Clutch envoyé mais pas encore accepté. Important : il n'occupe AUCUN créneau → il ne bloque personne. Le blocage n'arrive qu'au verrouillage.</Def>
    <Def mot="Buffer (tampon)">Une marge de sécurité. Ici : 1h AVANT le RDV pendant laquelle on ne peut plus rien verrouiller (le temps de s'y rendre).</Def>
    <Def mot="Migration SQL">Un fichier qui modifie la structure de la base (ajoute une table, une règle…). On les numérote par date pour garder l'historique.</Def>
    <Def mot="RLS (sécurité par ligne)">Des règles qui décident QUI a le droit de voir/modifier quelle ligne. Ex. « chacun ne voit que SES occupations » (anti-espionnage d'agenda).</Def>
  </div>)
}

function Parametres() {
  const rows = [
    ['Durée RDV normal', '2h (120 min)', 'Combien de temps un Clutch bloque l\'agenda'],
    ['Durée Quick Clutch', '1h (60 min)', 'Rencontre éclair'],
    ['Buffer de prépa', '1h avant', 'On ne peut plus verrouiller dès 1h avant le RDV'],
    ['Délai de réponse', '2h', 'Un clutch reçu non répondu expire'],
    ['Cooldown après refus', '48h', 'Avant de pouvoir re-clutcher la même personne'],
    ['Escalade du cooldown', '×2', 'Le délai double à chaque nouveau refus'],
    ['Arrêt de proposition', '3 refus', 'Au-delà, l\'algo ne propose plus la personne'],
    ['Horizon max', '18h', 'Tout se joue dans une fenêtre de 18h (ADN du produit)'],
  ]
  return (<div>
    <H>Les paramètres réglables</H>
    <P><i style={{color:C.mid}}>Tous changeables en UN endroit (<code>lib/clutch-config.ts</code>) sans casser la logique. Règle permanente de David.</i></P>
    <div style={{border:`1px solid ${C.border}`,borderRadius:12,overflow:'hidden',margin:'12px 0'}}>
      {rows.map((r,i)=>(
        <div key={i} style={{display:'flex',gap:10,padding:'11px 14px',background:i%2?C.cardSoft:'transparent',alignItems:'baseline'}}>
          <div style={{flex:'0 0 38%',fontWeight:800,color:C.text,fontSize:13.5}}>{r[0]}</div>
          <div style={{flex:'0 0 18%',fontWeight:900,color:C.orange,fontSize:13.5}}>{r[1]}</div>
          <div style={{flex:1,color:C.mid,fontSize:12.5}}>{r[2]}</div>
        </div>
      ))}
    </div>
    <P style={{fontSize:13,color:C.mid}}>En pratique on découvrira que certaines valeurs sont trop courtes/longues. On les changera ici, et toute la logique suivra — c'est tout l'intérêt de l'architecture évolutive.</P>
    <Todo><b>À challenger chez GPT :</b> le doublement du cooldown, le seuil d'arrêt (3 refus), et le cas « clutch expiré plusieurs fois de suite ».</Todo>
  </div>)
}

function Journal() {
  const log = [
    ['25.06 — nuit', 'Naissance de la Forteresse', 'Machine à états pure + fuzzer (800k actions, 0 faille). Migration occupancies + contrainte EXCLUDE appliquée en prod (mode shadow puis enforce). Bouton Verrouiller : conflit géré en douceur. Invitations « en pause » + revival.'],
    ['25.06', 'Durée RDV corrigée 1h→2h', 'Le fuzzer/David ont rattrapé : Quick=1h donc normal=2h (code app L1893). Leçon : vérifier la vraie valeur avant de trancher un défaut délégué.'],
    ['25.06', 'Buffer prépa 1h avant', 'On bloque le Verrou dans [RDV−1h, RDV+2h]. Le fuzzer a attrapé un vrai bug (la garde regardait la plage brute, pas la plage occupée) → corrigé via une source unique de la plage.'],
    ['25.06', 'Décisions produit', 'Expiration douce d\'un refus confirmée. Refus → cooldown 48h escaladant ×2, puis arrêt. Refus ≠ expiré. Une personne occupée PEUT envoyer des clutchs (mais pas en verrouiller dans la fenêtre bloquée).'],
    ['25.06', 'Question ouverte', 'Notifie-t-on un refus ? Reco : non (flou protecteur, anti-sonde). À valider.'],
  ]
  return (<div>
    <H>Le journal des décisions</H>
    <P><i style={{color:C.mid}}>L'histoire brute, horodatée. Rien ne se perd. (Source détaillée : docs/ + mémoire du projet.)</i></P>
    {log.map((l,i)=>(
      <div key={i} style={{borderLeft:`2px solid ${C.border}`,padding:'2px 0 16px 16px',position:'relative',marginLeft:4}}>
        <div style={{position:'absolute',left:-5,top:4,width:8,height:8,borderRadius:'50%',background:C.orange}}/>
        <div style={{fontSize:11,color:C.mid,fontWeight:700,letterSpacing:'.03em'}}>{l[0]}</div>
        <div style={{fontSize:15,fontWeight:900,color:C.salmon,margin:'2px 0 4px'}}>{l[1]}</div>
        <div style={{fontSize:13.5,lineHeight:1.6,color:C.text}}>{l[2]}</div>
      </div>
    ))}
    <Todo><b>Idée David :</b> un vrai fichier <code>.log</code> brut (append-only) de tout ce qui se passe, ré-injectable dans une IA pour condenser sans rien perdre. À mettre en place en parallèle de la mémoire.</Todo>
  </div>)
}

const TABS = [
  { key:'histoire', label:'📖 Histoire', el:<Histoire/> },
  { key:'archi', label:'🏗️ Architecture', el:<Architecture/> },
  { key:'algo', label:'🧮 Algorithmes', el:<Algorithmes/> },
  { key:'lexique', label:'📕 Lexique', el:<Lexique/> },
  { key:'params', label:'⚙️ Paramètres', el:<Parametres/> },
  { key:'journal', label:'📜 Journal', el:<Journal/> },
]

export default function CodexPage() {
  const [ok, setOk] = useState(false)
  const [tab, setTab] = useState('histoire')
  useEffect(() => { try { if (localStorage.getItem('codex_ok')==='1') setOk(true) } catch {} }, [])
  if (!ok) return <Lock onUnlock={()=>setOk(true)} />
  const active = TABS.find(t=>t.key===tab) || TABS[0]
  return (
    <div style={{ minHeight:'100vh', background:C.bg, color:C.text, fontFamily:'-apple-system,sans-serif' }}>
      <div style={{ maxWidth:760, margin:'0 auto', padding:'28px 18px 80px' }}>
        <div style={{ textAlign:'center', marginBottom:6 }}>
          <span style={{ fontSize:26, fontWeight:900, letterSpacing:'-.05em' }}><span style={{color:C.salmon}}>CLU</span><span style={{color:C.orange}}>TCH</span></span>
          <span style={{ fontSize:15, color:'rgba(255,191,158,.45)', fontWeight:700, marginLeft:8 }}>CODEX</span>
        </div>
        <div style={{ textAlign:'center', color:C.mid, fontSize:12.5, marginBottom:20 }}>La Bible — code · algorithmes · histoire · paramètres</div>
        <div style={{ display:'flex', gap:7, flexWrap:'wrap', justifyContent:'center', marginBottom:8, position:'sticky', top:0, background:C.bg, padding:'8px 0', zIndex:2 }}>
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)} style={{ padding:'7px 13px', borderRadius:20, border:`1px solid ${tab===t.key?C.orange:C.border}`, background:tab===t.key?'rgba(226,124,0,.16)':'transparent', color:tab===t.key?C.orange:C.mid, fontSize:12.5, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>{t.label}</button>
          ))}
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:'8px 20px 24px' }}>{active.el}</div>
        <div style={{ textAlign:'center', color:'rgba(245,232,222,.3)', fontSize:11, marginTop:20 }}>Document vivant — enrichi à chaque grande étape. Aucune miette perdue.</div>
      </div>
    </div>
  )
}
