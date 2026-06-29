# 🏙️ CLUTCH CITY — simulateur & validateur (vision + challenge + questions)

> Demande David 30.06 : « bombarder de tests la forteresse, voir tous les illogismes, une page externe type
> SimCity avec N personnes, dynamiques, qui se clutchent, une IA qui explique quand ça bug/tendu ».
> Il me challenge : « quelle question tu te poserais à toi-même pour construire ça ? » → voici.

---

## 🥊 LE CHALLENGE PRINCIPAL — ce sont DEUX outils, pas un

David mélange (légitimement) deux besoins très différents. Les confondre = rater les deux. Je les sépare :

### Outil A — LE VALIDATEUR LOGIQUE (« Coq », déterministe, exhaustif)
- **But** : prouver que **aucune configuration illogique n'est possible**. Rendre l'impossible impossible.
- **Méthode** : on **énumère TOUTES les combinaisons** (pas de hasard) de paramètres discrétisés et on **vérifie des invariants**. C'est exactement `scripts/test-forteresse.mts` (26/26) — mais on l'**étend**.
- **Ce qu'il attrape** : contradictions, fenêtres impossibles autorisées, plafonds incohérents, **enchaînements infaisables** (échecs 20h30 → Léa 22h30 loin), chevauchements, débordements 18h.
- **Ce qu'il N'attrape PAS** : les problèmes qui n'émergent qu'avec **beaucoup de monde dans le temps** (saturation, famine, deadlocks sociaux).
- ⚠️ Note honnête : « Coq » est un vrai prouveur formel (lourd, langage dédié). Ici on fait un **validateur exhaustif en TypeScript** — même esprit (zéro erreur tolérée), sans la machinerie Coq. Suffisant et pragmatique. On NE part PAS sur Coq (coût × bénéfice mauvais pour une app produit).

