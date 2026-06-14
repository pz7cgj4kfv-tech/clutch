'use client'
import { useState } from 'react'

const VERSION = 'v09.06-A'
const DATE = '9 juin 2026'

// ─── DONNÉES AUDIT EXPERT (7 panels — version originale conservée intégralement) ────
const panels = [
  {
    id:'01', expert:'Directeur Artistique', angle:'Identité visuelle & design', emoji:'🎨', color:'#8B1A4A',
    findings:[
      { s:'gap', l:'Pas de signature visuelle reconnaissable sans le nom', d:'Si on montre un screenshot sans le nom "Clutch", on voit "une app propre" — pas une marque. Aucune typographie distinctive, aucune icône forte.' },
      { s:'gap', l:'Système de couleurs fonctionnel mais non mémorable', d:'Bordeaux/blanc est propre et crédible. Ce n\'est pas suffisant pour créer de l\'attachement émotionnel. Comparaison : Spotify (vert néon), Duolingo (vert + jaune), Tinder (gradient orange-rose).' },
      { s:'gap', l:'Pas de langage d\'animation unifié', d:'Animations existent (pulse, countdown) mais sans cohérence. Aucun "motion principle" défini — vitesse, courbe d\'accélération, intention émotionnelle.' },
      { s:'ok',  l:'Whitespace bien utilisé, hiérarchie lisible', d:'Les cartes profil et les screens principaux respirent correctement. Pas de problème de surcharge visuelle.' },
      { s:'crit',l:'Le "✦" est un placeholder, pas un logo', d:'Un vrai logo doit être vectoriel, déclinable en favicon, splash screen, notification icon. Actuellement inexistant.' },
    ],
    action:'Créer une identité graphique complète : logo vectoriel, typographie signature, motion principles. Avant l\'App Store obligatoirement.',
  },
  {
    id:'02', expert:'UX Researcher', angle:'Comportements & parcours utilisateur', emoji:'🔬', color:'#2E9E6B',
    findings:[
      { s:'crit',l:'9 étapes avant le premier RDV — trop long', d:'Login → Onboarding (5 screens) → Se mettre dispo → Discover → Envoyer clutch → Accepté → RDV. La photo est un point d\'abandon massif au step 4.' },
      { s:'crit',l:'Aucune analytics — pilotage à l\'aveugle', d:'On ne sait pas où les users abandonnent, quel écran est le plus consulté, quel taux de conversion clutch→RDV. Impossible d\'améliorer sans données.' },
      { s:'gap', l:'Pas d\'empty state dans Discover', d:'Quand personne n\'est dispo, l\'écran est vide. Pas de message, pas de CTA. Un user sur 3 croit à un bug.' },
      { s:'ok',  l:'La contrainte 2h crée la bonne tension', d:'Ni trop courte (stress), ni trop longue (procrastination). Validé comportementalement.' },
      { s:'gap', l:'Aucun mécanisme si 0 RDV après 3 sessions', d:'Un user qui n\'a pas eu de RDV en 3 tentatives part sans revenir. Rien ne le retient.' },
    ],
    action:'Installer Plausible Analytics immédiatement. Rendre la photo optionnelle. Créer l\'empty state Discover avec CTA.',
  },
  {
    id:'03', expert:'Psychologue comportementaliste', angle:'Impact émotionnel & bien-être', emoji:'🧠', color:'#8B7CB8',
    findings:[
      { s:'ok',  l:'Friction vers le RDV réel = anti-addiction by design', d:'Le concept force l\'action physique. Pas de scroll infini, pas de validation sociale par les likes. Architecture éthique rare dans les apps de rencontre.' },
      { s:'ok',  l:'Score de fiabilité responsabilise sans humilier', d:'Conséquence objective (perte de points) plutôt que honte sociale (avis négatifs publics). Juste.' },
      { s:'gap', l:'Moment du refus/annulation non géré émotionnellement', d:'Quand quelqu\'un refuse ou annule, c\'est un mini-rejet. L\'app dit juste "pas dispo". Aucun filet de sécurité émotionnel. Pour les anxieux sociaux, c\'est un mur.' },
      { s:'gap', l:'Zéro célébration des petites victoires', d:'Premier clutch envoyé → rien. Premier RDV confirmé → navigation silencieuse. C\'est le moment le plus fort de l\'app, sous-exploité à 90%.' },
      { s:'gap', l:'Pas de "voix" pour les anxieux sociaux', d:'Quelqu\'un qui n\'ose pas être le premier à proposer n\'a aucune aide. Pas de suggestion, pas d\'encouragement.' },
    ],
    action:'Célébration plein écran à l\'acceptation (confetti, animation, message). Adoucir les messages de refus. Encourager les timides.',
  },
  {
    id:'04', expert:'Avocate droit numérique suisse', angle:'LPD 2023 · RGPD · Responsabilité civile', emoji:'⚖️', color:'#C9A96E',
    findings:[
      { s:'crit',l:'Suppression de compte non implémentée', d:'La LPD 2023 garantit le droit à l\'effacement. L\'App Store Apple l\'exige aussi depuis 2022. Sans cette feature, soumission App Store = rejet automatique.' },
      { s:'crit',l:'CGU non validée par un juriste', d:'La page /legal existe mais a été rédigée sans validation juridique. En cas d\'incident (agression post-RDV), une CGU mal rédigée = responsabilité civile de l\'équipe.' },
      { s:'gap', l:'Vérification d\'âge déclarative seulement', d:'Saisie libre de l\'âge. Un mineur peut mentir. Pas de barrière technique. Exposition légale réelle en Suisse.' },
      { s:'gap', l:'En cas d\'incident, pas de procédure documentée', d:'Si une agression survient suite à un RDV Clutch, quelle est la procédure ? Qui prévient qui ? Quelle traçabilité ? Rien de défini.' },
      { s:'ok',  l:'GPS = zone de disponibilité choisie, pas position live', d:'Excellente décision. Conforme LPD. La localisation "où je veux me retrouver" n\'est pas une donnée de localisation au sens strict.' },
    ],
    action:'Implémenter la suppression de compte en priorité absolue. Consultation juriste CH avant lancement public (~2h, ~300 CHF).',
  },
  {
    id:'05', expert:'Spécialiste sécurité utilisatrices', angle:'Protection · Anti-harcèlement · Trust & Safety', emoji:'🛡️', color:'#E8A87C',
    findings:[
      { s:'ok',  l:'GPS ≠ position réelle — protection de base correcte', d:'On ne peut pas trianguler la position exacte d\'une femme. Bonne décision dès le début.' },
      { s:'ok',  l:'Bouton SOS + blocage utilisateur présents', d:'Fonctionnels. Le SOS appelle le 144 et active le GPS de l\'utilisatrice.' },
      { s:'crit',l:'Faux comptes créables trivialement', d:'Pas de vérification d\'identité, pas de numéro de tel, pas de selfie obligatoire. Un harceleur peut créer 50 comptes différents en 10 minutes.' },
      { s:'gap', l:'Le SOS ne notifie pas l\'équipe Clutch', d:'Quand le SOS est activé, il appelle le 144 mais rien n\'est loggé côté Clutch. Pas de notification David/Mel. En cas d\'incident grave, aucune traçabilité.' },
      { s:'gap', l:'Reports non agrégés — comportements répétés invisibles', d:'Si 5 femmes reportent le même profil pour comportement suspect, ça n\'est détecté nulle part. Pas d\'alerte automatique.' },
    ],
    action:'Logger les SOS en base + notifier l\'équipe. Agréger les reports pour détecter les comportements répétés. Selfie de vérification à terme.',
  },
  {
    id:'06', expert:'Growth Hacker & Product Marketer', angle:'Acquisition · Rétention · Monétisation', emoji:'📈', color:'#2E9E6B',
    findings:[
      { s:'ok',  l:'Moment "aha" identifié : le countdown du Sent screen', d:'Quand le compte à rebours commence après un clutch envoyé, c\'est physiquement excitant. C\'est le moment différenciant de Clutch.' },
      { s:'crit',l:'Zéro referral intégré dans le produit', d:'"Partager l\'app" n\'est pas un referral. Le referral c\'est : "Invite ton amie à être dispo ce soir avec toi" — in-app, dans le flow, naturel.' },
      { s:'gap', l:'Aucun push de rétention', d:'"5 personnes sont dispos à Lausanne ce soir" envoyé à 18h chaque jour = mécanisme de rétention simple et puissant. Actuellement inexistant.' },
      { s:'gap', l:'Prix CHF 19.90 jamais testé sur la cible', d:'Pris arbitrairement. A/B test 14.90 / 19.90 / 24.90 dès la beta. L\'élasticité-prix sur les apps de rencontre est plus haute qu\'on ne croit.' },
      { s:'gap', l:'Empty state Discover = opportunité de conversion manquée', d:'L\'écran vide est une chance de convertir en premium : "Sois visible en priorité avec Premium →". Actuellement : rien.' },
    ],
    action:'Push de rétention quotidien à 18h. Referral in-app. Empty state Discover avec CTA premium.',
  },
  {
    id:'07', expert:'Designer d\'expérience émotionnelle', angle:'Wow moments · Mémorabilité · Voix du produit', emoji:'✨', color:'#8B1A4A',
    findings:[
      { s:'crit',l:'L\'acceptation d\'un clutch = moment le plus fort, zéro célébration', d:'Quelqu\'un dit "oui". C\'est le climax émotionnel de l\'app. Actuellement : navigation silencieuse vers rdv-active. Zéro confetti, zéro vibration, zéro son. Crime UX.' },
      { s:'gap', l:'Pas d\'interaction signature physique unique', d:'Le clutch s\'envoie via un formulaire classique. Tinder a le swipe. Bumble a le premier message femme. Clutch doit avoir SON geste — pression longue ? geste de "lancer" ? quelque chose d\'instinctif.' },
      { s:'gap', l:'Voix de l\'app trop fonctionnelle', d:'"Envoyer un Clutch" "RDV confirmé" "Retour à Discover" — propre mais froid. Clutch devrait parler comme quelqu\'un de cool, humain, un peu complice.' },
      { s:'ok',  l:'Le Proximity Meter est une idée de génie', d:'L\'indicateur de rapprochement 30 min avant le RDV crée de la tension positive unique. Pas encore assez mis en valeur visuellement.' },
      { s:'gap', l:'Pas de storytelling dans les écrans vides', d:'Empty states, états d\'attente, écrans de chargement — autant d\'opportunités de créer de la connivence avec l\'utilisateur. Actuellement : vides.' },
    ],
    action:'Célébration plein écran à l\'acceptation. Inventer le geste Clutch. Rewriter tous les micro-textes avec une voix forte.',
  },
]

