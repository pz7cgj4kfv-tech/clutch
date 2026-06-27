# 🌌 PROMPT GPT / GROK — « L'explorateur d'invariants de la Forteresse » (le "coq")

> Auto-suffisant (Grok ne connaît pas l'app). On veut ARRÊTER de corriger la forteresse bug par bug, et plutôt
> EXPLORER tout l'espace de configuration pour DÉRIVER l'algorithme correct + ses invariants. Rigoureux, formel.

COLLE À PARTIR D'ICI 👇

---

Panel de 3 experts (1. spécialiste property-based testing / model checking / fuzzing · 2. modélisateur espace-temps
(géométrie + temps) · 3. ingénieur produit anti-abus), sans complaisance, divergent puis convergent.

## Le contexte — « Clutch »
App de rencontre **spontanée EN PERSONNE** (Suisse, arc lémanique Genève→Villeneuve). Un utilisateur se déclare
**disponible** : { position GPS réelle · un ou plusieurs **créneaux** horaires (début→fin, dans les 18h) · un **rayon** R }.
Quelqu'un peut alors lui proposer un **RDV** (lieu P dans le rayon, heure T) ; s'il accepte → **Verrou**.

## La « Forteresse » — l'invariant qu'on veut GARANTIR
La forteresse doit empêcher une config **physiquement incrédible**. Invariant visé (à formaliser proprement) :

> « Un utilisateur ne doit jamais être déclaré comme pouvant honorer un RDV (lieu P, heure T) s'il ne peut pas
>   physiquement être à P à l'heure T, depuis sa position réelle, avec un moyen de transport plausible. »

Avec une **échelle de tension 0→10** (à laquelle le fondateur tient) : 0 = config large/sûre · 10 = hors de l'atteignable
(impossible) · entre les deux = de plus en plus tendu (friction croissante côté propriétaire uniquement). Réf mentale :
le **cône de causalité** (relativité) — l'ensemble des points atteignables à vitesse finie dans un temps donné.

## Le problème (vécu, en boucle)
Les corrections au cas par cas échouent : le fondateur trouve toujours un **chemin d'UI** qui viole l'invariant. Exemple
réel : il met l'heure loin (dans 2h) → le rayon s'ouvre à 50 km (OK) → puis il **ramène l'heure** à « dans 2 min » en
**gardant** le rayon à 50 km → l'app l'accepte (= « être à 50 km dans 2 min », impossible). Le couplage rayon↔heure
n'est ré-évalué que pendant certains gestes, pas tous. Il y a clairement un **espace de configuration** où l'invariant
casse, qu'on n'arrive pas à couvrir à la main.

## L'idée du fondateur : un EXPLORATEUR d'invariants (le "coq")
Construire, DANS l'app (admin only), un programme qui :
- génère ~**500 bots** sur une région (Genève→Villeneuve), positions/heures variées ;
- **énumère/fuzze TOUTES les combinaisons humaines** de configuration : ordre des gestes (changer rayon puis heure puis
  rayon…), plusieurs créneaux, presets « ce soir / dans 1h », bornes (rayon max, fenêtre 18h)… ;
- pour chaque config atteignable par l'UI, **teste l'invariant** (la config est-elle crédible ?) ;
- **remonte les VIOLATIONS** (configs qui passent l'UI mais violent l'invariant) → on en dérive la règle manquante ;
- en sort les **INVARIANTS** robustes et l'**algorithme minimal** qui les garantit.

## Les questions à trancher
1. **Formaliser l'invariant** proprement (maths) : quelle est la *vraie* contrainte ? Quelle heure « lie » le rayon —
   le DÉBUT du créneau, la FIN, l'heure du RDV proposé, ou une fonction des trois ? Donnez la définition correcte
   (ex. rayon_max(t) = f(temps jusqu'à t, vitesse plausible)) qui ne casse dans AUCUN ordre de manipulation.
2. **Espace de configuration à explorer** : quelles variables et quels chemins d'UI (séquences de gestes) faut-il
   énumérer pour être sûr de couvrir les violations ? (model checking vs fuzzing aléatoire vs énumération bornée)
3. **Détecteur de violation** : comment décider, pour une config donnée, qu'elle viole l'invariant (oracle) — sans
   dépendre du code buggé qu'on teste ?
4. **Dériver l'algorithme** : à partir des violations trouvées, comment obtenir la **règle minimale** qui rend l'invariant
   vrai pour TOUT chemin (ex. « re-clamper le rayon à chaque changement de n'importe quelle variable »), et le couplage
   propre rayon↔heure(s) **avec plusieurs créneaux**.
5. **La tension 0→10** : comment la définir de façon continue et monotone, cohérente avec l'invariant (0 loin du bord,
   10 au bord/au-delà), dérivée du même modèle.
6. **L'outil (le coq) dans l'app** : à quoi ressemble-t-il concrètement (admin only, 500 bots, région bornée) — quelles
   sorties (liste de violations, heatmap, invariants trouvés) pour qu'un fondateur non-dev le lise ?
7. Le **piège** sous-estimé.

## FORMAT DE SORTIE
1. **L'invariant formalisé** (maths) + quelle heure lie le rayon (la bonne réponse, justifiée).
2. **L'algorithme minimal** qui le garantit pour tout ordre de gestes + multi-créneaux (pseudo-code).
3. **La méthode d'exploration** (property-based / model checking / fuzzing borné) + l'oracle de violation.
4. **La tension 0→10** dérivée du modèle.
5. **Le design du "coq"** (outil admin, 500 bots, région, sorties lisibles).
6. Les **3 pièges**.
Concret, chiffré (km, min, km/h), formel. Challengez le fondateur s'il se trompe sur le modèle.

---

FIN DU BLOC ☝️
