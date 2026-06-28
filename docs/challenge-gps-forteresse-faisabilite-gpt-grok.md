# 🛰️ PROMPT GPT / GROK — Forteresse GPS dynamique : faisabilité, légalité, fréquence, consentement

> Auto-suffisant. On veut bâtir la version DYNAMIQUE de la « forteresse » (le cône de causalité piloté par la position
> GPS réelle). Avant de coder, on challenge : c'est faisable ? légal (LPD suisse / RGPD) ? à quelle fréquence capter le
> GPS ? et que fait-on des gens qui refusent de partager ? Rigueur, chiffres, droit. Challengez le fondateur.

COLLE À PARTIR D'ICI 👇

---

Panel de 3 experts sans complaisance : 1. ingénieur géolocalisation mobile temps-réel (iOS/Android, batterie, précision) ·
2. juriste protection des données (LPD suisse révisée 2023 + RGPD) · 3. designer produit sécurité/consentement.

## Contexte — « Clutch » et « la Forteresse »
App de rencontre **spontanée EN PERSONNE** (Suisse). On se déclare disponible : { position · lieu de RDV sur une carte ·
rayon · créneau horaire dans les 18 h }. Quelqu'un propose un RDV ; si accepté → engagement.
**La Forteresse = un moteur de crédibilité espace-temps** : ta config doit être physiquement crédible — tu dois pouvoir
être au point de RDV à l'heure dite. Aujourd'hui c'est STATIQUE (au moment où tu te déclares). On veut le **DYNAMIQUE** :

> Si je me mets dispo à Morges pour 16 h alors que je suis à Zurich à midi → OK à midi (j'ai le temps d'y aller). MAIS si
> à 15 h je suis TOUJOURS à Zurich → l'app doit comprendre que je ne pourrai pas être à Morges à 16 h, et **reculer
> automatiquement mon heure de départ / réduire ma fenêtre** pour rester crédible. Idem quand on déplace le pin loin de
> sa vraie position : plus c'est loin, plus l'heure minimale recule (Lyon dans 20 min = impossible).

Contrainte de sécurité déjà posée : **on n'expose JAMAIS la distance/position d'une personne à une autre** (anti-traque,
anti-triangulation) — la forteresse calcule côté serveur, ne renvoie que « crédible / pas crédible » et l'heure ajustée.

## Les questions à trancher

### 1. FRÉQUENCE de captation GPS
À quelle cadence lire la position pour que la forteresse dynamique fonctionne SANS vider la batterie ni être intrusive ?
(ex. lecture seulement quand l'app est ouverte ? toutes les X min seulement si on a une dispo active dans les 18 h ?
plus souvent si la tension monte (proche du bord du cône), moins sinon ? pas de tracking en arrière-plan ?) Donnez une
**politique de sampling concrète et chiffrée** (intervalles en minutes selon l'état), compatible iOS/Android + Capacitor.

### 2. LÉGALITÉ (LPD suisse révisée + RGPD)
La localisation = donnée personnelle sensible. Quelles obligations ? (base légale = consentement explicite + intérêt
légitime sécurité ; finalité limitée ; minimisation ; transparence ; durée de conservation ; pas de profilage caché ;
décisions automatisées). **A-t-on le droit** de calculer/ajuster une fenêtre à partir du GPS, et de **masquer une
personne** si sa config devient incrédible ? Que doit dire la politique de confidentialité ? Conserve-t-on l'historique
GPS ou seulement la dernière position (recommandé) ? Risques juridiques #1.

### 3. CONSENTEMENT & refus de partager
Trois profils d'utilisateurs : (a) partage toujours · (b) partage seulement quand « en ligne » · (c) refuse tout.
- L'app PEUT-ELLE fonctionner sans GPS ? Le fondateur pense **non** (sans position, la forteresse et la sécurité
  s'effondrent). **Est-ce défendable** d'imposer le GPS comme Uber l'impose de fait ? Ou faut-il un mode dégradé ?
- Quelle est la **meilleure UX de consentement** : GPS obligatoire à l'inscription ? seulement « quand tu te mets en
  ligne » (le plus acceptable) ? Comment gérer (b) — n'autoriser à se déclarer dispo QUE si le partage « en ligne » est
  actif ? Donnez le modèle le plus **éthique ET fonctionnel**.

### 4. FAISABILITÉ & NIVEAU DE DIFFICULTÉ
Situez la difficulté de cette forteresse GPS dynamique par rapport à des choses **déjà faites/documentées** : le suivi
chauffeur d'Uber, l'ETA de Google Maps, le geofencing (Life360, Find My), les apps de covoiturage. Qu'est-ce qui est
**réutilisable** (estimation de trajet via une API d'itinéraire, geofencing natif, débounce de position) vs ce qui est
**vraiment nouveau** (le couplage cône rayon↔heure↔position dynamique + l'anti-triangulation) ? Est-ce un projet de
quelques jours ou de plusieurs semaines ? Le **piège** sous-estimé (faux négatifs : le train arrive, l'utilisateur est
pénalisé à tort ; GPS qui ment en ville ; tunnels ; etc.).

## FORMAT DE SORTIE
1. **Politique de sampling GPS** chiffrée (intervalles selon l'état, batterie, pas de background si possible).
2. **Verdict légal** LPD/RGPD : ce qu'on a le droit de faire, ce qu'il faut écrire, durée de conservation.
3. **Modèle de consentement** recommandé (obligatoire ? « online only » ? mode dégradé ?) + UX.
4. **Difficulté /10** justifiée + comparaison Uber/Maps/geofencing + ce qui est réutilisable.
5. **Les 3 pièges** (faux négatifs, GPS urbain, batterie/légal).
Concret, chiffré, juridiquement solide pour la Suisse. Challengez le fondateur s'il se trompe (notamment sur « GPS
obligatoire » et sur la fréquence de captation).

---

FIN DU BLOC ☝️
