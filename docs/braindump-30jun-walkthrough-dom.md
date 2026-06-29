# 🧠 Walkthrough David 30.06 (19h) — capture complète + vision simulateur

> Brain-dump dicté par David en ouvrant l'app build 220 (pas encore mise à jour → certains fixes sont déjà
> dans le 221/222 mais non testés). RIEN n'est jeté. Pour la session de demain avec **Dom** (moteur causalité).
> Statuts : ✅ fait · 🔧 à faire · ❓ décision produit · 🧩 Dom (moteur/logique).

---

## 0. État des fixes déjà poussés (build 221/222, pas encore testés par David)
- ✅ **Départ par défaut +1h** (plus +5 min) — un user non-dispo atterrit direct sur `flow='carte'`, l'effet +1h ne tournait jamais. Init `useState` à +1h/+2h.
- ✅ **Friction curseur asymétrique** (v1) — résistance vers la droite, libre vers la gauche. ⚠️ David affine : « 1→5 km doit être FLUIDE, la résistance APRÈS, et là ça marche par à-coups, pas fluide » → 🔧 à re-régler (cf. §2).
- ✅ **Icônes catégories events de Mel** — David : « super, bravo et merci ».
- ✅ **Créneaux 15 min** (variable unique `SLOT_STEP_MIN`, bornage 18h auto) — build 222.

---