// ─── PRIORITÉS (inchangées) ───────────────────────────────────────────────────
const priorities = [
  { level:'CRITIQUE', color:'#C0392B', bg:'#fadadf', items:[
    'Suppression de compte (LPD 2023 + App Store — obligatoire)',
    'Célébration plein écran à l\'acceptation d\'un clutch (THE wow moment)',
    'Analytics Plausible — on pilote à l\'aveugle sans ça',
    'Logger les SOS + notifier l\'équipe Clutch en cas d\'activation',
  ]},
  { level:'IMPORTANT', color:'#c0612b', bg:'#FDF0E6', items:[
    'Empty state Discover avec CTA ("sois le premier à te mettre dispo")',
    'Photo optionnelle à l\'onboarding (réduire l\'abandon au step 4)',
    'Inventer le geste signature Clutch (pas un form, un vrai geste physique)',
    'Rewriter tous les micro-textes avec une voix humaine et forte',
    'Push de rétention quotidien à 18h ("X personnes sont dispos ce soir")',
    'Reports agrégés dans le dashboard admin',
  ]},
  { level:'PHASE 2', color:'#555', bg:'#f5f5f5', items:[
    'Referral in-app naturel ("invite ton amie à être dispo ce soir avec toi")',
    'A/B test pricing CHF 14.90 / 19.90 / 24.90',
    'Vérification d\'identité légère (selfie ou numéro de tel)',
    'Identité graphique complète (logo vectoriel, typographie signature)',
    'Consultation juriste suisse pour valider les CGU (~2h, ~300 CHF)',
    'Dark mode + icônes custom Figma/Illustrator',
  ]},
]

