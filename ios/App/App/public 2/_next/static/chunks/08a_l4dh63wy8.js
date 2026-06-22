(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,31498,e=>{"use strict";var t=e.i(63846),i=e.i(93524);let n="v09.06-A",s="9 juin 2026",r=[{id:"01",expert:"Directeur Artistique",angle:"Identité visuelle & design",emoji:"🎨",color:"#8B1A4A",findings:[{s:"gap",l:"Pas de signature visuelle reconnaissable sans le nom",d:'Si on montre un screenshot sans le nom "Clutch", on voit "une app propre" — pas une marque. Aucune typographie distinctive, aucune icône forte.'},{s:"gap",l:"Système de couleurs fonctionnel mais non mémorable",d:"Bordeaux/blanc est propre et crédible. Ce n'est pas suffisant pour créer de l'attachement émotionnel. Comparaison : Spotify (vert néon), Duolingo (vert + jaune), Tinder (gradient orange-rose)."},{s:"gap",l:"Pas de langage d'animation unifié",d:'Animations existent (pulse, countdown) mais sans cohérence. Aucun "motion principle" défini — vitesse, courbe d\'accélération, intention émotionnelle.'},{s:"ok",l:"Whitespace bien utilisé, hiérarchie lisible",d:"Les cartes profil et les screens principaux respirent correctement. Pas de problème de surcharge visuelle."},{s:"crit",l:'Le "✦" est un placeholder, pas un logo',d:"Un vrai logo doit être vectoriel, déclinable en favicon, splash screen, notification icon. Actuellement inexistant."}],action:"Créer une identité graphique complète : logo vectoriel, typographie signature, motion principles. Avant l'App Store obligatoirement."},{id:"02",expert:"UX Researcher",angle:"Comportements & parcours utilisateur",emoji:"🔬",color:"#2E9E6B",findings:[{s:"crit",l:"9 étapes avant le premier RDV — trop long",d:"Login → Onboarding (5 screens) → Se mettre dispo → Discover → Envoyer clutch → Accepté → RDV. La photo est un point d'abandon massif au step 4."},{s:"crit",l:"Aucune analytics — pilotage à l'aveugle",d:"On ne sait pas où les users abandonnent, quel écran est le plus consulté, quel taux de conversion clutch→RDV. Impossible d'améliorer sans données."},{s:"gap",l:"Pas d'empty state dans Discover",d:"Quand personne n'est dispo, l'écran est vide. Pas de message, pas de CTA. Un user sur 3 croit à un bug."},{s:"ok",l:"La contrainte 2h crée la bonne tension",d:"Ni trop courte (stress), ni trop longue (procrastination). Validé comportementalement."},{s:"gap",l:"Aucun mécanisme si 0 RDV après 3 sessions",d:"Un user qui n'a pas eu de RDV en 3 tentatives part sans revenir. Rien ne le retient."}],action:"Installer Plausible Analytics immédiatement. Rendre la photo optionnelle. Créer l'empty state Discover avec CTA."},{id:"03",expert:"Psychologue comportementaliste",angle:"Impact émotionnel & bien-être",emoji:"🧠",color:"#8B7CB8",findings:[{s:"ok",l:"Friction vers le RDV réel = anti-addiction by design",d:"Le concept force l'action physique. Pas de scroll infini, pas de validation sociale par les likes. Architecture éthique rare dans les apps de rencontre."},{s:"ok",l:"Score de fiabilité responsabilise sans humilier",d:"Conséquence objective (perte de points) plutôt que honte sociale (avis négatifs publics). Juste."},{s:"gap",l:"Moment du refus/annulation non géré émotionnellement",d:"Quand quelqu'un refuse ou annule, c'est un mini-rejet. L'app dit juste \"pas dispo\". Aucun filet de sécurité émotionnel. Pour les anxieux sociaux, c'est un mur."},{s:"gap",l:"Zéro célébration des petites victoires",d:"Premier clutch envoyé → rien. Premier RDV confirmé → navigation silencieuse. C'est le moment le plus fort de l'app, sous-exploité à 90%."},{s:"gap",l:'Pas de "voix" pour les anxieux sociaux',d:"Quelqu'un qui n'ose pas être le premier à proposer n'a aucune aide. Pas de suggestion, pas d'encouragement."}],action:"Célébration plein écran à l'acceptation (confetti, animation, message). Adoucir les messages de refus. Encourager les timides."},{id:"04",expert:"Avocate droit numérique suisse",angle:"LPD 2023 · RGPD · Responsabilité civile",emoji:"⚖️",color:"#C9A96E",findings:[{s:"crit",l:"Suppression de compte non implémentée",d:"La LPD 2023 garantit le droit à l'effacement. L'App Store Apple l'exige aussi depuis 2022. Sans cette feature, soumission App Store = rejet automatique."},{s:"crit",l:"CGU non validée par un juriste",d:"La page /legal existe mais a été rédigée sans validation juridique. En cas d'incident (agression post-RDV), une CGU mal rédigée = responsabilité civile de l'équipe."},{s:"gap",l:"Vérification d'âge déclarative seulement",d:"Saisie libre de l'âge. Un mineur peut mentir. Pas de barrière technique. Exposition légale réelle en Suisse."},{s:"gap",l:"En cas d'incident, pas de procédure documentée",d:"Si une agression survient suite à un RDV Clutch, quelle est la procédure ? Qui prévient qui ? Quelle traçabilité ? Rien de défini."},{s:"ok",l:"GPS = zone de disponibilité choisie, pas position live",d:'Excellente décision. Conforme LPD. La localisation "où je veux me retrouver" n\'est pas une donnée de localisation au sens strict.'}],action:"Implémenter la suppression de compte en priorité absolue. Consultation juriste CH avant lancement public (~2h, ~300 CHF)."},{id:"05",expert:"Spécialiste sécurité utilisatrices",angle:"Protection · Anti-harcèlement · Trust & Safety",emoji:"🛡️",color:"#E8A87C",findings:[{s:"ok",l:"GPS ≠ position réelle — protection de base correcte",d:"On ne peut pas trianguler la position exacte d'une femme. Bonne décision dès le début."},{s:"ok",l:"Bouton SOS + blocage utilisateur présents",d:"Fonctionnels. Le SOS appelle le 144 et active le GPS de l'utilisatrice."},{s:"crit",l:"Faux comptes créables trivialement",d:"Pas de vérification d'identité, pas de numéro de tel, pas de selfie obligatoire. Un harceleur peut créer 50 comptes différents en 10 minutes."},{s:"gap",l:"Le SOS ne notifie pas l'équipe Clutch",d:"Quand le SOS est activé, il appelle le 144 mais rien n'est loggé côté Clutch. Pas de notification David/Mel. En cas d'incident grave, aucune traçabilité."},{s:"gap",l:"Reports non agrégés — comportements répétés invisibles",d:"Si 5 femmes reportent le même profil pour comportement suspect, ça n'est détecté nulle part. Pas d'alerte automatique."}],action:"Logger les SOS en base + notifier l'équipe. Agréger les reports pour détecter les comportements répétés. Selfie de vérification à terme."},{id:"06",expert:"Growth Hacker & Product Marketer",angle:"Acquisition · Rétention · Monétisation",emoji:"📈",color:"#2E9E6B",findings:[{s:"ok",l:'Moment "aha" identifié : le countdown du Sent screen',d:"Quand le compte à rebours commence après un clutch envoyé, c'est physiquement excitant. C'est le moment différenciant de Clutch."},{s:"crit",l:"Zéro referral intégré dans le produit",d:'"Partager l\'app" n\'est pas un referral. Le referral c\'est : "Invite ton amie à être dispo ce soir avec toi" — in-app, dans le flow, naturel.'},{s:"gap",l:"Aucun push de rétention",d:'"5 personnes sont dispos à Lausanne ce soir" envoyé à 18h chaque jour = mécanisme de rétention simple et puissant. Actuellement inexistant.'},{s:"gap",l:"Prix CHF 19.90 jamais testé sur la cible",d:"Pris arbitrairement. A/B test 14.90 / 19.90 / 24.90 dès la beta. L'élasticité-prix sur les apps de rencontre est plus haute qu'on ne croit."},{s:"gap",l:"Empty state Discover = opportunité de conversion manquée",d:'L\'écran vide est une chance de convertir en premium : "Sois visible en priorité avec Premium →". Actuellement : rien.'}],action:"Push de rétention quotidien à 18h. Referral in-app. Empty state Discover avec CTA premium."},{id:"07",expert:"Designer d'expérience émotionnelle",angle:"Wow moments · Mémorabilité · Voix du produit",emoji:"✨",color:"#8B1A4A",findings:[{s:"crit",l:"L'acceptation d'un clutch = moment le plus fort, zéro célébration",d:"Quelqu'un dit \"oui\". C'est le climax émotionnel de l'app. Actuellement : navigation silencieuse vers rdv-active. Zéro confetti, zéro vibration, zéro son. Crime UX."},{s:"gap",l:"Pas d'interaction signature physique unique",d:"Le clutch s'envoie via un formulaire classique. Tinder a le swipe. Bumble a le premier message femme. Clutch doit avoir SON geste — pression longue ? geste de \"lancer\" ? quelque chose d'instinctif."},{s:"gap",l:"Voix de l'app trop fonctionnelle",d:'"Envoyer un Clutch" "RDV confirmé" "Retour à Discover" — propre mais froid. Clutch devrait parler comme quelqu\'un de cool, humain, un peu complice.'},{s:"ok",l:"Le Proximity Meter est une idée de génie",d:"L'indicateur de rapprochement 30 min avant le RDV crée de la tension positive unique. Pas encore assez mis en valeur visuellement."},{s:"gap",l:"Pas de storytelling dans les écrans vides",d:"Empty states, états d'attente, écrans de chargement — autant d'opportunités de créer de la connivence avec l'utilisateur. Actuellement : vides."}],action:"Célébration plein écran à l'acceptation. Inventer le geste Clutch. Rewriter tous les micro-textes avec une voix forte."}],a=[{level:"CRITIQUE",color:"#C0392B",bg:"#fadadf",items:["Suppression de compte (LPD 2023 + App Store — obligatoire)","Célébration plein écran à l'acceptation d'un clutch (THE wow moment)","Analytics Plausible — on pilote à l'aveugle sans ça","Logger les SOS + notifier l'équipe Clutch en cas d'activation"]},{level:"IMPORTANT",color:"#c0612b",bg:"#FDF0E6",items:['Empty state Discover avec CTA ("sois le premier à te mettre dispo")',"Photo optionnelle à l'onboarding (réduire l'abandon au step 4)","Inventer le geste signature Clutch (pas un form, un vrai geste physique)","Rewriter tous les micro-textes avec une voix humaine et forte",'Push de rétention quotidien à 18h ("X personnes sont dispos ce soir")',"Reports agrégés dans le dashboard admin"]},{level:"PHASE 2",color:"#555",bg:"#f5f5f5",items:['Referral in-app naturel ("invite ton amie à être dispo ce soir avec toi")',"A/B test pricing CHF 14.90 / 19.90 / 24.90","Vérification d'identité légère (selfie ou numéro de tel)","Identité graphique complète (logo vectoriel, typographie signature)","Consultation juriste suisse pour valider les CGU (~2h, ~300 CHF)","Dark mode + icônes custom Figma/Illustrator"]}],o=[{icon:"✦",title:"Ce que Clutch est vraiment",color:"#D4A853",body:`Clutch n'est pas une app de rencontres. Ce n'est pas un Tinder suisse. Ce n'est pas un clone de Bumble, Thursday, ou Meetup.

Clutch est une infrastructure de spontan\xe9it\xe9 urbaine — un r\xe9seau de personnes physiquement disponibles maintenant, dans un rayon donn\xe9, pour partager un moment r\xe9el dans les 18 prochaines heures.

Le cas d'usage "dating" est un parmi d'autres : caf\xe9, balade, chien, concert, billet en trop, yoga, networking, amiti\xe9, rencontre amoureuse. Le cœur est la spontan\xe9it\xe9 + la pr\xe9sence + le r\xe9el.

Nouvelle cat\xe9gorie invent\xe9e : "Presence Network" — comme Uber n'est pas "une voiture" mais "de la mobilit\xe9 \xe0 la demande", Clutch n'est pas "une rencontre" mais du temps humain partag\xe9, imm\xe9diatement.`},{icon:"💬",title:"La phrase définitive + slogans",color:"#8B1A4A",body:`Phrase d\xe9finitive :
"Quelqu'un t'attend. Tu ne le savais pas encore."

Ou plus court, plus brutal : "Disponible maintenant. Pour de vrai."

Slogans candidats :
• "Quelqu'un t'attend." ← le meilleur — 3 mots, \xe9motion directe, vrai pour tous les cas d'usage
• "Le monde dans les prochaines heures."
• "Sois l\xe0."
• "Lausanne a du monde ce soir."
• "Disponible. Comme toi."
• "18 heures pour que quelque chose se passe."`},{icon:"🔤",title:"Vocabulaire propriétaire",color:"#2E9E6B",body:`\xc0 GARDER ET RENFORCER :
→ Clutch (verbe + nom) — parfait, court, m\xe9morable
→ Verrou — fort, original, non-Tinder
→ Disponible — simple, puissant
→ Fen\xeatre — pour le cr\xe9neau horaire (mieux que "slot")

\xc0 CR\xc9ER :
→ Pr\xe9sence — \xeatre physiquement l\xe0 dans la ville
→ Lancer un Clutch (pas "envoyer")
→ Ouvrir une fen\xeatre (pas "se mettre dispo")
→ Fermer le Verrou (pas "confirmer le RDV")
→ Appara\xeetre (pas "se rendre visible")

\xc0 BANNIR ABSOLUMENT :
✗ Match \xb7 Swipe \xb7 Like \xb7 Feed \xb7 Story \xb7 Boost \xb7 Super-like
✗ "Application" → dire "Clutch" tout court
✗ "Rencontre" → pr\xe9f\xe9rer "moment", "pr\xe9sence", "retrouvaille"`},{icon:"🏗️",title:"Architecture UX idéale (3 onglets)",color:"#8B7CB8",body:`L'architecture actuelle (Discover / \xc9v\xe9nements / Messages / Profil) copie les apps de dating existantes. Ce n'est pas Clutch.

Architecture id\xe9ale :
TAB 1 — MAINTENANT (pas "Discover" — "Discover" = browsing passif, anti-Clutch)
TAB 2 — MES CLUTCHS (Inbox + Sent fusionn\xe9s, filtre re\xe7u/envoy\xe9/actifs)
TAB 3 — PROFIL

Les \xc9v\xe9nements = cards contextuelles dans MAINTENANT, pas un onglet s\xe9par\xe9. Un \xe9v\xe9nement ce soir \xe0 Lausanne = une card dans le feed du moment.

Objectif : moins de 3 taps pour \xeatre disponible. Actuellement c'est 5-6 interactions minimum.`},{icon:"📱",title:"L'écran parfait à l'ouverture",color:"#C9A96E",body:`Fond : nuit urbaine, flou, chaud. Pas blanc, pas noir pur. La couleur de Lausanne \xe0 20h — bleu-gris avec des lumi\xe8res chaudes et dor\xe9es.

Zone haute (40%) : Logo CLUTCH align\xe9 \xe0 gauche, comme une signature. L'heure en temps r\xe9el en grand. "20h14." — pas d'explication, l'heure dit tout. Quand tu ouvres Clutch, le premier mot que tu lis, c'est l'heure.

Zone centrale (40%) : Si tu es disponible → carte minimaliste avec points lumineux qui pulsent = personnes disponibles autour de toi. Pas de photos, pas de noms. Juste des pr\xe9sences. "7 personnes disponibles \xe0 2km."
Si tu n'es pas disponible → un seul bouton \xe9norme. Pas "se mettre disponible". Juste : "Je suis l\xe0." Appui long = geste intentionnel = d\xe9clenche la disponibilit\xe9.

Zone basse (20%) : Une seule phrase contextuelle, changeante : "Lucas cherche quelqu'un pour un caf\xe9 \xe0 20 min de toi" ou "3 personnes cherchent quelqu'un pour ce soir."`},{icon:"🎨",title:"Identité visuelle future",color:"#D4A853",body:`Palette propos\xe9e (sortir du bordeaux/blanc actuel) :
• Nuit chaude #0F0C0E — fond principal
• Or Lausanne #D4A853 — couleur signature, lumi\xe8re de ville
• Bordeaux profond #7A1535 — accent, verrou confirm\xe9
• Blanc cass\xe9 #F7F3EF — texte, cartes
• Vert pr\xe9sence #2DBD7E — disponible, confirm\xe9, vivant

Pas de bleu. Pas de violet. Pas de gradients arc-en-ciel.

Typographie : Neue Montreal ou Satoshi — g\xe9om\xe9trique, moderne, europ\xe9en

Ce qui rend Clutch reconnaissable en 2 secondes :
→ L'horloge — l'heure est toujours visible quelque part. C'est l'identit\xe9.
→ Le point qui pulse — indicateur de pr\xe9sence, comme un cœur qui bat.
→ La couleur or — rare dans les apps de rencontre, m\xe9morable.`}],l=[{partie:"Partie 1 — Identité profonde",verdict:"✅ GPT a raison — on adopte",resume:"GPT challenge l'identité même de Clutch : \"ce n'est PAS une app de rencontres, pas un Tinder suisse.\" Les cas d'usage (café, balade, chien, concert, billet en trop, yoga, networking, amitié, rencontre amoureuse) prouvent que le dating n'est qu'un sous-cas. Le cœur = spontanéité + présence + réel + anti-solitude.",reaction:`On adopte int\xe9gralement. Voici tout ce qui a \xe9t\xe9 dit et d\xe9cid\xe9 sur l'identit\xe9 de Clutch — \xe0 ne jamais perdre.

━━ CE QUE CLUTCH N'EST PAS ━━

→ Clutch n'est PAS une app de rencontres. Ce n'est pas un Tinder suisse.
→ Clutch n'est pas un clone de Bumble, Thursday, ou Meetup.
→ Clutch n'est pas "Uber pour les dates" — c'est plus grand que \xe7a.
→ Clutch n'est pas une app d'\xe9v\xe9nements. Pas une app de networking.
→ Clutch n'est pas con\xe7u pour maximiser le temps pass\xe9 sur l'app — c'est l'inverse.

━━ CE QUE CLUTCH EST ━━

→ Clutch est une infrastructure de spontan\xe9it\xe9 urbaine.
→ Clutch est "l'Uber de la pr\xe9sence sociale" — la disponibilit\xe9 humaine \xe0 la demande.
→ Clutch est un r\xe9seau de personnes physiquement disponibles MAINTENANT, dans un rayon donn\xe9, pour partager un moment r\xe9el dans les 18 prochaines heures.
→ Clutch invente une nouvelle cat\xe9gorie : "Presence Network".
→ Comme Uber n'est pas "une voiture" mais "de la mobilit\xe9 \xe0 la demande", Clutch n'est pas "une rencontre" mais du temps humain partag\xe9, imm\xe9diatement disponible.
→ Le cœur de Clutch : spontan\xe9it\xe9 + pr\xe9sence + r\xe9el + anti-solitude.

━━ LES PHRASES D\xc9FINITIVES ━━

→ Pitch principal : "La pr\xe9sence urbaine \xe0 la demande."
→ Phrase d\xe9finitive longue : "Quelqu'un t'attend. Tu ne le savais pas encore."
→ Phrase courte, brutale : "Disponible maintenant. Pour de vrai."
→ Tagline app : "Quelqu'un t'attend. Sois l\xe0."

━━ SLOGANS RETENUS ━━

→ "Quelqu'un t'attend." ← le meilleur — 3 mots, \xe9motion directe, vrai pour tous les cas d'usage
→ "Sois l\xe0."
→ "Disponible. Comme toi."
→ "Lausanne a du monde ce soir."
→ "La pr\xe9sence urbaine \xe0 la demande."
→ "18 heures pour que quelque chose se passe."
→ "Le monde dans les prochaines heures."
→ "Pas un match de plus. Un vrai rendez-vous."

━━ CAS D'USAGE (le dating n'est qu'un parmi d'autres) ━━

→ Un caf\xe9 avec quelqu'un de nouveau
→ Une balade avec un chien
→ Un concert avec un billet en trop
→ Une session yoga, une rando, un atelier
→ Du networking informel
→ De l'amiti\xe9
→ Et oui, aussi : des rencontres amoureuses

━━ VOCABULAIRE PROPRI\xc9TAIRE (d\xe9cid\xe9 le 9 juin 2026) ━━

→ Clutcher = envoyer une proposition de RDV (verbe + nom)
→ Un Clutch = la proposition (lieu + heure + message, expire en 2h)
→ \xcatre clutch\xe9\xb7e = recevoir une proposition
→ Un Verrou = quand les deux ont accept\xe9 → RDV confirm\xe9 (PAS "match")
→ Une Fen\xeatre = le cr\xe9neau horaire disponible (pas "slot")
→ Lancer un Clutch (pas "envoyer")
→ Ouvrir une fen\xeatre (pas "se mettre dispo")
→ Appara\xeetre (pas "se rendre visible")
→ Fermer le Verrou (pas "confirmer le RDV")

━━ MOTS BANNIS ABSOLUMENT ━━

✗ Match \xb7 Swipe \xb7 Like \xb7 Feed \xb7 Story \xb7 Boost \xb7 Super-like
✗ "Application" → dire "Clutch" tout court
✗ "Rencontre" → pr\xe9f\xe9rer "moment", "pr\xe9sence", "retrouvaille"
✗ "Se mettre dispo" → "Ouvrir une fen\xeatre" ou "Appara\xeetre"

━━ POURQUOI C'EST DIFF\xc9RENT ET D\xc9FENDABLE ━━

→ La contrainte 18h est structurelle et d\xe9fendable l\xe9galement — pas juste un choix UX
→ Le score de fiabilit\xe9 est long \xe0 construire = moat r\xe9el
→ La gratuit\xe9 femmes = avantage r\xe9seau + image + bouche-\xe0-oreille
→ Anti-addiction by design = argument fort post-COVID o\xf9 les gens sont fatigu\xe9s des apps addictives
→ Lausanne = terrain test parfait (petite, dense, internationale, \xe9tudiante) avant la Suisse romande`},{partie:"Partie 2 — Design Lab avant le code",verdict:"✅ GPT a raison — stratégie adoptée",resume:"Ne pas modifier l'app directement. Créer d'abord un prototype ultra-réaliste (Figma ou Framer) sans backend, sans Supabase, sans logique métier. Uniquement écrans, animations, transitions, UX. Puis intégrer dans l'app réelle screen par screen.",reaction:`Strat\xe9gie correcte et importante.

→ Notre variante optimale : Mel dessine dans Figma (qu'elle conna\xeet) + cr\xe9e les assets vectoriels dans Illustrator (export SVG) → Claude code dans /proto de l'app existante. R\xe9sultat : testable sur vrai iPhone en 1-2h par \xe9cran, dans le bon framework, sans apprendre Framer.
→ Les 5 \xe9crans \xe0 prototyper en priorit\xe9 : Home (carte de pr\xe9sences), Disponibilit\xe9 ("Je suis l\xe0."), Clutch envoy\xe9 (countdown), Verrou confirm\xe9 (c\xe9l\xe9bration), Proximity Meter.
→ NE PAS tout refaire d'un coup. Screen par screen. Commencer par le wow moment : l'acceptation.`},{partie:"Partie 3 — Architecture UX",verdict:"✅ Alignés",resume:'L\'architecture actuelle (Discover / Événements / Messages / Profil) copie les apps de dating existantes. GPT recommande de la réduire et de repenser "Discover" comme un écran de présences actives, pas de browsing passif.',reaction:`Align\xe9s \xe0 100%.

→ Architecture id\xe9ale : 3 onglets seulement
TAB 1 — MAINTENANT (pas "Discover" — le mot "Discover" = browsing passif = anti-Clutch)
TAB 2 — MES CLUTCHS (Inbox + Sent fusionn\xe9s)
TAB 3 — PROFIL
→ Les \xc9v\xe9nements = cards contextuelles dans MAINTENANT, pas un onglet s\xe9par\xe9
→ Objectif : moins de 3 taps pour \xeatre disponible. Actuellement 5-6 interactions minimum.`},{partie:"Partie 4 — Écran d'ouverture",verdict:"✅ The insight clé",resume:"GPT insiste sur l'urgence temporelle comme ancre identitaire. L'heure en grand = \"c'est maintenant\". Créer immédiatement envie, spontanéité, émotion, confiance — sans surcharger l'écran.",reaction:`L'heure est THE signature visuelle de Clutch.

→ Fond : nuit urbaine, bleu-gris chaud, lumi\xe8res dor\xe9es — la couleur de Lausanne \xe0 20h
→ Zone haute 40% : Logo CLUTCH align\xe9 gauche. L'HEURE en temps r\xe9el, grande. "20h14." — pas d'explication.
→ Zone centrale 40% : Si dispo → carte avec points qui pulsent = pr\xe9sences r\xe9elles. "7 personnes disponibles \xe0 2km." Pas de photos, pas de noms. Juste des pr\xe9sences.
Si pas dispo → un seul bouton \xe9norme : "Je suis l\xe0." Appui long = geste intentionnel.
→ Zone basse 20% : Une phrase contextuelle. "Lucas cherche quelqu'un pour un caf\xe9 \xe0 20 min de toi."`},{partie:"Partie 5 — Identité visuelle",verdict:"⚠️ Direction adoptée, détails ajustés",resume:'GPT recommande de sortir du rose/bordeaux actuel pour quelque chose de plus premium, mémorable, reconnaissable en 2 secondes. Palette "nuit chaude" + couleur signature forte.',reaction:`On suit la direction g\xe9n\xe9rale avec un ajustement :

→ Palette retenue :
• Nuit chaude #0F0C0E — fond principal
• Or Lausanne #D4A853 — couleur signature (rare dans les apps de rencontre)
• Bordeaux profond #7A1535 — accent, verrou confirm\xe9 (on le garde)
• Blanc cass\xe9 #F7F3EF — texte, cartes
• Vert pr\xe9sence #2DBD7E — disponible, confirm\xe9
→ Logo direction retenue : Option 02 "Bleu Nuit et Melon" (#132B45 + #E9B07F) — symbole sablier/nœud/instantan\xe9it\xe9 cr\xe9\xe9 par Mel
→ Ce qui rend Clutch reconnaissable en 2s : l'horloge toujours visible + le point qui pulse + la couleur or
→ Typo : Neue Montreal ou Satoshi — g\xe9om\xe9trique, europ\xe9en, moderne`},{partie:"Partie 6 — Expérience femme",verdict:"🔴 Points critiques non résolus",resume:"GPT demande une analyse complète avant/pendant/après le RDV. Tous les scénarios, tous les risques, tous les signaux de confiance visibles et invisibles.",reaction:`Analyse compl\xe8te :

AVANT LE RDV :
→ ✅ Badge de s\xe9curit\xe9 lieux (🛡 lieu public, 👁 tr\xe8s fr\xe9quent\xe9) — en place mais peu visible
→ ✅ Score de fiabilit\xe9 affich\xe9 sur le profil avant d'envoyer un clutch
→ ❌ Partage automatique avec contact de confiance — pas encore. "J'ai un Clutch au Caf\xe9 Gr\xfctli \xe0 20h30 avec [Pr\xe9nom]" → SMS automatique opt-in \xe0 impl\xe9menter
→ ❌ Avis de s\xe9curit\xe9 d'autres femmes sur le lieu — feature manquante \xe0 fort impact

PENDANT LE RDV :
→ ✅ Proximity Meter en place (30 min avant)
→ ❌ Check-in automatique silencieux : si les deux GPS convergent → notification discr\xe8te au contact de confiance "Elle est arriv\xe9e"
→ ❌ Si elle ne bouge plus 30 min apr\xe8s l'heure → ping discret au contact de confiance

APR\xc8S LE RDV :
→ ✅ Feedback anonyme (ghost/lapin/ok/super)
→ ❌ Feedback f\xe9minin sp\xe9cifique sur comportement (pas le lieu, la personne) — agr\xe9g\xe9 en interne, jamais public
→ ❌ Si plusieurs femmes reportent le m\xeame profil → suspension imm\xe9diate sans validation manuelle

SIGNAUX INVISIBLES qui rassurent (que les femmes ressentent sans le voir) :
→ Photos v\xe9rifi\xe9es = badge tr\xe8s discret
→ Temps de r\xe9ponse moyen affich\xe9 sur le profil
→ Nombre de RDVs honor\xe9s / total visible`},{partie:"Partie 7 — Créateurs d'événements",verdict:"🟡 Modèle défini, à implémenter",resume:"GPT demande l'analyse du modèle futur avec créateurs certifiés (yoga, running, photographie, networking, ateliers). Modèle économique, certification, risques juridiques et sécurité, UX.",reaction:`Mod\xe8le en 3 niveaux d\xe9fini :

NIVEAU 1 — User certifi\xe9 (selfie + num\xe9ro)
→ Peut cr\xe9er des \xe9v\xe9nements jusqu'\xe0 10 personnes
→ Soumis mod\xe9ration 24h
→ Gratuit

NIVEAU 2 — Cr\xe9ateur d'activit\xe9 (dossier + validation Clutch)
→ \xc9v\xe9nements r\xe9currents, badge visible
→ Push notif aux followers de sa cat\xe9gorie
→ Exempt de mod\xe9ration apr\xe8s 3 \xe9v\xe9nements sans incident
→ Gratuit — Clutch prend la visibilit\xe9

NIVEAU 3 — Partenaire (contrat B2B)
→ \xc9v\xe9nements illimit\xe9s, mise en avant, dashboard analytics
→ CHF 49-99/mois ou commission si \xe9v\xe9nement payant

RISQUES JURIDIQUES CH :
→ \xc9v\xe9nement avec alcool + mineurs → responsabilit\xe9 de l'organisateur (CGU \xe0 pr\xe9ciser)
→ RSVP = contrat → si annulation, remboursement obligatoire si payant
→ RC obligatoire pour cr\xe9ateurs Niveau 3

RISQUE PRODUIT PRINCIPAL : un cr\xe9ateur avec 200 followers dans l'app peut partir sur WhatsApp. Fid\xe9lisation = features exclusives Clutch (analytics, boost, badge) valant plus que WhatsApp.`},{partie:"Partie 8 — Roadmap si CEO",verdict:"✅ Ordre adopté",resume:"GPT demande la roadmap optimale dans l'ordre exact : Architecture UX → Design System → Prototype → Tests utilisateurs → Intégration. Ou autre ?",reaction:`Ordre retenu (l\xe9g\xe8rement ajust\xe9) :

SEM 1-2 : D\xe9cisions fondatrices sur papier — slogan final, palette, architecture 3 onglets, logo direction. Avant tout pixel.
SEM 3-4 : Mel dessine dans Figma + Illustrator → les 5 \xe9crans critiques
SEM 5-6 : Claude code /proto dans l'app — testable iPhone en 1-2h par \xe9cran
SEM 7 : Test sur 5 femmes 20-30 ans \xe0 Lausanne — observation silencieuse, pas de questionnaire
SEM 8-10 : Int\xe9gration progressive dans l'app r\xe9elle, screen par screen

COMMENCER PAR : la c\xe9l\xe9bration de l'acceptation d'un Clutch — le wow moment le plus impactant, actuellement inexploit\xe9.

NE PAS FAIRE : grande refonte d'un coup (\xe7a ne sort jamais). Se lancer App Store avant un design m\xe9morable. Ouvrir \xe0 d'autres villes avant de dominer Lausanne.`},{partie:"Partie 9 — Auto-destruction",verdict:"🔴 Exercice de lucidité obligatoire",resume:"GPT demande à oublier qu'on aime l'idée, devenir un investisseur hostile. Lister les 20 plus gros risques, les 10 raisons d'échouer, les 10 raisons de réussir, les fonctionnalités inutiles, les manquantes, les erreurs stratégiques.",reaction:`Les 10 raisons d'\xe9chouer (honn\xeates) :
1. Masse critique — sans users, l'app est une ville fant\xf4me. Les 100 premiers ne voient personne → partent → app morte.
2. "Se d\xe9clarer disponible" = admettre qu'on est seul. Friction psychologique r\xe9elle et sous-estim\xe9e.
3. Thursday (Londres) = m\xeame concept, d\xe9j\xe0 1M+ users, ressources importantes. On n'est pas seuls.
4. Tinder pourrait copier en 3 mois avec leur base de 75M utilisateurs. "Tinder Now" existe d\xe9j\xe0.
5. \xc9quilibre hommes/femmes structurellement fragile — si les femmes partent, les hommes partent. Si les hommes paient, les femmes restent mais s'ennuient.
6. Saisonnalit\xe9 : -5\xb0 \xe0 Lausanne en hiver = personne ne veut sortir spontan\xe9ment. Effondrement 4 mois/an.
7. CHF 19.90/mois sans avoir prouv\xe9 la valeur d'abord = barri\xe8re \xe9norme au paywall.
8. V\xe9rification identit\xe9 : sans elle → probl\xe8mes s\xe9curit\xe9. Avec elle → perte 40% inscriptions.
9. Les cr\xe9ateurs d'\xe9v\xe9nements peuvent partir sur WhatsApp avec leurs followers.
10. Z\xe9ro analytics = pilotage aveugle complet.

Les 10 raisons de r\xe9ussir :
1. Concept genuinement nouveau — pas un clone, une vraie cat\xe9gorie invent\xe9e
2. Timing post-COVID : les gens veulent du r\xe9el, pas du virtuel
3. Lausanne = ville test id\xe9ale (petite, dense, internationale, \xe9tudiante)
4. Contrainte 18h = diff\xe9rentiateur d\xe9fendable l\xe9galement et strat\xe9giquement
5. Gratuit\xe9 femmes = r\xe9tention + image + bouche-\xe0-oreille
6. Score de fiabilit\xe9 = m\xe9canisme de confiance unique, long \xe0 copier
7. Cr\xe9ateurs d'\xe9v\xe9nements = acquisition B2B2C naturelle
8. Pas de scroll infini = attrait g\xe9n\xe9ration fatigu\xe9e des apps addictives
9. Suisse romande = march\xe9 premium, pouvoir d'achat \xe9lev\xe9
10. \xc9quipe petite, peut pivoter rapidement

Fonctionnalit\xe9s inutiles pour la beta : certification selfie (trop t\xf4t), 36 cr\xe9neaux (personne ne scrolle jusqu'au 30), badges avanc\xe9s.
Fonctionnalit\xe9s manquantes critiques : suppression de compte \xb7 carte des pr\xe9sences \xb7 geste signature \xb7 c\xe9l\xe9bration acceptation \xb7 push de r\xe9tention 18h.`}],u=[{name:"Figma",icon:"🖼️",résumé:"L'outil de design d'interface le plus utilisé au monde. Gratuit pour débuter.",pourquoi:"C'est là que tu dessines les écrans — ce que les gens verront. Comme Photoshop mais fait exprès pour les apps. Mel peut apprendre les bases en 2h avec les tutoriels sur figma.com.",parfaitPour:"Dessiner les écrans, créer les composants (boutons, cartes, onglets), partager les maquettes avec l'équipe.",limitations:"Les animations sont basiques. On ne ressent pas vraiment comment l'app va se comporter.",recommandé:!0},{name:"Framer",icon:"⚡",résumé:"Comme Figma mais avec de vraies animations et du vrai code React exportable.",pourquoi:"Framer génère du code React réutilisable. Les animations sont vraies — pas des simulations. Mais l'outil demande un apprentissage réel et est payant.",parfaitPour:"Prototypes ultra-réalistes avec vraies animations et micro-interactions.",limitations:"Courbe d'apprentissage de 1-2 semaines. Payant (~20$/mois). Si Mel ne le connaît pas déjà, c'est du temps perdu.",recommandé:!1},{name:"Notre approche (recommandée)",icon:"✦",résumé:"Mel dessine dans Figma. Claude code directement dans /proto de l'app.",pourquoi:"C'est la méthode la plus rapide pour notre équipe. Mel crée les maquettes dans ce qu'elle connaît. Claude les code en 1-2h dans une route /proto — hardcodé, sans base de données, avec les vraies animations iOS. On teste sur le vrai téléphone immédiatement, dans le bon framework.",parfaitPour:"Notre équipe exactement — une designeuse, un dev IA, pas besoin d'apprendre de nouvel outil.",limitations:"Requiert que Mel livre des maquettes claires (pas juste une idée en tête).",recommandé:!0}],d=[{n:"1",who:"Mel",label:"Définir les 5 écrans à créer",detail:"Avant de dessiner quoi que ce soit, décider ensemble quels sont les 5 écrans les plus importants à prototyper. Suggestion : Home (carte de présences), Disponibilité, Clutch envoyé, Verrou confirmé, Proximity Meter.",tools:"Papier, discussion"},{n:"2",who:"Mel",label:"Créer un compte Figma (gratuit)",detail:'Aller sur figma.com → créer un compte gratuit → cliquer "New Design File". Choisir un frame "iPhone 14" (390×844px) dans la liste de droite. C\'est l\'espace de travail de base.',tools:"Figma (figma.com) — gratuit"},{n:"3",who:"Mel",label:"Dessiner les écrans dans Figma",detail:`Pour chaque \xe9cran : utiliser les formes de base (rectangles, textes, cercles). Pas besoin d'\xeatre parfait — l'important c'est la structure. O\xf9 est le titre ? O\xf9 est le bouton principal ? Quelle couleur de fond ? Les photos = des rectangles gris avec une croix, pas besoin des vraies images.

Ressource utile : chercher "Figma iOS UI Kit" sur Google pour des composants iPhone pr\xeats \xe0 l'emploi.`,tools:"Figma"},{n:"4",who:"Mel",label:"Créer les assets graphiques dans Illustrator",detail:`Mel conna\xeet Illustrator — c'est parfait pour les \xe9l\xe9ments vectoriels : le logo CLUTCH, les ic\xf4nes custom (le point qui pulse, le verrou, les \xe9toiles fiabilit\xe9), les illustrations. Exporter en SVG depuis Illustrator → importer dans Figma comme composants r\xe9utilisables.

Format d'export : SVG pour les ic\xf4nes/logos (vectoriel, l\xe9ger), PNG 2x pour les illustrations.`,tools:"Illustrator → export SVG → import Figma"},{n:"5",who:"Mel + David",label:"Valider les maquettes ensemble",detail:'Partager le lien Figma avec David (bouton "Share" en haut à droite → "Anyone with link can view"). Passer en revue chaque écran. Annoter les changements directement dans Figma (mode Commentaire). Valider avant de passer au code.',tools:"Figma (partage de lien)"},{n:"6",who:"Claude",label:"Coder le prototype dans /proto",detail:"Claude code exactement ce que Mel a dessiné dans une route /proto de l'app. Hardcodé (pas de vraie base de données), avec les vraies animations CSS/React, les vraies transitions. Résultat : une page testable sur le vrai iPhone de Mel en 1-2h.",tools:"Next.js / React — app existante"},{n:"7",who:"Mel",label:"Tester sur iPhone réel",detail:"Ouvrir pz7cgj4kfv-tech.github.io/proto sur Safari iPhone. Passer l'écran à 5 femmes de l'entourage si possible. Observer sans expliquer — juste regarder où elles cliquent, où elles hésitent, ce qui les fait sourire ou froncer les sourcils.",tools:"Safari iPhone"},{n:"8",who:"Mel + Claude",label:"Itérer et intégrer dans l'app réelle",detail:"Ce qui marche dans /proto → Claude l'intègre dans l'app réelle, screen par screen. Jamais tout d'un coup. Commencer par le moment le plus impactant : la célébration de l'acceptation d'un Clutch.",tools:"App existante"}],c=["Score de fiabilité : système de suspension escalatoire en place — <60: pause 3j, <40: 14j, <20: 60j, 0: ban permanent (v08.06-I)","Invisible dans Discover pendant RDV actif (±90 min autour du proposed_time) — v08.06-G","Toast swipe-up pour fermer — v08.06-I","Badge version + timestamp build auto (NEXT_PUBLIC_BUILD_TIME) — v08.06-H","Comptes test Mel (mel@clutch.app/Mel2026!) et Ami (ami@clutch.app/Ami2026!) créés","Lien guide test Mel : /mel","OneSignal Web Push fonctionnel — notifs sur tous les events du cycle de vie d'un Clutch","Realtime messages via REPLICA IDENTITY FULL (ALTER TABLE messages REPLICA IDENTITY FULL)","Stripe CHF 19.90/mois intégré — gate premium clutches + favoris","Proximity Meter actif 30 min avant le RDV","Poll backup clutches toutes les 8s (à passer à 20s une fois realtime stable)","PATCH 400 sur profiles (checkExpiry / available_from:null) — bug non résolu","Plausible Analytics : pas encore installé — priorité absolue","Suppression de compte : non implémentée — légal + App Store bloquant","Architecture UX actuelle (4 onglets) = sous-optimale selon audit — 3 onglets recommandés pour V2"];e.s(["default",0,function(){let[e,p]=(0,i.useState)("audit");return(0,t.jsxs)("html",{lang:"fr",children:[(0,t.jsxs)("head",{children:[(0,t.jsx)("meta",{charSet:"utf-8"}),(0,t.jsx)("meta",{name:"viewport",content:"width=device-width, initial-scale=1"}),(0,t.jsxs)("title",{children:["Clutch · Audit & Vision — ",s]}),(0,t.jsx)("style",{dangerouslySetInnerHTML:{__html:`
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
        `}})]}),(0,t.jsx)("body",{children:(0,t.jsxs)("div",{className:"wrap",children:[(0,t.jsxs)("div",{style:{background:"#0d0d0d",borderRadius:20,padding:"36px 40px",marginBottom:24,color:"white"},children:[(0,t.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:14,marginBottom:16},children:[(0,t.jsx)("div",{style:{width:50,height:50,background:"#8B1A4A",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:900,flexShrink:0},children:"✦"}),(0,t.jsxs)("div",{children:[(0,t.jsxs)("div",{style:{fontSize:32,fontWeight:900,letterSpacing:"-0.04em"},children:["CLU",(0,t.jsx)("span",{style:{color:"#8B1A4A"},children:"TCH"})]}),(0,t.jsx)("div",{style:{fontSize:12,color:"#555",marginTop:1},children:"Présence urbaine à la demande · Lausanne"})]})]}),(0,t.jsxs)("div",{style:{fontSize:13,color:"#555",lineHeight:1.8,borderTop:"1px solid #1a1a1a",paddingTop:16},children:[(0,t.jsx)("strong",{style:{color:"#888"},children:"Audit & Vision — Document central équipe"})," · ",s," · ",n,(0,t.jsx)("br",{}),"David · Mélanie · Claude · Confidentiel"]}),(0,t.jsx)("p",{style:{fontSize:14,color:"#aaa",marginTop:12,lineHeight:1.65},children:"Ce document réunit tout : l'audit technique de l'app, la vision produit, les réponses à l'audit GPT, le workflow de design pour Mel, et les points à ne pas perdre. Une seule page, tout dedans."}),(0,t.jsxs)("div",{style:{display:"flex",gap:8,marginTop:16,flexWrap:"wrap"},children:[(0,t.jsx)("button",{className:"no-print",onClick:()=>window.print(),style:{background:"white",color:"#111",border:"none",borderRadius:8,padding:"7px 16px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"},children:"⬇ PDF"}),(0,t.jsx)("a",{href:"/hq",style:{background:"transparent",color:"#666",border:"1px solid #333",borderRadius:8,padding:"7px 16px",fontSize:12,fontWeight:600,textDecoration:"none"},children:"← QG"}),(0,t.jsx)("a",{href:"/mel",style:{background:"transparent",color:"#2DBD7E",border:"1px solid #2DBD7E",borderRadius:8,padding:"7px 16px",fontSize:12,fontWeight:600,textDecoration:"none"},children:"Guide Mel →"})]})]}),(0,t.jsx)("div",{style:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:24},className:"no-print",children:[{n:"8",l:"Critiques",c:"#C0392B"},{n:"14",l:"Gaps",c:"#c0612b"},{n:"7",l:"Forces",c:"#2E9E6B"},{n:"5",l:"Écrans à créer",c:"#D4A853"}].map(e=>(0,t.jsxs)("div",{style:{background:"white",borderRadius:14,padding:"16px",textAlign:"center"},children:[(0,t.jsx)("div",{style:{fontSize:30,fontWeight:900,color:e.c,letterSpacing:"-0.04em"},children:e.n}),(0,t.jsx)("div",{style:{fontSize:11,color:"#888",marginTop:3,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:600},children:e.l})]},e.l))}),(0,t.jsx)("div",{className:"no-print",style:{background:"#e8e8e8",borderRadius:12,padding:4,display:"flex",gap:2,marginBottom:24,flexWrap:"wrap"},children:[["audit","🔍 Audit technique"],["vision","✦ Vision produit"],["gpt","🤖 Audit GPT"],["workflow","🎨 Workflow design"],["saved","📦 Archive"]].map(([i,n])=>(0,t.jsx)("button",{onClick:()=>p(i),style:{padding:"9px 18px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,background:e===i?"#111":"transparent",color:e===i?"#fff":"#999",transition:"all 0.15s"},children:n},i))}),"audit"===e&&(0,t.jsxs)("div",{children:[(0,t.jsx)("div",{style:{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"#999",marginBottom:16},children:"7 panels d'expertise — Analyse critique de l'app actuelle"}),r.map(e=>(0,t.jsxs)("div",{style:{background:"white",borderRadius:16,padding:"24px 28px",marginBottom:12,borderLeft:`4px solid ${e.color}`},children:[(0,t.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16},children:[(0,t.jsxs)("div",{children:[(0,t.jsxs)("div",{style:{fontSize:11,color:"#bbb",fontWeight:700,letterSpacing:"0.08em",marginBottom:4},children:["PANEL ",e.id]}),(0,t.jsx)("div",{style:{fontSize:17,fontWeight:800,letterSpacing:"-0.02em"},children:e.expert}),(0,t.jsx)("div",{style:{fontSize:12,color:"#888",marginTop:2},children:e.angle})]}),(0,t.jsx)("span",{style:{fontSize:28},children:e.emoji})]}),e.findings.map((e,i)=>(0,t.jsxs)("div",{style:{display:"flex",gap:10,marginBottom:10,alignItems:"flex-start"},children:[(0,t.jsx)("div",{style:{width:8,height:8,borderRadius:"50%",flexShrink:0,marginTop:5,background:"crit"===e.s?"#C0392B":"gap"===e.s?"#e07b39":"#2E9E6B"}}),(0,t.jsxs)("div",{children:[(0,t.jsx)("div",{style:{fontSize:13,fontWeight:700,marginBottom:2},children:e.l}),(0,t.jsx)("div",{style:{fontSize:12,color:"#666",lineHeight:1.55},children:e.d})]})]},i)),(0,t.jsx)("div",{style:{marginTop:14,paddingTop:12,borderTop:"1px solid #f0f0f0",fontSize:12,color:"#555",fontStyle:"italic"},children:e.action})]},e.id)),(0,t.jsx)("div",{style:{marginTop:32,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"#999",marginBottom:16},children:"Priorités d'action consolidées"}),a.map(e=>(0,t.jsxs)("div",{style:{background:e.bg,borderRadius:14,padding:"20px 24px",marginBottom:10},children:[(0,t.jsxs)("div",{style:{fontSize:11,fontWeight:800,letterSpacing:"0.1em",color:e.color,marginBottom:10},children:["● ",e.level]}),e.items.map((i,n)=>(0,t.jsxs)("div",{style:{display:"flex",gap:8,marginBottom:7,fontSize:13,color:"#333",lineHeight:1.5},children:[(0,t.jsx)("span",{style:{color:e.color,fontWeight:700,flexShrink:0},children:"→"}),(0,t.jsx)("span",{children:i})]},n))]},e.level))]}),"vision"===e&&(0,t.jsxs)("div",{children:[(0,t.jsxs)("div",{style:{background:"linear-gradient(135deg,#fffbf0,#fff5e0)",border:"1px solid #f0d88a",borderRadius:16,padding:"18px 22px",marginBottom:24},children:[(0,t.jsx)("div",{style:{fontSize:13,fontWeight:800,color:"#b07d00",marginBottom:6},children:"✦ Redéfinition stratégique — 9 juin 2026"}),(0,t.jsx)("p",{style:{fontSize:13,color:"#856000",lineHeight:1.7},children:"Clutch n'est plus une app de rencontres. C'est une infrastructure de spontanéité urbaine. Cette section définit ce que Clutch doit devenir — identité, vocabulaire, architecture, design."})]}),o.map((e,i)=>(0,t.jsxs)("details",{style:{background:"white",borderRadius:14,marginBottom:8,overflow:"hidden",borderLeft:`3px solid ${e.color}`},children:[(0,t.jsxs)("summary",{style:{padding:"16px 20px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",userSelect:"none"},children:[(0,t.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:10},children:[(0,t.jsx)("span",{style:{fontSize:20},children:e.icon}),(0,t.jsx)("span",{style:{fontSize:14,fontWeight:700,color:"#111"},children:e.title})]}),(0,t.jsx)("span",{className:"chevron",style:{color:"#bbb",fontSize:12},children:"▼"})]}),(0,t.jsx)("div",{style:{padding:"0 20px 18px",borderTop:"1px solid #f5f5f5"},children:e.body.split("\n").map((e,i)=>(0,t.jsx)("p",{style:{fontSize:13,color:e.startsWith("→")||e.startsWith("•")||e.startsWith("✗")?"#444":"#666",lineHeight:1.7,marginTop:0===i?12:3,fontWeight:e.startsWith("→")||e.startsWith("✗")?600:400},children:e||" "},i))})]},i))]}),"gpt"===e&&(0,t.jsxs)("div",{children:[(0,t.jsxs)("div",{style:{background:"#f0f4ff",border:"1px solid #c8d8ff",borderRadius:16,padding:"18px 22px",marginBottom:24},children:[(0,t.jsx)("div",{style:{fontSize:13,fontWeight:800,color:"#3455cc",marginBottom:6},children:"🤖 Audit GPT-4 — 9 juin 2026"}),(0,t.jsx)("p",{style:{fontSize:13,color:"#445",lineHeight:1.7},children:"GPT-4 a réalisé un audit fondateur en 9 parties, challengeant l'identité même de Clutch. Ci-dessous : résumé de chaque partie + réaction de Claude (où on est d'accord, où on diverge, ce qu'on adopte)."})]}),l.map((e,i)=>(0,t.jsxs)("div",{style:{background:"white",borderRadius:14,padding:"20px 24px",marginBottom:10},children:[(0,t.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12,flexWrap:"wrap",gap:8},children:[(0,t.jsx)("div",{style:{fontSize:14,fontWeight:800,color:"#111"},children:e.partie}),(0,t.jsx)("span",{style:{fontSize:12,fontWeight:700,padding:"3px 10px",borderRadius:20,background:e.verdict.startsWith("✅")?"#D4F0E4":e.verdict.startsWith("⚠️")?"#FDF0E6":"#fadadf",color:e.verdict.startsWith("✅")?"#1a6b45":e.verdict.startsWith("⚠️")?"#b05a00":"#C0392B"},children:e.verdict})]}),(0,t.jsxs)("div",{style:{fontSize:12,color:"#666",lineHeight:1.65,marginBottom:12,background:"#f9f9f9",borderRadius:8,padding:"10px 14px"},children:[(0,t.jsx)("strong",{style:{color:"#888",fontSize:11,textTransform:"uppercase",letterSpacing:"0.06em"},children:"GPT dit : "}),e.resume]}),e.reaction.split("\n").map((e,i)=>(0,t.jsx)("p",{style:{fontSize:13,color:"#333",lineHeight:1.7,marginTop:4*(0!==i),fontWeight:e.startsWith("→")?600:400},children:e},i))]},i))]}),"workflow"===e&&(0,t.jsxs)("div",{children:[(0,t.jsxs)("div",{style:{background:"linear-gradient(135deg,#f5eeff,#ede6ff)",border:"1px solid #d0beff",borderRadius:16,padding:"18px 22px",marginBottom:24},children:[(0,t.jsx)("div",{style:{fontSize:13,fontWeight:800,color:"#6633cc",marginBottom:6},children:"🎨 Comment construire les nouveaux écrans — expliqué simplement"}),(0,t.jsx)("p",{style:{fontSize:13,color:"#553388",lineHeight:1.7},children:"Cette section explique les outils, qui fait quoi, dans quel ordre, et comment tester sur le vrai téléphone. Pas de jargon. Si tu connais Illustrator, tu peux démarrer demain."})]}),(0,t.jsx)("div",{style:{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"#999",marginBottom:14},children:"Les 3 options — laquelle choisir ?"}),(0,t.jsx)("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:28},children:u.map(e=>(0,t.jsxs)("div",{style:{background:"white",borderRadius:14,padding:"18px 20px",border:e.recommandé?"2px solid #2DBD7E":"1px solid #eee",position:"relative"},children:[e.recommandé&&"Notre approche (recommandée)"===e.name&&(0,t.jsx)("div",{style:{position:"absolute",top:-10,left:16,background:"#2DBD7E",color:"white",fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:10,letterSpacing:"0.06em"},children:"✓ NOTRE CHOIX"}),(0,t.jsx)("div",{style:{fontSize:22,marginBottom:8},children:e.icon}),(0,t.jsx)("div",{style:{fontSize:14,fontWeight:800,marginBottom:6},children:e.name}),(0,t.jsx)("div",{style:{fontSize:12,color:"#555",lineHeight:1.6,marginBottom:10},children:e.résumé}),(0,t.jsxs)("div",{style:{fontSize:11,color:"#888",lineHeight:1.6},children:[(0,t.jsx)("strong",{style:{color:"#555"},children:"Parfait pour : "}),e.parfaitPour]}),(0,t.jsxs)("div",{style:{fontSize:11,color:"#aaa",lineHeight:1.6,marginTop:6},children:[(0,t.jsx)("strong",{style:{color:"#888"},children:"Limite : "}),e.limitations]})]},e.name))}),(0,t.jsxs)("div",{style:{background:"#fff8f0",border:"1px solid #ffd0a0",borderRadius:14,padding:"18px 22px",marginBottom:24},children:[(0,t.jsx)("div",{style:{fontSize:13,fontWeight:800,color:"#b05a00",marginBottom:8},children:"🖊️ Mel maîtrise Illustrator — comment l'utiliser"}),(0,t.jsxs)("p",{style:{fontSize:13,color:"#664400",lineHeight:1.7},children:[(0,t.jsx)("strong",{children:"Bonne nouvelle :"})," Illustrator est parfait pour créer les assets graphiques — le logo CLUTCH vectoriel, les icônes custom (le point qui pulse, le verrou, les étoiles), les illustrations. C'est exactement là-dedans que ça doit être fait.",(0,t.jsx)("br",{}),(0,t.jsx)("br",{}),(0,t.jsx)("strong",{children:"Workflow Illustrator → Figma :"}),(0,t.jsx)("br",{}),"Créer l'icône ou le logo dans Illustrator → Fichier → Exporter → Exporter en tant que → choisir SVG → importer dans Figma (glisser-déposer). Le SVG reste vectoriel, zoomable à l'infini, utilisable sur toutes tailles d'écran et comme favicon."]})]}),(0,t.jsx)("div",{style:{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"#999",marginBottom:14},children:"Procédure pas à pas — de zéro à l'iPhone"}),d.map((e,i)=>(0,t.jsxs)("div",{style:{background:"white",borderRadius:14,padding:"18px 22px",marginBottom:8,display:"flex",gap:16,alignItems:"flex-start"},children:[(0,t.jsx)("div",{style:{width:32,height:32,borderRadius:"50%",background:"Mel"===e.who?"#8B1A4A":"Claude"===e.who?"#2E9E6B":"#D4A853",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,flexShrink:0},children:e.n}),(0,t.jsxs)("div",{style:{flex:1},children:[(0,t.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:6},children:[(0,t.jsx)("span",{style:{fontSize:14,fontWeight:700},children:e.label}),(0,t.jsx)("span",{style:{fontSize:11,padding:"2px 8px",borderRadius:10,fontWeight:700,background:"Mel"===e.who?"#F5E0EA":"Claude"===e.who?"#D4F0E4":"#FDF5E6",color:"Mel"===e.who?"#8B1A4A":"Claude"===e.who?"#1a6b45":"#b07d00"},children:e.who})]}),e.detail.split("\n").map((e,i)=>(0,t.jsx)("p",{style:{fontSize:13,color:"#555",lineHeight:1.65,marginTop:6*(0!==i)},children:e},i)),(0,t.jsxs)("div",{style:{marginTop:10,fontSize:11,color:"#aaa",fontWeight:600},children:["🛠 ",e.tools]})]})]},i)),(0,t.jsxs)("div",{style:{background:"#0d0d0d",borderRadius:16,padding:"22px 26px",marginTop:24,color:"white"},children:[(0,t.jsx)("div",{style:{fontSize:13,fontWeight:800,color:"#D4A853",marginBottom:16},children:"🚀 Ordre recommandé (semaine par semaine)"}),[{w:"Sem 1-2",t:"Décisions fondatrices",d:"Slogan, palette, architecture 3 onglets — sur papier. Avant tout pixel."},{w:"Sem 3-4",t:"Figma + Illustrator",d:"Mel dessine les 5 écrans critiques. Claude exporte les assets SVG si besoin."},{w:"Sem 5-6",t:"Prototype /proto",d:"Claude code les écrans dans l'app. Résultat : testable sur iPhone en 1-2h par écran."},{w:"Sem 7",t:"Test utilisateurs",d:"5 femmes 20-30 ans à Lausanne. Observation silencieuse, pas de questionnaire."},{w:"Sem 8-10",t:"Intégration progressive",d:"Screen par screen dans l'app réelle. Commencer par la célébration de l'acceptation."}].map((e,i)=>(0,t.jsxs)("div",{style:{display:"flex",gap:16,alignItems:"flex-start",padding:"10px 0",borderBottom:i<4?"1px solid #1a1a1a":"none"},children:[(0,t.jsx)("div",{style:{fontSize:11,fontWeight:700,color:"#D4A853",minWidth:60,flexShrink:0},children:e.w}),(0,t.jsxs)("div",{children:[(0,t.jsx)("div",{style:{fontSize:13,fontWeight:700,color:"white",marginBottom:3},children:e.t}),(0,t.jsx)("div",{style:{fontSize:12,color:"#666"},children:e.d})]})]},i))]})]}),"saved"===e&&(0,t.jsxs)("div",{children:[(0,t.jsxs)("div",{style:{background:"#f5f5f5",border:"1px solid #ddd",borderRadius:16,padding:"18px 22px",marginBottom:24},children:[(0,t.jsx)("div",{style:{fontSize:13,fontWeight:800,color:"#555",marginBottom:6},children:"📦 Points sauvegardés — à ne pas perdre"}),(0,t.jsx)("p",{style:{fontSize:13,color:"#777",lineHeight:1.7},children:"Tout ce qui est en place, les bugs connus, les décisions prises, les choses à ne pas oublier. Ce n'est pas un todo, c'est une mémoire."})]}),(0,t.jsx)("div",{style:{background:"white",borderRadius:14,overflow:"hidden"},children:c.map((e,i)=>(0,t.jsxs)("div",{style:{padding:"13px 18px",borderBottom:i<c.length-1?"1px solid #f0f0f0":"none",display:"flex",gap:10,alignItems:"flex-start"},children:[(0,t.jsx)("span",{style:{color:"#bbb",fontSize:13,flexShrink:0,marginTop:1},children:"·"}),(0,t.jsx)("span",{style:{fontSize:13,color:"#444",lineHeight:1.6},children:e})]},i))})]}),(0,t.jsxs)("div",{style:{marginTop:48,paddingTop:24,borderTop:"1px solid #e0e0e0",display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:12},children:[(0,t.jsxs)("div",{children:[(0,t.jsxs)("p",{style:{fontSize:11,color:"#bbb",lineHeight:1.8},children:[(0,t.jsx)("strong",{children:"Clutch"})," — La présence urbaine à la demande · Lausanne, Suisse"]}),(0,t.jsxs)("p",{style:{fontSize:11,color:"#bbb",lineHeight:1.8},children:["David Saugy · Mélanie · Claude · ",s," · ",n]})]}),(0,t.jsx)("button",{className:"no-print",onClick:()=>window.print(),style:{background:"#0d0d0d",color:"white",border:"none",borderRadius:10,padding:"10px 22px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"},children:"⬇ Enregistrer PDF"})]})]})})]})}])}]);