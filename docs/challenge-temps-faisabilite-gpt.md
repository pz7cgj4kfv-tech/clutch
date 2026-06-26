# ⏱️ PROMPT GPT — « Visibilité dans le temps + faisabilité d'un Clutch » (à coller à GPT)

> Le cœur de la logique de matching. Le fondateur a relevé un trou qu'on doit combler. Sois rigoureux.

COLLE À PARTIR D'ICI 👇

---

Panel de 3 experts (architecte systèmes temps/contraintes · designer produit · sécurité-anti-abus), sans complaisance, divergent puis convergent.

## Contexte — « Clutch »
App de rencontre spontanée EN PERSONNE (Lausanne), fenêtre **18h**. On déclare des **créneaux de disponibilité** = {fenêtre horaire, lieu, rayon} — c'est une **INTENTION future dans les 18h**, PAS « en ligne pile maintenant ». On envoie un **Clutch** (invitation à un lieu + heure) ; l'autre accepte → **Verrou** (RDV confirmé) ; un RDV confirmé **occupe** l'agenda (forteresse : 1 personne ≠ 2 endroits, garantie par une contrainte Postgres). Un Clutch en attente **n'occupe pas**. Les **événements** acceptés occupent aussi.

## Le trou relevé par le fondateur (2 problèmes liés)

**Problème A — Visibilité dans le temps.**
Anaïs se met dispo **18h→23h** alors qu'il est **midi**. À midi, le fondateur veut **la VOIR** et pouvoir **la clutcher POUR CE SOIR**. Aujourd'hui le filtre la cache parce que sa fenêtre « ne couvre pas maintenant ». C'est faux : *« on peut se voir alors qu'on n'est pas en ligne maintenant, parce qu'on sera en ligne plus tard. »*
→ **Question : qui apparaît dans les Présences ?** Tous les gens dispo dans les 18h ? Seulement ceux dont la fenêtre peut **croiser une des miennes** ? Et si je suis dispo 12h-14h et elle 18h-23h (aucun croisement) — je la vois ou pas ? Je peux la clutcher ou pas ?

**Problème B — Faisabilité d'un Clutch (le gros).**
Le fondateur est **inscrit à un event 19h à Lausanne** (occupe son agenda). Il a quand même pu **proposer un Clutch à 18h40 à Morges**. C'est absurde : Morges→Lausanne en 20 min + un event à 19h = infaisable. Il dit, et il a raison :
- La **forteresse ne devrait pas seulement bloquer au verrouillage** — le **FILTRE devrait l'empêcher de proposer** ce créneau.
- Mieux : quand il propose un Clutch à quelqu'un, les **heures proposables** doivent être **calculées** : il pourrait proposer **17h** (avant l'event), mais **pas 18h40** ; et la **durée max** proposable doit tenir compte de **l'event à 19h + le trajet** (donc ~1h max, pas plus).
→ *« Le filtre doit calculer que je peux lui proposer une durée d'une heure imposée, parce qu'il y a un event plus tard ET le trajet. »*

## Les questions à trancher
1. **Présences** : quelle est la règle de visibilité exacte (horizon 18h · croisement de fenêtres possible · rayon) ? Montrer large et trier, ou filtrer dur ?
2. **Sélecteur d'heure d'un Clutch** : il ne doit proposer QUE des créneaux faisables, calculés depuis : ma dispo ∩ la sienne, MOINS mes engagements (events/RDV) et le **trajet** (aller au RDV + repartir vers l'engagement suivant). Comment le calculer simplement (sans API GPS lourde) et le présenter ?
3. **Durée** : comment dériver la **durée max** d'un Clutch quand un engagement suit (event/RDV + trajet) ? Faut-il l'imposer ou juste la suggérer ?
4. **Forteresse au moment de PROPOSER** (pas seulement au verrouillage) : on empêche carrément, ou on prévient ? (Attention : un pending n'occupe pas — mais proposer un truc infaisable est inutile/frustrant.)
5. **Anti-abus / sécurité** : ces calculs révèlent-ils des infos sur l'agenda de l'autre (anti-sonde) ? Comment ne PAS fuiter « elle a déjà un RDV à 20h » ?
6. **Cold-start / simplicité** : au lancement (peu de données), comment garder ça simple et pas étouffant ?

## FORMAT DE SORTIE
1. **Règle de visibilité Présences** (précise).
2. **Algo de faisabilité du sélecteur d'heure** (entrées, calcul trajet simple, sortie = créneaux + durée max), en pseudo-code.
3. **Verdict « empêcher vs prévenir »** au moment de proposer.
4. **Garde anti-sonde** (ne pas fuiter l'agenda d'autrui).
5. Le **piège** que le fondateur ou le dev sous-estiment encore.
Concret, pseudo-code bienvenu, chiffré. Challenge le fondateur s'il a tort.

---

FIN DU BLOC ☝️
