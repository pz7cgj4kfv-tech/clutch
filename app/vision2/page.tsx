'use client'
// ─────────────────────────────────────────────────────────────────────────────
// VISION 2 — IDÉES BRUTES (accordéon). PRINCIPE ANTI-COMPRESSION :
// on garde les mots de David EN ENTIER (juste mieux syntaxés, dédupliqués),
// jamais réduits à une phrase. Un titre cliquable → tout le contexte dessous.
// Append-only : on ajoute, on n'efface jamais, on ne compresse jamais.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react'

const C = {
  bg: '#FAF6F0', card: '#FFFFFF', card2: '#FFF8F2',
  border: 'rgba(42,16,32,0.12)', ink: '#1a0810',
  gold: '#A06808', salmon: '#C0603A', mid: 'rgba(26,8,16,0.80)', dim: 'rgba(26,8,16,0.45)',
  green: '#1a7a40', blue: '#1a5fa0', purple: '#6040b0', red: '#c0392b', pink: '#c2407e',
}
const PASS = 'hctulc'

const P = ({ children }: any) => <p style={{ fontSize: 14, color: C.mid, lineHeight: 1.85, margin: '0 0 12px' }}>{children}</p>
const B = ({ children }: any) => <b style={{ color: C.ink }}>{children}</b>
const Quote = ({ children }: any) => (
  <div style={{ borderLeft: `3px solid ${C.gold}`, background: C.card2, padding: '11px 15px', borderRadius: '0 10px 10px 0', margin: '12px 0', fontSize: 13.5, color: C.ink, lineHeight: 1.8, fontStyle: 'italic' }}>{children}</div>
)
const Fix = ({ children }: any) => (
  <div style={{ background: `${C.green}10`, border: `1px solid ${C.green}40`, borderRadius: 10, padding: '10px 14px', margin: '12px 0', fontSize: 13, color: C.mid, lineHeight: 1.75 }}>
    <b style={{ color: C.green }}>✓ Précision </b>{children}
  </div>
)

