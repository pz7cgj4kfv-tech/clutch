'use client'

const C = {
  bg: '#140810',
  card: '#1e0e18',
  card2: '#261428',
  border: 'rgba(255,191,158,0.14)',
  borderGold: 'rgba(200,134,10,0.35)',
  gold: '#C8860A',
  salmon: '#FFBF9E',
  white: '#f5e8de',
  mid: 'rgba(245,232,222,0.6)',
  dim: 'rgba(245,232,222,0.35)',
  green: '#4ade80',
  orange: '#E27C00',
  red: '#f87171',
  blue: '#60a5fa',
  purple: '#a78bfa',
  teal: '#2dd4bf',
}

/* ─── PRIMITIVES ─────────────────────────────────────────────────────────────── */

const H1 = ({ children }: any) => (
  <h1 style={{ fontSize: 26, fontWeight: 900, color: C.gold, margin: '0 0 4px', letterSpacing: '-.5px' }}>{children}</h1>
)
const H2 = ({ children, color }: any) => (
  <h2 style={{ fontSize: 15, fontWeight: 900, color: color || C.gold, margin: '0 0 14px', letterSpacing: '-.3px', paddingBottom: 8, borderBottom: `2px solid ${color || C.gold}` }}>{children}</h2>
)
const H3 = ({ children, color }: any) => (
  <h3 style={{ fontSize: 12, fontWeight: 800, color: color || C.salmon, margin: '16px 0 8px', textTransform: 'uppercase', letterSpacing: '.06em' }}>{children}</h3>
)
const P = ({ children }: any) => (
  <p style={{ fontSize: 12, color: C.mid, lineHeight: 1.75, margin: '0 0 10px' }}>{children}</p>
)
const Tag = ({ label, color }: { label: string; color: string }) => (
  <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 20, background: `${color}15`, border: `1px solid ${color}40`, color, fontSize: 10, fontWeight: 700, letterSpacing: '.04em', whiteSpace: 'nowrap' }}>
    {label}
  </span>
)
const Chip = ({ label, color }: any) => (
  <span style={{ display: 'inline-flex', padding: '1px 6px', borderRadius: 10, background: `${color}20`, color, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
)
const Card = ({ children, accent }: any) => (
  <div style={{ background: C.card, border: `1px solid ${accent ? `${accent}30` : C.border}`, borderRadius: 14, padding: '16px 18px', marginBottom: 14 }}>
    {children}
  </div>
)
const Divider = () => <div style={{ borderTop: `1px solid ${C.border}`, margin: '32px 0' }} />
const Row = ({ label, value, color }: any) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${C.border}`, fontSize: 11 }}>
    <span style={{ color: C.mid }}>{label}</span>
    <span style={{ color: color || C.white, fontWeight: 600 }}>{value}</span>
  </div>
)

/* ─── COMPONENTS ─────────────────────────────────────────────────────────────── */

type IdeaStatus = '✅ Implémenté' | '🔜 Phase 2' | '📋 Phase 3' | '💡 À valider Mel' | '⚠️ Risqué' | '❌ Hors scope'
type EthicScore = '✅' | '⚠️' | '❌'

interface Idea {
  id: string
  titre: string
  description: string
  pourquoi: string
  comment: string
  risques?: string
  ethique: EthicScore
  ergo: EthicScore
  business: EthicScore
  femmesFirst: EthicScore
  statut: IdeaStatus
  tags: string[]
  source?: string
}

const ETHIC_LABEL: Record<EthicScore, string> = { '✅': 'OK', '⚠️': 'Vigilance', '❌': 'Problème' }
const ETHIC_COLOR: Record<EthicScore, string> = { '✅': C.green, '⚠️': C.orange, '❌': C.red }

const IdeaCard = ({ idea }: { idea: Idea }) => {
  const statusColor: Record<IdeaStatus, string> = {
    '✅ Implémenté': C.green,
    '🔜 Phase 2': C.gold,
    '📋 Phase 3': C.orange,
    '💡 À valider Mel': C.purple,
    '⚠️ Risqué': C.red,
    '❌ Hors scope': C.dim,
  }
  const sc = statusColor[idea.statut]
  return (
    <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderLeft: `3px solid ${sc}`, borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: C.dim, fontWeight: 600 }}>{idea.id}</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: C.white }}>{idea.titre}</span>
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Chip label={idea.statut} color={sc} />
          {idea.source && <Chip label={idea.source} color={C.blue} />}
        </div>
      </div>
      <p style={{ fontSize: 12, color: C.mid, lineHeight: 1.7, margin: '0 0 10px' }}>{idea.description}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: C.dim, fontWeight: 700, marginBottom: 3 }}>POURQUOI C\'EST CLUTCH</div>
          <div style={{ fontSize: 11, color: C.mid, lineHeight: 1.6 }}>{idea.pourquoi}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: C.dim, fontWeight: 700, marginBottom: 3 }}>COMMENT ÇA MARCHE</div>
          <div style={{ fontSize: 11, color: C.mid, lineHeight: 1.6 }}>{idea.comment}</div>
        </div>
      </div>
      {idea.risques && (
        <div style={{ background: `${C.red}08`, border: `1px solid ${C.red}20`, borderRadius: 8, padding: '6px 10px', marginBottom: 10 }}>
          <span style={{ fontSize: 10, color: C.red, fontWeight: 700 }}>⚠ RISQUES : </span>
          <span style={{ fontSize: 11, color: C.mid }}>{idea.risques}</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          ['Éthique', idea.ethique],
          ['Ergo', idea.ergo],
          ['Business', idea.business],
          ['Femmes ♀', idea.femmesFirst],
        ].map(([lbl, val]: any) => (
          <div key={lbl} style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <span style={{ fontSize: 9, color: C.dim }}>{lbl}</span>
            <span style={{ fontSize: 11, color: ETHIC_COLOR[val as EthicScore] }}>{val} {ETHIC_LABEL[val as EthicScore]}</span>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        {idea.tags.map((t, i) => <Tag key={i} label={t} color={C.salmon} />)}
      </div>
    </div>
  )
}

/* ─── DATA ───────────────────────────────────────────────────────────────────── */

const IDEAS: Idea[] = [
  // ── IMPLÉMENTÉES ──
  {
    id: 'A-01', titre: 'Onboarding 4 slides + Setup Wizard 5 étapes',
    description: 'Premier contact avec l\'application : 4 slides expliquent la philosophie Clutch (spontanéité, Verrou, sécurité, score). Puis 5 étapes de configuration : photo, âge, genre, bio courte, catégorie métier. Entièrement skippable à partir de l\'étape 3.',
    pourquoi: 'Sans onboarding, 70% des users abandonnent au premier écran vide. Les 4 slides posent la culture avant même la création de compte.',
    comment: 'Slides animées → création compte → wizard → app principale. Guard localStorage empêche de le revoir. URL ?preview=onboarding pour tester sans compte.',
    ethique: '✅', ergo: '✅', business: '✅', femmesFirst: '✅',
    statut: '✅ Implémenté', tags: ['Core', 'Rétention'], source: 'Claude',
  },
  {
    id: 'A-02', titre: 'Score fiabilité public (Lapin / À l\'heure / Venu·e)',
    description: 'Chaque utilisateur a un score de fiabilité visible sur son profil. Poser un lapin coûte -5 points, être à l\'heure rapporte +2, être venu·e +1. Le score est public et influence la confiance que les autres lui accordent.',
    pourquoi: 'Rend les comportements sociaux visibles et coûteux. Contrairement à Tinder où ghoster est sans conséquence, ici chaque lapin a un coût réel et public.',
    comment: 'Calculé après chaque RDV via double feedback caché révélé 3h après. Affiché en ★ sur la carte de profil dans Présences.',
    risques: 'Faux feedbacks vendetta. Solution : le double feedback caché + délai 3h réduit la réactivité émotionnelle.',
    ethique: '✅', ergo: '✅', business: '✅', femmesFirst: '✅',
    statut: '✅ Implémenté', tags: ['Confiance', 'Core'], source: 'David + Claude',
  },
  {
    id: 'A-03', titre: 'Mode réception femmes (3 modes)',
    description: 'Les femmes choisissent comment recevoir les Clutchs : Ouverte (toutes les demandes), Sélective (seulement les profils avec score ≥ X ou catégorie métier choisie), Pause (aucune demande pendant une durée définie). Ce contrôle est invisible pour les hommes.',
    pourquoi: 'La surcharge de demandes est le principal motif de départ des femmes des apps de rencontres. Lui donner un contrôle absolu = la garder.',
    comment: 'Toggle dans les réglages Profil → Réception. Le mode Sélectif filtre côté serveur avant même que la demande soit envoyée.',
    ethique: '✅', ergo: '✅', business: '✅', femmesFirst: '✅',
    statut: '✅ Implémenté', tags: ['Sécurité ♀', 'Anti-spam'], source: 'Claude',
  },
  {
    id: 'A-04', titre: 'SOS Contacts + Simulation countdown',
    description: 'Dans les réglages, l\'utilisatrice enregistre 2 contacts de confiance (prénom + numéro). En appuyant sur le bouton SOS dans l\'app, un compte à rebours de 10s se lance. Si elle ne l\'annule pas, un SMS automatique est envoyé avec sa position et le profil de la personne rencontrée. La simulation permet de tester le flow sans vrai SMS.',
    pourquoi: 'Feature de sécurité physique. La différence entre Clutch et les autres apps : on assume la responsabilité d\'avoir mis deux personnes au même endroit.',
    comment: 'Contacts stockés en localStorage (pas en DB). Compte à rebours modal avec vibration. Simulation identique mais n\'envoie pas le vrai SMS.',
    risques: 'Sans Edge Function SMS, le SMS n\'est pas encore réellement envoyé. À connecter avec Twilio ou un service SMS.',
    ethique: '✅', ergo: '✅', business: '✅', femmesFirst: '✅',
    statut: '✅ Implémenté', tags: ['Sécurité ♀', 'Urgence'], source: 'David',
  },
  {
    id: 'A-05', titre: 'Mode Pro — filtre par catégorie métier (Manoski)',
    description: 'Un bouton 💼 dans Présences active le Mode Pro. L\'écran passe en vue métier : chaque catégorie (Tech, Design, Finance, Santé, Artisan, Musique...) est affichée avec le nombre de personnes disponibles maintenant dans cette catégorie. On clique sur un métier pour voir ces personnes. 30 catégories dont les métiers manuels (électricité, menuiserie, mécanique).',
    pourquoi: 'Ouvre le networking spontané B-to-C que personne ne fait. "J\'ai besoin d\'un conseil juridique en 30 min" ou "Je cherche un photographe maintenant" = impossible sur LinkedIn, naturel sur Clutch.',
    comment: 'Mode togglé dans l\'UI Présences. Filtre sur le champ job_category de profiles. Vide si personne n\'a renseigné son métier → incitation dans l\'onboarding.',
    ethique: '✅', ergo: '✅', business: '✅', femmesFirst: '✅',
    statut: '✅ Implémenté', tags: ['Mode Pro', 'B2C'], source: 'David (Manoski)',
  },
  {
    id: 'A-06', titre: 'Activité du moment (trace éphémère 8h)',
    description: 'Chaque utilisateur peut indiquer ce qu\'il fait maintenant : "♟️ Je joue aux échecs", "🎵 Je cherche quelqu\'un pour un jazz session", "☕ Au café, si quelqu\'un veut passer". Ce statut est visible sur sa carte de profil dans Présences pendant 8h puis disparaît.',
    pourquoi: 'Donne un prétexte naturel de contact au-delà de l\'attraction physique. "On a le même truc en commun maintenant" est plus puissant que "tu me plais".',
    comment: '15 emojis proposés + champ texte libre. Stocké en localStorage avec timestamp. Affiché en or sur les cartes de profil si non expiré.',
    ethique: '✅', ergo: '✅', business: '✅', femmesFirst: '✅',
    statut: '✅ Implémenté', tags: ['Social', 'Connexion'], source: 'Claude',
  },
  {
    id: 'A-07', titre: 'Simultanéité clutchs limitée (3 free / 5 premium / 20 femmes)',
    description: 'Un homme free ne peut avoir que 3 Clutchs actifs en même temps. Un premium en a 5. Les femmes ont 20, ce qui est dans les faits illimité. Cette limite est maintenant enforced côté DB par un trigger PostgreSQL.',
    pourquoi: 'Évite le spam industriel. Un homme qui envoie 50 Clutchs simultanément casse l\'expérience de 50 femmes. La contrainte force la qualité sur la quantité.',
    comment: 'Vérifié côté client JS ET côté DB via trigger BEFORE INSERT. Si le trigger DB lève une exception, l\'app intercepte l\'erreur et affiche un toast.',
    ethique: '✅', ergo: '✅', business: '✅', femmesFirst: '✅',
    statut: '✅ Implémenté', tags: ['Anti-spam', 'DB'], source: 'Claude',
  },
  {
    id: 'A-08', titre: 'Events avec compteur dynamique par catégorie',
    description: 'L\'onglet Events affiche les événements partenaires filtrables par catégorie (Apéro, Sport, Culture, Dating, Pro...). Chaque badge de catégorie montre en temps réel le nombre d\'events actifs. Les catégories à 0 event sont grisées.',
    pourquoi: 'Un compteur vide = catégorie inutile. Le grisage évite la frustration de cliquer pour trouver rien. Le compteur dynamique donne un signal de vie de l\'app.',
    comment: 'Les events sont dans une table Supabase. Le compteur est calculé côté client au chargement. Filtre multi-catégorie possible.',
    ethique: '✅', ergo: '✅', business: '✅', femmesFirst: '✅',
    statut: '✅ Implémenté', tags: ['Events', 'UX'], source: 'Claude',
  },
  {
    id: 'A-09', titre: 'ProximityRadar — approche vers le lieu de RDV',
    description: 'Une fois un Clutch accepté (Verrou activé), les deux parties voient un radar visuel qui montre leur rapprochement vers le lieu de RDV. Le radar utilise le GPS pour calculer la distance. La distance est tronquée à "300m+" pour ne pas révéler la position exacte.',
    pourquoi: 'Transforme le trajet en expérience. La tension de l\'approche, voir que l\'autre s\'approche aussi = dopamine éthique. Aucune app ne fait ça.',
    comment: 'GPS côté client (pas stocké en DB). Calcul trigonométrique local. Cap 300m affiché pour la sécurité. Check-in "J\'y suis" confirme l\'arrivée.',
    ethique: '✅', ergo: '✅', business: '✅', femmesFirst: '✅',
    statut: '✅ Implémenté', tags: ['GPS', 'Expérience', 'Sécurité ♀'], source: 'Claude',
  },
  {
    id: 'A-10', titre: 'Double feedback caché révélé 3h après le RDV',
    description: 'Après un RDV, les deux parties reçoivent une notification 3h après. Chacun répond sans voir la réponse de l\'autre : À l\'heure / Venu·e / Lapin. Les deux réponses sont révélées en même temps seulement quand les deux ont répondu (ou après 24h timeout).',
    pourquoi: 'Le délai de 3h réduit les feedbacks vengeance à chaud. Le double révélation symétrique empêche d\'influencer la réponse de l\'autre. C\'est le même mécanisme que les négociations de salaire bilatérales.',
    comment: 'Stocké dans rdv_feedbacks. Révélé par une Edge Function ou un cron toutes les 15min. Score mis à jour automatiquement.',
    risques: 'La contrainte DB outcome n\'acceptait que "absent" — corrigé en session 16.06 pour accepter on_time/showed/absent.',
    ethique: '✅', ergo: '✅', business: '✅', femmesFirst: '✅',
    statut: '✅ Implémenté', tags: ['Fiabilité', 'Core'], source: 'Claude',
  },

  // ── PHASE 2 ──
  {
    id: 'B-01', titre: 'Mission du Jour',
    description: 'Chaque matin à 9h, l\'app propose un défi du jour : "Aujourd\'hui : rencontre quelqu\'un d\'un métier différent du tien" ou "Bois un café avec quelqu\'un à plus de 5km de chez toi" ou "Dis bonjour à quelqu\'un qui porte un chapeau". Les utilisateurs qui réalisent la mission gagnent des badges cachés et une visibilité boostée ce jour-là.',
    pourquoi: 'Crée un rituel quotidien. L\'app devient une habitude matinale, comme consulter les news. Les badges cachés créent de la surprise positive. Aucun géant du dating n\'a réussi à gamifier la rencontre réelle.',
    comment: 'Table missions en DB avec un cron quotidien. Badge assigné après feedback positif du RDV de ce jour. Visibilité boostée = apparaît en premier dans Présences.',
    risques: 'Nécessite contenu éditorial quotidien (peut être algorithmic avec templates).',
    ethique: '✅', ergo: '✅', business: '✅', femmesFirst: '✅',
    statut: '🔜 Phase 2', tags: ['Gamification', 'Rétention', 'Quotidien'], source: 'GPT',
  },
  {
    id: 'B-02', titre: 'File d\'attente intelligente pour les femmes',
    description: 'Au lieu de recevoir toutes les demandes de Clutch en vrac, les femmes reçoivent une sélection de 3 meilleurs candidats, renouvelée toutes les heures. L\'algorithme classe par : score de fiabilité, compatibilité d\'activité du moment, diversité de profils (pas 3 développeurs). Les demandes non-sélectionnées sont mises en file et pourraient être proposées plus tard.',
    pourquoi: 'Supprime la surcharge cognitive. "J\'ai 47 demandes" est paralysant. "Voici 3 personnes intéressantes maintenant" est activable. Améliore la perception de qualité de l\'app.',
    comment: 'Algo de scoring côté serveur à construire. Renouvellement horaire via cron. Les hommes ne savent pas qu\'ils sont en file d\'attente.',
    risques: 'Complexité algorithmique. Risque que les hommes patientent trop longtemps. Solution : timeout 2h si non-sélectionné → rejeté proprement.',
    ethique: '✅', ergo: '✅', business: '✅', femmesFirst: '✅',
    statut: '🔜 Phase 2', tags: ['Algo', 'Sécurité ♀', 'UX'], source: 'GPT',
  },
  {
    id: 'B-03', titre: 'Mode Duo',
    description: 'Deux amies (ou amis) peuvent lier leurs comptes temporairement pour un Duo. Elles apparaissent ensemble dans Présences avec un badge "Duo". Quand un Clutch Duo est envoyé, il concerne les 4 personnes : les 2 qui envoient et les 2 qui reçoivent.',
    pourquoi: 'Révolutionnaire pour la sécurité des femmes. Venir à deux = infiniment plus confortable. Répond à la question "et si ça se passe mal ?" sans friction. Aucune app ne fait ça.',
    comment: 'Table duo_sessions temporaires (durée max 4h). Notification aux 4 parties. RDV de groupe dans un lieu public.',
    risques: 'Complexité de coordination : que se passe-t-il si une des 4 annule ? Scénarios à définir avec Mel.',
    ethique: '✅', ergo: '⚠️', business: '✅', femmesFirst: '✅',
    statut: '🔜 Phase 2', tags: ['Sécurité ♀', 'Social', 'Innovant'], source: 'GPT',
  },
  {
    id: 'B-04', titre: 'Mission Express (Mode Pro)',
    description: '"J\'ai besoin d\'un photographe pour 30 minutes ce soir" / "Quelqu\'un peut m\'aider à traduire ce contrat en anglais maintenant ?" — Une micro-mission professionnelle ou créative, publiée avec une durée et un lieu. Les personnes compétentes disponibles dans la zone voient la mission et peuvent répondre.',
    pourquoi: 'Micro-économie locale. Personne ne fait ça actuellement. Uber a les chauffeurs, AirBnB les logements, Clutch peut avoir les talents locaux disponibles maintenant.',
    comment: 'Formulaire en Mode Pro : type de besoin + durée + lieu + budget optionnel. Visible seulement par les profils avec la catégorie métier correspondante.',
    risques: 'Modération des abus (demandes inappropriées déguisées en missions). RLS par catégorie métier. Signalement simple.',
    ethique: '⚠️', ergo: '✅', business: '✅', femmesFirst: '⚠️',
    statut: '🔜 Phase 2', tags: ['Mode Pro', 'B2C', 'Revenus'], source: 'GPT',
  },
  {
    id: 'B-05', titre: 'Coaching invisible pour les hommes',
    description: 'Dans l\'interface homme, des micro-insights anonymisés et bienveillants apparaissent : "Les Clutchs proposés après 18h ont 40% de succès en plus" / "Ton profil avec la photo de profil souriante reçoit 3x plus de réponses" / "Les Clutchs café fonctionnent mieux que les Clutchs bar pour un premier contact". Pas de score individuel affiché, seulement des tips basés sur les données agrégées.',
    pourquoi: 'Améliore l\'expérience sans humilier. Les hommes qui ne reçoivent pas de réponses partent. Les guider subtilement = meilleur taux de succès = rétention hommes = plus de revenus premium.',
    comment: 'Templates de tips basés sur les données agrégées (pas de tracking individuel visible). Affiché discrètement sous les Clutchs refusés.',
    ethique: '✅', ergo: '✅', business: '✅', femmesFirst: '✅',
    statut: '🔜 Phase 2', tags: ['Rétention ♂', 'UX', 'Data'], source: 'GPT',
  },
  {
    id: 'B-06', titre: 'Clutch Parents — Cherche copain de jeu',
    description: 'Un mode séparé pour les parents. Profil enfant anonyme (âge + centres d\'intérêt, PAS de photo de l\'enfant). Un parent disponible au parc peut indiquer "Mon fils de 7 ans cherche à jouer — calme, Lego". Un autre parent dans la zone voit ça et peut créer un Clutch Parc.',
    pourquoi: 'Comble un vide réel et émotionnellement fort. Trouver un copain de jeu pour son enfant au parc est une vraie douleur. Aucune app ne fait ça sérieusement. Fort potentiel viral parent-à-parent.',
    comment: 'Mode parent séparé dans les réglages. Profil enfant sans photo, uniquement âge et intérêts. Validation identité parent obligatoire avant activation.',
    risques: 'Sécurité des enfants : validation stricte des parents, RLS, pas de photos d\'enfants, modération forte. Risque légal si mauvaise utilisation. À lancer SEULEMENT avec modération humaine active.',
    ethique: '⚠️', ergo: '✅', business: '✅', femmesFirst: '✅',
    statut: '🔜 Phase 2', tags: ['Parents', 'Niche', 'Émotionnel'], source: 'GPT',
  },
  {
    id: 'B-07', titre: 'Swap de compétences',
    description: '"Je t\'apprends 30 minutes de guitare, tu m\'aides avec Excel" — un échange de savoirs sans argent. Disponible en Mode Pro. On indique ce qu\'on peut offrir et ce dont on a besoin. L\'app propose les paires compatibles disponibles maintenant.',
    pourquoi: 'Zéro friction financière, zéro complication FINMA (pas de monnaie). Fort chez étudiants, freelances et expats en Suisse. Crée des liens plus profonds qu\'un simple RDV.',
    comment: 'Champs "j\'offre" + "je cherche" dans le profil Mode Pro. Matching algorithmique simple sur les paires compatibles.',
    ethique: '✅', ergo: '✅', business: '⚠️', femmesFirst: '✅',
    statut: '🔜 Phase 2', tags: ['Mode Pro', 'Étudiants', 'Communauté'], source: 'GPT',
  },
  {
    id: 'B-08', titre: 'Golden Hour Clutch',
    description: 'Chaque vendredi entre 18h et 20h : tous les profils disponibles pendant cette fenêtre sont mis en avant avec un design spécial (bordure or, badge "Golden"). La visibilité est boostée et la limite de Clutchs simultanés est temporairement augmentée. Un compteur live montre combien de personnes sont dans la Golden Hour en ce moment à Lausanne.',
    pourquoi: 'Crée un événement social hebdomadaire. "Vendredi 18h sur Clutch" devient un rituel. La Golden Hour est un concept simple à communiquer à l\'extérieur de l\'app (bouche à oreille).',
    comment: 'Condition temporelle côté client. Badge doré automatique si l\'heure correspond. Compteur Supabase temps réel.',
    ethique: '✅', ergo: '✅', business: '✅', femmesFirst: '✅',
    statut: '🔜 Phase 2', tags: ['Culture', 'Engagement', 'Rituel'], source: 'GPT',
  },
  {
    id: 'B-09', titre: 'Création d\'events par les particuliers',
    description: '"♟️ Partie d\'échecs au bord du lac ce soir à 19h — 2 places" / "🍕 Pizza et Netflix chez moi — 3 personnes max". N\'importe quel utilisateur peut créer un mini-event public en 20 secondes : icône + titre + lieu + heure + nb max participants.',
    pourquoi: 'Étend l\'usage de l\'app au-delà du one-to-one. Un event créé = des dizaines de profils qui interagissent. Réseau social local instantané.',
    comment: 'Formulaire en 3 champs : quoi (icône + texte) + où + quand. Visible dans l\'onglet Events. Limite : 1 event/semaine free, 5/semaine premium.',
    risques: 'Modération. Faux events, spam. Solution : signalement facile + suppression auto si 0 participant après 2h.',
    ethique: '✅', ergo: '✅', business: '✅', femmesFirst: '⚠️',
    statut: '🔜 Phase 2', tags: ['Events', 'Communauté', 'Social'], source: 'David',
  },
  {
    id: 'B-10', titre: 'Filtre préférences dans Présences',
    description: 'Un panneau de filtres dans Présences : tranche d\'âge (ex : 25-35), distance max (500m / 1km / 2km), genre (M/F/Tous), catégorie métier (Mode Pro), score fiabilité minimum. Les filtres actifs sont résumés en une ligne sous le header.',
    pourquoi: 'L\'expérience non-filtrée convient à un petit groupe. Avec des centaines d\'utilisateurs, les filtres deviennent nécessaires pour ne pas être submergé.',
    comment: 'État local dans l\'app. Les filtres ne sont pas envoyés au serveur — on filtre le résultat côté client pour éviter les appels DB pour chaque changement.',
    risques: 'Trop de filtres = paralysie. Règle : max 4 filtres visibles, le reste en "Avancé".',
    ethique: '✅', ergo: '⚠️', business: '✅', femmesFirst: '✅',
    statut: '🔜 Phase 2', tags: ['UX', 'Présences', 'Filtre'], source: 'David',
  },
  {
    id: 'B-11', titre: 'Contre-Clutch (refus avec proposition alternative)',
    description: 'Quand une femme reçoit un Clutch qu\'elle trouve intéressant mais pas au bon moment ou pas au bon lieu, elle peut répondre avec un Contre-Clutch : "Je ne suis pas libre maintenant mais si tu veux on peut se voir demain à 14h au même endroit". L\'autre accepte ou décline le contre-Clutch.',
    pourquoi: 'Évite le refus sec qui décourage. Permet la négociation du RDV sans perdre le contact. Plus respectueux des contraintes horaires réelles.',
    comment: 'Bouton "Proposer autre chose" dans l\'écran de réception du Clutch. Ouvre un sélecteur heure/lieu simplifié.',
    risques: 'Sort de la règle 18h si la contre-proposition est pour le lendemain. À décider : accepte-t-on les Clutchs J+1 en contre-Clutch seulement ?',
    ethique: '✅', ergo: '✅', business: '✅', femmesFirst: '✅',
    statut: '🔜 Phase 2', tags: ['Flow', 'Négociation', 'UX'], source: 'David (perdu)',
  },
  {
    id: 'B-12', titre: 'Alerte distance/temps restant avant RDV',
    description: 'Quand il reste 30 minutes avant l\'heure du RDV, l\'app calcule le temps de trajet de l\'utilisateur jusqu\'au lieu et envoie une notification : "Il te faut 18 minutes pour y arriver. Pars maintenant ou préviens-le." Avec un bouton direct "Prévenir que je suis en retard".',
    pourquoi: 'Réduit les lapins par oubli ou mauvais calcul de temps. Proactif plutôt que punitif. Améliore le taux de présence = meilleur score général de l\'app.',
    comment: 'Push notification via OneSignal avec deep link. Calcul trajet via API maps (ou estimation simple basée sur distance vol d\'oiseau).',
    ethique: '✅', ergo: '✅', business: '✅', femmesFirst: '✅',
    statut: '🔜 Phase 2', tags: ['Notifications', 'GPS', 'Fiabilité'], source: 'David (perdu)',
  },

  // ── PHASE 3 ──
  {
    id: 'C-01', titre: 'Roulette réelle — "Surprends-moi"',
    description: 'Un bouton unique : "Surprends-moi". L\'app choisit pour toi la personne la plus compatible disponible maintenant dans ta zone et envoie automatiquement un Clutch en ton nom. Tu n\'as pas choisi qui, tu fais juste confiance à l\'algo. La personne reçoit le Clutch et peut accepter ou refuser comme d\'habitude.',
    pourquoi: 'Le concept ultime de spontanéité. Tu délègues le choix. Cohérent avec l\'ADN Clutch. Fort levier marketing ("l\'app qui choisit pour toi").',
    comment: 'Algo de compatibilité pondéré : fiabilité + activité similaire + distance + diversité (pas deux fois la même catégorie). Un Clutch max par "Surprise" par jour.',
    risques: 'Si l\'algo est mal calibré, on envoie des Clutchs incohérents. À tester avec beaucoup de data avant d\'activer en production.',
    ethique: '✅', ergo: '✅', business: '✅', femmesFirst: '⚠️',
    statut: '📋 Phase 3', tags: ['Core', 'Algo', 'Viral'], source: 'GPT',
  },
  {
    id: 'C-02', titre: 'Cartes secrètes de la ville',
    description: 'Après X Verrous réussis, des "cartes secrètes" se débloquent : accès à des bars partenaires cachés (happy hour réservé Clutch), invitations à des events privés non-publics, réductions partenaires exclusifs. Plus tu rencontres vraiment des gens, plus la ville t\'offre.',
    pourquoi: 'Fidélisation par la gamification territoriale. La ville de Lausanne devient un jeu. Fort levier de partenariat avec les bars et restaurants locaux.',
    comment: 'Table rewards en DB. Badges débloqués côté client. Partenariats à négocier manuellement en phase 3.',
    ethique: '✅', ergo: '✅', business: '✅', femmesFirst: '✅',
    statut: '📋 Phase 3', tags: ['Gamification', 'Partenariats', 'Fidélisation'], source: 'GPT',
  },
  {
    id: 'C-03', titre: 'Event mobile (qui se déplace sur la carte)',
    description: '"Balade avec mon chien au bord du lac" — un event qui se déplace en temps réel sur la carte. Les autres voient : "Sophie et son labrador — au parc maintenant, en route vers la fontaine de Ouchy". Le statut change automatiquement selon la position.',
    pourquoi: 'Innovant et mémorable. Résout le problème des events "je ne sais pas où exactement". Adapté aux balades, courses, sorties spontanées.',
    comment: 'Position live envoyée toutes les 30s via Supabase Realtime. Visible sur la carte principale. Durée max 3h.',
    risques: 'Position live = donnée sensible LPD. Consentement explicite obligatoire. Risque de stalking. À sécuriser avec : visible seulement aux personnes qui ont eu un Clutch validé avec l\'organisateur.',
    ethique: '⚠️', ergo: '✅', business: '✅', femmesFirst: '⚠️',
    statut: '📋 Phase 3', tags: ['Events', 'GPS', 'Innovant'], source: 'GPT',
  },
  {
    id: 'C-04', titre: 'Masque progressif du profil',
    description: 'Le profil est révélé progressivement : d\'abord seulement prénom + catégorie d\'activité du moment + message vocal de 10 secondes. Pas de photo. Seulement après que les deux parties ont dit "intéressé·e" : la photo se révèle. L\'image physique est la dernière information, pas la première.',
    pourquoi: 'Réduit radicalement le jugement superficiel. Force à réagir à la personnalité et à l\'activité avant l\'apparence. Cohérent avec la philosophie anti-Tinder.',
    comment: 'Profil en 3 couches dans la DB. Message vocal via Supabase Storage (max 10s). Révélation progressive via Realtime après double intérêt.',
    risques: 'Friction forte qui peut rebuter. À tester en A/B test sur un segment. Risque que les hommes abandonnent si la photo n\'est pas là d\'emblée.',
    ethique: '✅', ergo: '⚠️', business: '⚠️', femmesFirst: '✅',
    statut: '💡 À valider Mel', tags: ['UX', 'Anti-Tinder', 'Audacieux'], source: 'GPT',
  },
  {
    id: 'C-05', titre: 'Covoiturage spontané',
    description: '"Je pars de Lausanne pour Genève dans 45 min, 2 places libres" — un mini-event de transport partagé. Visible dans l\'onglet Events avec un badge 🚗. Les passagers potentiels dans la zone voient et peuvent rejoindre.',
    pourquoi: 'Étend l\'app à une utilité concrète quotidienne. Le covoiturage crée du lien social naturellement (1h de voiture = vraie conversation). Fort potentiel de rétention pour les non-romantiques.',
    comment: 'Sous-catégorie d\'Events. Champs spécifiques : départ + destination + heure + places. Durée de vie max = durée du trajet.',
    risques: 'Hors scope du concept core (spontanéité romantique/amicale). À garder en phase 3 pour ne pas diluer le message. Aspect assurance à vérifier légalement.',
    ethique: '✅', ergo: '✅', business: '⚠️', femmesFirst: '⚠️',
    statut: '📋 Phase 3', tags: ['Events', 'Mobilité', 'Social'], source: 'David',
  },
  {
    id: 'C-06', titre: 'Option végan / Don 10% à une association',
    description: 'Dans les réglages, une option "Clutch éthique" : 10% du revenu premium est reversé à une association choisie (protection animale, environnement, aide humanitaire). Visible sur le profil de l\'utilisateur premium. Option filtrage "restaurants végan-friendly" dans les lieux suggérés de RDV.',
    pourquoi: 'Cohérence avec les valeurs de David (végan, éthique). Fort signal de différenciation pour une cible jeune consciente. Le badge "Clutch éthique" visible sur le profil = signal vertueux.',
    comment: 'Liste de 5 associations partenaires. Reversement via Stripe ou virement mensuel manuel en phase 1. Badge affiché si activé.',
    ethique: '✅', ergo: '✅', business: '⚠️', femmesFirst: '✅',
    statut: '💡 À valider Mel', tags: ['Éthique', 'Premium', 'Valeurs'], source: 'David',
  },
  {
    id: 'C-07', titre: 'Multi-profil Manoski (romantique / amical / pro / parents)',
    description: 'Un même compte peut avoir jusqu\'à 4 profils selon le mode : Romantique (profil dating classique), Amical (profil détente + activités), Professionnel (Mode Pro, bio CV), Parents (profil famille). L\'utilisateur choisit en quittant l\'app dans quel mode il est disponible.',
    pourquoi: 'Permet à l\'app d\'être une plateforme de rencontres sociale complète sans diluer chaque mode. Un même user peut utiliser Clutch pour dater le lundi et networker le jeudi.',
    comment: 'Table profiles avec colonne mode. Toggle dans les réglages. Photo différente possible selon mode.',
    risques: 'Complexité UX importante. Risque de confusion. À valider absolument avec Mel avant de coder.',
    ethique: '✅', ergo: '⚠️', business: '✅', femmesFirst: '✅',
    statut: '💡 À valider Mel', tags: ['Multi-mode', 'Manoski', 'Architecture'], source: 'David',
  },
  {
    id: 'C-08', titre: 'IA anti-creep invisible',
    description: 'Un algorithme invisible surveille les comportements suspects : annulations répétées (propose puis annule), messages agressifs détectés, Clutchs envoyés exclusivement à des femmes avec photo récente, trop de refus consécutifs. Les utilisateurs suspects ne sont pas bannis mais leur visibilité diminue progressivement sans qu\'ils le sachent (shadow-reduce).',
    pourquoi: 'La plupart des apps banissent (observable, contournable). Ici le comportement coûte de la visibilité. Les créeps persistent mais ne voient plus personne. Protection femmes sans guerre ouverte.',
    comment: 'Score interne non-visible. Calculé en backend. Seuils paramétrables. Jamais affiché publiquement.',
    risques: 'Risque de biais algorithmique (faux positifs). Nécessite data suffisante. Shadow reduce ≠ discrimination = légal si opaque.',
    ethique: '⚠️', ergo: '✅', business: '✅', femmesFirst: '✅',
    statut: '📋 Phase 3', tags: ['Sécurité ♀', 'Algo', 'Invisible'], source: 'GPT',
  },
]

/* ─── BUGS TROUVÉS ──────────────────────────────────────────────────────────── */

const BUGS = [
  {
    id: 'DB-01', sev: 'CORRIGÉ ✅', titre: 'Trigger clutches référençait colonne "plan" inexistante',
    desc: 'Le trigger check_clutch_limit() cherchait NEW.plan mais la colonne s\'appelle account_type dans profiles. Résultat : TOUT INSERT dans clutches échouait. Aucun Clutch ne pouvait être envoyé.',
    fix: 'Trigger recréé avec la bonne colonne. Code JS corrigé (.plan → .account_type). SQL appliqué en DB le 16.06.',
  },
  {
    id: 'DB-02', sev: 'CORRIGÉ ✅', titre: 'Contrainte rdv_feedbacks rejetait "on_time" et "showed"',
    desc: 'La contrainte CHECK n\'acceptait que "absent". Le code JS envoyait aussi "on_time" et "showed". Quand les premiers vrais users auraient fait un feedback positif, ça aurait échoué silencieusement.',
    fix: 'ALTER TABLE rdv_feedbacks: contrainte mise à jour pour accepter on_time/showed/absent. SQL appliqué le 16.06.',
  },
  {
    id: 'DB-03', sev: 'CORRIGÉ ✅', titre: 'RLS UPDATE manquant sur profiles et clutches',
    desc: 'Un PATCH anon retournait HTTP 200 au lieu de 401. Sur des tables vides pas de risque concret, mais en production des données auraient pu être modifiées sans authentification.',
    fix: 'Policies CREATE POLICY profiles_update et clutches_update ajoutées. SQL appliqué le 16.06.',
  },
  {
    id: 'DB-04', sev: '🔴 OUVERT', titre: 'user_feedbacks lisible sans authentification',
    desc: 'La table user_feedbacks est accessible en lecture publique (HTTP 200 avec données). Les feedbacks de "Tafit" incluant son identifiant Supabase sont visibles sans connexion. Fuite de données LPD.',
    fix: 'ALTER TABLE user_feedbacks ENABLE ROW LEVEL SECURITY + CREATE POLICY feedbacks_select. Inclus dans le SQL du 16.06 — à vérifier que c\'est bien appliqué.',
  },
  {
    id: 'DB-05', sev: '🟡 À FAIRE', titre: 'Anti-doublon et self-Clutch non enforced en DB',
    desc: 'La logique "une seule demande par paire" et "on ne peut pas s\'envoyer un Clutch à soi-même" est 100% côté JS. Un utilisateur via API peut contourner. Pas critique avec 0 vrais users mais à corriger avant lancement.',
    fix: 'UNIQUE constraint sur (sender_id, receiver_id) + CHECK constraint sender_id != receiver_id. À appliquer dans Supabase.',
  },
  {
    id: 'DB-06', sev: '🟡 À FAIRE', titre: 'reliability_score calculé côté JS uniquement',
    desc: 'Le score de fiabilité est mis à jour en JS après chaque feedback. Un utilisateur malveillant peut signaler des lapins sans que son score soit affecté s\'il bypass le client.',
    fix: 'Créer une Edge Function Supabase qui calcule le delta de score après INSERT dans rdv_feedbacks et applique la mise à jour sur profiles.',
  },
  {
    id: 'PERF-01', sev: '✅ OK', titre: 'Performances API Supabase',
    desc: 'Tests de charge effectués par l\'agent de simulation : temps de réponse 26-76ms en régime normal. Tables vides actuellement (0 vrais users). À remonitorer à partir de 500 users.',
    fix: 'RAS. Indexer is_available + available_until si les requêtes ralentissent.',
  },
  {
    id: 'GPS-01', sev: '✅ OK', titre: 'GPS non stocké en clair — conforme LPD',
    desc: 'Confirmé par audit : les coordonnées GPS ne sont pas stockées en DB. Seule la "zone de disponibilité choisie" est enregistrée. Le calcul de proximité est 100% côté client.',
    fix: 'RAS. À maintenir comme invariant dans toutes les futures features GPS.',
  },
]

/* ─── DECISIONS ─────────────────────────────────────────────────────────────── */

const DECISIONS = [
  { statut: '✅', d: 'Vocabulaire propriétaire : Clutch / Verrou / Présences (jamais "match" ou "swipe")', why: 'Un langage propre = une culture défendable. C\'est l\'équivalent du "tweet" pour Twitter.' },
  { statut: '✅', d: 'Femmes gratuites à vie', why: 'Éthique ET stratégique. Sans elles, les hommes partent. Ce n\'est pas un choix commercial, c\'est une contrainte de design.' },
  { statut: '✅', d: 'Contrainte 18h max sur tous les créneaux', why: 'Structurel et non-négociable. L\'étirer = trahir le concept. La contrainte crée l\'urgence = la valeur.' },
  { statut: '✅', d: 'GPS : zone choisie, pas position live', why: 'LPD suisse. Localisation = donnée sensible. On stocke "disponible au centre-ville", jamais les coordonnées exactes en DB.' },
  { statut: '✅', d: 'Score fiabilité public (affiché, pas caché)', why: 'Responsabilisation sociale. Les comportements invisibles restent impunis. Ici le lapin coûte publiquement.' },
  { statut: '✅', d: 'Apple IAP CHF 19.90/mois hommes premium', why: 'Testé mentalement : 30% commission Apple = CHF 14 net/mois. 1000 premiums = CHF 14k/mois = viable. Gratuit femmes = équilibré.' },
  { statut: '⚠️', d: 'Colonne "account_type" dans DB pour le statut premium (pas "plan")', why: 'Bug découvert 16.06. Le code JS utilisait .plan mais la DB a account_type. Harmonisé le 16.06.' },
  { statut: '📋', d: 'Dépôt marque IGE — "Clutch" (~CHF 550, classe 42+45)', why: 'À faire avant lancement public. Vérifier que "Cloche" et "Clutch" ne sont pas déjà déposés sur swissreg.ch.' },
  { statut: '🔴', d: 'Apple Developer Program $99/an — BLOQUANT pour TestFlight', why: 'Sans ça, aucun test iOS natif possible. Aller sur developer.apple.com/enroll dès que possible.' },
]

/* ─── MAIN ───────────────────────────────────────────────────────────────────── */

export default function Rapport() {
  const implemented = IDEAS.filter(i => i.statut === '✅ Implémenté')
  const phase2 = IDEAS.filter(i => i.statut === '🔜 Phase 2')
  const phase3 = IDEAS.filter(i => i.statut === '📋 Phase 3')
  const toValidate = IDEAS.filter(i => i.statut === '💡 À valider Mel')

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.white, fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif', WebkitFontSmoothing: 'antialiased' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '44px 20px 100px' }}>

        {/* ── HEADER ── */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 30, fontWeight: 900, color: C.gold, letterSpacing: '-1px' }}>CLUTCH</span>
            <span style={{ fontSize: 11, background: `${C.gold}20`, border: `1px solid ${C.gold}40`, borderRadius: 20, padding: '3px 12px', color: C.gold }}>Document stratégique v16.06</span>
            <span style={{ fontSize: 11, background: `${C.green}15`, border: `1px solid ${C.green}40`, borderRadius: 20, padding: '3px 12px', color: C.green }}>Beta privée Lausanne</span>
          </div>
          <H1>Rapport complet — Idées, Décisions, Bugs, Roadmap</H1>
          <P>État au 16 juin 2026 · Lausanne, Suisse · Document interne équipe fondatrice · Version exhaustive — chaque idée est documentée, classée et évaluée.</P>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 20 }}>
            {[
              { n: implemented.length, label: 'Features live', color: C.green },
              { n: phase2.length, label: 'Phase 2', color: C.gold },
              { n: phase3.length + toValidate.length, label: 'Phase 3 / Explorer', color: C.orange },
              { n: BUGS.filter(b => b.sev.startsWith('🔴') || b.sev.startsWith('🟡')).length, label: 'Bugs ouverts', color: C.red },
            ].map((s, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${s.color}30`, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.n}</div>
                <div style={{ fontSize: 10, color: C.mid, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 0. VISION ── */}
        <section style={{ marginBottom: 40 }}>
          <H2>0 · Vision & Promesse fondatrice</H2>
          <Card accent={C.salmon}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.salmon, marginBottom: 10 }}>"Présence spontanée vérifiée dans le monde réel."</div>
            <P>Clutch n\'est pas un meilleur Tinder. C\'est une nouvelle catégorie. Là où les apps de rencontres créent des cimetières de matchs non-concrétisés, Clutch impose l\'action : un Clutch = un rendez-vous proposé dans les 2h, à réaliser dans les 18h max. Ou ça expire. La friction est volontaire. La spontanéité est architecturale.</P>
            <P>Le GPS n\'est pas là pour espionner — il est là pour que tu saches que la personne est vraiment à Lausanne maintenant, pas à Paris en train de swiper. La position est une zone choisie, jamais des coordonnées exactes.</P>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
              {[
                ['❌ Tinder', 'Infiniment de profils, aucun RDV. Le chat remplace le vrai contact.'],
                ['✅ Clutch', 'Profils disponibles MAINTENANT. Le chat est interdit. RDV dans les 18h ou rien.'],
                ['❌ Meetic', 'Planifier un RDV 2 semaines à l\'avance après 50 messages.'],
                ['✅ Clutch', 'Pas de chat. Un Verrou = un engagement. Le reste est IRL.'],
              ].map(([label, text], i) => (
                <div key={i} style={{ background: i % 2 === 0 ? `${C.red}08` : `${C.green}08`, border: `1px solid ${i % 2 === 0 ? C.red : C.green}20`, borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: i % 2 === 0 ? C.red : C.green, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 11, color: C.mid }}>{text}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card accent={C.gold}>
            <H3>ADN produit — ce qui ne changera jamais</H3>
            {[
              ['Vocabulaire', 'Clutch / Verrou / Présences. JAMAIS "match", "swipe", "like". Le vocabulaire est la promesse.'],
              ['Contrainte 18h', 'Tout timing respecte cette fenêtre. L\'étirer = trahir le concept. Non-négociable.'],
              ['Femmes au centre', 'Elles sont le centre gravitationnel. Sans elles les hommes partent. Gratuité = permanente.'],
              ['Friction utile', '"Cette feature rend-elle Clutch plus confortable depuis le canapé ?" Si oui → dark pattern.'],
              ['Belle énergie', 'L\'app doit irradier de la vie sociale positive. "Se rencontrer vraiment" > "trouver un match".'],
            ].map(([k, v], i) => <Row key={i} label={k} value={v} />)}
          </Card>
        </section>

        <Divider />

        {/* ── 1. DÉCISIONS ── */}
        <section style={{ marginBottom: 40 }}>
          <H2 color={C.teal}>1 · Décisions validées & justifications</H2>
          <P>Ces décisions sont actées. Elles ne se remettent pas en question sans accord de l\'équipe fondatrice.</P>
          {DECISIONS.map((d, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 14, flexShrink: 0, width: 20, color: d.statut === '✅' ? C.green : d.statut === '⚠️' ? C.orange : d.statut === '🔴' ? C.red : C.purple }}>{d.statut}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.white, marginBottom: 2 }}>{d.d}</div>
                <div style={{ fontSize: 11, color: C.mid, fontStyle: 'italic' }}>{d.why}</div>
              </div>
            </div>
          ))}
        </section>

        <Divider />

        {/* ── 2. BUGS ── */}
        <section style={{ marginBottom: 40 }}>
          <H2 color={C.red}>2 · Bugs détectés — Audit simulation 16.06</H2>
          <P>7 scénarios testés par 9 agents en parallèle (4 min 33s). Appels HTTP réels contre l\'API Supabase. Score avant fixes : 4/10. Score attendu après : 8/10.</P>
          {BUGS.map((b, i) => {
            const sevColor = b.sev.startsWith('CORRIGÉ') ? C.green : b.sev.startsWith('🔴') ? C.red : b.sev.startsWith('🟡') ? C.orange : C.teal
            return (
              <div key={i} style={{ background: C.card, border: `1px solid ${sevColor}25`, borderLeft: `3px solid ${sevColor}`, borderRadius: 10, padding: '12px 16px', marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, color: C.dim, fontWeight: 700 }}>{b.id}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: C.white }}>{b.titre}</span>
                  <Chip label={b.sev} color={sevColor} />
                </div>
                <div style={{ fontSize: 11, color: C.mid, lineHeight: 1.6, marginBottom: 6 }}>{b.desc}</div>
                <div style={{ fontSize: 11, color: sevColor }}>→ {b.fix}</div>
              </div>
            )
          })}
          <Card accent={C.orange}>
            <H3 color={C.orange}>SQL restant à appliquer dans Supabase</H3>
            <div style={{ background: '#000', borderRadius: 8, padding: '14px', fontFamily: 'monospace', fontSize: 10, color: C.mid, lineHeight: 1.7, overflowX: 'auto' }}>
              {`-- Anti-doublon : contraintes DB manquantes\nALTER TABLE clutches ADD CONSTRAINT no_self_clutch CHECK (sender_id != receiver_id);\nCREATE UNIQUE INDEX IF NOT EXISTS clutch_pair_unique ON clutches(sender_id, receiver_id) WHERE status IN ('pending','confirmed','accepted');\n\n-- Vérifier que RLS user_feedbacks est actif :\nALTER TABLE user_feedbacks ENABLE ROW LEVEL SECURITY;`}
            </div>
          </Card>
        </section>

        <Divider />

        {/* ── 3. FEATURES IMPLÉMENTÉES ── */}
        <section style={{ marginBottom: 40 }}>
          <H2 color={C.green}>3 · Features implémentées — en production</H2>
          <P>{implemented.length} features live. Chaque carte détaille le pourquoi, le comment, et l\'évaluation éthique/ergo/business/femmes.</P>
          {implemented.map(idea => <IdeaCard key={idea.id} idea={idea} />)}
        </section>

        <Divider />

        {/* ── 4. PHASE 2 ── */}
        <section style={{ marginBottom: 40 }}>
          <H2 color={C.gold}>4 · Phase 2 — Priorités développement</H2>
          <P>Ces {phase2.length} features sont validées dans leur concept. Elles seront codées dans les prochaines semaines selon la priorité business.</P>
          {phase2.map(idea => <IdeaCard key={idea.id} idea={idea} />)}
        </section>

        <Divider />

        {/* ── 5. PHASE 3 ── */}
        <section style={{ marginBottom: 40 }}>
          <H2 color={C.orange}>5 · Phase 3 — Explorer & valider</H2>
          <P>Ces {phase3.length + toValidate.length} idées sont documentées mais pas encore actées. Certaines nécessitent une validation Mel, d\'autres de la data suffisante pour être calibrées.</P>
          {[...phase3, ...toValidate].map(idea => <IdeaCard key={idea.id} idea={idea} />)}
        </section>

        <Divider />

        {/* ── 6. FOSSÉ DÉFENSIF ── */}
        <section style={{ marginBottom: 40 }}>
          <H2 color={C.purple}>6 · Fossé défensif — ce que les concurrents ne peuvent pas copier</H2>
          <P>Quand Clutch marche, les géants voudront copier. Ce qui est non-copiable sans repartir de zéro :</P>
          {[
            ['🔒 Réputation publique réelle', 'Le score de fiabilité est basé sur des comportements réels vérifiés. Il faut des années de data pour le construire. Impossible à copier à froid.'],
            ['📖 Culture & vocabulaire propriétaires', 'Clutch / Verrou / Présences. Un langage = une tribu. Les utilisateurs partagent ces mots entre eux. Ça ne se copie pas.'],
            ['🏙️ Réseau local Lausanne-first', 'L\'effet réseau local est défensif. EPFL + UNIL + bars partenaires = masse critique locale difficile à déloger.'],
            ['🕸️ Historique social et connexions', 'Après 10 rencontres : "Vous avez 4 personnes en commun." Ce graphe social local ne peut pas être recréé sans plusieurs années d\'usage.'],
            ['⏱️ Contrainte 18h architecturale', 'Ce n\'est pas un feature, c\'est la définition du produit. Le copier = faire Clutch, pas un clone de Tinder.'],
            ['⚖️ Système de responsabilisation', 'Le double feedback + le score public + l\'histoire de fiabilité forment un écosystème de confiance qui prend des années à construire.'],
          ].map(([t, d], i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 20, width: 30, flexShrink: 0, textAlign: 'center' }}>{t.slice(0, 2)}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.white, marginBottom: 2 }}>{t.slice(3)}</div>
                <div style={{ fontSize: 11, color: C.mid, lineHeight: 1.6 }}>{d}</div>
              </div>
            </div>
          ))}
        </section>

        <Divider />

        {/* ── 7. ROADMAP ── */}
        <section style={{ marginBottom: 40 }}>
          <H2 color={C.blue}>7 · Roadmap prioritaire</H2>
          {[
            { phase: 'IMMÉDIAT — cette semaine', color: C.red, items: [
              '🔴 Payer Apple Developer $99/an → débloquer TestFlight et beta iOS',
              '🔴 Appliquer le SQL restant dans Supabase (anti-doublon + user_feedbacks RLS)',
              '🔴 Vérifier "Clutch" sur swissreg.ch avant dépôt IGE',
              '📲 Tester l\'app avec 5-10 vrais users Lausanne (cercle proche)',
            ]},
            { phase: 'SEMAINE 2-3', color: C.orange, items: [
              '📲 Build iOS Xcode → TestFlight → 50 testeurs Lausanne',
              '🎨 Flow création event particuliers (20 secondes — ID B-09)',
              '💼 Filtre âge/distance dans Présences (ID B-10)',
              '✦ Mission du Jour — feature rétention majeure (ID B-01)',
              '📊 SMS SOS réel via Twilio (actuellement simulation seulement)',
            ]},
            { phase: 'JUILLET — Phase 2', color: C.gold, items: [
              '🎯 File d\'attente intelligente femmes 3 meilleurs (ID B-02)',
              '💼 Mode Pro : Mission Express + Swap compétences (ID B-04, B-07)',
              '👨‍👩‍👧 Mode Parents / Clutch Kids (ID B-06) — avec modération humaine active',
              '⚡ Coaching invisible hommes (ID B-05)',
              '🔒 Contre-Clutch + Alerte distance RDV (ID B-11, B-12)',
              '💎 Apple IAP CHF 19.90/mois premium',
            ]},
            { phase: 'OCTOBRE — Phase 3 & Expansion', color: C.green, items: [
              '🌍 Google Play + Android',
              '🏙️ Expansion Genève / Berne / Zurich',
              '🎲 Roulette réelle + Golden Hour (ID C-01, B-08)',
              '🤝 Partenariats bars / clubs Lausanne (Cartes secrètes — ID C-02)',
              '🚀 Lancement public + campagne presse romande',
            ]},
          ].map((ph, i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: ph.color, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8, paddingBottom: 4, borderBottom: `1px solid ${ph.color}30` }}>{ph.phase}</div>
              {ph.items.map((item, j) => (
                <div key={j} style={{ display: 'flex', gap: 8, fontSize: 12, color: C.mid, padding: '5px 0', borderBottom: `1px solid ${C.border}22` }}>
                  <span style={{ color: ph.color, flexShrink: 0 }}>→</span>{item}
                </div>
              ))}
            </div>
          ))}
        </section>

        {/* ── FOOTER ── */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 10, color: C.dim }}>Clutch · Lausanne · 16.06.2026 · Confidentiel équipe fondatrice</div>
          <div style={{ fontSize: 10, color: C.dim }}>pz7cgj4kfv-tech.github.io/rapport</div>
        </div>

      </div>
    </div>
  )
}