### Outil B — LA SIMULATION ÉMERGENTE (« SimCity / Clutch City », stochastique, dynamique)
- **But** : observer ce qui **émerge** quand 1 000 → 10 000 agents vivent dans le temps.
- **Méthode** : N **agents** avec des comportements probabilistes (se mettent en ligne/hors-ligne, choisissent rayon/créneaux/lieu, se déplacent, s'envoient des clutchs, acceptent/refusent, créent/rejoignent des events). On **avance le temps** (tick) et on **mesure**.
- **Ce qu'il attrape** : boîte des femmes saturée, hommes qui ghostent, places d'events bloquées, tension qui monte, ratio d'acceptation, zones mortes, effets de la masse (la « masse critique » du business).
- **Ce qu'il N'attrape PAS** : il ne *prouve* rien (il échantillonne). D'où le besoin de A en parallèle.

→ **Décision proposée : on construit A d'abord** (cale et prouve le moteur, y compris multi-engagements),
**puis B** (observe l'émergence). B **réutilise** les agents + la vraie logique de A.

---

## 🧱 ARCHITECTURE PROPOSÉE (réutilise tout l'existant, zéro divergence)

Principe d'or : **la simulation appelle EXACTEMENT le même moteur que la prod.** Sinon on teste un faux système.
- `lib/forteresse-engine.ts` = le juge (déjà pur, déjà prouvé). On l'**étend** à `evaluateSchedule(engagements[])` pour le multi-engagements (§9 du walkthrough).
- Un module pur **`lib/sim/`** (nouveau) :
  - `agent.ts` — un agent : position, genre, dispo, créneaux, comportement (probas).
  - `world.ts` — la ville : liste d'agents, horloge, file d'events.
  - `step.ts` — un tick : qui se met en ligne, qui clutche qui, qui accepte/refuse, qui se déplace.
  - `metrics.ts` — agrégats (taux d'acceptation, saturation boîte ♀, tension moyenne, deadlocks).
  - `seed.ts` — **déterminisme** : RNG seedé (rejouable, indispensable pour reproduire un bug).
- Deux entrées :
  - **`scripts/test-clutch-city.mts`** — le validateur (Outil A) en CLI : `node scripts/test-clutch-city.mts` → OK/KO.
  - **`/clutch-city`** — page interactive (Outil B) : curseurs (N, %H/F, dynamique…), bouton Play/Pause/Step, carte + graphes live, panneau « alertes & explications ».

---

## 🎛️ LES RÉGLAGES (page interactive) — tout ce que David a listé
- **Population** : N (slider 100 → 10 000), zone (Lausanne → Romandie → Suisse), densité.
- **Démographie** : % hommes / femmes, distribution d'âge.
- **Dynamique** : taux de mise en ligne / hors-ligne par heure ; masse locale **constante / monte / baisse**.
- **Comportement créneaux** : 1/2/3 créneaux ; là où ils sont / pas / ailleurs ; se déplacent ou non.
- **Rayons / positions** : distribution statistique.
- **Clutch** : probas d'envoi, d'acceptation, de refus ; libération de place ou non (timeout).
- **Events** : taux de création, remplissage, paliers.
- **Horloge** : vitesse (1 min réelle = X min sim), Play/Pause/Step.

## 📊 CE QU'ON MESURE + L'IA QUI EXPLIQUE
- Indicateurs live : taux d'acceptation, **saturation boîte ♀**, RDV confirmés/h, **tension moyenne** (0-10), no-shows, places mortes, zones froides.
- **Détecteur d'anomalies** : à chaque tick, si un invariant casse (RDV impossible accepté, double-booking, débordement 18h) → **alerte rouge horodatée + état rejouable** (seed + tick).
- **Couche explicative** : 1) règles dures (« 12 RDV impossibles acceptés au tick 340 — l'enchaînement n'est pas vérifié ») ; 2) option **IA** (résumé langage naturel : « la boîte des femmes sature dès 800 users si 70 % d'hommes — augmente le coût d'envoi »). L'IA **explique/oriente, ne prescrit pas** (règle produit).

---

## 🤔 LES QUESTIONS QUE JE ME POSE (le challenge demandé)
1. **Fidélité vs vitesse.** Simuler 10 000 agents au km/min près = lourd. Quel niveau de fidélité géo (vraies routes via Dom, ou portée à vol d'oiseau × détour) ? → V1 : le modèle trajet actuel (suffit pour la logique) ; brancher Dom en V2.
2. **Déterminisme.** Sans RNG seedé, un bug observé n'est pas reproductible → inutilisable. **Seed obligatoire** dès le départ.
3. **Le moteur d'abord.** Tester par simulation un moteur qui ignore encore les multi-engagements = tester un faux. **On finit `evaluateSchedule` avant la grosse sim.**
4. **Qu'est-ce qu'un « bug » pour le validateur ?** Il faut une **liste d'invariants** explicite (le contrat). C'est 80 % du travail et c'est de la pure logique — donc faisable et c'est là qu'est la valeur.
5. **Où vit la sim ?** Page Next statique (`output:'export'`) → tourne **côté navigateur** (pas de serveur). OK pour 1 000-10 000 agents en JS. Au-delà → web worker.
6. **Réutilisation prod.** Les agents doivent appeler la **vraie** logique (engine + RPC simulées), sinon divergence. Non négociable.
7. **Ergonomie pilote.** David doit **tout comprendre sans rien rater**. → presets (« Lausanne soirée 1 000 », « ♀ saturée », « 2 villes tendues ») + un mode pas-à-pas.

---

## 🗺️ PLAN EN ÉTAPES (proposé)
- **Étape 0 (moteur)** : `evaluateSchedule(engagements)` = faisabilité multi-RDV/events + durée défaut 2h. (avec Dom)
- **Étape 1 (validateur)** : `scripts/test-clutch-city.mts` énumère configs + multi-engagements → invariants prouvés (la « coque v2 »).
- **Étape 2 (agents + monde)** : `lib/sim/` pur + seed, sans UI → un run CLI qui sort des métriques.
- **Étape 3 (page)** : `/clutch-city` interactive — Lausanne, 1 000 agents, curseurs, carte, graphes, alertes.
- **Étape 4 (échelle + IA)** : Romandie/Suisse, web worker, couche explicative IA.

---

## ✅ Ce dont j'ai besoin de David pour démarrer (cf. questions posées en chat)
- Priorité : **moteur multi-engagements d'abord** (reco) ou **simulateur visuel d'abord** (pour « voir tourner ») ?
- Périmètre V1 : **Lausanne seul** d'abord, ou direct Romandie ?
- L'IA explicative : **maintenant** (couche legère) ou **plus tard** (d'abord les règles dures) ?