const IDEAS: { id: string; icon: string; title: string; tag?: string; body: () => React.ReactElement }[] = [
  {
    id: 'graal', icon: '🧭', title: 'Le Graal : accro à la vraie vie, pas à l\'app',
    body: () => (<>
      <P>Clutch n'est pas une app de rencontre. C'est un système qui transforme une envie molle (« je devrais sortir ») en vraie rencontre dans les deux heures. Le concurrent, ce n'est ni Tinder ni Instagram : <B>c'est le canapé</B>. La seule question qui juge chaque feature : est-ce que ça fait sortir quelqu'un dans les deux heures ?</P>
      <P>Le vrai produit, c'est <B>la notification</B>, pas l'écran. On ouvre, on vérifie, on décide, on referme, on y va. L'utilisateur parfait n'ouvre presque jamais l'app — il se rend juste <B>disponible</B> parce qu'il peut se passer quelque chose. On veut une app qu'on est fier de fermer.</P>
    </>)
  },
  {
    id: 'places', icon: '🎟️', title: 'Les places : chacun choisit combien de clutchs il accepte', tag: 'TA CLÉ',
    body: () => (<>
      <P>L'idée que tu as trouvée, en entier. <B>Tout le monde — mais c'est surtout pensé pour les femmes — peut choisir, dans son profil, combien de clutchs il accepte en même temps.</B> Mettons qu'une fille mette cinq. Tant qu'elle n'a pas répondu à ces cinq-là (accepté ou refusé), ses places sont pleines.</P>
      <P>Quand ses places sont pleines, elle <B>n'est plus clutchable</B> : les nouveaux ne peuvent plus l'inviter, ils voient « complète ce soir » <B>à la porte</B>. Le point que tu as soulevé est essentiel : il ne faut pas qu'elle soit <B>saturée par cinq cent mille personnes en disant non sans arrêt</B> — ça, ce n'est pas bon. Avec les places, ça n'arrive jamais : on bloque à l'entrée, ça ne s'empile pas chez elle.</P>
      <P>Pour récupérer des places, soit elle répond (accepte/refuse), soit le clutch expire tout seul. Ses places se libèrent, sans que ce soit une corvée.</P>
      <Fix>Deux corrections qu'on a actées ensemble. (1) Elle reste <B>visible et peut scroller tout le monde à l'infini</B> et clutcher qui elle veut — la limite ne touche QUE le fait d'<B>être</B> clutchée, jamais ce qu'elle voit. Quelqu'un de « non-clutchable », c'est juste quelqu'un de déjà pris. (2) Le défaut ne sera pas 5 (trop peu) mais plutôt 10, voire plus — réglable, et qui veut 50 par jour en a le droit. Le bon chiffre par défaut reste à analyser.</Fix>
      <Fix>Une place de clutch se répond en <B>2 heures</B> (après quoi le clutch expire). À ne pas confondre avec la fenêtre de <B>disponibilité personnelle</B>, qui peut aller jusqu'à 18h.</Fix>
    </>)
  },
  {
    id: 'premium-alerte', icon: '💎', title: 'Premium : l\'alerte quand une place se libère', tag: 'TON IDÉE',
    body: () => (<>
      <P>Pas de liste d'attente, on est d'accord. Par contre, voilà ton idée exacte : <B>si le filtre correspond, un mec qui a payé peut recevoir une notification quand une place de l'autre s'est libérée</B>, et il peut aller la clutcher en premier.</P>
      <Quote>« Le mec qui a payé peut avoir une notification que la place de l'autre s'est libérée, puis il peut aller la clutcher. Et il pourrait voir qu'elle est quand même en ligne, dispo, et se mettre une alerte. »</Quote>
      <P>Concrètement : une personne pleine reste visible. Un premium peut la voir <B>même non-clutchable</B>, et poser une alerte personnelle. Dès qu'une de ses places se libère (réponse ou expiration), il est notifié, il clique, il propose. Ce n'est pas une file classée — c'est une <B>alerte de réactivité</B>.</P>
    </>)
  },
  {
    id: 'premium-dispo', icon: '🔔', title: 'Premium : l\'alerte quand la personne redevient disponible', tag: 'TON IDÉE',
    body: () => (<>
      <P>La variante, tes mots : <B>on peut voir les gens qui sont présents mais pas clutchables, et se mettre une alerte ; quand cette personne est tout à coup dispo, on reçoit une alerte, on clique, et on lui propose un truc.</B></P>
      <Quote>« On pourrait rajouter dans le premium qu'on peut quand même voir les gens qui sont présents mais pas clutchables, et mettre une alerte : quand cette personne est tout à coup dispo, on reçoit une alerte, on clique, puis on lui propose un truc. »</Quote>
      <P>Garde-fou éthique : on vend de la <B>réactivité / du confort</B>, jamais la visibilité ni la priorité de mérite, jamais la fiabilité. C'est une alerte de réservation, pas un coupe-file truqué.</P>
    </>)
  },
  {
    id: 'qui-voit-pleins', icon: '👁️', title: 'Qui voit les personnes pleines ? (raffinement)', tag: 'NOUVEAU',
    body: () => (<>
      <P>Ton raffinement : <B>une personne pleine (non-clutchable) ne devrait plus être visible par les utilisateurs gratuits — seulement par ceux qui paient.</B> La logique : un gratuit ne peut de toute façon pas l'inviter, donc autant lui éviter la frustration du « complète » ; et ça donne une vraie raison de payer (la voir, et poser une alerte « place libérée »).</P>
      <Quote>« Les personnes qui sont pleines, à mon avis, elles ne doivent plus être visibles par les gens normaux. Elles sont visibles que par les gens qui paient. Ça paraît logique. »</Quote>
      <Fix><B>Mon challenge (à trancher avec Mel).</B> Attention à notre ligne éthique : « ne jamais vendre la visibilité, ne pas traiter les femmes comme le produit ». Comme les gens « pleins » seront surtout des femmes très demandées, « le premium voit les pleines » peut se lire comme <B>« payer pour voir plus de femmes »</B>. La nuance qui peut sauver : le gratuit voit déjà <B>toutes les personnes disponibles</B> ; le premium ne gagne que l'accès aux personnes <B>occupées</B> (+ l'alerte de réactivité), jamais un avantage de mérite. À valider ensemble : est-ce que ça reste du confort, ou est-ce que ça franchit la ligne ? C'est une décision produit toi + Mel, pas un automatisme.</Fix>
      <Fix><B>Ma recommandation (position nette).</B> Je serais CONTRE « les premium voient les pleines » — ça sent trop le « payer pour voir des femmes ». Mieux, même bénéfice sans la ligne franchie : les pleines disparaissent de la liste clutchable <B>pour tout le monde</B> (gratuit ET premium), et le vrai perk premium, c'est l'<B>alerte</B> : tu mets quelqu'un en favori, et si cette personne est pleine/occupée, tu reçois une notif quand une place se libère. Tu poses l'alerte sur quelqu'un que tu as <B>déjà vu / mis en favori</B>, pas sur « les femmes occupées » en général. On vend de la réactivité, jamais de la visibilité.</Fix>
    </>)
  },
  {
    id: 'invisible', icon: '🥷', title: 'Premium (à valider) : clutcher sans être clutchable',
    body: () => (<>
      <P>Tu as aussi lancé l'idée de pouvoir <B>ne plus être clutchable tout en continuant de clutcher les autres</B>. Candidat de fonction premium. À valider éthiquement avec Mel : est-ce que ça déséquilibre le rapport hommes/femmes ? À creuser, pas tranché.</P>
    </>)
  },
  {
    id: 'scaling', icon: '🌀', title: 'Et si ça cartonne ? (Paris, New York)', tag: 'TA GRANDE QUESTION',
    body: () => (<>
      <P>Ta question, en entier : au début c'est le vide, d'accord, mais <B>imagine que l'application marche à mort</B>. Une ville comme Paris, un cercle restreint, un vendredi soir : énormément de monde en ligne en même temps dans le même périmètre. Comment on gère ça ? Et une ville d'un million ? Et New York ? Est-ce que, passé un certain nombre de personnes, l'app n'est plus utilisable — est-ce qu'elle perd son sens par rapport à ce qu'on veut proposer ?</P>
      <Quote>« Si l'application était saturée, tant mieux pour nous, mais il se passe quoi en fait ? Est-ce que tout à coup l'application n'a plus de sens ? Faut quand même se poser la question. »</Quote>
      <P>La réponse, et ta propre intuition était juste : <B>l'application peut montrer beaucoup de personnes, mais l'autre ne doit pas être clutchable à l'infini.</B> À grande échelle, on ne cache pas la foule, on la <B>trie</B> (les plus compatibles, proches et fiables en haut) — et les places protègent les gens très demandés (une fois pleins, ils deviennent non-clutchables). Donc plus il y a de monde, plus le tri et les places travaillent. La foule devient ta matière première, pas un mur. Clutch ne perd pas son sens à l'échelle : il l'inverse.</P>
      <P>Les chiffres réels : Genève ~2 000 en ligne un bon soir ; Paris ~15 000, un cercle central = plusieurs dizaines de milliers ; New York 65 000+. À ce niveau, le tri n'est plus une option, il est vital.</P>
    </>)
  },
  {
    id: 'thermostat', icon: '🌡️', title: 'Le réglage doit être automatique — pas nous à la main, mais pas une boîte noire', tag: 'TON EXIGENCE',
    body: () => (<>
      <P>Tes mots : <B>il ne faudra pas que ce soit nous qui décidons. Il faut que ce soit dynamique, interne. On ne peut pas être tout le temps devant l'écran à voir combien il y a de personnes.</B> Et si ça devient mondial, on ne va pas engager cinq cent mille personnes pour gérer chaque ville. On ne peut pas valider tout à la main.</P>
      <Quote>« Il faut que ce soit dynamique interne. Est-ce qu'il faudra faire gérer ça par l'IA ? Mais il faut que ce soit stable, avec toi qui gères tout ça. Une API liée au serveur, liée aux bases de données. Et puis s'il y a un bug, il faut des backups, si tu as une panne. Imagine que ça cartonne. »</Quote>
      <P>La solution : un <B>thermostat</B>. Un petit programme tourne dans la base de données, calcule la densité par zone et par heure, et règle tout seul l'intensité du tri. Chaque quartier s'auto-calibre → ça marche pour Lausanne comme pour New York, sans humain par ville. <B>Ce n'est pas une IA boîte noire</B> (ça, ce serait le risque, et tu as dit « pas le droit à l'erreur ») : c'est déterministe, borné, prévisible.</P>
      <P>Ton point sur les pannes est intégré : <B>filet de sécurité</B> — si le programme plante, on retombe sur « montre tout le monde, tri neutre », jamais cassé, et la base est sauvegardée. Deux vitesses : le réglage densité = automatique temps réel ; la forme de la formule = toi et moi, rarement, sur de vraies données.</P>
    </>)
  },
  {
    id: 'transparence', icon: '🤫', title: 'La transparence doit être subtile, pas niaise', tag: 'TON GOÛT',
    body: () => (<>
      <P>Tu m'as repris, à juste titre, sur mon exemple naze :</P>
      <Quote>« Tu imagines comme c'est nul de dire "allez, vous avez le jazz en commun". Non, il faut être sérieux. Il faut vraiment être subtil, moral et éthique. »</Quote>
      <P>On ne montre jamais la machinerie (« score 87 %, poids 0.3 » = froid et trichable), et on ne tombe pas non plus dans l'étiquette niaise. La cible : un <B>ordre intelligent</B> + au mieux un <B>signal discret, ressenti</B>, jamais une phrase qui explique. L'influence se règle dans le profil (un curseur « plutôt similaire / plutôt différent »), sans jamais exposer les chiffres. Je te proposerai 2-3 directions — c'est un choix de goût, je ne le tranche pas seul.</P>
    </>)
  },
  {
    id: 'surprise', icon: '🎁', title: 'Mode Surprise / Mégaclutch : l\'IA repère l\'exceptionnel', tag: 'TON IDÉE',
    body: () => (<>
      <P>Tes mots : <B>le mode surprise, je veux que ce soit des activités hors du commun.</B> Quelqu'un crée un événement — un saut en parachute, un vol en parapente. Pour lui, c'est un événement lambda. Mais <B>l'IA va déterminer que c'est un événement exceptionnel</B>, et le proposer en avant à des gens qui auront payé pour voir les trucs exceptionnels.</P>
      <Quote>« On va appeler ça surprise, ou mégaclutch, ou je ne sais pas, il faut trouver un nom. »</Quote>
      <P>Techniquement : un classifieur qui repère le rare/extraordinaire + une mise en avant premium. Vrai facteur de désir et de différenciation. Le nom est à trouver.</P>
    </>)
  },
  {
    id: 'carte-events', icon: '🗺️', title: 'Une carte interactive des événements', tag: 'NOUVEAU',
    body: () => (<>
      <P>Ton idée : <B>une vraie carte qu'on manipule. On clique dessus, on voit les événements, on peut dézoomer, se déplacer dessus virtuellement</B> — puis se placer à un endroit pour voir/s'inscrire aux events de ce coin.</P>
      <Quote>« J'aimerais avoir une carte interactive. On clique sur une carte, on voit les événements, on peut dézoomer, se déplacer dessus virtuellement. Pour ensuite se placer à un endroit… il faudrait se placer là-bas pour s'inscrire, puis ça reset le côté présence. »</Quote>
      <P><B>Faisable :</B> oui. L'app utilise déjà Leaflet (carte des présences, /scenario). Une carte d'events (épingles cliquables, zoom, déplacement, fiche au clic) est tout à fait à portée.</P>
      <Fix><B>Mon challenge sur « se placer là-bas → ça reset la présence ».</B> Attention à coupler deux choses qui peuvent se contredire. Ta « présence » obéit déjà à une logique stricte (zone de dispo + fenêtre 18h + le gate). Si s'inscrire à un event te <B>téléporte</B> ta présence ailleurs et la reset, ça peut surprendre l'utilisateur et entrer en conflit avec sa dispo en cours. Trois options à choisir : (a) s'inscrire à un event = ça remplace ta présence par « je suis à cet event à telle heure » (cohérent mais à rendre très clair) ; (b) l'event et la présence restent <B>séparés</B> (tu peux être dispo ET inscrit à un event, deux choses distinctes) ; (c) un entre-deux : l'event crée une présence « verrouillée » sur ce lieu/heure sans toucher le reste. Mon instinct : <B>(b) au début</B> (plus simple, moins de surprises), et (a) seulement si les tests montrent que les gens le veulent. Décision à prendre avant de coder.</Fix>
    </>)
  },
  {
    id: 'notifs', icon: '📲', title: 'Des notifications personnalisées qui donnent envie de cliquer',
    body: () => (<>
      <P>Tes mots : <B>il faut penser à faire des pop-up ou des notifications personnalisées. Tu reçois la notif, elle te donne envie de cliquer, tu dis oui, et tu ne vas même pas sur l'appli.</B> C'est cohérent avec le Graal : le produit vit dans la notif. À soigner : pertinence et fraîcheur, jamais du bruit.</P>
    </>)
  },
  {
    id: 'femmes', icon: '👩', title: 'Les femmes sont le centre — sans règle genrée qu\'on cache',
    body: () => (<>
      <P>Le vrai goulot, ce n'est pas le matching : c'est qu'une femme accepte d'appuyer sur « disponible ». La question n'est pas « comment attirer des femmes » mais « comment réduire le coût psychologique de dire oui ». D'où le contrôle total (âge, distance, type, heures, qui peut la voir) et une réputation de fiabilité hyper-visible.</P>
      <P>Et le point que tu as soulevé, honnêtement : <B>au fond, le produit, ce sont les femmes, on le sait.</B> Mais on a tranché ensemble qu'on ne le sert <B>jamais par une règle genrée qu'on devrait cacher</B> (un quota « femmes illimité / hommes limité » caché = dark pattern + risque légal + ça se découvre). On le sert par le <B>design</B> : des règles neutres pour tous, conçues pour que la protection émerge d'elle-même (mêmes places, réception sélective pour tous). Honnête, défendable, et ça protège quand même.</P>
    </>)
  },
  {
    id: 'lancement', icon: '🚀', title: 'Lancement & liquidité : le vrai tueur',
    body: () => (<>
      <P>Ce qui tue Clutch, ce n'est pas Tinder : c'est <B>ouvrir l'app et voir personne</B>. La nuance que tu as ajoutée et qui est la clé : tout doit être réglable, mais <B>la sécurité, la confiance et la liquidité doivent être pensées à fond AVANT le lancement</B>, parce qu'une mauvaise première expérience (une femme noyée sous 25 sollicitations, trois lapins la première semaine, une ambiance de marché aux bestiaux) ne se rattrape jamais.</P>
      <P>Le playbook : ne pas lancer « Lausanne » mais <B>Lausanne centre</B>, puis seulement <B>jeudi-vendredi-samedi</B>, puis seulement <B>18h-23h</B>. Des <B>Golden Hours</B> sacrées. Les <B>événements</B> comme béquille de démarrage. Et un <B>anti-vide honnête</B> : jamais de faux profils, mais quand c'est vide on montre un compte à rebours, des events, « 6 personnes étaient là hier à cette heure ». Le vide devient une promesse.</P>
    </>)
  },
  {
    id: 'ia-temps-reel', icon: '🤖', title: 'Intégrer l\'IA en temps réel une fois l\'app lancée', tag: 'À FAIRE',
    body: () => (<>
      <P>Ta question, que je n'avais pas vraiment traitée : <B>une fois l'app lancée, comment l'intelligence s'ajuste en temps réel ?</B> Voici ma réponse, en 3 couches, de la plus sûre à la plus avancée — on ne saute jamais une marche.</P>
      <P><B>Couche 1 — le thermostat (déterministe, pas une IA).</B> Un programme dans la base règle la densité par zone en temps réel. Automatique, borné, prévisible. C'est la fondation, et ça tourne dès le lancement.</P>
      <P><B>Couche 2 — le tuning supervisé (semi-automatique).</B> L'app <B>logge tout</B> (clutch → réponse → présence → lapin → feedback). Un job régulier calcule des statistiques par zone et par heure et <B>propose</B> des ajustements de poids ; toi et moi on valide. Ici l'IA = <B>analyse + recommandation</B>, jamais décision. C'est ta règle : « l'IA explique et oriente, l'humain décide ».</P>
      <P><B>Couche 3 — l'apprentissage en ligne (avancé, plus tard, prudent).</B> Quand il y aura assez de données, on peut laisser un modèle ajuster <B>certains</B> poids tout seul — MAIS toujours entre des <B>bornes</B> (garde-fous) et avec un <B>kill switch</B> qui retombe sur le déterministe si ça dérape. Jamais une boîte noire qui décide seule sans filet.</P>
      <P><B>Où ça tourne (vu qu'on n'a pas de serveur à nous) :</B> dans des <B>Edge Functions Supabase</B> déclenchées par un cron (elles lisent les logs, écrivent des paramètres en base), et plus tard un petit service externe si on grossit. <B>Jamais d'IA dans le navigateur du user</B> : le client lit seulement des paramètres en base. Avec logs + sauvegardes + kill switch. → à mettre dans les chantiers (axe 3 du plan, couche « après lancement »).</P>
    </>)
  },
  {
    id: 'principe', icon: '📐', title: 'Le principe : on ne compresse JAMAIS tes idées', tag: 'RÈGLE',
    body: () => (<>
      <P>Cette page existe parce que je compressais tes explications de dix minutes en une carte de deux lignes, et qu'on y perdait toute la richesse. Plus jamais.</P>
      <P><B>La règle, gravée :</B> tes idées sont gardées <B>brutes</B>, juste mieux syntaxées (comme un correcteur de français, sans répétitions), <B>jamais raccourcies</B>. On <B>ajoute</B>, on n'efface jamais, on n'écrase jamais. Un titre court qu'on déplie → tout le contexte dessous. Le résumé (sur /vision) n'est qu'une surface par-dessus ce texte complet — jamais un remplacement.</P>
    </>)
  },
]

