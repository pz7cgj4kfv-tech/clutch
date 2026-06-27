# 🕊️ PROMPT GPT / GROK — Favoris + « cooldown SOFT » : éjection invisible & graduelle d'un poursuivant non désiré

> Auto-suffisant (Grok ne connaît pas l'app). On veut valider l'ÉTHIQUE + trouver le MODÈLE MATHÉMATIQUE d'un
> système qui fait disparaître **en douceur, sans que personne ne s'en rende compte**, un homme qui s'acharne sur
> une femme qui le refuse — tout en gardant un peu d'engagement. Rigueur, chiffres, et challengez le fondateur.

COLLE À PARTIR D'ICI 👇

---

Panel de 3 experts sans complaisance (1. éthique produit / sécurité des femmes en ligne · 2. mathématicien des
systèmes de réputation/throttling (anti-abus, anti-gaming) · 3. juriste protection des données + dark patterns),
divergent puis convergent.

## Contexte — « Clutch »
App de rencontre **spontanée EN PERSONNE** (Suisse, LPD). On se met **en ligne** sur un créneau ; quelqu'un peut
proposer un **RDV** (« Clutch ») ; l'autre **accepte** (→ Verrou) ou **refuse**. Le cœur = **sécurité des femmes**.
Déjà en place : un **cooldown** après refus = **24h, ×2 à chaque nouveau refus du même expéditeur** (exponentiel) →
un insistant s'auto-éteint. La **boîte de Clutchs reçus est limitée** (plafond de demandes en attente).

## La feature « Favoris » (en débat)
- On veut **remplacer la page Contacts par des FAVORIS** : on met en favori qui on veut (personne / event).
- **AUCUNE notification** « ton favori est en ligne » (notifier serait un vecteur de harcèlement → on l'exclut volontairement).
- Seul effet : quand **toi ET ton favori êtes en ligne en même temps**, il/elle **remonte en premier** dans ta liste.
- **Favoris LIMITÉS** (ex. 5 max) → ressource rare.

## Le problème à résoudre (et l'idée du fondateur)
Cas : un homme **flashe sur une femme**, la met en favori → elle remonte en premier chez lui → il peut la **clutcher en
premier** dès qu'elle est en ligne. **Elle, elle ne le voit pas en premier** (asymétrie). Risque = acharnement.
Le fondateur affirme que ce n'est **pas** un risque de sécurité, parce qu'il veut ajouter un **« cooldown SOFT »** :

> Au lieu de la **bloquer frontalement**, le système la fait **disparaître progressivement et INVISIBLEMENT** du champ
> de ce monsieur, à mesure qu'elle le refuse — « il faut lire entre les lignes, un peu de psychologie ». Personne ne
> doit se rendre compte que ça se produit.

Mécaniques proposées (à modéliser/valider) :
1. **Cooldown pondéré par la relation favori** : le multiplicateur du cooldown grandit **PLUS VITE** si la femme refusée
   est **dans les favoris de l'expéditeur** (signal qu'il cible une personne précise qui dit non, pas du hasard).
2. **Éviction silencieuse des favoris** : après assez de refus, elle est **retirée de ses favoris à lui sans le
   prévenir** ; comme les favoris sont rares (5), il « gaspille » ses slots sur des gens qui le refusent.
3. **Variante « business » de la cofondatrice (Mélanie)** : on ne la retire PAS des favoris ; mais quand il envoie un
   Clutch, **on le livre EN RETARD** (delivery delay) → les **autres** prétendants remplissent la boîte limitée de la
   femme **avant** lui → de facto elle ne le voit plus / il passe toujours après. Soft, invisible, gradué.

Objectif assumé du fondateur : **garder un peu** d'engagement (le mec continue d'essayer car il ne sait pas qu'il est
throttlé) — mais « **un peu, pas à 100 %** » — SANS dark pattern ni risque pour la femme.

## Les questions à trancher

### 1. ÉTHIQUE — le throttle invisible est-il légitime ?
Un **shadow-throttle** (le ralentir/l'effacer sans le lui dire) protège la femme **sans confrontation** (elle n'a pas à
bloquer = pas d'escalade, pas de représailles). MAIS il **trompe l'homme** (il ne sait pas). Où est la ligne entre
(a) **shadow-ban légitime d'un harceleur** (pattern de sécurité reconnu) et (b) **manipulation** (le faire « tourner »
pour l'engagement) ? La même mécanique sert les deux — qu'est-ce qui la rend éthique ou non ? Le **« un peu pas 100 % »**
du fondateur est-il tenable, ou faut-il **assumer 100 % sécurité** et abandonner l'angle engagement ?

### 2. LE MODÈLE MATHÉMATIQUE (chiffré, anti-gaming)
Donnez des fonctions concrètes :
- `cooldown(n_refus, est_favori)` — base 24h ×2 ; comment accélérer si `est_favori` ? (ex. ×2 → ×3 ? +offset ?)
- `delai_livraison(historique)` — le retard de Mel : combien, à partir de quel signal, jusqu'où ?
- `score_visibilité(t)` — décroissance de la visibilité de lui chez elle (continue, monotone, douce).
- `seuil_éviction_favori` — après combien de refus elle quitte ses favoris à lui ?
Chiffres réalistes (heures, multiplicateurs, seuils). Le système doit **converger** (l'insistant disparaît) et **ne pas
être gameable**.

### 3. FAUX POSITIFS — ne pas punir un mec correct
Distinguez **« elle le refuse LUI spécifiquement, répétitivement »** de **« elle est juste occupée / boîte pleine /
très demandée »**. Un homme normal ne doit pas être throttlé parce qu'une femme est populaire. Quel **signal propre**
isole l'acharnement ciblé ? (refus répétés du **même** couple expéditeur→destinataire, fenêtre de temps, ratio.)

### 4. ABUS / SYMÉTRIE
- Ça protège surtout les femmes : faut-il l'appliquer **à tous les genres** (un homme harcelé aussi) ?
- **Gaming** : un groupe peut-il coordonner des refus pour **enterrer** quelqu'un injustement ? Parade ?
- **LPD/transparence** : a-t-on le droit de throttler invisiblement ? Que doit dire la politique de confidentialité ?

### 5. Les 3 PIÈGES sous-estimés.

## FORMAT DE SORTIE
1. **Verdict éthique** (légitime ou non, et à quelles conditions) + la ligne shadow-ban-sécurité vs manipulation-engagement.
2. **Le modèle mathématique** complet (les 4 fonctions, chiffrées) + preuve de convergence + anti-gaming.
3. **Faux positifs** : le signal propre qui isole l'acharnement ciblé.
4. **Abus/symétrie/LPD** : recommandations.
5. **3 pièges**.
Concret, chiffré, et **challengez le fondateur** s'il se trompe (notamment sur le « un peu pas 100 % » et sur la
transparence LPD). Réaliste pour une app Next.js export statique + Supabase (logique côté RPC/SQL, jamais JS seul).

---

FIN DU BLOC ☝️
