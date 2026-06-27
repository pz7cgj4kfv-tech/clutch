# 🌌 PROMPT GPT / GROK — « La Forteresse : modèle de crédibilité ESPACE-TEMPS » (à coller)

> Pitch AUTO-SUFFISANT (Grok ne connaît pas l'app). Le cœur de l'intégrité de Clutch. Rigoureux, chiffré, scientifique.

COLLE À PARTIR D'ICI 👇

---

Panel de 3 experts (physicien/modélisateur espace-temps · ingénieur géo-mobilité/transport · designer produit
anti-friction & anti-abus), sans complaisance, divergent puis convergent.

## Le pitch — « Clutch »
App de rencontre **spontanée EN PERSONNE** (Suisse, démarrage Lausanne). On se déclare **disponible** = {position GPS ·
lieu de zone · rayon · fenêtre horaire} dans les **18h**. Quelqu'un envoie une invitation lieu+heure (« Clutch »),
l'autre accepte → **RDV confirmé**. Règle d'or : on n'expose JAMAIS à autrui la position, la distance, ni la raison
d'un refus (anti-triangularisation d'une personne, sécurité). Le calcul reste côté serveur/téléphone, ne renvoyant que
« faisable / pas faisable ».

## La « Forteresse » — 2 invariants (Graals)
- **Graal 1 — EXCLUSION** : une personne ≠ 2 endroits au même instant. (déjà garanti par une contrainte d'exclusion
  temporelle en base : 2 RDV confirmés ne peuvent pas se chevaucher.)
- **Graal 2 — CAUSALITÉ (le sujet)** : ma config de dispo doit être **physiquement crédible**. Je dois pouvoir ÊTRE au
  point de RDV à l'heure, depuis ma position réelle, avec un moyen de transport plausible. Métaphore visée : le **cône
  de causalité** de la relativité (l'ensemble des événements atteignables à vitesse finie). Si le point de RDV est
  **hors de mon cône**, je ne dois pas y être proposable.

## Ce qu'on veut modéliser : une TENSION 0→10
Plus ma config s'approche de l'infaisable, plus la **tension** monte : 0 = large/sûr · 4-6 = serré (messages de plus
en plus fermes, côté propriétaire SEULEMENT) · 10 = hors du cône → on n'affiche rien, on EMPÊCHE (sans message).

## Les 2 problèmes concrets à résoudre
**Problème 1 — couplage RAYON ↔ HEURE de départ.**
Plus mon rayon de dispo est grand, plus le bord du cercle est loin → moins je peux y être à temps. Ex : dispo à 11h30,
rayon 10 km ; on me clutche au bord à 11h30 → infaisable (≈20-30 min de trajet). → Il faut **coupler** rayon et heure :
agrandir le rayon doit reculer l'heure de départ minimale (ou être bloqué). Inversement, un départ plus tardif autorise
un plus grand rayon. Comment formaliser ce couplage simplement ?

**Problème 2 — POSITION RÉELLE vs lieu déclaré, et DYNAMIQUE dans le temps.**
À 11h je me déclare dispo à Sion 14h-18h (je suis à Lausanne, 1h30 de train → OK). Mais à 13h je suis TOUJOURS à
Lausanne → l'heure de départ faisable doit **reculer** dynamiquement, avec des nudges (~toutes les 30 min : « tu pourras
encore y être à 14h30 ? »), jusqu'à annulation si vraiment hors cône. L'app lit la position de temps en temps (PAS de
tracking continu : batterie + vie privée + anxiogène). L'utilisateur peut confirmer « oui je gère » sans être harcelé.

## Le moteur de « causalité » (estimateur de trajet) — quels SIGNAUX ?
Au lancement, on a un module qui estime le **temps de trajet MAX** entre 2 points : trafic temps réel + horaires
train/transports publics (CFF) + voiture. À enrichir : **multimodal** (à pied / vélo / vélo électrique pour les courtes
distances urbaines), et idéalement des **stats de déplacements réels observés**. Mondialisation = vitesses très
variables selon les régions.

## Les questions à trancher
1. **Formalisation du cône** : comment définir « atteignable » simplement et robustement (rayon faisable = f(temps
   restant, vitesse plausible selon distance/mode)) ? Donnez le **modèle mathématique** (pseudo-code), borné, dégradé.
2. **Couplage rayon ↔ heure** (Problème 1) : la bonne UX/règle ? (le rayon pousse l'heure ? un curseur 2D rayon×heure ?)
3. **Dynamique GPS** (Problème 2) : cadence de lecture position (coût batterie/vie privée), règle de recul de l'heure,
   nudges, et quand on annule. Sans jamais exposer la position à autrui.
4. **Choix de signaux** : au-delà du trafic/train/voiture, quels signaux ROBUSTES et FAIBLES en coût pour estimer le
   temps de trajet multimodal, mondialement ? Dégradé quand on ne sait pas (zone inconnue) ?
5. **Maintenant vs « Clutch Live »** : que coder en V1 (cold-start Lausanne) vs Phase 2 ?
6. **Anti-abus & vie privée** : ce modèle peut-il fuiter une position (même indirectement) ? Garde-fous.
7. Le **piège** que le fondateur sous-estime.

## FORMAT DE SORTIE
1. **Modèle « cône / tension 0→10 »** formalisé (maths + pseudo-code, chiffré).
2. **Règle rayon↔heure** (Problème 1).
3. **Algo dynamique GPS** (Problème 2 : cadence, recul d'heure, nudges, annulation).
4. **Signaux recommandés** pour l'estimateur de trajet multimodal + dégradé.
5. **V1 vs Phase 2** (ce qu'on coupe).
6. **Garde vie-privée / anti-sonde**.
7. Les **3 pièges**.
Concret, chiffré (mètres, minutes, km/h), scientifique. Challengez le fondateur s'il a tort.

---

FIN DU BLOC ☝️