// ─── VISION PRODUIT ───────────────────────────────────────────────────────────
const visionItems = [
  {
    icon:'✦', title:'Ce que Clutch est vraiment', color:'#D4A853',
    body:`Clutch n'est pas une app de rencontres. Ce n'est pas un Tinder suisse. Ce n'est pas un clone de Bumble, Thursday, ou Meetup.\n\nClutch est une infrastructure de spontanéité urbaine — un réseau de personnes physiquement disponibles maintenant, dans un rayon donné, pour partager un moment réel dans les 18 prochaines heures.\n\nLe cas d'usage "dating" est un parmi d'autres : café, balade, chien, concert, billet en trop, yoga, networking, amitié, rencontre amoureuse. Le cœur est la spontanéité + la présence + le réel.\n\nNouvelle catégorie inventée : "Presence Network" — comme Uber n'est pas "une voiture" mais "de la mobilité à la demande", Clutch n'est pas "une rencontre" mais du temps humain partagé, immédiatement.`,
  },
  {
    icon:'💬', title:'La phrase définitive + slogans', color:'#8B1A4A',
    body:`Phrase définitive :\n"Quelqu'un t'attend. Tu ne le savais pas encore."\n\nOu plus court, plus brutal : "Disponible maintenant. Pour de vrai."\n\nSlogans candidats :\n• "Quelqu'un t'attend." ← le meilleur — 3 mots, émotion directe, vrai pour tous les cas d'usage\n• "Le monde dans les prochaines heures."\n• "Sois là."\n• "Lausanne a du monde ce soir."\n• "Disponible. Comme toi."\n• "18 heures pour que quelque chose se passe."`,
  },
  {
    icon:'🔤', title:'Vocabulaire propriétaire', color:'#2E9E6B',
    body:`À GARDER ET RENFORCER :\n→ Clutch (verbe + nom) — parfait, court, mémorable\n→ Verrou — fort, original, non-Tinder\n→ Disponible — simple, puissant\n→ Fenêtre — pour le créneau horaire (mieux que "slot")\n\nÀ CRÉER :\n→ Présence — être physiquement là dans la ville\n→ Lancer un Clutch (pas "envoyer")\n→ Ouvrir une fenêtre (pas "se mettre dispo")\n→ Fermer le Verrou (pas "confirmer le RDV")\n→ Apparaître (pas "se rendre visible")\n\nÀ BANNIR ABSOLUMENT :\n✗ Match · Swipe · Like · Feed · Story · Boost · Super-like\n✗ "Application" → dire "Clutch" tout court\n✗ "Rencontre" → préférer "moment", "présence", "retrouvaille"`,
  },
  {
    icon:'🏗️', title:'Architecture UX idéale (3 onglets)', color:'#8B7CB8',
    body:`L'architecture actuelle (Discover / Événements / Messages / Profil) copie les apps de dating existantes. Ce n'est pas Clutch.\n\nArchitecture idéale :\nTAB 1 — MAINTENANT (pas "Discover" — "Discover" = browsing passif, anti-Clutch)\nTAB 2 — MES CLUTCHS (Inbox + Sent fusionnés, filtre reçu/envoyé/actifs)\nTAB 3 — PROFIL\n\nLes Événements = cards contextuelles dans MAINTENANT, pas un onglet séparé. Un événement ce soir à Lausanne = une card dans le feed du moment.\n\nObjectif : moins de 3 taps pour être disponible. Actuellement c'est 5-6 interactions minimum.`,
  },
  {
    icon:'📱', title:'L\'écran parfait à l\'ouverture', color:'#C9A96E',
    body:`Fond : nuit urbaine, flou, chaud. Pas blanc, pas noir pur. La couleur de Lausanne à 20h — bleu-gris avec des lumières chaudes et dorées.\n\nZone haute (40%) : Logo CLUTCH aligné à gauche, comme une signature. L'heure en temps réel en grand. "20h14." — pas d'explication, l'heure dit tout. Quand tu ouvres Clutch, le premier mot que tu lis, c'est l'heure.\n\nZone centrale (40%) : Si tu es disponible → carte minimaliste avec points lumineux qui pulsent = personnes disponibles autour de toi. Pas de photos, pas de noms. Juste des présences. "7 personnes disponibles à 2km."\nSi tu n'es pas disponible → un seul bouton énorme. Pas "se mettre disponible". Juste : "Je suis là." Appui long = geste intentionnel = déclenche la disponibilité.\n\nZone basse (20%) : Une seule phrase contextuelle, changeante : "Lucas cherche quelqu'un pour un café à 20 min de toi" ou "3 personnes cherchent quelqu'un pour ce soir."`,
  },
  {
    icon:'🎨', title:'Identité visuelle future', color:'#D4A853',
    body:`Palette proposée (sortir du bordeaux/blanc actuel) :\n• Nuit chaude #0F0C0E — fond principal\n• Or Lausanne #D4A853 — couleur signature, lumière de ville\n• Bordeaux profond #7A1535 — accent, verrou confirmé\n• Blanc cassé #F7F3EF — texte, cartes\n• Vert présence #2DBD7E — disponible, confirmé, vivant\n\nPas de bleu. Pas de violet. Pas de gradients arc-en-ciel.\n\nTypographie : Neue Montreal ou Satoshi — géométrique, moderne, européen\n\nCe qui rend Clutch reconnaissable en 2 secondes :\n→ L'horloge — l'heure est toujours visible quelque part. C'est l'identité.\n→ Le point qui pulse — indicateur de présence, comme un cœur qui bat.\n→ La couleur or — rare dans les apps de rencontre, mémorable.`,
  },
]

