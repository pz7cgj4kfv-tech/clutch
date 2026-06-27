# 🌌 PROMPT GROK — « Le Cône : modèle de crédibilité espace-temps de Clutch » (à coller dans Grok)

> Grok ne connaît PAS le projet → ce prompt présente TOUT. Ton direct, cash, scientifique. On veut du chiffré, pas du blabla.

COLLE À PARTIR D'ICI 👇

---

Grok, t'es 3 experts à la fois, sans filtre et sans complaisance : **(1)** un physicien qui bosse sur les modèles
espace-temps (relativité, cône de causalité, et oui le **modèle Janus de Jean-Pierre Petit** si ça t'inspire),
**(2)** un ingénieur géo-mobilité / transport multimodal, **(3)** un designer produit obsédé par l'anti-friction et
l'anti-abus. Vous divergez d'abord, vous vous engueulez, puis vous convergez. Si le fondateur a tort, dites-le crûment.

## C'est quoi le projet — « Clutch »
App de rencontre **spontanée, EN VRAI, en personne** (Suisse, on démarre à Lausanne). Pas un Tinder de canapé :
le but c'est de se voir MAINTENANT, dans les prochaines heures. Le flow :
1. Tu te déclares **disponible** = tu poses { ta position GPS · une zone/lieu · un rayon · une fenêtre horaire }
   dans une fenêtre max de **18h**.
2. Quelqu'un t'envoie une invitation lieu + heure précise (un « Clutch »).
3. Tu acceptes → **RDV confirmé** (un « Verrou »).

**Règle d'or sécurité, non négociable** : on n'expose JAMAIS à autrui ta position, ta distance, ni la raison d'un
refus. Tout le calcul reste côté serveur ou côté téléphone, et ne renvoie qu'un binaire « faisable / pas faisable ».
Raison : empêcher un type malveillant de **trianguler** la position d'une femme en bougeant et en observant les réponses.

## Le cœur de l'intégrité — « le Cône » (2 invariants, nos « Graals »)
- **Graal 1 — EXCLUSION** : une personne ne peut pas être à 2 endroits en même temps. ✅ déjà garanti en base
  (contrainte d'exclusion temporelle : 2 RDV confirmés ne peuvent pas se chevaucher).
- **Graal 2 — CAUSALITÉ (LE sujet, à construire)** : quand je me déclare dispo quelque part à une heure, ça doit être
  **physiquement crédible**. Je dois pouvoir VRAIMENT être au point de RDV à l'heure dite, depuis ma position réelle,
  avec un moyen de transport plausible. La métaphore qu'on a choisie : **le cône de causalité** de la relativité =
  l'ensemble des points qu'on peut atteindre à vitesse finie dans un temps donné. **Si le RDV est hors de mon cône,
  je ne dois pas être proposable là-bas. Point.**

## Ce qu'on veut modéliser : une TENSION de 0 à 10
Plus ma config se rapproche de l'infaisable, plus la **tension** monte :
- **0** = large, confortable, sûr.
- **4-6** = serré → messages de plus en plus fermes, MAIS uniquement de MON côté (le proprio de la dispo), jamais
  montré aux autres.
- **10** = hors du cône → on n'affiche rien, on **empêche** carrément (et sans message, pour ne pas donner d'info
  exploitable à un attaquant).

## Les 2 problèmes concrets à résoudre

**PROBLÈME 1 — couplage RAYON ↔ HEURE de départ.**
Plus mon rayon de dispo est grand, plus le bord du cercle est loin → moins je peux y être à temps. Exemple chiffré :
je me déclare dispo à **11h30**, rayon **10 km**. On me clutche tout au bord à **11h30** → infaisable, faut ~20-30 min
de trajet. Donc il FAUT coupler rayon et heure : agrandir mon rayon devrait reculer mon heure de départ minimale
(ou être bloqué). Et inversement, un départ plus tardif autorise un plus grand rayon. **Comment formaliser ce
couplage simplement et robustement ?**

**PROBLÈME 2 — POSITION RÉELLE vs lieu déclaré, et ça bouge dans le TEMPS.**
À 11h je me déclare dispo à **Sion de 14h à 18h** (je suis à Lausanne, 1h30 de train → OK, j'ai le temps). MAIS à 13h
je suis TOUJOURS à Lausanne → mon heure de départ faisable doit **reculer dynamiquement**, avec des relances
(~toutes les 30 min : « tu pourras encore y être à 14h30 ? »), jusqu'à annulation si je suis vraiment hors cône.
L'app lit ma position de temps en temps (PAS de tracking continu — batterie + vie privée + c'est flippant). Je peux
confirmer « oui je gère » sans me faire harceler. **Comment cadencer ça, reculer l'heure, relancer, et annuler —
sans jamais exposer ma position ?**

## Le « moteur de causalité » (estimateur de temps de trajet) — quels SIGNAUX ?
Au lancement on a un module qui estime le **temps de trajet MAX** entre 2 points : trafic temps réel + horaires des
trains/transports publics (CFF en Suisse) + voiture. À enrichir : **multimodal** (à pied / vélo / vélo électrique pour
les courtes distances urbaines), et idéalement des **stats de déplacements réels observés**. Et à terme c'est
mondial → les vitesses varient énormément selon les régions. **Quels signaux robustes et peu coûteux ? Comment
dégrader proprement quand on ne connaît pas une zone ?**

## Ce que je veux en sortie (chiffré, scientifique, actionnable)
1. **Le modèle « cône / tension 0→10 » formalisé** : maths + pseudo-code. Rayon faisable = f(temps restant, vitesse
   plausible selon distance et mode). Borné, avec mode dégradé.
2. **La règle rayon ↔ heure** (Problème 1) : la bonne UX/règle. Le rayon pousse l'heure ? Un curseur 2D rayon × heure ?
3. **L'algo dynamique GPS** (Problème 2) : cadence de lecture position (coût batterie/vie privée), règle de recul de
   l'heure, relances, et quand on annule.
4. **Les signaux recommandés** pour l'estimateur multimodal + le dégradé quand on ne sait pas.
5. **V1 vs Phase 2** : qu'est-ce qu'on code MAINTENANT pour le démarrage à Lausanne, qu'est-ce qu'on repousse ?
6. **Garde vie-privée / anti-sonde** : ce modèle peut-il fuiter une position, même indirectement ? Les garde-fous.
7. **Le piège #1** que le fondateur sous-estime.

Sois concret et chiffré : des mètres, des minutes, des km/h. Et si une de mes hypothèses est conne, démonte-la.

---

FIN DU BLOC ☝️
