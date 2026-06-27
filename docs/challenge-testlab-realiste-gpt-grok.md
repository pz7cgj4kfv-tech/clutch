# 🤖 PROMPT GPT / GROK — « Test Lab FIDÈLE : moi sur mon iPhone, nœud central, avec toutes les contraintes d'un vrai humain »

> Auto-suffisant (Grok ne connaît pas l'app). Le fondateur teste SEUL depuis son téléphone et veut piloter des
> « bots » qui se comportent EXACTEMENT comme de vrais humains, avec TOUTES les contraintes. Sans ça, le test ne prouve rien.

COLLE À PARTIR D'ICI 👇

---

Panel de 3 experts (architecte QA/simulation multi-agents · ingénieur back-end temps réel (Postgres/contraintes) ·
designer d'outils internes pour non-dev), sans complaisance, divergent puis convergent.

## Le contexte — « Clutch »
App de rencontre **spontanée EN PERSONNE** (Suisse, Lausanne). On se déclare **disponible** (position GPS · lieu · rayon ·
**créneaux** horaires dans les 18h, parfois plusieurs). Quelqu'un envoie une invitation lieu+heure (« Clutch ») → l'autre
accepte → **RDV confirmé** (« Verrou »). Il y a aussi des **événements** (un organisateur crée, les autres s'inscrivent →
liste d'attente). Et une **« Forteresse »** = moteur d'intégrité espace-temps :
- **Exclusion** : pas 2 RDV/occupations qui se chevauchent (contrainte Postgres EXCLUDE).
- **Le Cône** : ma config doit être physiquement crédible (rayon ↔ heure ; je dois pouvoir être au lieu à temps).
- **Cooldown** anti-spam (paliers après refus).

## Le problème (vécu en test, ce soir)
Le fondateur (NON-dev) teste **seul, sur son iPhone**. Il pilote des **bots** (faux users = vraies lignes en base). Constats :
1. Il **clutche** un bot à 17h55 alors qu'il a déjà un Verrou à 20h → **rien ne se passe, aucune alerte** (ni blocage ni explication).
2. Il peut **rejoindre un événement alors qu'il n'est PAS disponible** à ce créneau (l'app dit « pas dispo » mais l'event reste joignable).
3. Les **dates sont fausses** (on est samedi, l'event affiche « lundi 22 juin »).
4. Les **pastilles de notif** (clutch reçu / message) ne s'affichent pas bien (surtout onglet Clutchs, info mélangée).
5. Dans son outil de test, il **ne peut pas choisir l'heure** où un bot est en ligne, ni faire **créer un événement** par un bot.

→ Conclusion du fondateur : **la Forteresse (Cône + exclusion) n'est pas appliquée à la logique des bots**, et l'outil
de test n'est pas assez fidèle/complet. Il veut que **TOUT se comporte comme un vrai humain**, sinon le test ment.

## Ce qu'il veut vraiment
Un **Test Lab** où LUI = le **nœud central** sur son téléphone, qui peut, en quelques taps :
- mettre un bot **en ligne** avec **un créneau précis** (heure début/fin, lieu, rayon) — comme un vrai humain qui se déclare,
- faire un bot **créer un événement** (date/heure/lieu/places réels),
- envoyer/recevoir des clutchs, accepter/refuser, « j'y suis », terminer,
- et que **TOUTES les contraintes réelles s'appliquent** aux bots comme à lui : Cône, exclusion (pas 2 endroits à la fois),
  dispo/créneau (on ne voit/joint un event QUE si on est dispo à ce créneau), dates réelles, cooldown, liste d'attente.
- avec, à chaque blocage, un **message clair** (jamais « rien ne se passe »).

## Contraintes techniques
- **Next.js export statique** (zéro serveur custom) + **Supabase** (Postgres, RLS, RPC SECURITY DEFINER, Realtime,
  contraintes EXCLUDE gist, pg_cron). Les règles dures vivent en base (contraintes/RPC), pas en JS (contournable).
- L'outil de test doit pouvoir **disparaître en 1 bloc** avant l'App Store.
- Pensé pour un **non-dev** qui teste **seul** sur **mobile** : simple devant, complet derrière.

## Les questions à trancher
1. **Où appliquer les contraintes ?** Pour que les bots respectent VRAIMENT la Forteresse (Cône + exclusion + dispo +
   cooldown), faut-il que toutes les actions (clutch, accept, inscription event) passent par les **mêmes RPC gardées**
   que les vrais users (avec un `actor_id` admin) plutôt que des `insert/update` directs ? Donnez l'architecture.
2. **Feedback de blocage** : comment garantir qu'un blocage (chevauchement, hors-cône, pas dispo, cooldown) renvoie
   TOUJOURS une **raison lisible** côté test (sans exposer d'info sensible aux vrais users en prod) ?
3. **Filtre dispo↔event** : règle exacte pour qu'un event ne soit **visible/joignable que si on a un créneau compatible**.
   Quid des events des bots ?
4. **Dates/temps réels** : comment éliminer les dates en dur et tout ancrer sur « maintenant » (créneaux relatifs) ?
5. **UX mobile du nœud central** : le bon écran pour « mettre X en ligne à telle heure » / « X crée un event à telle
   heure » en 2-3 taps, sans formulaire lourd.
6. **Le piège** que le fondateur sous-estime dans cette simulation.

## FORMAT DE SORTIE
1. **Architecture** « toutes les actions via RPC gardées + actor_id admin » (ou alternative), schéma simple.
2. **Le contrat de feedback** (chaque blocage → raison lisible, codes).
3. **Règle dispo↔event** (visible/joignable seulement si créneau compatible).
4. **Modèle de temps** (tout relatif à maintenant, zéro date en dur).
5. **L'écran de pilotage** mobile (mettre en ligne à telle heure · créer event à telle heure).
6. Les **3 pièges**.
Concret, actionnable, pour un fondateur non-dev qui teste seul sur iPhone. Challengez-le s'il se complique la vie.

---

FIN DU BLOC ☝️