// ─── AUDIT GPT — 9 PARTIES COMPLÈTES ────────────────────────────────────────
const gptItems = [
  {
    partie:'Partie 1 — Identité profonde', verdict:'✅ GPT a raison — on adopte',
    resume:`GPT challenge l'identité même de Clutch : "ce n'est PAS une app de rencontres, pas un Tinder suisse." Les cas d'usage (café, balade, chien, concert, billet en trop, yoga, networking, amitié, rencontre amoureuse) prouvent que le dating n'est qu'un sous-cas. Le cœur = spontanéité + présence + réel + anti-solitude.`,
    reaction:`On adopte intégralement. Voici tout ce qui a été dit et décidé sur l'identité de Clutch — à ne jamais perdre.\n\n━━ CE QUE CLUTCH N'EST PAS ━━\n\n→ Clutch n'est PAS une app de rencontres. Ce n'est pas un Tinder suisse.\n→ Clutch n'est pas un clone de Bumble, Thursday, ou Meetup.\n→ Clutch n'est pas "Uber pour les dates" — c'est plus grand que ça.\n→ Clutch n'est pas une app d'événements. Pas une app de networking.\n→ Clutch n'est pas conçu pour maximiser le temps passé sur l'app — c'est l'inverse.\n\n━━ CE QUE CLUTCH EST ━━\n\n→ Clutch est une infrastructure de spontanéité urbaine.\n→ Clutch est "l'Uber de la présence sociale" — la disponibilité humaine à la demande.\n→ Clutch est un réseau de personnes physiquement disponibles MAINTENANT, dans un rayon donné, pour partager un moment réel dans les 18 prochaines heures.\n→ Clutch invente une nouvelle catégorie : "Presence Network".\n→ Comme Uber n'est pas "une voiture" mais "de la mobilité à la demande", Clutch n'est pas "une rencontre" mais du temps humain partagé, immédiatement disponible.\n→ Le cœur de Clutch : spontanéité + présence + réel + anti-solitude.\n\n━━ LES PHRASES DÉFINITIVES ━━\n\n→ Pitch principal : "La présence urbaine à la demande."\n→ Phrase définitive longue : "Quelqu'un t'attend. Tu ne le savais pas encore."\n→ Phrase courte, brutale : "Disponible maintenant. Pour de vrai."\n→ Tagline app : "Quelqu'un t'attend. Sois là."\n\n━━ SLOGANS RETENUS ━━\n\n→ "Quelqu'un t'attend." ← le meilleur — 3 mots, émotion directe, vrai pour tous les cas d'usage\n→ "Sois là."\n→ "Disponible. Comme toi."\n→ "Lausanne a du monde ce soir."\n→ "La présence urbaine à la demande."\n→ "18 heures pour que quelque chose se passe."\n→ "Le monde dans les prochaines heures."\n→ "Pas un match de plus. Un vrai rendez-vous."\n\n━━ CAS D'USAGE (le dating n'est qu'un parmi d'autres) ━━\n\n→ Un café avec quelqu'un de nouveau\n→ Une balade avec un chien\n→ Un concert avec un billet en trop\n→ Une session yoga, une rando, un atelier\n→ Du networking informel\n→ De l'amitié\n→ Et oui, aussi : des rencontres amoureuses\n\n━━ VOCABULAIRE PROPRIÉTAIRE (décidé le 9 juin 2026) ━━\n\n→ Clutcher = envoyer une proposition de RDV (verbe + nom)\n→ Un Clutch = la proposition (lieu + heure + message, expire en 2h)\n→ Être clutché·e = recevoir une proposition\n→ Un Verrou = quand les deux ont accepté → RDV confirmé (PAS "match")\n→ Une Fenêtre = le créneau horaire disponible (pas "slot")\n→ Lancer un Clutch (pas "envoyer")\n→ Ouvrir une fenêtre (pas "se mettre dispo")\n→ Apparaître (pas "se rendre visible")\n→ Fermer le Verrou (pas "confirmer le RDV")\n\n━━ MOTS BANNIS ABSOLUMENT ━━\n\n✗ Match · Swipe · Like · Feed · Story · Boost · Super-like\n✗ "Application" → dire "Clutch" tout court\n✗ "Rencontre" → préférer "moment", "présence", "retrouvaille"\n✗ "Se mettre dispo" → "Ouvrir une fenêtre" ou "Apparaître"\n\n━━ POURQUOI C'EST DIFFÉRENT ET DÉFENDABLE ━━\n\n→ La contrainte 18h est structurelle et défendable légalement — pas juste un choix UX\n→ Le score de fiabilité est long à construire = moat réel\n→ La gratuité femmes = avantage réseau + image + bouche-à-oreille\n→ Anti-addiction by design = argument fort post-COVID où les gens sont fatigués des apps addictives\n→ Lausanne = terrain test parfait (petite, dense, internationale, étudiante) avant la Suisse romande`,
  },
  {
    partie:'Partie 2 — Design Lab avant le code', verdict:'✅ GPT a raison — stratégie adoptée',
    resume:`Ne pas modifier l'app directement. Créer d'abord un prototype ultra-réaliste (Figma ou Framer) sans backend, sans Supabase, sans logique métier. Uniquement écrans, animations, transitions, UX. Puis intégrer dans l'app réelle screen par screen.`,
    reaction:`Stratégie correcte et importante.\n\n→ Notre variante optimale : Mel dessine dans Figma (qu'elle connaît) + crée les assets vectoriels dans Illustrator (export SVG) → Claude code dans /proto de l'app existante. Résultat : testable sur vrai iPhone en 1-2h par écran, dans le bon framework, sans apprendre Framer.\n→ Les 5 écrans à prototyper en priorité : Home (carte de présences), Disponibilité ("Je suis là."), Clutch envoyé (countdown), Verrou confirmé (célébration), Proximity Meter.\n→ NE PAS tout refaire d'un coup. Screen par screen. Commencer par le wow moment : l'acceptation.`,
  },
  {
    partie:'Partie 3 — Architecture UX', verdict:'✅ Alignés',
    resume:`L'architecture actuelle (Discover / Événements / Messages / Profil) copie les apps de dating existantes. GPT recommande de la réduire et de repenser "Discover" comme un écran de présences actives, pas de browsing passif.`,
    reaction:`Alignés à 100%.\n\n→ Architecture idéale : 3 onglets seulement\nTAB 1 — MAINTENANT (pas "Discover" — le mot "Discover" = browsing passif = anti-Clutch)\nTAB 2 — MES CLUTCHS (Inbox + Sent fusionnés)\nTAB 3 — PROFIL\n→ Les Événements = cards contextuelles dans MAINTENANT, pas un onglet séparé\n→ Objectif : moins de 3 taps pour être disponible. Actuellement 5-6 interactions minimum.`,
  },
  {
    partie:'Partie 4 — Écran d\'ouverture', verdict:'✅ The insight clé',
    resume:`GPT insiste sur l'urgence temporelle comme ancre identitaire. L'heure en grand = "c'est maintenant". Créer immédiatement envie, spontanéité, émotion, confiance — sans surcharger l'écran.`,
    reaction:`L'heure est THE signature visuelle de Clutch.\n\n→ Fond : nuit urbaine, bleu-gris chaud, lumières dorées — la couleur de Lausanne à 20h\n→ Zone haute 40% : Logo CLUTCH aligné gauche. L'HEURE en temps réel, grande. "20h14." — pas d'explication.\n→ Zone centrale 40% : Si dispo → carte avec points qui pulsent = présences réelles. "7 personnes disponibles à 2km." Pas de photos, pas de noms. Juste des présences.\nSi pas dispo → un seul bouton énorme : "Je suis là." Appui long = geste intentionnel.\n→ Zone basse 20% : Une phrase contextuelle. "Lucas cherche quelqu'un pour un café à 20 min de toi."`,
  },
  {
    partie:'Partie 5 — Identité visuelle', verdict:'⚠️ Direction adoptée, détails ajustés',
    resume:`GPT recommande de sortir du rose/bordeaux actuel pour quelque chose de plus premium, mémorable, reconnaissable en 2 secondes. Palette "nuit chaude" + couleur signature forte.`,
    reaction:`On suit la direction générale avec un ajustement :\n\n→ Palette retenue :\n• Nuit chaude #0F0C0E — fond principal\n• Or Lausanne #D4A853 — couleur signature (rare dans les apps de rencontre)\n• Bordeaux profond #7A1535 — accent, verrou confirmé (on le garde)\n• Blanc cassé #F7F3EF — texte, cartes\n• Vert présence #2DBD7E — disponible, confirmé\n→ Logo direction retenue : Option 02 "Bleu Nuit et Melon" (#132B45 + #E9B07F) — symbole sablier/nœud/instantanéité créé par Mel\n→ Ce qui rend Clutch reconnaissable en 2s : l'horloge toujours visible + le point qui pulse + la couleur or\n→ Typo : Neue Montreal ou Satoshi — géométrique, européen, moderne`,
  },
  {
    partie:'Partie 6 — Expérience femme', verdict:'🔴 Points critiques non résolus',
    resume:`GPT demande une analyse complète avant/pendant/après le RDV. Tous les scénarios, tous les risques, tous les signaux de confiance visibles et invisibles.`,
    reaction:`Analyse complète :\n\nAVANT LE RDV :\n→ ✅ Badge de sécurité lieux (🛡 lieu public, 👁 très fréquenté) — en place mais peu visible\n→ ✅ Score de fiabilité affiché sur le profil avant d'envoyer un clutch\n→ ❌ Partage automatique avec contact de confiance — pas encore. "J'ai un Clutch au Café Grütli à 20h30 avec [Prénom]" → SMS automatique opt-in à implémenter\n→ ❌ Avis de sécurité d'autres femmes sur le lieu — feature manquante à fort impact\n\nPENDANT LE RDV :\n→ ✅ Proximity Meter en place (30 min avant)\n→ ❌ Check-in automatique silencieux : si les deux GPS convergent → notification discrète au contact de confiance "Elle est arrivée"\n→ ❌ Si elle ne bouge plus 30 min après l'heure → ping discret au contact de confiance\n\nAPRÈS LE RDV :\n→ ✅ Feedback anonyme (ghost/lapin/ok/super)\n→ ❌ Feedback féminin spécifique sur comportement (pas le lieu, la personne) — agrégé en interne, jamais public\n→ ❌ Si plusieurs femmes reportent le même profil → suspension immédiate sans validation manuelle\n\nSIGNAUX INVISIBLES qui rassurent (que les femmes ressentent sans le voir) :\n→ Photos vérifiées = badge très discret\n→ Temps de réponse moyen affiché sur le profil\n→ Nombre de RDVs honorés / total visible`,
  },
  {
    partie:'Partie 7 — Créateurs d\'événements', verdict:'🟡 Modèle défini, à implémenter',
    resume:`GPT demande l'analyse du modèle futur avec créateurs certifiés (yoga, running, photographie, networking, ateliers). Modèle économique, certification, risques juridiques et sécurité, UX.`,
    reaction:`Modèle en 3 niveaux défini :\n\nNIVEAU 1 — User certifié (selfie + numéro)\n→ Peut créer des événements jusqu'à 10 personnes\n→ Soumis modération 24h\n→ Gratuit\n\nNIVEAU 2 — Créateur d'activité (dossier + validation Clutch)\n→ Événements récurrents, badge visible\n→ Push notif aux followers de sa catégorie\n→ Exempt de modération après 3 événements sans incident\n→ Gratuit — Clutch prend la visibilité\n\nNIVEAU 3 — Partenaire (contrat B2B)\n→ Événements illimités, mise en avant, dashboard analytics\n→ CHF 49-99/mois ou commission si événement payant\n\nRISQUES JURIDIQUES CH :\n→ Événement avec alcool + mineurs → responsabilité de l'organisateur (CGU à préciser)\n→ RSVP = contrat → si annulation, remboursement obligatoire si payant\n→ RC obligatoire pour créateurs Niveau 3\n\nRISQUE PRODUIT PRINCIPAL : un créateur avec 200 followers dans l'app peut partir sur WhatsApp. Fidélisation = features exclusives Clutch (analytics, boost, badge) valant plus que WhatsApp.`,
  },
  {
    partie:'Partie 8 — Roadmap si CEO', verdict:'✅ Ordre adopté',
    resume:`GPT demande la roadmap optimale dans l'ordre exact : Architecture UX → Design System → Prototype → Tests utilisateurs → Intégration. Ou autre ?`,
    reaction:`Ordre retenu (légèrement ajusté) :\n\nSEM 1-2 : Décisions fondatrices sur papier — slogan final, palette, architecture 3 onglets, logo direction. Avant tout pixel.\nSEM 3-4 : Mel dessine dans Figma + Illustrator → les 5 écrans critiques\nSEM 5-6 : Claude code /proto dans l'app — testable iPhone en 1-2h par écran\nSEM 7 : Test sur 5 femmes 20-30 ans à Lausanne — observation silencieuse, pas de questionnaire\nSEM 8-10 : Intégration progressive dans l'app réelle, screen par screen\n\nCOMMENCER PAR : la célébration de l'acceptation d'un Clutch — le wow moment le plus impactant, actuellement inexploité.\n\nNE PAS FAIRE : grande refonte d'un coup (ça ne sort jamais). Se lancer App Store avant un design mémorable. Ouvrir à d'autres villes avant de dominer Lausanne.`,
  },
  {
    partie:'Partie 9 — Auto-destruction', verdict:'🔴 Exercice de lucidité obligatoire',
    resume:`GPT demande à oublier qu'on aime l'idée, devenir un investisseur hostile. Lister les 20 plus gros risques, les 10 raisons d'échouer, les 10 raisons de réussir, les fonctionnalités inutiles, les manquantes, les erreurs stratégiques.`,
    reaction:`Les 10 raisons d'échouer (honnêtes) :\n1. Masse critique — sans users, l'app est une ville fantôme. Les 100 premiers ne voient personne → partent → app morte.\n2. "Se déclarer disponible" = admettre qu'on est seul. Friction psychologique réelle et sous-estimée.\n3. Thursday (Londres) = même concept, déjà 1M+ users, ressources importantes. On n'est pas seuls.\n4. Tinder pourrait copier en 3 mois avec leur base de 75M utilisateurs. "Tinder Now" existe déjà.\n5. Équilibre hommes/femmes structurellement fragile — si les femmes partent, les hommes partent. Si les hommes paient, les femmes restent mais s'ennuient.\n6. Saisonnalité : -5° à Lausanne en hiver = personne ne veut sortir spontanément. Effondrement 4 mois/an.\n7. CHF 19.90/mois sans avoir prouvé la valeur d'abord = barrière énorme au paywall.\n8. Vérification identité : sans elle → problèmes sécurité. Avec elle → perte 40% inscriptions.\n9. Les créateurs d'événements peuvent partir sur WhatsApp avec leurs followers.\n10. Zéro analytics = pilotage aveugle complet.\n\nLes 10 raisons de réussir :\n1. Concept genuinement nouveau — pas un clone, une vraie catégorie inventée\n2. Timing post-COVID : les gens veulent du réel, pas du virtuel\n3. Lausanne = ville test idéale (petite, dense, internationale, étudiante)\n4. Contrainte 18h = différentiateur défendable légalement et stratégiquement\n5. Gratuité femmes = rétention + image + bouche-à-oreille\n6. Score de fiabilité = mécanisme de confiance unique, long à copier\n7. Créateurs d'événements = acquisition B2B2C naturelle\n8. Pas de scroll infini = attrait génération fatiguée des apps addictives\n9. Suisse romande = marché premium, pouvoir d'achat élevé\n10. Équipe petite, peut pivoter rapidement\n\nFonctionnalités inutiles pour la beta : certification selfie (trop tôt), 36 créneaux (personne ne scrolle jusqu'au 30), badges avancés.\nFonctionnalités manquantes critiques : suppression de compte · carte des présences · geste signature · célébration acceptation · push de rétention 18h.`,
  },
]

