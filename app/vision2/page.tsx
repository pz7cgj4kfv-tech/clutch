'use client'
// ─────────────────────────────────────────────────────────────────────────────
// VISION 2 — LE RÉCIT PROFOND (non compressé). Ici on garde le CONTEXTE entier,
// les scénarios, le raisonnement de David, mot pour mot dans l'esprit.
// /vision = la carte rapide (rangée). /vision2 = la version longue et poussée.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react'

const C = {
  bg: '#FAF6F0', card: '#FFFFFF', card2: '#FFF8F2',
  border: 'rgba(42,16,32,0.12)', ink: '#1a0810',
  gold: '#A06808', salmon: '#C0603A', mid: 'rgba(26,8,16,0.78)', dim: 'rgba(26,8,16,0.45)',
  green: '#1a7a40', blue: '#1a5fa0', purple: '#6040b0', red: '#c0392b', pink: '#c2407e',
}
const PASS = 'hctulc'

const CHAPTERS = [
  { id: 'graal', icon: '🧭', t: 'Le Graal' },
  { id: 'places', icon: '🎟️', t: 'Les places' },
  { id: 'premium', icon: '💎', t: 'Premium & alertes' },
  { id: 'scaling', icon: '🌀', t: 'Scaling & thermostat' },
  { id: 'transparence', icon: '🤫', t: 'Transparence' },
  { id: 'surprise', icon: '🎁', t: 'Surprise / Mégaclutch' },
  { id: 'lancement', icon: '🚀', t: 'Lancement & liquidité' },
  { id: 'femmes', icon: '👩', t: 'Femmes = centre' },
]

const H1 = ({ children }: any) => <h1 style={{ fontSize: 25, fontWeight: 900, color: C.gold, letterSpacing: '-.5px', margin: '0 0 4px' }}>{children}</h1>
const H2 = ({ id, children }: any) => <h2 id={id} style={{ fontSize: 19, fontWeight: 900, color: C.ink, margin: '34px 0 10px', scrollMarginTop: 70, borderTop: `2px solid ${C.gold}30`, paddingTop: 16 }}>{children}</h2>
const H3 = ({ children }: any) => <h3 style={{ fontSize: 13, fontWeight: 800, color: C.salmon, textTransform: 'uppercase', letterSpacing: '.06em', margin: '18px 0 6px' }}>{children}</h3>
const P = ({ children }: any) => <p style={{ fontSize: 14, color: C.mid, lineHeight: 1.85, margin: '0 0 12px' }}>{children}</p>
const Quote = ({ children, who }: any) => (
  <div style={{ borderLeft: `3px solid ${C.gold}`, background: C.card2, padding: '12px 16px', borderRadius: '0 10px 10px 0', margin: '14px 0' }}>
    <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.8, fontStyle: 'italic' }}>{children}</div>
    {who && <div style={{ fontSize: 11, color: C.dim, marginTop: 6, fontWeight: 700 }}>— {who}</div>}
  </div>
)
const Note = ({ children, color = C.blue, title }: any) => (
  <div style={{ background: `${color}10`, border: `1px solid ${color}40`, borderRadius: 12, padding: '13px 16px', margin: '14px 0' }}>
    {title && <div style={{ fontSize: 12.5, fontWeight: 800, color, marginBottom: 5 }}>{title}</div>}
    <div style={{ fontSize: 13.5, color: C.mid, lineHeight: 1.8 }}>{children}</div>
  </div>
)
const B = ({ children }: any) => <b style={{ color: C.ink }}>{children}</b>

