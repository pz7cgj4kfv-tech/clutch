# 🛰️ PROMPT GPT — « Forteresse DYNAMIQUE selon la position GPS » (à coller à GPT)

> Le cœur de la faisabilité physique d'un Clutch. Le fondateur a relevé un trou important. Sois rigoureux, chiffré.

COLLE À PARTIR D'ICI 👇

---

Panel de 3 experts (architecte systèmes temps-réel/géo · spécialiste sécurité & vie privée · designer produit anti-friction),
sans complaisance, divergent puis convergent.

## Contexte — « Clutch »
App de rencontre spontanée EN PERSONNE, fenêtre 18h. On déclare des **créneaux de disponibilité** = {fenêtre horaire,
lieu, rayon} — une INTENTION future, pas « en ligne pile maintenant ». Les créneaux PEUVENT se chevaucher (« je suis
ouvert à plusieurs plans ») ; **seul un RDV confirmé (Verrou) OCCUPE l'agenda** (forteresse Postgres : 1 personne ≠ 2
endroits au même moment, garantie par une contrainte d'exclusion temporelle). Confidentialité GPS forte : on ne stocke
PAS la position live publiquement (risque de triangularisation) ; le radar de proximité montre le **TEMPS restant**, jamais
la distance à la personne.

## Le trou relevé par le fondateur
Quelqu'un à **Zurich à midi** se met dispo **Morges 16-20h** + **Lausanne 20h-minuit**, et a un RDV à **Montreux**. Tant
qu'il peut voyager, tout est cohérent. MAIS imprévu : il **reste à Zurich**. À 16h, il est encore à Zurich → il **ne peut
physiquement PAS** honorer un Clutch à 16h à Morges (≈2h30 de route). Aujourd'hui rien ne l'empêche d'être proposé.
→ Il faut que la **fenêtre de dispo se RÉDUISE dynamiquement** selon le **temps de trajet depuis sa position GPS réelle** :
quand des créneaux sont ouverts, l'app consulte de temps en temps la position et la forteresse interdit « clutchable dans
X min ici » s'il est trop loin pour y être à temps.

## Les questions à trancher
1. **Cadence de lecture GPS** : à quelle fréquence lire la position quand des créneaux sont ouverts, sans vider la batterie
   ni créer un mouchard ? (événementiel ? au moment où quelqu'un veut clutcher ? périodique léger ?)
2. **Calcul du temps de trajet** : proche = estimation routière simple (km × facteur ÷ vitesse). Inter-villes/européen =
   train/avion/horaires → trop lourd ? Quel modèle dégradé acceptable au lancement (ex : vol d'oiseau × facteur, plafonné) ?
3. **Réduction de fenêtre** : on **rogne** le début du créneau (« pas avant 18h30 le temps d'arriver »), on **masque** le
   créneau, ou on **prévient seulement** (gradient) ? Qui voit quoi ?
4. **Anti-sonde / vie privée** : comment faire ça SANS exposer la position live de la personne aux autres (pas de
   triangularisation) ? Le calcul peut-il rester côté serveur en ne renvoyant que « faisable / pas faisable », jamais la
   position ? Consentement LPD (Suisse) pour lire le GPS en tâche de fond ?
5. **Dégradé hors-ligne / GPS indispo** : si pas de position fiable, on fait quoi (fail-open ? dernière position connue +
   marge ? on n'applique pas la réduction) ?
6. **Le piège** que le fondateur ou le dev sous-estiment (ex : quelqu'un qui bouge VITE, faux positifs qui frustrent,
   coût batterie, edge cases fuseaux/transports).

## FORMAT DE SORTIE
1. **Modèle de cadence GPS** (quand lire, à quel coût).
2. **Algo de faisabilité géo-temporelle** (entrées : position, créneaux, vitesse estimée ; sortie : fenêtre faisable),
   en pseudo-code, chiffré, avec le dégradé inter-villes.
3. **Verdict rogner / masquer / prévenir** (et le rôle du gradient 0→10).
4. **Garde vie-privée / anti-triangularisation** (ce qui reste serveur, ce qu'on n'expose jamais).
5. Les **3 pièges** principaux.
Concret, chiffré, hiérarchisé. Challenge le fondateur s'il a tort.

---

FIN DU BLOC ☝️