// ─── WORKFLOW DESIGN ──────────────────────────────────────────────────────────
const toolsExplained = [
  {
    name:'Figma',
    icon:'🖼️',
    résumé:'L\'outil de design d\'interface le plus utilisé au monde. Gratuit pour débuter.',
    pourquoi:`C'est là que tu dessines les écrans — ce que les gens verront. Comme Photoshop mais fait exprès pour les apps. Mel peut apprendre les bases en 2h avec les tutoriels sur figma.com.`,
    parfaitPour:'Dessiner les écrans, créer les composants (boutons, cartes, onglets), partager les maquettes avec l\'équipe.',
    limitations:'Les animations sont basiques. On ne ressent pas vraiment comment l\'app va se comporter.',
    recommandé: true,
  },
  {
    name:'Framer',
    icon:'⚡',
    résumé:'Comme Figma mais avec de vraies animations et du vrai code React exportable.',
    pourquoi:`Framer génère du code React réutilisable. Les animations sont vraies — pas des simulations. Mais l'outil demande un apprentissage réel et est payant.`,
    parfaitPour:'Prototypes ultra-réalistes avec vraies animations et micro-interactions.',
    limitations:'Courbe d\'apprentissage de 1-2 semaines. Payant (~20$/mois). Si Mel ne le connaît pas déjà, c\'est du temps perdu.',
    recommandé: false,
  },
  {
    name:'Notre approche (recommandée)',
    icon:'✦',
    résumé:'Mel dessine dans Figma. Claude code directement dans /proto de l\'app.',
    pourquoi:`C'est la méthode la plus rapide pour notre équipe. Mel crée les maquettes dans ce qu'elle connaît. Claude les code en 1-2h dans une route /proto — hardcodé, sans base de données, avec les vraies animations iOS. On teste sur le vrai téléphone immédiatement, dans le bon framework.`,
    parfaitPour:'Notre équipe exactement — une designeuse, un dev IA, pas besoin d\'apprendre de nouvel outil.',
    limitations:'Requiert que Mel livre des maquettes claires (pas juste une idée en tête).',
    recommandé: true,
  },
]

