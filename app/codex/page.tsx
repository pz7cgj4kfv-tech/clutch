'use client'
import { useState, useEffect } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// CODEX CLUTCH — documentation technique DENSE (niveau chercheur/ingénieur).
// Objectif David : « documente comme un fou, dans le détail, petite police ».
// Page isolée, protégée par mot de passe. Aucun import de l'app → zéro impact runtime.
// Vivant : enrichi à chaque étape. Source de vérité longue : docs/ + mémoire projet.
// ─────────────────────────────────────────────────────────────────────────────

const PWD = 'clutch2026!'
const C = {
  bg:'#241019', panel:'#160a11', card:'#30141f', soft:'rgba(255,255,255,.035)',
  salmon:'#FFBF9E', orange:'#E27C00', green:'#77BC1F', red:'#e87b7b',
  text:'#ece0d7', mid:'rgba(236,224,215,.58)', dim:'rgba(236,224,215,.36)',
  border:'rgba(255,191,158,.13)', code:'#0f0710',
}

function Lock({ onUnlock }:{ onUnlock:()=>void }) {
  const [v,setV]=useState(''); const [e,setE]=useState(false)
  const go=()=>{ if(v===PWD){ try{localStorage.setItem('codex_ok','1')}catch{} onUnlock() } else { setE(true); setV(''); setTimeout(()=>setE(false),900) } }
  return (<div style={{minHeight:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'-apple-system,sans-serif'}}>
    <div style={{textAlign:'center'}}>
      <div style={{fontSize:28,fontWeight:900,letterSpacing:'-.05em'}}><span style={{color:C.salmon}}>CLU</span><span style={{color:C.orange}}>TCH</span> <span style={{fontSize:13,color:'rgba(255,191,158,.4)'}}>CODEX</span></div>
      <div style={{color:C.mid,fontSize:11.5,margin:'6px 0 24px'}}>Documentation technique — accès restreint</div>
      <input autoFocus type="password" value={v} onChange={x=>setV(x.target.value)} onKeyDown={x=>x.key==='Enter'&&go()} placeholder="mot de passe"
        style={{background:e?'#450a0a':'#3D1A33',border:`1px solid ${e?'#ef4444':C.border}`,borderRadius:10,padding:'11px 18px',fontSize:15,color:C.text,outline:'none',textAlign:'center',width:210,fontFamily:'inherit'}}/>
      <div style={{marginTop:14}}><button onClick={go} style={{background:C.orange,color:'#fff',border:'none',borderRadius:9,padding:'9px 28px',fontSize:13,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>Entrer</button></div>
    </div></div>)
}

// ── primitives denses ──
const H=({c}:{c:any})=><div style={{fontSize:15,fontWeight:900,color:C.salmon,margin:'20px 0 7px',letterSpacing:'-.01em'}}>{c}</div>
const Sub=({c}:{c:any})=><div style={{fontSize:12.5,fontWeight:800,color:C.orange,margin:'13px 0 4px'}}>{c}</div>
const P=({c,s}:{c:any,s?:any})=><div style={{fontSize:12.3,lineHeight:1.62,color:C.text,margin:'0 0 8px',...s}}>{c}</div>
const Note=({c}:{c:any})=><div style={{fontSize:11.5,lineHeight:1.55,color:C.mid,margin:'0 0 8px'}}>{c}</div>
const Code=({c}:{c:any})=><pre style={{background:C.code,border:`1px solid ${C.border}`,borderRadius:8,padding:'10px 12px',fontSize:11,color:C.salmon,overflowX:'auto',margin:'7px 0',fontFamily:'ui-monospace,Menlo,monospace',lineHeight:1.5,whiteSpace:'pre'}}>{c}</pre>
const Rev=({c}:{c:any})=><div style={{background:'rgba(226,124,0,.1)',borderLeft:`3px solid ${C.orange}`,borderRadius:'0 8px 8px 0',padding:'8px 12px',margin:'9px 0',fontSize:12,lineHeight:1.55,color:C.text}}><b style={{color:C.orange}}>▸ </b>{c}</div>
const Todo=({c}:{c:any})=><div style={{background:'rgba(119,188,31,.07)',border:`1px dashed ${C.green}66`,borderRadius:8,padding:'8px 12px',margin:'7px 0',fontSize:11.8,lineHeight:1.55,color:C.text}}><b style={{color:C.green}}>⏳ </b>{c}</div>
const KV=({k,v,d}:{k:any,v:any,d?:any})=>(<div style={{display:'flex',gap:9,padding:'6px 10px',borderBottom:`1px solid ${C.border}`,alignItems:'baseline',fontSize:11.8}}>
  <div style={{flex:'0 0 34%',fontWeight:700,color:C.text}}>{k}</div><div style={{flex:'0 0 20%',fontWeight:900,color:C.orange,fontFamily:'ui-monospace,monospace'}}>{v}</div><div style={{flex:1,color:C.mid,fontSize:11}}>{d}</div></div>)
const Tag=({c,col}:{c:any,col?:any})=><span style={{fontSize:10,fontWeight:800,padding:'1px 7px',borderRadius:20,background:`${col||C.green}22`,color:col||C.green,marginLeft:6}}>{c}</span>

// ════════════════════════════ ONGLETS ════════════════════════════

function Histoire(){return(<div>
  <H c="Histoire de la Forteresse anti-conflit"/>
  <Note c="25–26 juin 2026. Comment Clutch a rendu mathématiquement impossible qu'un humain soit à deux endroits à la fois."/>
  <P c={<>Origine — angoisse de David, dictée : « si je verrouille un Clutch et qu'une autre personne m'en envoie un au même moment, qu'est-ce qui se passe ? Il y a une <i>infinité</i> de possibilités, tout seul je n'y arriverai pas. » Le problème réel : une app de rencontre où chacun envoie/reçoit des invitations qui se chevauchent dans le temps → explosion combinatoire des cas. Les coder à la main = garantie d'en oublier.</>}/>
  <Rev c={<>Intuition de David (via son ami Dom) : <b>Coq</b> — formaliser les états et <i>prouver</i> qu'un état impossible ne survient jamais. Coq = trop lourd pour 1 dev. Traduction « startup » retenue : <b>machine à états + invariants + fuzzer</b> (le robot qui cherche les failles à notre place).</>}/>
  <Rev c={<>Le pivot conceptuel : arrêter de raisonner en « Clutchs », raisonner en <b>engagements temporels</b>. Un Clutch verrouillé et un event accepté occupent un créneau → <b>même moteur</b>. L'infini s'effondre en 1 table + 1 contrainte.</>}/>
  <Rev c={<>Challenge GPT (panel 3 experts) → apport décisif : faire de l'occupation du temps un <b>objet de 1ʳᵉ classe en base</b> avec une contrainte <code>EXCLUDE USING gist</code> qui rend le chevauchement <i>impossible par construction</i>. La base tranche, pas le JS (contournable).</>}/>
  <Rev c={<>Le fuzzer a prouvé sa valeur 2×: (a) 800 000 actions aléatoires → 0 faille ; (b) en ajoutant le buffer de 1h, il a <b>attrapé un vrai bug</b> qu'on allait livrer (garde sur plage brute ≠ plage occupée). Détail onglet Fuzzer.</>}/>
  <P c={<>Livré en ~24h : moteur pur testé, 2 migrations en prod (clutchs + events), conflits gérés en douceur côté UI, invitations « en pause » qui revivent seules. Fondation crue infinie → <b>1 table, 1 contrainte, ~245 lignes testées</b>.</>}/>
</div>)}

function Schema(){return(<div>
  <H c="Schéma réel (production, vérifié par diagnostic SQL)"/>
  <Note c="⚠️ Le fichier supabase-schema.sql du repo est PÉRIMÉ. Vérité = la base live (interrogée le 25.06 via information_schema)."/>
  <Sub c="Table clutches — 35 colonnes (extrait pertinent)"/>
  <Code c={`id uuid · sender_id uuid · receiver_id uuid
venue text · venue_lat/lng double · venue_safety text
proposed_time timestamptz       -- heure proposée du RDV
counter_time  timestamptz       -- si contre-proposition (prioritaire)
duration_minutes int            -- NULL=normal(→120) · 60 si is_quick_date
is_quick_date boolean · is_contact_rdv boolean
status text  CHECK ∈ {pending, accepted, confirmed, checked_in,
                      declined, expired, cancelled, completed}
checked_in_sender/receiver bool · sender_arrived/receiver_arrived bool
expires_at timestamptz (def now()+2h) · created_at · updated_at`}/>
  <Note c={<>Répartition réelle des status (25.06) : cancelled 217 · expired 52 · completed 40 · declined 4 · pending 2 · confirmed 1 · (accepted/checked_in 0).</>}/>
  <Rev c={<><b>Vocabulaire « Verrou » incohérent</b> dans la base : les bots écrivaient <code>accepted</code>, le bouton humain <code>confirmed</code>, et <code>checked_in</code> existe aussi. Les 3 = « RDV confirmé qui occupe ». La forteresse les traite identiquement.</>}/>
  <Sub c="Tables events / event_participants"/>
  <Code c={`events: id, title, venue, date_label(texte), spots, status, created_by
  + AJOUTÉ 26.06 : starts_at timestamptz, duration_minutes int
event_participants: (event_id, user_id) PK, joined_at   -- pas de status`}/>
  <Note c={<>Avant le 26.06 les events n'avaient qu'un <code>date_label</code> texte (« Ce soir · 19:00 ») → inexploitable. L'app calcule désormais un vrai <code>starts_at</code> depuis « Aujourd'hui/Demain » + heure HH:MM.</>}/>
  <Sub c="Table occupancies (créée 25.06) — le cœur"/>
  <Code c={`occupancies(
  id uuid pk, user_id uuid,
  start_at timestamptz, end_at timestamptz,
  source_type text,   -- 'clutch' | 'event'
  source_id uuid,
  CHECK(start_at < end_at))
index (user_id) · RLS: select WHERE user_id = auth.uid()  (anti-sonde)`}/>
</div>)}

function Archi(){return(<div>
  <H c="Architecture base de données (SQL réel)"/>
  <Sub c="① La loi physique : contrainte d'exclusion"/>
  <Code c={`CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE occupancies ADD CONSTRAINT occ_no_overlap
  EXCLUDE USING gist (
    user_id WITH =,
    tstzrange(start_at, end_at, '[)') WITH &&  );`}/>
  <P c={<>Pour un même <code>user_id</code>, deux plages temporelles qui se chevauchent (<code>&&</code>) sont <b>refusées à l'insertion</b>. Intervalle <b>demi-ouvert <code>[)</code></b> : deux RDV bout-à-bout (18–20h puis 20–22h) ne se chevauchent PAS (réaliste). Concurrence : 2 confirmations simultanées → 1 réussit, 1 échoue (atomique, transactionnel).</>}/>
  <Sub c="② Occupation = projection DÉRIVÉE (trigger, jamais saisie main)"/>
  <P c={<>Règle de correction : si on écrivait l'occupation à la main, un event supprimé sans nettoyage → « occupation fantôme » bloquant l'user à vie. Donc trigger uniquement.</>}/>
  <Code c={`-- sync_clutch_occupancy() — AFTER INSERT/UPDATE/DELETE on clutches
occupe ⇔ status ∈ {accepted, confirmed, checked_in}
v_start := coalesce(counter_time, proposed_time)
start_at := v_start - interval '60 min'     -- BUFFER prépa
end_at   := v_start + coalesce(duration_minutes,120)·min
DELETE occ du clutch ; si occupe → INSERT (sender) + (receiver)`}/>
  <Code c={`-- sync_event_occupancy() — AFTER INSERT/DELETE on event_participants
start_at := events.starts_at - 60min
end_at   := events.starts_at + coalesce(duration_minutes,180)·min
INSERT 1 occ pour le user qui rejoint  (NULL starts_at → rien)
-- resync_event_participants() — si starts_at change, recalcule tous`}/>
  <P c={<>Trigger en <code>SECURITY DEFINER</code> (écrit les occupancies des 2 users malgré la RLS). Une insertion qui violerait <code>occ_no_overlap</code> fait échouer la transaction déclenchante → le verrou/inscription est refusé en base. Côté UI : message doux (cf. onglet Fichiers, points de branchement).</>}/>
  <Sub c="③ Sans serveur"/>
  <P c={<>Clutch = site statique (Next.js <code>output:'export'</code>), zéro backend propre. Tout via Supabase (Postgres) appelé depuis le client. La forteresse vit donc <b>dans la base</b> — incontournable, non contournable par un client modifié.</>}/>
</div>)}

function Moteur(){return(<div>
  <H c="Moteur pur — machine à états & invariants"/>
  <Note c="lib/clutch-states.ts (~245 l, 0 dépendance DB/UI). Logique rejouable hors-ligne par le fuzzer. Source de vérité de la logique."/>
  <Sub c="Deux dimensions séparées"/>
  <Code c={`RelState (engagement) : pending → locked → completed
                       ↘ refused | expired | cancelled | no_show
PresState (présence)  : none → arrived → both_arrived   (= le 'J'y suis')`}/>
  <Sub c="Table des transitions autorisées (INV7 — monotonie)"/>
  <Code c={`pending   → {locked, refused, expired, cancelled}
locked    → {completed, no_show, cancelled}
completed/refused/expired/cancelled/no_show → {}  (terminaux figés)`}/>
  <Sub c="Plage d'occupation (source unique : clutchOccRange)"/>
  <Code c={`clutchOccRange(c) = [ c.startAt - PREP_BUFFER_MIN·min , c.endAt ]
// utilisée À LA FOIS pour créer l'occupation ET pour la garde au lock.
// (les désaligner = la faille que le fuzzer a trouvée — voir onglet Fuzzer)`}/>
  <Sub c="Les 7 invariants"/>
  <P s={{fontSize:11.6,lineHeight:1.7}} c={<>
    <b>INV1</b> — aucun chevauchement d'occupations actives par user (clutch + event confondus). <i>Garanti par EXCLUDE gist.</i><br/>
    <b>INV2</b> — sender ≠ receiver. <i>CHECK.</i><br/>
    <b>INV3</b> — pas 2 clutchs actifs (non terminaux) entre la même paire — clé canonique <code>pairKey(a,b)=min|max</code> (anti A→B & B→A simultané).<br/>
    <b>INV4</b> — un event accepté occupe un créneau (même table occupancies).<br/>
    <b>INV5</b> — un état terminal ne redevient jamais actif.<br/>
    <b>INV6</b> — start_at &lt; end_at toujours.<br/>
    <b>INV7</b> — transitions monotones (pas de <code>completed→locked</code>).</>}/>
  <Sub c="« En pause » & revival (calculé, jamais stocké)"/>
  <P c={<><code>isPaused(c)</code> = un pending dont <code>clutchOccRange</code> chevauche une de mes occupations actives. Le statut <b>reste pending</b> (aucune écriture). Si le RDV bloquant s'annule → l'occupation disparaît → le pending « revit » seul. Pas de transition non-monotone, pas de ping-pong d'état.</>}/>
  <Sub c="Réducteur"/>
  <Code c={`apply(world, action) → { world', ok, reason }   // pur, immuable (structuredClone)
actions: create_clutch · lock · refuse · expire · cancel · complete
         · no_show · counter_propose · accept_event · release_event · checkin
lock: refuse si !canTransition || userOccupied(clutchOccRange)  // = la garde INV1`}/>
</div>)}

function Fuzzer(){return(<div>
  <H c="Le fuzzer — preuve par 800 000 actions"/>
  <Note c="scripts/fuzz-clutch-states.mts — zéro dépendance (Node 24 lit le .ts nativement)."/>
  <Sub c="Méthodologie (property-based testing)"/>
  <P c={<>PRNG déterministe <b>mulberry32</b> (graine = n° de run → reproductible, pas de <code>Math.random</code>). <b>20 000 séquences × 40 actions = 800 000 actions</b>. Univers réduit (4 users, 6 créneaux, durées variées) pour <i>maximiser</i> les collisions. Après CHAQUE action : on rejoue les invariants + on vérifie la monotonie (un terminal ne doit jamais redevenir actif). À la moindre violation → la séquence exacte est imprimée (graine + index) pour reproduction.</>}/>
  <Sub c="Lancer"/>
  <Code c={`npm run fuzz
→ 8 tests ciblés (ex. « Verrou pendant un event accepté refusé »)
→ 800 000 actions jouées · ~390k acceptées · ~410k refusées à juste titre
→ ✅ 0 violation. La forteresse tient.`}/>
  <Sub c="Le bug réel attrapé (26.06)"/>
  <P c={<>En introduisant le buffer de 1h, le fuzzer a échoué au pas #13 d'une séquence : <code>INV1(u2: clutch:c2 ∩ event:c4)</code>.</>}/>
  <Code c={`Cause : la GARDE au lock testait la plage BRUTE [start, end]
        mais l'occupation créée était BUFFERISÉE [start-1h, end].
→ un lock passait la garde puis créait une occupation
  qui chevauchait un event existant.
Fix : clutchOccRange() = source UNIQUE pour la garde ET l'occupation.
→ re-fuzz : 800 000 actions, 0 violation.`}/>
  <Rev c={<>Sans le fuzzer, ce bug partait en prod. Réponse concrète à « comment ne rien rater » : on ne pense pas à la main — le robot pense pour nous.</>}/>
  <Sub c="Les 8 propriétés vérifiées"/>
  <Note c="INV1 jamais violé · sender≠receiver · pas de paire active double · aucun overlap résiduel · terminal reste terminal · concurrence (2 locks → 1 succès) · pendings incompatibles en pause · idempotence de lock."/>
</div>)}

function Lexique(){const D=({m,c}:{m:any,c:any})=><div style={{margin:'0 0 8px',padding:'8px 11px',background:C.soft,borderRadius:8,border:`1px solid ${C.border}`}}><span style={{fontWeight:900,color:C.orange,fontSize:12.3}}>{m}</span><span style={{fontSize:11.6,lineHeight:1.5,color:C.text}}> — {c}</span></div>
  return(<div><H c="Lexique du code"/><Note c="Pour parler la même langue (utile à Mel et à toute IA reprenant le projet)."/>
  <D m="Invariant" c="règle vraie À TOUT MOMENT. Si elle casse = bug grave. Ex. INV1."/>
  <D m="Machine à états" c="liste FINIE des situations d'une chose + passages autorisés. Dompte l'explosion combinatoire."/>
  <D m="Fuzzer / property-based testing" c="robot qui joue des milliers d'actions aléatoires et asserte des propriétés après chacune."/>
  <D m="PRNG (mulberry32)" c="générateur pseudo-aléatoire à graine → mêmes tirages à chaque run = bug reproductible."/>
  <D m="Timestamp / tstzrange" c="instant précis (timestamptz) ; tstzrange = intervalle de temps Postgres ([) = demi-ouvert)."/>
  <D m="Occupation (occupancy)" c="plage [start,end] pendant laquelle un user est pris. Unité de base de la forteresse."/>
  <D m="EXCLUDE USING gist" c="contrainte Postgres refusant 2 lignes dont des champs 'se chevauchent' (via index GiST + btree_gist)."/>
  <D m="Trigger" c="code en base exécuté automatiquement à un changement de donnée (INSERT/UPDATE/DELETE)."/>
  <D m="SECURITY DEFINER" c="fonction exécutée avec les droits de son créateur → peut écrire malgré la RLS de l'appelant."/>
  <D m="RLS (Row Level Security)" c="règles 'qui voit/modifie quelle ligne'. Ici : chacun ne voit que SES occupations."/>
  <D m="RPC" c="appel direct d'une fonction Postgres depuis le client (supabase.rpc) — pas de serveur intermédiaire."/>
  <D m="Pending" c="clutch envoyé non accepté. N'occupe RIEN → ne bloque personne. Le blocage n'arrive qu'au verrouillage."/>
  <D m="Buffer" c="marge. Ici 1h AVANT le RDV où l'on ne peut plus rien verrouiller (trajet/prépa)."/>
  <D m="Projection dérivée" c="donnée recalculée depuis une source (occupancies dérivée des clutchs/events), jamais saisie main."/>
  <D m="Monotonie (des transitions)" c="à sens unique : un état terminal ne revient jamais en arrière."/>
  </div>)}

function Params(){const R=[['rdvDurationDefaultMin','120','RDV normal = 2h (duration_minutes NULL)'],['rdvDurationQuickMin','60','Quick Clutch = 1h'],['prepBufferMin','60','blocage dès 1h avant le RDV'],['clutchReplyWindowH','2','expiration d\'un clutch non répondu'],['refuseCooldownH','48','délai avant de re-clutcher après refus'],['refuseCooldownFactor','2','le cooldown double à chaque refus'],['refuseStopAfter','3','au-delà, l\'algo ne propose plus'],['eventDurationDefaultMin','180','durée event par défaut = 3h'],['maxHorizonH','18','fenêtre structurelle du produit']]
  return(<div><H c="Paramètres réglables"/><Note c={<>Source unique : <code>lib/clutch-config.ts</code>. Règle permanente : aucun nombre magique dispersé ; on change ici, la logique suit.</>}/>
  <div style={{border:`1px solid ${C.border}`,borderRadius:8,overflow:'hidden',margin:'8px 0'}}>{R.map((r,i)=><KV key={i} k={r[0]} v={r[1]} d={r[2]}/>)}</div>
  <Todo c="À challenger GPT : doublement du cooldown, seuil d'arrêt (3), cas 'clutch expiré' répété."/></div>)}

function Decisions(){const L=[
  ['26.06','Phase 2 — branchement + bienveillance + PREUVE',<>Gardien <code>create_clutch()</code> branché (envoi via RPC, anti-sonde) + unifié au blocage existant (<code>blocks</code>). Nudge « event de groupe » (sous-exposés). Multi-créneaux visibles via <code>syncCurrentSlot()</code> (promote-only, 0 site de gate touché). <b>Vérif prod : 0 chevauchement interdit ✅</b>. Cooldown : pas de blocage auto (correction David) → dé-priorisation + blocage volontaire réversible. Coûts opé : ~$25/mois + $99/an.</>],
  ['26.06','Taxonomie events + multi-créneaux',<>Validé (challenge GPT, tri Claude) : axe principal <code>spontané | planifié</code> — PAS le type de compte. Spontané (host≠partner) = dans une dispo active + horizon 18h glissant ; planifié (partenaire) = libre de dispo + 7j ; les DEUX créent une occupation. Multi-créneaux : max 3 actifs, gratuit, non-chevauchants. Fondation posée : config + logique pure testée (7 tests) + migration <code>availabilities</code>. UI 3 créneaux + gate = prochaine passe (EventsTab ne reçoit pas encore la dispo).</>],
  ['25.06','Forteresse — fondation',<>Machine à états pure + fuzzer (800k/0). Migration <code>occupancies</code> + EXCLUDE en prod (shadow→enforce). Bouton Verrouiller : rollback optimiste + message doux sur conflit (app2 ~L10968).</>],
  ['25.06','Durée RDV 1h→2h',<>Erreur rattrapée : <code>duration_minutes: isQuickDate?60:null</code> (app2 L1893) ⇒ quick=1h donc normal=2h. Leçon : vérifier la vraie valeur avant de trancher un défaut délégué.</>],
  ['26.06','Buffer 1h avant',<>Occupation = [proposed−1h, proposed+durée]. Le fuzzer a attrapé un bug (garde brute vs occupée) → <code>clutchOccRange()</code> source unique. Appliqué en prod (trigger MAJ + resync).</>],
  ['26.06','Events Phase 2',<>Migration <code>20260626_events_occupancy.sql</code> en prod. App : création écrit <code>starts_at</code> (L2945) ; rejoindre un event chevauchant → refus doux (L3171). EXCLUDE couvre clutch↔event et event↔event.</>],
  ['25.06','Produit — refus',<>Expiration douce (pas de « rejeté » brutal). Refus ≠ expiré : refus → cooldown 48h ×2 escalade puis arrêt ; expiré (pas vu) → pas de cooldown. Occupé peut envoyer (pas verrouiller dans la fenêtre).</>],
  ['25.06','Ouvert — notif refus',<>Notifie-t-on un refus ? Reco : non (flou protecteur, anti-sonde). À valider David.</>],
]
  return(<div><H c="Journal des décisions (horodaté, justifié)"/><Note c="Rien ne se perd. Détail long : docs/architecture-engagements.md + mémoire projet."/>
  {L.map((l,i)=><div key={i} style={{borderLeft:`2px solid ${C.border}`,padding:'1px 0 13px 14px',position:'relative',marginLeft:3}}>
    <div style={{position:'absolute',left:-5,top:3,width:8,height:8,borderRadius:'50%',background:C.orange}}/>
    <div style={{fontSize:10,color:C.dim,fontWeight:700}}>{l[0]}</div>
    <div style={{fontSize:12.8,fontWeight:900,color:C.salmon,margin:'1px 0 3px'}}>{l[1]}</div>
    <div style={{fontSize:11.6,lineHeight:1.55,color:C.text}}>{l[2]}</div></div>)}
  </div>)}

function Fichiers(){const F=[
  ['lib/clutch-states.ts','~245 l','Moteur pur : états, transitions, 7 invariants, clutchOccRange, isPaused, reducer apply().'],
  ['scripts/fuzz-clutch-states.mts','~190 l','Fuzzer : 8 tests ciblés + 800k actions aléatoires. npm run fuzz.'],
  ['lib/clutch-config.ts','~40 l','Tous les paramètres réglables (durées, buffer, cooldown, horizon).'],
  ['supabase/migrations/20260625_occupancies.sql','—','Table occupancies + EXCLUDE + trigger clutch + RLS (appliqué prod).'],
  ['supabase/migrations/20260626_events_occupancy.sql','—','starts_at/durée events + triggers event (appliqué prod).'],
  ['docs/architecture-engagements.md','—','Spec longue de la forteresse (source de vérité écrite).'],
  ['app/app2/page.tsx','~11,7k l','Branchements : L2945 starts_at · L3171 join conflict · L10968 verrou conflict · L10505 isPausedClutch.'],
]
  return(<div><H c="Inventaire des fichiers"/><Note c="Où vit quoi. (Lignes approximatives.)"/>
  {F.map((f,i)=><div key={i} style={{padding:'7px 0',borderBottom:`1px solid ${C.border}`}}>
    <div style={{display:'flex',gap:8,alignItems:'baseline'}}><code style={{fontSize:11.5,color:C.orange,fontWeight:700}}>{f[0]}</code><span style={{fontSize:10,color:C.dim}}>{f[1]}</span></div>
    <div style={{fontSize:11.3,color:C.mid,lineHeight:1.5,marginTop:2}}>{f[2]}</div></div>)}
  </div>)}

function Roadmap(){return(<div><H c="À implémenter (roadmap technique)"/>
  <P s={{fontSize:11.5}} c={<span style={{color:'#77BC1F'}}>✅ Faits : forteresse · taxonomie+gate · cooldown+gardien · blocage · multi-créneaux (persist+feuille+visibilité) · nudge bienveillant · Codex. Prod vérifiée : 0 chevauchement.</span>}/>
  <Todo c={<><b>🔑 Boost sous-exposés (slice 2)</b> — BLOQUÉ par l'upgrade Supabase. Besoin : logging léger des impressions (écritures) → puis <code>underExposureScore</code> + boost ranking plafonné +20%. À faire après le passage en Pro.</>}/>
  <Todo c={<><b>Supabase « over quota »</b> — passer en Pro ($25/mois) avant le 24.07. Débloque le boost.</>}/>
  <Todo c={<><b>Polish</b> : message gentil aussi sur accept-bot / contre-proposition (cosmétique — la base bloque déjà tout chevauchement). · promotion créneau au focus de l'app.</>}/>
  <Todo c={<><b>Fichier .log brut</b> (append-only) ré-injectable dans une IA, en parallèle de la mémoire.</>}/>
  <Todo c={<><b>Refactor app2</b> (~11,8k l) — extraire composants/helpers. Avec David, testé.</>}/>
</div>)}

function Systemes(){return(<div>
  <H c="La Forteresse, le Cône & le COQ — les systèmes (récap 28.06 → 01.07)"/>
  <Note c="Le cœur logique de Clutch. Trois pièces : la FORTERESSE (les règles espace-temps), le CÔNE (sa formule), le COQ (le validateur qui prouve qu'aucune règle ne casse, même à 1000 personnes)."/>

  <Sub c="🏰 LA FORTERESSE — les 2 Graals"/>
  <P c={<><b>Graal 1 — exclusion :</b> on ne peut pas être à 2 endroits en même temps. Garanti DUR par la base (table <code>occupancies</code> + contrainte <code>EXCLUDE gist</code> : chevauchement impossible par construction). Un clutch verrouillé OU un event accepté = un engagement qui occupe un créneau. Même moteur.</>}/>
  <P c={<><b>Graal 2 — causalité (le déplacement physique) :</b> on ne doit imposer le <i>moins</i> de tension possible à l'espace-temps. Concrètement : pour aller à un RDV, il faut le temps physique de s'y rendre. <b>Plus c'est loin, plus ça doit être tard.</b></>}/>

  <Sub c="🌀 LE CÔNE — la formule de causalité"/>
  <P c={<>Une seule inégalité gouverne tout (fichier <code>lib/forteresse-engine.ts</code>, prouvé) :</>}/>
  <Code c={`D + R ≤ portée(Δt)
  D  = distance moi → lieu (km)
  R  = rayon de recherche (km)
  Δt = temps avant le début (min)
  portée(Δt) = km parcourables en Δt  (modèle trajet ~35 km/h effectif)`}/>
  <P c={<>Tout en sort : le <b>plafond du rayon</b>, le flag <b>« trop loin »</b>, la <b>tension 0→10</b> (10 = la limite), la fenêtre <b>18h</b>. Le « cône » : à mesure que l'heure approche (Δt→0), la portée se resserre → la fenêtre du possible rétrécit comme un cône de lumière en relativité.</>}/>
  <Rev c={<>Affinage 30.06 (David) : pour un EVENT/lieu, on a <b>découplé</b> R de la contrainte. Seul le CENTRE doit être atteignable (<code>D ≤ portée</code>) ; le rayon = juste la zone de recherche, plafonné par le temps seul. Déplacer le pin loin ne rétrécit plus le rayon (la carte ne dézoome plus) — on <b>flague</b> « trop loin », on ne bloque pas dur.</>}/>

  <Sub c="🗓️ evaluateSchedule — le trou logique #1 (multi-engagements)"/>
  <P c={<>La forteresse ne raisonnait que sur UN clutch isolé. Le vrai manque : enchaîner DEUX engagements. Ex : échecs 20h30 (2h) → on accepte Léa 22h30 à Genève = <i>impossible</i> (pas le temps d'y aller), mais c'était autorisé.</>}/>
  <Code c={`fin(A) + trajet(lieuA → lieuB) ≤ début(B)   pour toute paire d'engagements
+ EXCLUSION (pas de chevauchement) + REACH (atteignable depuis ma position)`}/>
  <P c={<><b>En vigueur dans l'app (build 226-228) :</b> double-booking = bloqué DUR · enchaînement serré = <b>alerte</b> à l'envoi ET à l'acceptation (jamais bloquer, prévenir). cf <code>docs/protection-forteresse.md</code>.</>}/>

  <Sub c="🐓 LE COQ — le validateur logique"/>
  <P c={<>Nom de code du fuzzer nouvelle génération (clin d'œil au prouveur <i>Coq</i> de Dom). Il <b>énumère/bombarde</b> toutes les configs et <b>prouve les invariants</b> : aucun état impossible ne peut exister. <code>scripts/test-forteresse</code> = 26/26. <code>scripts/clutch-city</code> = la version vivante (ci-dessous).</>}/>

  <Sub c="🏙️ CLUTCH CITY — la ville-test"/>
  <P c={<>Page <code>/clutch-city</code> : N agents (jusqu'à ~700) vivent 18h à Lausanne sur la VRAIE forteresse + le VRAI algo de matching, RNG seedé (rejouable). Le COQ compte les trous en direct. Interrupteur <b>« forteresse corrigée »</b> → <b>14 415 trous → 0</b> (prouve que les règles tiennent à grande échelle).</>}/>
  <P c={<>Cockpit POV : on suit ~10 personnes (piochées ou <b>créées à la main</b>), on voit leur vécu (qui les clutche, RDV…), mode <b>👁 POV</b> (zoom + qui-elles-voient + leur rayon), <b>incarnation</b> (agir à leur place, la ville rejoue). Headless : <code>npx tsx scripts/clutch-city.mts</code>.</>}/>
  <Note c="⚠️ Le COQ/Clutch City prouve la LOGIQUE (zéro état impossible), pas l'adoption/UX (agents aléatoires, pas de vraies psychologies)."/>

  <Sub c="🎟️ Events × forteresse"/>
  <P c={<>Un event est <b>flagué « ⛔ trop loin pour l'heure » + grisé</b> dès que tu ne peux plus l'atteindre depuis ta position GPS pour son heure. Quand tu te déplaces (Lausanne→Genève) ou que le temps passe, les events injoignables se grisent seuls — sur la liste ET la carte 🗺️. Couleur de l'event = créneau (1/2/3) qui le contient.</>}/>
</div>)}

const TABS=[
  {k:'systemes',l:'🏰 Forteresse & COQ',e:<Systemes/>},
  {k:'histoire',l:'Histoire',e:<Histoire/>},
  {k:'schema',l:'Schéma réel',e:<Schema/>},
  {k:'archi',l:'Architecture SQL',e:<Archi/>},
  {k:'moteur',l:'Moteur & invariants',e:<Moteur/>},
  {k:'fuzzer',l:'Fuzzer',e:<Fuzzer/>},
  {k:'lexique',l:'Lexique',e:<Lexique/>},
  {k:'params',l:'Paramètres',e:<Params/>},
  {k:'decisions',l:'Décisions',e:<Decisions/>},
  {k:'fichiers',l:'Fichiers',e:<Fichiers/>},
  {k:'roadmap',l:'Roadmap',e:<Roadmap/>},
]

export default function CodexPage(){
  const [ok,setOk]=useState(false); const [tab,setTab]=useState('systemes')
  useEffect(()=>{ try{ if(localStorage.getItem('codex_ok')==='1') setOk(true) }catch{} },[])
  if(!ok) return <Lock onUnlock={()=>setOk(true)}/>
  const A=TABS.find(t=>t.k===tab)||TABS[0]
  return(<div style={{minHeight:'100vh',background:C.bg,color:C.text,fontFamily:'-apple-system,sans-serif'}}>
    <div style={{maxWidth:720,margin:'0 auto',padding:'22px 16px 70px'}}>
      <div style={{textAlign:'center',marginBottom:3}}>
        <span style={{fontSize:22,fontWeight:900,letterSpacing:'-.05em'}}><span style={{color:C.salmon}}>CLU</span><span style={{color:C.orange}}>TCH</span></span>
        <span style={{fontSize:13,color:'rgba(255,191,158,.45)',fontWeight:700,marginLeft:7}}>CODEX</span>
        <Tag c="v1 · dense" col={C.orange}/>
      </div>
      <div style={{textAlign:'center',color:C.dim,fontSize:11,marginBottom:14}}>Documentation technique — forteresse anti-conflit · moteur · algorithmes · décisions</div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',justifyContent:'center',marginBottom:6,position:'sticky',top:0,background:C.bg,padding:'7px 0',zIndex:2}}>
        {TABS.map(t=><button key={t.k} onClick={()=>setTab(t.k)} style={{padding:'5px 11px',borderRadius:18,border:`1px solid ${tab===t.k?C.orange:C.border}`,background:tab===t.k?'rgba(226,124,0,.15)':'transparent',color:tab===t.k?C.orange:C.mid,fontSize:11.3,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>{t.l}</button>)}
      </div>
      <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:14,padding:'4px 18px 22px'}}>{A.e}</div>
      <div style={{textAlign:'center',color:C.dim,fontSize:10,marginTop:16}}>Document vivant — enrichi à chaque étape. Aucune miette perdue. Source longue : docs/ + mémoire projet.</div>
    </div></div>)
}