## 1. DÉMARRAGE & CARTE
- 🔧 **Écran blanc qui flashe** avant l'animation de splash au lancement → corriger (probable flash avant montage du splash / SW).
- 🔧 **Zoom carte trop serré à l'ouverture.** Doit s'ouvrir **dézoomée à l'échelle d'une petite ville** : voir ~**5 km autour** par défaut (au lieu d'optimiser sur le rayon 1 km → cercle « mangé », pas pratique).
- 🔧 **Zoom auto trop agressif** quand je déplace le pin hors zone → « il zoome comme un taré, je suis perdu ». Calmer / supprimer le re-zoom auto pendant le drag.
- 🔧 **Le pin/centre semble bouger** quand je change le rayon (« ça déplace un peu ma position GPS par rapport au centre »). Bug à vérifier : changer le rayon ne doit JAMAIS déplacer le centre.
- 🔧 **Cercle « zone atteignable »** (le petit cercle pointillé) : à optimiser visuellement, ou le cacher proprement quand on dézoome/rezoome. Pas clair pour l'instant.

### Recherche de lieu (barre du haut)
- 🔧 **Autocomplete** : taper « Sion » doit **proposer au fur et à mesure** (suggestions), pas obliger à appuyer Enter.
- 🔧 **Zoom après recherche trop fort** : il zoome sur le rayon 1 km de Sion. Devrait montrer **au moins ~10 km à la ronde** même si mon rayon fait 1 km.

---

## 2. CURSEUR DE RAYON (friction) — affinage David
- Comportement voulu : **1 km → 5 km = totalement FLUIDE.** La **résistance n'apparaît qu'APRÈS** (zone tendue), et **uniquement vers la DROITE** (agrandir). Vers la **gauche** (restreindre) = toujours **libre**.
- Problème actuel : « ça marche par à-coups, c'est compliqué sur la droite, l'idée est là mais pas fluide, ça rend un truc bizarre ».
- 🔧 Action : revoir l'algo pour **fluidité** (pas de saut/catch-up), seuil de confort = **min(cap, ~5 km absolu)** plutôt que tension r6, résistance **continue** ensuite.
- ❓ Nuance soulevée par David : la résistance dépend de **si le centre du cercle est sur ma position GPS ou pas** (je peux me déplacer). Pour l'instant le pin est au centre → « plus je vais à droite, plus ce sera dur plus tard ». À garder en tête pour la forteresse GPS dynamique (Phase 2).

---

## 3. MESSAGES FORTERESSE — clarté (penser « pour les gens »)
- 🔧 « **Tu t'es éloigné de 69 km de ta zone** » → **pas clair** : « ta zone » = ma position actuelle ? la zone grise ? Reformuler simplement.
- 🔧 « **Garder ou recaler ici** » → « ici » c'est **où** ? Ambigu. Clarifier (montrer/le nommer).
- ✅ À GARDER : l'**alerte** « ce lieu est à 31 km du centre de Léa, mais Léa s'est rendue dispo sur 20 km » quand le lieu RDV sort de la zone du receveur → **très très bien**, on garde.

---

## 4. MODIFIER UN CRÉNEAU (bug confirmé)
- 🔧 Quand je clique **Modifier** un créneau existant, il **ne garde PAS** la position + l'heure d'origine → il remet à ma **position actuelle**. **NON.** Modifier doit **pré-remplir position + heure + rayon d'origine**, puis je modifie si je veux. (Déjà tenté via `editingSlotRef` — à re-vérifier, ça ne tient pas.)

---

## 5. CLUTCHER HORS ZONE — décision produit
- Aujourd'hui : si le lieu RDV proposé sort de la zone du receveur → **alerte** (bien) mais dans certains cas **ça bloque** (« là je ne peux pas »).
- ❓ **Décision David (penche OUI)** : laisser les gens **mettre le lieu qu'ils veulent** avec **juste l'alerte**, **ne pas bloquer** (cohérent avec le gradient « jamais bloquer, prévenir »).
- ❓ **Question ouverte que David me pose** : doit-on pouvoir clutcher **seulement à l'intersection des deux cercles**, ou pas ? → cf. ma reco §10.

---

## 6. MOMENTS DE LA JOURNÉE (boutons intelligents)
- 🔧 À 19h, devrait proposer **ce soir · cette nuit · demain matin** (19h + 18h = 13h le lendemain → « demain matin » DOIT exister). Il en manque.
- 🔧 **Arrondir** « demain matin » jusqu'au **max de la fenêtre 18h**.
- Logique : calculer les dayparts **de maintenant jusqu'à +18h** (à minuit → cette nuit, demain matin, demain aprem, demain soir…). C'est `lib/feasibility.ts → dayParts()` : vérifier qu'il couvre bien tout l'horizon 18h et pas seulement jusqu'à minuit.
- ⚠️ Subtil : « demain matin » peut être hors de la dispo du receveur → c'est ok (moi je suis dispo jusqu'à +18h, lui peut n'être dispo que ce soir). À gérer proprement (mon horizon ≠ son horizon).

---

## 7. POST-RDV — feedback + favoris
- 🔧 À **« Terminer »** un RDV → écran feedback **simple** : **à l'heure / présent / lapin** (le trio déjà prévu) + **une étoile** « garder en favori ? ».
- 🔧 « Contacts » n'existe plus → c'est **Favoris**. Les **Favoris** contiendront : **gens + événements + tout**. Retirer l'ancienne logique « garder le contact ».

---

## 8. ÉVÉNEMENTS — cohérence + génération
- 🔧 Events actuels = **fake/incohérents** (dates passées : « dimanche 5 juillet », « aujourd'hui 20h » faux). À remplacer par un **service qui génère des events crédibles** selon l'heure actuelle + forteresse + filtres.
- ❓ Deux pistes (David ok pour l'une OU l'autre, voire combiner) :
  - **(a) Bots créateurs** : sous chaque bot, bouton « créer un événement » → ouvre la **vraie** page de création → **mêmes contraintes** (heure, forteresse). Events 100 % réalistes.
  - **(b) Génération aléatoire filtrée** : events random mais qui **respectent mes filtres + ma forteresse + mes créneaux** (si je m'ouvre à Sion → events à Sion ; si je les VOIS, c'est que je peux y participer). Pour tester : **aprèm Lausanne + soirée Sion** → vérifier que la forteresse **prévient quand ça devient tendu**.
- 🔧 **Mes événements** : quand je crée mon event → il doit apparaître dans **Clutchs → Prochain rendez-vous, tout en haut**, marqué. Trier les prochains events : **mes events / partenaires / inscrits**. Me **rappeler** que mon event arrive (alerte « ton event est à telle heure, déplace-toi »). 🧩 Idée Phase 2 : prendre la **position GPS 30 min avant** → si la forteresse voit que je n'y arriverai pas → prévenir.
- 🔧 Dans la page Événements, **mon event est perdu au milieu des autres** → le distinguer / le mettre en avant.
- 🔧 Pas de **discussion/chat** dans l'événement (manque).

### Page « Organiser un événement » — refonte (screenshot fourni)
- 🔧 **Icône de l'event** : pouvoir choisir parmi les **icônes de Mel**.
- 🔧 Le textbox titre : placeholder **« Titre de ton événement »** (aujourd'hui ambigu, on dirait « description »).
- 🔧 **Lieu** : recherche d'adresse avec **propositions sur la carte** (même autocomplete que §1).
- ✅ **Event fixe** : garder (important).
- 🔧 **Dates** : boutons intelligents calculés depuis l'heure actuelle jusqu'à +18h (même moteur que §6).
- 🔧 **Nombre de places — refonte importante** :
  - Autoriser les **nombres impairs** (seul + veux une pétanque → demander **3** personnes).
  - L'organisateur précise : **combien ils sont déjà**, **places min pour que l'event ait lieu**, **places max**.
  - **Pair ou impair au choix.**
  - Ex pétanque : **8 places** total, déjà **3** → 1 de plus « remplit » un palier ; places 5-6-7-8 **ne s'activent que si pleines** (pour **tournois** : 4 équipes de 2). → notion de **paliers de places**.
- ✅ **Prix** : ok. ❓ molette ? (incertain, David hésite).
- 🔧 **Description (vraie)** : placeholder qui **aide/guide** : « décris ton event, à quoi faire attention, le niveau, transport / place de parc, quoi amener à boire-manger, y aura-t-il à boire/manger sur place ? ».
- 🔧 **Publier** → l'event doit ensuite être **retrouvable** (cf. « mes events » ci-dessus).

---

## 9. 🌌 LA FORTERESSE DOIT RAISONNER SUR TOUS MES ENGAGEMENTS (le gros sujet Dom)
> **C'est LE manque logique #1 que David a identifié.** Aujourd'hui la forteresse évalue **un clutch isolé**
> (`D + R ≤ portée(Δt)`). Elle **ne tient PAS compte** de mes **autres RDV/events confirmés**.

- Cas réel vécu : David a une **partie d'échecs à 20h30 (durée 2h par défaut)** PUIS propose **Léa à 22h30 à Hudi/loin**. Le système l'a **autorisé** alors que physiquement : échecs finit ~22h30 + trajet → **impossible** d'être à Hudi à 22h30.
- Règle voulue : la forteresse doit **en permanence** vérifier la faisabilité d'un nouveau RDV **par rapport à ce qui est DÉJÀ prévu** (clutchs confirmés + events) et **alerter** si conflit spatio-temporel.
- Paramètres :
  - **Durée RDV par défaut = 2h** si non spécifiée.
  - Marge déjà décidée : « **dispo jusqu'à 1h avant le RDV** » → mais à **compléter** par la contrainte d'**enchaînement** (fin de l'engagement N + trajet ≤ début de l'engagement N+1).
- 🧩 **Architecture cible** = `occupancies` + `EXCLUDE gist` (déjà spécifié, cf. `docs/architecture-engagements.md` + mémoire `project_architecture_engagements`). La faisabilité d'enchaînement = `fin(A) + trajet(lieuA→lieuB) ≤ début(B)` pour toute paire d'engagements. C'est le moteur de **causalité** de Dom appliqué non plus à 1 clutch mais à **l'agenda entier**.

---

## 10. 🥊 MES RECO / CHALLENGES (à valider demain)
- **Clutcher hors zone (§5)** : **OUI, autoriser + alerte, ne pas bloquer.** Cohérent avec le gradient « jamais bloquer ». L'**intersection des cercles** ≠ une contrainte dure : c'est une **aide** (montrer la zone commune comme suggestion), pas un mur. On fait confiance aux gens (règle produit #9 du CLAUDE.md). → donc **pas** « seulement à l'intersection ».
- **Événements de test (§8)** : je recommande **(a) + (b) combinés** → un **générateur** qui crée des events **via la vraie RPC de création** (donc soumis aux mêmes contraintes), pilotés par des bots, **calés sur mes créneaux/filtres**. Un seul code, zéro divergence test/prod. C'est aussi la brique du **simulateur** (§11).
- **Forteresse multi-engagements (§9)** : à construire AVANT le simulateur massif — sinon le simulateur testerait un moteur incomplet. C'est la prochaine vraie feature moteur (avec Dom).

---

## 11. 🏙️ CLUTCH CITY — le simulateur (vision David)
> Cf. document séparé **`docs/clutch-city-vision.md`** (architecture + challenge + questions). Résumé ici pour Dom.

David veut **DEUX choses** qu'il faut bien distinguer (mon challenge principal) :
1. **Le VALIDATEUR LOGIQUE** (« Coq, laisse passer aucune erreur ») = extension de `scripts/test-forteresse.mts` : **énumère TOUTES les configs** (déterministe, exhaustif) et **prouve les invariants**, MAINTENANT y compris **multi-engagements** (§9). But : rendre les configs **impossibles** vraiment impossibles. Pas de hasard.
2. **LA SIMULATION ÉMERGENTE** (« SimCity / Clutch City ») = N agents (1000 → 10000), %H/F, dynamique online/offline, créneaux, déplacements, ils se clutchent/acceptent/refusent, events se remplissent, le temps passe. But : voir les problèmes **émergents** (saturation, boîte des femmes pleine, deadlocks, tension) que la logique seule ne montre pas. + une **IA/analyse** qui explique « ça bug ici, c'est tendu là, voilà quoi améliorer ».

→ Ce sont **2 outils différents** (l'un prouve la logique, l'autre observe l'émergence). On fait **le validateur d'abord** (cale le moteur), **puis** la simulation. Étapes géo : **Lausanne → Suisse Romande → Suisse**.

---

## 12. TODO priorisé (proposition)
1. 🧩 **Forteresse multi-engagements** (§9) + durée RDV défaut 2h — avec Dom. *Cœur logique.*
2. 🔧 **Validateur logique étendu** (§11.1) qui teste §9 — la « coque » nouvelle génération.
3. 🔧 **Générateur d'events réalistes** (§8, piste a+b) — débloque les tests + nourrit le simulateur.
4. 🔧 **Carte** : zoom d'ouverture ~5 km, calmer le re-zoom, autocomplete recherche, zoom recherche ~10 km, pin qui ne bouge pas au rayon (§1).
5. 🔧 **Curseur fluide** 1→5 km libre puis résistance (§2).
6. 🔧 **Messages forteresse clairs** (§3) + **modifier créneau garde position/heure** (§4) + **demain matin** (§6).
7. 🔧 **Post-RDV feedback + favoris unifiés** (§7).
8. 🔧 **Refonte page Organiser un event** (§8) : icône Mel, titre, lieu autocomplete, places impaires/paliers, description guidée.
9. 🏙️ **Clutch City** simulation (§11.2) — après 1-3.