const workflowSteps = [
  {
    n:'1', who:'Mel', label:'Définir les 5 écrans à créer',
    detail:`Avant de dessiner quoi que ce soit, décider ensemble quels sont les 5 écrans les plus importants à prototyper. Suggestion : Home (carte de présences), Disponibilité, Clutch envoyé, Verrou confirmé, Proximity Meter.`,
    tools:'Papier, discussion',
  },
  {
    n:'2', who:'Mel', label:'Créer un compte Figma (gratuit)',
    detail:`Aller sur figma.com → créer un compte gratuit → cliquer "New Design File". Choisir un frame "iPhone 14" (390×844px) dans la liste de droite. C'est l'espace de travail de base.`,
    tools:'Figma (figma.com) — gratuit',
  },
  {
    n:'3', who:'Mel', label:'Dessiner les écrans dans Figma',
    detail:`Pour chaque écran : utiliser les formes de base (rectangles, textes, cercles). Pas besoin d'être parfait — l'important c'est la structure. Où est le titre ? Où est le bouton principal ? Quelle couleur de fond ? Les photos = des rectangles gris avec une croix, pas besoin des vraies images.\n\nRessource utile : chercher "Figma iOS UI Kit" sur Google pour des composants iPhone prêts à l'emploi.`,
    tools:'Figma',
  },
  {
    n:'4', who:'Mel', label:'Créer les assets graphiques dans Illustrator',
    detail:`Mel connaît Illustrator — c'est parfait pour les éléments vectoriels : le logo CLUTCH, les icônes custom (le point qui pulse, le verrou, les étoiles fiabilité), les illustrations. Exporter en SVG depuis Illustrator → importer dans Figma comme composants réutilisables.\n\nFormat d'export : SVG pour les icônes/logos (vectoriel, léger), PNG 2x pour les illustrations.`,
    tools:'Illustrator → export SVG → import Figma',
  },
  {
    n:'5', who:'Mel + David', label:'Valider les maquettes ensemble',
    detail:`Partager le lien Figma avec David (bouton "Share" en haut à droite → "Anyone with link can view"). Passer en revue chaque écran. Annoter les changements directement dans Figma (mode Commentaire). Valider avant de passer au code.`,
    tools:'Figma (partage de lien)',
  },
  {
    n:'6', who:'Claude', label:'Coder le prototype dans /proto',
    detail:`Claude code exactement ce que Mel a dessiné dans une route /proto de l'app. Hardcodé (pas de vraie base de données), avec les vraies animations CSS/React, les vraies transitions. Résultat : une page testable sur le vrai iPhone de Mel en 1-2h.`,
    tools:'Next.js / React — app existante',
  },
  {
    n:'7', who:'Mel', label:'Tester sur iPhone réel',
    detail:`Ouvrir pz7cgj4kfv-tech.github.io/proto sur Safari iPhone. Passer l'écran à 5 femmes de l'entourage si possible. Observer sans expliquer — juste regarder où elles cliquent, où elles hésitent, ce qui les fait sourire ou froncer les sourcils.`,
    tools:'Safari iPhone',
  },
  {
    n:'8', who:'Mel + Claude', label:'Itérer et intégrer dans l\'app réelle',
    detail:`Ce qui marche dans /proto → Claude l'intègre dans l'app réelle, screen par screen. Jamais tout d'un coup. Commencer par le moment le plus impactant : la célébration de l'acceptation d'un Clutch.`,
    tools:'App existante',
  },
]

// ─── POINTS SAUVEGARDÉS (à ne pas perdre) ────────────────────────────────────
const savedPoints = [
  'Score de fiabilité : système de suspension escalatoire en place — <60: pause 3j, <40: 14j, <20: 60j, 0: ban permanent (v08.06-I)',
  'Invisible dans Discover pendant RDV actif (±90 min autour du proposed_time) — v08.06-G',
  'Toast swipe-up pour fermer — v08.06-I',
  'Badge version + timestamp build auto (NEXT_PUBLIC_BUILD_TIME) — v08.06-H',
  'Comptes test Mel (mel@clutch.app/Mel2026!) et Ami (ami@clutch.app/Ami2026!) créés',
  'Lien guide test Mel : /mel',
  'OneSignal Web Push fonctionnel — notifs sur tous les events du cycle de vie d\'un Clutch',
  'Realtime messages via REPLICA IDENTITY FULL (ALTER TABLE messages REPLICA IDENTITY FULL)',
  'Stripe CHF 19.90/mois intégré — gate premium clutches + favoris',
  'Proximity Meter actif 30 min avant le RDV',
  'Poll backup clutches toutes les 8s (à passer à 20s une fois realtime stable)',
  'PATCH 400 sur profiles (checkExpiry / available_from:null) — bug non résolu',
  'Plausible Analytics : pas encore installé — priorité absolue',
  'Suppression de compte : non implémentée — légal + App Store bloquant',
  'Architecture UX actuelle (4 onglets) = sous-optimale selon audit — 3 onglets recommandés pour V2',
]