export default function Vision2() {
  const [auth, setAuth] = useState(false)
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)

  if (!auth) {
    const go = () => { if (pw === PASS) setAuth(true); else setErr(true) }
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', padding: 20 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, width: 300, textAlign: 'center', boxShadow: '0 8px 30px rgba(42,16,32,.10)' }}>
          <div style={{ fontSize: 26, marginBottom: 8 }}>📖</div>
          <div style={{ fontSize: 15, fontWeight: 900, color: C.gold, marginBottom: 4 }}>Vision 2 · le récit profond</div>
          <div style={{ fontSize: 11, color: C.dim, marginBottom: 20 }}>version longue, non compressée</div>
          <input autoFocus type="password" value={pw} onChange={e => { setPw(e.target.value); setErr(false) }} onKeyDown={e => { if (e.key === 'Enter') go() }} placeholder="mot de passe"
            style={{ background: C.card2, border: `2px solid ${err ? C.red : 'rgba(200,134,10,.4)'}`, borderRadius: 10, padding: '10px 16px', color: C.ink, fontSize: 14, width: '100%', outline: 'none', textAlign: 'center', boxSizing: 'border-box', marginBottom: 8 }} />
          {err && <div style={{ fontSize: 11, color: C.red, marginBottom: 8 }}>Code incorrect</div>}
          <button onClick={go} style={{ background: C.gold, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 800, fontSize: 13, cursor: 'pointer', width: '100%' }}>Entrer</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'ui-sans-serif,system-ui,-apple-system,sans-serif' }}>
      {/* Nav chapitres */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: `${C.bg}f2`, backdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.border}`, padding: '10px 16px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: C.gold, marginBottom: 6 }}>📖 Vision 2 — le récit profond <span style={{ fontSize: 10, color: C.dim, fontWeight: 500 }}>(non compressé · la carte rapide reste sur /vision)</span></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {CHAPTERS.map(c => (
              <a key={c.id} href={`#${c.id}`} style={{ fontSize: 11, fontWeight: 600, color: C.mid, textDecoration: 'none', border: `1px solid ${C.border}`, borderRadius: 14, padding: '3px 9px', background: C.card }}>{c.icon} {c.t}</a>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 18px 80px' }}>
        <H1>La vision de Clutch — en entier</H1>
        <P>Cette page existe parce que la « carte rapide » (/vision) compresse tout en phrases courtes, et qu'on y perd le contexte et les scénarios. Ici, on garde <B>le raisonnement complet</B>. C'est long, c'est voulu.</P>

        {/* ── GRAAL ── */}
        <H2 id="graal">🧭 Le Graal — accro à la vie, pas à l'app</H2>
        <P>Clutch n'est pas une app de rencontre. C'est un <B>système d'exploitation des opportunités sociales en temps réel</B>. Le concurrent n'est ni Tinder ni Instagram : <B>c'est le canapé</B>, c'est « je reste chez moi ». L'unique aune de toute décision produit : <B>est-ce que ça fait sortir quelqu'un dans les deux heures ?</B></P>
        <P>La plupart des apps fabriquent le réflexe « j'ouvre parce qu'il y a peut-être une notification ». Clutch doit créer un réflexe radicalement différent : <B>« je me rends disponible parce qu'il peut se passer quelque chose »</B>. La nuance est énorme : on ne crée pas une habitude d'écran, on crée une <B>disponibilité au réel</B>.</P>
        <P>Et c'est honnête, contrairement à Tinder. Tinder <i>fabrique</i> l'espoir avec un feed algorithmique (fausse variabilité = dark pattern). Chez Clutch, la variabilité est <B>réelle</B> : la disponibilité des vraies gens change tout le temps. La dopamine est éthique parce que l'opportunité est vraie. On révèle le monde, on ne le manipule pas.</P>
        <H3>Le vrai produit, c'est la notification</H3>
        <P>L'app est le <B>cockpit, pas la destination</B>. Le produit vit dans le push : « 3 personnes fiables dispo à 12 min, jusqu'à 19h42 » → tu tapes → « 18h30 au café ? » → tu fermes ton téléphone et tu y vas. <B>L'utilisateur parfait n'ouvre presque jamais l'app.</B> La métrique Nord : <B>rencontres réelles ÷ minutes d'écran</B>. Toute feature qui augmente le temps d'écran sans augmenter les vrais RDV est un dark pattern → on la coupe. On veut <B>une app qu'on est fier de fermer.</B></P>

        {/* ── PLACES ── */}
        <H2 id="places">🎟️ Les places — le scénario complet</H2>
        <P>C'est la clé que tu as trouvée. Déroulons-la <B>entièrement</B>, avec une vraie personne.</P>
        <P>Sophie se met disponible un jeudi soir. Dans son profil, elle a réglé une chose simple : <B>« je veux recevoir au maximum 5 clutchs à la fois »</B> (ce nombre, c'est SA décision ; par défaut on mettra plutôt ~10, et chacun peut le régler, jusqu'à 50+ pour qui veut).</P>
        <P>Pendant la soirée, elle reçoit des clutchs. Tant qu'elle n'a pas <B>5 clutchs en attente</B>, tout le monde peut l'inviter. Mais dès qu'elle atteint ses 5 places pleines, <B>elle devient « complète »</B> : les nouveaux venus ne peuvent plus lui envoyer de clutch. Ils voient « complète ce soir » <B>à la porte</B> — donc ils ne s'empilent pas chez elle. C'est capital : <B>Sophie ne se retrouve JAMAIS face à 500 sollicitations à refuser une par une.</B> Le plafond la protège à l'entrée.</P>
        <H3>Comment les places se libèrent</H3>
        <P>De deux façons, et <B>aucune n'est une corvée</B> : soit Sophie <B>répond</B> (elle accepte ou refuse l'un de ses 5), soit le clutch <B>expire tout seul</B> (la fenêtre de réponse est de <B>2 heures</B> — à ne pas confondre avec sa fenêtre de disponibilité personnelle qui, elle, peut aller jusqu'à 18h). Donc même si Sophie ne fait rien, ses places se rouvrent avec le temps. Elle n'est jamais <i>forcée</i> de refuser quelqu'un.</P>
        <Note color={C.green} title="Le point qu'il ne faut pas rater">
          Tout ça ne touche QUE la <B>clutchabilité</B> (combien de clutchs elle reçoit), <B>jamais la visibilité</B>. Sophie, elle, continue de <B>voir tout le monde à l'infini</B> (scroll infini) et peut <B>clutcher qui elle veut</B>, même quand elle est pleine. Les femmes choisissent, les hommes attendent. La limite ne restreint jamais la choisisseuse — seulement le flot qui va vers elle.
        </Note>
        <Note color={C.salmon} title="Pas de liste d'attente classée">
          On a écarté l'idée d'une file d'attente avec un classement : ça créerait de la pression et des jeux de stratégie. « Complète, je te préviens si une place se libère » suffit, c'est doux.
        </Note>

        {/* ── PREMIUM ── */}
        <H2 id="premium">💎 Premium — les alertes (ton idée, en entier)</H2>
        <P>Voici précisément le scénario premium que tu m'as décrit, déroulé complètement — c'est lui que tu cherchais.</P>
        <P>Marc a payé l'abonnement. Il tombe sur le profil de Sophie, qui correspond parfaitement à ce qu'il cherche. Mais elle est <B>pleine</B> ce soir (ses 5 places sont prises). Un utilisateur gratuit verrait juste « complète » et passerait son chemin.</P>
        <P>Marc, lui, parce qu'il est premium, peut <B>voir qu'elle est en ligne et disponible même si elle est non-clutchable</B>, et surtout il peut poser une <B>alerte personnelle</B> : <B>« préviens-moi dès qu'une place se libère chez Sophie »</B>. Dès que Sophie répond à l'un de ses clutchs, ou qu'un de ses clutchs expire (2h), <B>une place se rouvre → Marc reçoit une notification → il clique → il l'invite, parmi les premiers.</B></P>
        <Quote who="David">
          « Le mec qui a payé peut avoir une notification que la place de l'autre s'est libérée, puis il peut aller la clutcher. Et il pourrait voir qu'elle est quand même en ligne, dispo, et se mettre une alerte. »
        </Quote>
        <H3>La variante « redevenue disponible »</H3>
        <P>Même logique pour quelqu'un qui n'est pas dispo du tout pour l'instant. Un premium peut voir les <B>présents non-clutchables</B> et poser une alerte ; quand la personne <B>repasse disponible</B>, il est prévenu et peut l'inviter aussitôt.</P>
        <Note color={C.purple} title="Pourquoi ce n'est PAS du pay-to-win">
          On vend de la <B>réactivité / du confort</B> (être prévenu au bon moment), <B>jamais</B> la visibilité, la priorité injuste, ni la fiabilité. La fiabilité se mérite et ne s'achète jamais. Marc n'a aucun avantage <i>de mérite</i> sur Sophie : il est juste mieux outillé pour saisir une vraie opportunité au moment où elle apparaît. C'est l'équivalent d'une alerte de réservation, pas d'un coupe-file truqué.
        </Note>
        <H3>L'idée à valider : « clutcher sans être clutchable »</H3>
        <P>Tu as aussi soulevé : pouvoir <B>ne plus être clutchable tout en continuant de clutcher les autres</B>. C'est un candidat de fonction premium — à valider éthiquement avec Mel (est-ce que ça déséquilibre le rapport hommes/femmes ? à creuser).</P>

        {/* ── SCALING ── */}
        <H2 id="scaling">🌀 Scaling — et si ça cartonne ? (Paris, New York)</H2>
        <P>Ta grande inquiétude : au début c'est le vide, d'accord — mais <B>si l'app explose</B>, qu'est-ce qui se passe ? Est-ce qu'elle perd son sens quand il y a 50 000 personnes en ligne dans un petit périmètre un vendredi soir ?</P>
        <P>La réponse rassurante : <B>à grande échelle, Clutch ne perd pas son sens, il l'inverse. Plus il y a de monde, plus on en cache… non — plus on TRIE.</B> On ne cache personne (tu as raison là-dessus, et j'avais eu tort de dire « on montre 5, on cache le reste » : c'est faux, c'est scroll infini, on voit tout le monde). Ce qui change, c'est l'<B>ordre</B> : les plus compatibles, proches et fiables remontent en haut. La foule devient ta <B>matière première</B> pour trouver les pépites, pas un mur de visages.</P>
        <P>Et les gens populaires sont protégés non pas en les cachant, mais par <B>les places</B> : une fois pleins, ils deviennent non-clutchables. Donc même avec 10 000 hommes en ligne, une femme très demandée ne reçoit jamais que ses N clutchs. <B>Le tri + les places, c'est ça le mécanisme qui scale.</B> Tinder déverse l'infini ; Clutch te tend les bonnes rencontres et protège les gens.</P>
        <H3>Le thermostat — automatique, par zone, sans humain</H3>
        <P>Tu l'as dit clairement : <B>on ne peut pas être deux devant un écran à régler ça pour chaque ville si ça devient mondial.</B> Donc ce n'est pas nous qui décidons en direct, et ce n'est <B>pas une IA boîte noire</B> (ça, ce serait le risque, et tu as dit « pas le droit à l'erreur »).</P>
        <P>C'est un <B>thermostat déterministe</B> : un petit programme tourne dans la base de données (comme le cron qui expire déjà les clutchs), calcule la <B>densité par zone et par heure</B>, et règle tout seul l'intensité du tri. Place de la Palud à 21h n'a pas le même réglage que Morges à 14h. <B>Chaque quartier s'auto-calibre</B> → ça marche pour Lausanne comme pour New York, <B>sans humain par ville</B>.</P>
        <Note color={C.red} title="Filet de sécurité (ton point sur les pannes)">
          Si ce programme plante, on retombe automatiquement sur « tri neutre, montre tout le monde » : <B>jamais cassé</B>, juste moins optimal. Et la base est sauvegardée régulièrement. On ne lance jamais quelque chose dont une panne casserait tout.
        </Note>
        <H3>Les deux vitesses</H3>
        <P>⚡ Le réglage de densité = <B>automatique, temps réel</B> (le thermostat). 🐢 La <i>forme</i> de la formule et les grands poids = <B>toi et moi, rarement</B>, en lisant les vraies données. Ça réconcilie tes deux exigences : « ça doit apprendre/s'ajuster tout seul » (le live) ET « pas de boîte noire qui décide à notre place » (l'humain garde les grandes orientations).</P>
        <H3>Les vrais chiffres</H3>
        <P>Genève : ~200 000 adultes → ~2 000 en ligne un bon vendredi (peu de tri nécessaire). <B>Paris</B> : ~1,5M d'adultes intra-muros → ~15 000 en ligne, et un cercle central de 2 km un vendredi soir = <B>plusieurs dizaines de milliers</B>. <B>New York</B> : ~65 000+. À cette échelle, la curation (tri + places) n'est plus une option, elle est <B>vitale</B>. Au lancement, c'est l'inverse total : 20 à 80 personnes par ville → thermostat éteint, priorité absolue à l'anti-vide.</P>

        {/* ── TRANSPARENCE ── */}
        <H2 id="transparence">🤫 Transparence — subtile, jamais naïve</H2>
        <P>On a tranché un point de goût important. Montrer la machinerie (« score 87 %, poids 0.3 ») est froid et triche-able. Mais l'inverse — une étiquette niaise du genre « vous aimez le jazz tous les deux » — tu l'as jugée nulle, et tu as raison.</P>
        <Quote who="David">« Tu imagines comme c'est nul de dire "allez vous avez le jazz en commun". Il faut être sérieux, subtil, moral et éthique. »</Quote>
        <P>La cible : un <B>ordre intelligent</B> + au mieux un <B>signal discret, ressenti</B> (une nuance, pas une phrase explicative). L'influence se règle dans le profil (un curseur « plutôt similaire ↔ plutôt différent ») <B>sans jamais exposer les chiffres</B>. On garde le mystère, on garde une pointe de chaleur, on ne donne jamais l'impression d'une calculette. → Je te proposerai <B>2-3 directions</B> concrètes (c'est un choix de goût, je ne le décide pas seul).</P>

        {/* ── SURPRISE ── */}
        <H2 id="surprise">🎁 Mode Surprise / Mégaclutch</H2>
        <P>Ton idée d'expériences hors du commun. Quelqu'un crée un événement — un saut en parachute, un vol en parapente. Pour lui, c'est peut-être banal. Mais <B>l'IA détecte que cet événement est exceptionnel</B> (un classifieur qui repère le rare) et le <B>met en avant</B> auprès des gens qui ont payé pour voir l'exceptionnel.</P>
        <P>Nom de travail : « Surprise » ou « Mégaclutch » — à trouver. C'est une couche au-dessus des événements normaux : la détection automatique de l'extraordinaire + une mise en avant premium. À creuser, c'est un vrai facteur de différenciation et de désir.</P>

        {/* ── LANCEMENT ── */}
        <H2 id="lancement">🚀 Lancement & liquidité — le vrai tueur</H2>
        <P>Ce qui tue Clutch, ce n'est pas Tinder, Bumble ou Hinge. C'est <B>ouvrir l'app et voir personne</B> — la mort de l'espoir. 70 % de l'énergie doit aller là, pas dans l'algo.</P>
        <H3>La nuance qui change tout (la tienne)</H3>
        <P><B>Tout doit être réglable</B> (poids, crédits, seuils). <B>Mais</B> trois choses doivent être pensées à fond <B>avant</B> le lancement, parce qu'une mauvaise première expérience ne se rattrape pas : <B>la sécurité, la confiance, la liquidité</B>. Une femme qui reçoit 25 sollicitations en 20 minutes, trois lapins la première semaine, une impression de marché aux bestiaux → dette de réputation irrattrapable. (Et on a déjà commencé à y répondre : le cooldown 48h et le blocage sont verrouillés en base, et les places règlent le flot.)</P>
        <H3>Le playbook</H3>
        <P>Ne pas lancer « Lausanne ». Lancer <B>Lausanne centre</B>, puis seulement <B>jeudi-vendredi-samedi</B>, puis seulement <B>18h-23h</B>. On concentre la rareté au lieu de la subir. Les <B>Golden Hours</B> (jeu 19h, ven 18h, sam 16h) deviennent des heures sacrées : tout le monde sait que « c'est là qu'il se passe quelque chose ». Les <B>événements</B> sont la béquille de démarrage (events → micro-groupes → duos).</P>
        <H3>L'anti-vide honnête</H3>
        <P><B>Jamais de faux profils, jamais de faux matchs</B> (beaucoup de startups meurent là). Mais quand le rayon est vide, on ne montre jamais du vide : un <B>compte à rebours de la prochaine Golden Hour</B>, les événements à venir, « 6 personnes étaient dispo ici hier à cette heure ». Le vide devient une <B>promesse</B>, pas un échec.</P>
        <H3>Masse critique & décision contre-intuitive</H3>
        <P>Repères : 100-150 actifs/semaine dans un micro-secteur = ça respire ; 300-500 = intéressant ; 1000+ = effet réseau visible. Et la décision que la plupart des fondateurs refusent : <B>refuser d'ouvrir trop vite</B>. 500 personnes très actives à Lausanne valent mieux que 10 000 dispersées en Suisse romande.</P>
        <H3>Le fossé incopiable</H3>
        <P>Ce n'est ni la techno, ni l'IA, ni l'algo. C'est une <B>réputation collective de fiabilité</B> : « sur Clutch, quand quelqu'un dit oui, il vient. » Ça, c'est un actif extrêmement rare. D'où la fiabilité rendue <B>hyper-visible</B> (presque avant les photos).</P>
        <Quote who="La phrase stratégique">
          « Le produit n'est ni le matching, ni l'IA, ni les profils. C'est la transformation d'une intention sociale faible ("je devrais sortir") en rencontre réelle dans les deux heures, avec assez de confiance pour que les femmes aient envie d'appuyer sur Disponible. Gagne cette bataille, le reste est de l'optimisation. Perds-la, aucun algorithme ne te sauve. »
        </Quote>

        {/* ── FEMMES ── */}
        <H2 id="femmes">👩 Femmes = centre de gravité</H2>
        <P>Le problème n°1 n'est pas le matching. C'est : <B>est-ce qu'une femme de 23 ans, seule un soir, accepte d'appuyer sur « je suis disponible » ?</B> Si oui, les hommes arrivent. Si non, tout meurt. La vraie question n'est pas « comment attirer des femmes » mais « <B>comment réduire le coût psychologique de dire oui</B> ».</P>
        <P>Elle ne se demande pas « vais-je matcher ? » mais « <B>est-ce que je garde le contrôle ?</B> ». D'où : contrôle total avant même l'invitation (tranche d'âge, distance, type de rencontre, heures autorisées) ; contrôle de visibilité (visible seulement aux profils fiables / vérifiés / ayant déjà participé à un événement) ; réputation extrêmement visible ; et un premier rendez-vous idéalement dans des <B>lieux partenaires publics</B> (très sous-estimé, à coder un jour).</P>
        <Note color={C.pink} title="Le principe éthique dur">
          Le produit, au fond, ce sont les femmes — on le sait. Mais on ne le sert <B>jamais par une règle genrée qu'on devrait cacher</B> (ce serait un dark pattern + un risque légal). On le sert par le <B>design</B> : des règles neutres pour tous (mêmes quotas, mêmes places), conçues pour que la protection émerge d'elle-même. Honnête, défendable, et ça protège quand même.
        </Note>

        <div style={{ marginTop: 40, paddingTop: 16, borderTop: `1px solid ${C.border}`, fontSize: 11, color: C.dim, textAlign: 'center' }}>
          Vision 2 · récit profond · Clutch · on enrichit cette page, on ne la compresse jamais.
        </div>
      </div>
    </div>
  )
}