export default function Vision2() {
  const [auth, setAuth] = useState(false)
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)
  const [open, setOpen] = useState<string | null>('places')

  if (!auth) {
    const go = () => { if (pw === PASS) setAuth(true); else setErr(true) }
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', padding: 20 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, width: 300, textAlign: 'center', boxShadow: '0 8px 30px rgba(42,16,32,.10)' }}>
          <div style={{ fontSize: 26, marginBottom: 8 }}>📖</div>
          <div style={{ fontSize: 15, fontWeight: 900, color: C.gold, marginBottom: 4 }}>Vision 2 · idées brutes</div>
          <div style={{ fontSize: 11, color: C.dim, marginBottom: 20 }}>tes idées en entier, non compressées</div>
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
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 18px 80px' }}>
        {/* Barre de liens vers les autres pages internes */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
          {[['/vision2', '📖 Vision 2', true], ['/vision', '🗺 Vision (carte)', false], ['/eventsmap', '🗺️ Carte events', false], ['/sim', '🧪 Simulateur', false], ['/animation', '✨ Animations', false], ['/hq', '🔒 QG', false]].map(([href, label, here]: any) => (
            <a key={href} href={href} style={{ fontSize: 11.5, fontWeight: here ? 800 : 600, textDecoration: 'none', color: here ? '#fff' : C.mid, background: here ? C.gold : C.card, border: `1px solid ${here ? C.gold : C.border}`, borderRadius: 9, padding: '5px 11px', whiteSpace: 'nowrap' }}>{label}{here ? ' · ici' : ''}</a>
          ))}
        </div>
        <div style={{ fontSize: 25, fontWeight: 900, color: C.gold, letterSpacing: '-.5px', marginBottom: 4 }}>📖 Vision 2 — tes idées, en entier</div>
        <P>Ici, <B>rien n'est compressé</B>. Chaque idée est gardée brute (juste mieux syntaxée), avec tout son contexte. Clique un titre pour le déplier. La carte rapide reste sur <B>/vision</B> ; ici, c'est la version profonde. On enrichit cette page, on ne la raccourcit jamais.</P>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18 }}>
          {IDEAS.map(it => {
            const on = open === it.id
            return (
              <div key={it.id} style={{ background: C.card, border: `1px solid ${on ? C.gold + '66' : C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: on ? `0 4px 16px ${C.gold}18` : 'none' }}>
                <button onClick={() => setOpen(on ? null : it.id)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{it.icon}</span>
                  <span style={{ fontSize: 14.5, fontWeight: 800, color: C.ink, flex: 1 }}>{it.title}</span>
                  {it.tag && <span style={{ fontSize: 9, fontWeight: 900, color: C.gold, background: `${C.gold}15`, border: `1px solid ${C.gold}40`, borderRadius: 6, padding: '2px 6px', flexShrink: 0 }}>{it.tag}</span>}
                  <span style={{ color: C.dim, flexShrink: 0 }}>{on ? '▲' : '▼'}</span>
                </button>
                {on && <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${C.border}` }}><div style={{ paddingTop: 12 }}>{it.body()}</div></div>}
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 32, fontSize: 11, color: C.dim, textAlign: 'center' }}>Vision 2 · idées brutes · append-only · on ajoute, on ne compresse jamais.</div>
      </div>
    </div>
  )
}