export default function AuditPage() {
  const [tab, setTab] = useState<'audit'|'vision'|'gpt'|'workflow'|'saved'>('audit')

  const tabStyle = (t: string) => ({
    padding: '9px 18px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer' as const,
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 700,
    background: tab === t ? '#111' : 'transparent',
    color: tab === t ? '#fff' : '#999',
    transition: 'all 0.15s',
  })

  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>Clutch · Audit & Vision — {DATE}</title>
        <style dangerouslySetInnerHTML={{ __html: `
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif; background: #f2f2f2; color: #111; }
          .wrap { max-width: 900px; margin: 0 auto; padding: 32px 20px 80px; }
          @media print {
            body { background: white; }
            .wrap { padding: 0; max-width: 100%; }
            .no-print { display: none !important; }
            @page { margin: 18mm 15mm; size: A4; }
          }
          details > summary { list-style: none; }
          details > summary::-webkit-details-marker { display: none; }
          details[open] > summary .chevron { transform: rotate(180deg); }
          .chevron { transition: transform 0.2s; display: inline-block; }
          a { color: inherit; }
        `}}/>
      </head>
      <body>
        <div className="wrap">

          {/* ── HEADER ─────────────────────────────────────── */}
          <div style={{ background:'#0d0d0d', borderRadius:20, padding:'36px 40px', marginBottom:24, color:'white' }}>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
              <div style={{ width:50, height:50, background:'#8B1A4A', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:900, flexShrink:0 }}>✦</div>
              <div>
                <div style={{ fontSize:32, fontWeight:900, letterSpacing:'-0.04em' }}>CLU<span style={{ color:'#8B1A4A' }}>TCH</span></div>
                <div style={{ fontSize:12, color:'#555', marginTop:1 }}>Présence urbaine à la demande · Lausanne</div>
              </div>
            </div>
            <div style={{ fontSize:13, color:'#555', lineHeight:1.8, borderTop:'1px solid #1a1a1a', paddingTop:16 }}>
              <strong style={{ color:'#888' }}>Audit & Vision — Document central équipe</strong> · {DATE} · {VERSION}<br/>
              David · Mélanie · Claude · Confidentiel
            </div>
            <p style={{ fontSize:14, color:'#aaa', marginTop:12, lineHeight:1.65 }}>
              Ce document réunit tout : l'audit technique de l'app, la vision produit, les réponses à l'audit GPT, le workflow de design pour Mel, et les points à ne pas perdre. Une seule page, tout dedans.
            </p>
            <div style={{ display:'flex', gap:8, marginTop:16, flexWrap:'wrap' }}>
              <button className="no-print" onClick={()=>window.print()} style={{ background:'white', color:'#111', border:'none', borderRadius:8, padding:'7px 16px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>⬇ PDF</button>
              <a href="/hq" style={{ background:'transparent', color:'#666', border:'1px solid #333', borderRadius:8, padding:'7px 16px', fontSize:12, fontWeight:600, textDecoration:'none' }}>← QG</a>
              <a href="/mel" style={{ background:'transparent', color:'#2DBD7E', border:'1px solid #2DBD7E', borderRadius:8, padding:'7px 16px', fontSize:12, fontWeight:600, textDecoration:'none' }}>Guide Mel →</a>
            </div>
          </div>

          {/* ── STATS RAPIDES ──────────────────────────────── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:24 }} className="no-print">
            {[
              { n:'8', l:'Critiques', c:'#C0392B' },
              { n:'14', l:'Gaps', c:'#c0612b' },
              { n:'7', l:'Forces', c:'#2E9E6B' },
              { n:'5', l:'Écrans à créer', c:'#D4A853' },
            ].map(s => (
              <div key={s.l} style={{ background:'white', borderRadius:14, padding:'16px', textAlign:'center' }}>
                <div style={{ fontSize:30, fontWeight:900, color:s.c, letterSpacing:'-0.04em' }}>{s.n}</div>
                <div style={{ fontSize:11, color:'#888', marginTop:3, textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:600 }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* ── TABS ───────────────────────────────────────── */}
          <div className="no-print" style={{ background:'#e8e8e8', borderRadius:12, padding:4, display:'flex', gap:2, marginBottom:24, flexWrap:'wrap' }}>
            {([
              ['audit','🔍 Audit technique'],
              ['vision','✦ Vision produit'],
              ['gpt','🤖 Audit GPT'],
              ['workflow','🎨 Workflow design'],
              ['saved','📦 Archive'],
            ] as const).map(([t,l]) => (
              <button key={t} onClick={()=>setTab(t)} style={tabStyle(t)}>{l}</button>
            ))}
          </div>

          {/* ══ TAB : AUDIT TECHNIQUE ══════════════════════ */}
          {tab === 'audit' && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#999', marginBottom:16 }}>7 panels d'expertise — Analyse critique de l'app actuelle</div>
              {panels.map(p => (
                <div key={p.id} style={{ background:'white', borderRadius:16, padding:'24px 28px', marginBottom:12, borderLeft:`4px solid ${p.color}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                    <div>
                      <div style={{ fontSize:11, color:'#bbb', fontWeight:700, letterSpacing:'0.08em', marginBottom:4 }}>PANEL {p.id}</div>
                      <div style={{ fontSize:17, fontWeight:800, letterSpacing:'-0.02em' }}>{p.expert}</div>
                      <div style={{ fontSize:12, color:'#888', marginTop:2 }}>{p.angle}</div>
                    </div>
                    <span style={{ fontSize:28 }}>{p.emoji}</span>
                  </div>
                  {p.findings.map((f,i) => (
                    <div key={i} style={{ display:'flex', gap:10, marginBottom:10, alignItems:'flex-start' }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', flexShrink:0, marginTop:5, background: f.s==='crit'?'#C0392B':f.s==='gap'?'#e07b39':'#2E9E6B' }}/>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, marginBottom:2 }}>{f.l}</div>
                        <div style={{ fontSize:12, color:'#666', lineHeight:1.55 }}>{f.d}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid #f0f0f0', fontSize:12, color:'#555', fontStyle:'italic' }}>{p.action}</div>
                </div>
              ))}

              <div style={{ marginTop:32, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#999', marginBottom:16 }}>Priorités d'action consolidées</div>
              {priorities.map(pr => (
                <div key={pr.level} style={{ background:pr.bg, borderRadius:14, padding:'20px 24px', marginBottom:10 }}>
                  <div style={{ fontSize:11, fontWeight:800, letterSpacing:'0.1em', color:pr.color, marginBottom:10 }}>● {pr.level}</div>
                  {pr.items.map((item,i) => (
                    <div key={i} style={{ display:'flex', gap:8, marginBottom:7, fontSize:13, color:'#333', lineHeight:1.5 }}>
                      <span style={{ color:pr.color, fontWeight:700, flexShrink:0 }}>→</span><span>{item}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* ══ TAB : VISION PRODUIT ══════════════════════ */}
          {tab === 'vision' && (
            <div>
              <div style={{ background:'linear-gradient(135deg,#fffbf0,#fff5e0)', border:'1px solid #f0d88a', borderRadius:16, padding:'18px 22px', marginBottom:24 }}>
                <div style={{ fontSize:13, fontWeight:800, color:'#b07d00', marginBottom:6 }}>✦ Redéfinition stratégique — 9 juin 2026</div>
                <p style={{ fontSize:13, color:'#856000', lineHeight:1.7 }}>Clutch n'est plus une app de rencontres. C'est une infrastructure de spontanéité urbaine. Cette section définit ce que Clutch doit devenir — identité, vocabulaire, architecture, design.</p>
              </div>
              {visionItems.map((item,i) => (
                <details key={i} style={{ background:'white', borderRadius:14, marginBottom:8, overflow:'hidden', borderLeft:`3px solid ${item.color}` }}>
                  <summary style={{ padding:'16px 20px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', userSelect:'none' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:20 }}>{item.icon}</span>
                      <span style={{ fontSize:14, fontWeight:700, color:'#111' }}>{item.title}</span>
                    </div>
                    <span className="chevron" style={{ color:'#bbb', fontSize:12 }}>▼</span>
                  </summary>
                  <div style={{ padding:'0 20px 18px', borderTop:'1px solid #f5f5f5' }}>
                    {item.body.split('\n').map((line,j) => (
                      <p key={j} style={{ fontSize:13, color: line.startsWith('→')||line.startsWith('•')||line.startsWith('✗') ? '#444':'#666', lineHeight:1.7, marginTop: j===0?12:3, fontWeight: line.startsWith('→')||line.startsWith('✗')?600:400 }}>{line || ' '}</p>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          )}

          {/* ══ TAB : AUDIT GPT ════════════════════════════ */}
          {tab === 'gpt' && (
            <div>
              <div style={{ background:'#f0f4ff', border:'1px solid #c8d8ff', borderRadius:16, padding:'18px 22px', marginBottom:24 }}>
                <div style={{ fontSize:13, fontWeight:800, color:'#3455cc', marginBottom:6 }}>🤖 Audit GPT-4 — 9 juin 2026</div>
                <p style={{ fontSize:13, color:'#445', lineHeight:1.7 }}>GPT-4 a réalisé un audit fondateur en 9 parties, challengeant l'identité même de Clutch. Ci-dessous : résumé de chaque partie + réaction de Claude (où on est d'accord, où on diverge, ce qu'on adopte).</p>
              </div>
              {gptItems.map((item,i) => (
                <div key={i} style={{ background:'white', borderRadius:14, padding:'20px 24px', marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, flexWrap:'wrap', gap:8 }}>
                    <div style={{ fontSize:14, fontWeight:800, color:'#111' }}>{item.partie}</div>
                    <span style={{ fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:20, background: item.verdict.startsWith('✅')?'#D4F0E4':item.verdict.startsWith('⚠️')?'#FDF0E6':'#fadadf', color: item.verdict.startsWith('✅')?'#1a6b45':item.verdict.startsWith('⚠️')?'#b05a00':'#C0392B' }}>{item.verdict}</span>
                  </div>
                  <div style={{ fontSize:12, color:'#666', lineHeight:1.65, marginBottom:12, background:'#f9f9f9', borderRadius:8, padding:'10px 14px' }}>
                    <strong style={{ color:'#888', fontSize:11, textTransform:'uppercase', letterSpacing:'0.06em' }}>GPT dit : </strong>{item.resume}
                  </div>
                  {item.reaction.split('\n').map((line,j) => (
                    <p key={j} style={{ fontSize:13, color:'#333', lineHeight:1.7, marginTop: j===0?0:4, fontWeight: line.startsWith('→')?600:400 }}>{line}</p>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* ══ TAB : WORKFLOW DESIGN ═════════════════════ */}
          {tab === 'workflow' && (
            <div>
              <div style={{ background:'linear-gradient(135deg,#f5eeff,#ede6ff)', border:'1px solid #d0beff', borderRadius:16, padding:'18px 22px', marginBottom:24 }}>
                <div style={{ fontSize:13, fontWeight:800, color:'#6633cc', marginBottom:6 }}>🎨 Comment construire les nouveaux écrans — expliqué simplement</div>
                <p style={{ fontSize:13, color:'#553388', lineHeight:1.7 }}>Cette section explique les outils, qui fait quoi, dans quel ordre, et comment tester sur le vrai téléphone. Pas de jargon. Si tu connais Illustrator, tu peux démarrer demain.</p>
              </div>

              {/* Les outils */}
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#999', marginBottom:14 }}>Les 3 options — laquelle choisir ?</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:28 }}>
                {toolsExplained.map(tool => (
                  <div key={tool.name} style={{ background:'white', borderRadius:14, padding:'18px 20px', border: tool.recommandé?'2px solid #2DBD7E':'1px solid #eee', position:'relative' }}>
                    {tool.recommandé && tool.name==='Notre approche (recommandée)' && <div style={{ position:'absolute', top:-10, left:16, background:'#2DBD7E', color:'white', fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:10, letterSpacing:'0.06em' }}>✓ NOTRE CHOIX</div>}
                    <div style={{ fontSize:22, marginBottom:8 }}>{tool.icon}</div>
                    <div style={{ fontSize:14, fontWeight:800, marginBottom:6 }}>{tool.name}</div>
                    <div style={{ fontSize:12, color:'#555', lineHeight:1.6, marginBottom:10 }}>{tool.résumé}</div>
                    <div style={{ fontSize:11, color:'#888', lineHeight:1.6 }}>
                      <strong style={{ color:'#555' }}>Parfait pour : </strong>{tool.parfaitPour}
                    </div>
                    <div style={{ fontSize:11, color:'#aaa', lineHeight:1.6, marginTop:6 }}>
                      <strong style={{ color:'#888' }}>Limite : </strong>{tool.limitations}
                    </div>
                  </div>
                ))}
              </div>

              {/* Rôle de Mel / Illustrator */}
              <div style={{ background:'#fff8f0', border:'1px solid #ffd0a0', borderRadius:14, padding:'18px 22px', marginBottom:24 }}>
                <div style={{ fontSize:13, fontWeight:800, color:'#b05a00', marginBottom:8 }}>🖊️ Mel maîtrise Illustrator — comment l'utiliser</div>
                <p style={{ fontSize:13, color:'#664400', lineHeight:1.7 }}>
                  <strong>Bonne nouvelle :</strong> Illustrator est parfait pour créer les assets graphiques — le logo CLUTCH vectoriel, les icônes custom (le point qui pulse, le verrou, les étoiles), les illustrations. C'est exactement là-dedans que ça doit être fait.<br/><br/>
                  <strong>Workflow Illustrator → Figma :</strong><br/>
                  Créer l'icône ou le logo dans Illustrator → Fichier → Exporter → Exporter en tant que → choisir SVG → importer dans Figma (glisser-déposer). Le SVG reste vectoriel, zoomable à l'infini, utilisable sur toutes tailles d'écran et comme favicon.
                </p>
              </div>

              {/* Étapes */}
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#999', marginBottom:14 }}>Procédure pas à pas — de zéro à l'iPhone</div>
              {workflowSteps.map((step,i) => (
                <div key={i} style={{ background:'white', borderRadius:14, padding:'18px 22px', marginBottom:8, display:'flex', gap:16, alignItems:'flex-start' }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background: step.who==='Mel'?'#8B1A4A':step.who==='Claude'?'#2E9E6B':'#D4A853', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, flexShrink:0 }}>{step.n}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                      <span style={{ fontSize:14, fontWeight:700 }}>{step.label}</span>
                      <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, fontWeight:700, background: step.who==='Mel'?'#F5E0EA':step.who==='Claude'?'#D4F0E4':'#FDF5E6', color: step.who==='Mel'?'#8B1A4A':step.who==='Claude'?'#1a6b45':'#b07d00' }}>{step.who}</span>
                    </div>
                    {step.detail.split('\n').map((line,j) => (
                      <p key={j} style={{ fontSize:13, color:'#555', lineHeight:1.65, marginTop: j===0?0:6 }}>{line}</p>
                    ))}
                    <div style={{ marginTop:10, fontSize:11, color:'#aaa', fontWeight:600 }}>🛠 {step.tools}</div>
                  </div>
                </div>
              ))}

              {/* Roadmap visuelle */}
              <div style={{ background:'#0d0d0d', borderRadius:16, padding:'22px 26px', marginTop:24, color:'white' }}>
                <div style={{ fontSize:13, fontWeight:800, color:'#D4A853', marginBottom:16 }}>🚀 Ordre recommandé (semaine par semaine)</div>
                {[
                  { w:'Sem 1-2', t:'Décisions fondatrices', d:'Slogan, palette, architecture 3 onglets — sur papier. Avant tout pixel.' },
                  { w:'Sem 3-4', t:'Figma + Illustrator', d:'Mel dessine les 5 écrans critiques. Claude exporte les assets SVG si besoin.' },
                  { w:'Sem 5-6', t:'Prototype /proto', d:'Claude code les écrans dans l\'app. Résultat : testable sur iPhone en 1-2h par écran.' },
                  { w:'Sem 7', t:'Test utilisateurs', d:'5 femmes 20-30 ans à Lausanne. Observation silencieuse, pas de questionnaire.' },
                  { w:'Sem 8-10', t:'Intégration progressive', d:'Screen par screen dans l\'app réelle. Commencer par la célébration de l\'acceptation.' },
                ].map((s,i) => (
                  <div key={i} style={{ display:'flex', gap:16, alignItems:'flex-start', padding:'10px 0', borderBottom: i<4?'1px solid #1a1a1a':'none' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#D4A853', minWidth:60, flexShrink:0 }}>{s.w}</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:'white', marginBottom:3 }}>{s.t}</div>
                      <div style={{ fontSize:12, color:'#666' }}>{s.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ TAB : ARCHIVE ═════════════════════════════ */}
          {tab === 'saved' && (
            <div>
              <div style={{ background:'#f5f5f5', border:'1px solid #ddd', borderRadius:16, padding:'18px 22px', marginBottom:24 }}>
                <div style={{ fontSize:13, fontWeight:800, color:'#555', marginBottom:6 }}>📦 Points sauvegardés — à ne pas perdre</div>
                <p style={{ fontSize:13, color:'#777', lineHeight:1.7 }}>Tout ce qui est en place, les bugs connus, les décisions prises, les choses à ne pas oublier. Ce n'est pas un todo, c'est une mémoire.</p>
              </div>
              <div style={{ background:'white', borderRadius:14, overflow:'hidden' }}>
                {savedPoints.map((point,i) => (
                  <div key={i} style={{ padding:'13px 18px', borderBottom: i<savedPoints.length-1?'1px solid #f0f0f0':'none', display:'flex', gap:10, alignItems:'flex-start' }}>
                    <span style={{ color:'#bbb', fontSize:13, flexShrink:0, marginTop:1 }}>·</span>
                    <span style={{ fontSize:13, color:'#444', lineHeight:1.6 }}>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── FOOTER ─────────────────────────────────────── */}
          <div style={{ marginTop:48, paddingTop:24, borderTop:'1px solid #e0e0e0', display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:12 }}>
            <div>
              <p style={{ fontSize:11, color:'#bbb', lineHeight:1.8 }}><strong>Clutch</strong> — La présence urbaine à la demande · Lausanne, Suisse</p>
              <p style={{ fontSize:11, color:'#bbb', lineHeight:1.8 }}>David Saugy · Mélanie · Claude · {DATE} · {VERSION}</p>
            </div>
            <button className="no-print" onClick={()=>window.print()} style={{ background:'#0d0d0d', color:'white', border:'none', borderRadius:10, padding:'10px 22px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              ⬇ Enregistrer PDF
            </button>
          </div>

        </div>
      </body>
    </html>
  )
}
