# 🪟 PROMPT GPT / GROK — Refonte des pages 1 & 2 de « Ouvrir ma fenêtre » (Clutch)

> Auto-suffisant (Grok ne connaît pas l'app). On veut TRANCHER 3 choix de design imbriqués + des garde-fous éthiques.
> Rigueur, alternatives chiffrées, on challenge même le fondateur.

COLLE À PARTIR D'ICI 👇

---

Panel de 3 experts sans complaisance (1. designer produit mobile / réduction de friction · 2. ingénieur algos de
matching + modération de contenu · 3. spécialiste sécurité/éthique des apps de rencontre), divergent puis convergent.

## Le contexte — « Clutch »
App de rencontre **spontanée EN PERSONNE** (Suisse). On se rend **disponible** pour un créneau dans les **18h** : on
choisit sur une carte un **lieu** + un **rayon** (1–50 km), une **fenêtre horaire** (début→fin via 2 molettes), puis on
décrit son **intention**. Quelqu'un peut alors proposer un **RDV** (un « Clutch ») ; si on accepte → **Verrou**.
Vocabulaire : « Clutch / Verrou / Rendez-vous » (jamais match/swipe/like). Public sensible : sécurité des femmes = cœur.

Le flow « Ouvrir ma fenêtre » a **2 pages** :
- **Page 1** = carte (placer le lieu en déplaçant la carte) + slider de rayon + 2 molettes d'heure (début/fin) +
  des **boutons « moment de la journée »** (raccourcis) + un bouton **Quick Clutch** (RDV éclair 1h).
- **Page 2** = intention : aujourd'hui des tuiles de **mode** (Romance/Amitié/Pro/Famille) + **genre recherché** +
  un **champ texte d'intention** (optionnel) + filtre d'âge.

## Les 3 choix à trancher

### CHOIX A — Boutons « moment de la journée » INTELLIGENTS et MULTI-SÉLECTION
Aujourd'hui : 4 chips fixes (ce soir / cette nuit / demain matin / demain après-midi). On veut des chips qui :
- **s'adaptent à l'heure courante** au clic (lire l'horloge) ;
- **pré-remplissent les 2 molettes** (début/fin) avec une tranche de base, fine-tunable ensuite ;
- sont **multi-sélection** (cocher plusieurs, ou tous).
Définitions proposées par le fondateur : *ce matin* = maintenant→12h · *cet après-midi* = 12h→18h ·
*ce soir* = 18h→08h (lendemain). Plus les variantes *demain matin / aprèm / soir*.
**Contrainte dure : la fenêtre max = +18h depuis maintenant.** Donc on doit **masquer** les moments déjà passés ou
hors des 18h (ex. début d'après-midi → plus de « ce matin », mais « demain matin » OK ; le soir → plus de
« ce matin / cet après-midi »).
**Le piège non résolu : la multi-sélection NON CONTIGUË.** Une fenêtre = un seul intervalle [début, fin]. Si on coche
« ce matin » + « ce soir » mais PAS « cet après-midi », faut-il (a) couvrir tout 08h→08h (inclure l'après-midi non
voulu), (b) créer **plusieurs créneaux** distincts (l'app autorise jusqu'à 3 créneaux), ou (c) interdire les trous
(sélection forcément contiguë) ? Donnez la **bonne sémantique** + son UX, en gardant « simplicité dehors ».

### CHOIX B — Où placer le bouton « Quick Clutch » (RDV éclair 1h) ?
Il est aujourd'hui par erreur sur la page 2. Le fondateur le voulait page 1, **sous les molettes d'heure**. Options :
(1) page 1 sous les molettes · (2) page 2 avec l'intention · (3) ailleurs (ex. un toggle global sur la carte).
Quelle place **minimise la confusion** et fait comprendre que « Quick Clutch = je veux que ça se passe dans l'heure » ?
Le Quick Clutch **raccourcit-il aussi la fenêtre** automatiquement (cohérence : éclair = maintenant→+1h) ? Tranchez.

### CHOIX C — Page 2 : passer des « modes » à une INTENTION OBLIGATOIRE + matching par « mood »
Le fondateur veut **supprimer les tuiles de mode** (épurer) et rendre le **champ texte d'intention OBLIGATOIRE**
(aujourd'hui optionnel). Idée : à partir de la phrase d'intention, l'algorithme **déduit un ou plusieurs « moods »**, et
**propose en priorité** les gens dont les moods **s'intersectent** (après le filtre d'âge, qui reste prioritaire).
Questions :
1. **Inférence de mood** depuis un texte libre court, **offline / léger** (pas d'appel LLM à chaque saisie, app
   statique + Supabase) : dictionnaire de mots-clés pondérés ? embeddings pré-calculés ? Donnez une méthode MVP
   réaliste + une liste de ~6–10 moods de base pour une app de rencontre spontanée (ex. « conversation profonde »,
   « boire un verre », « sport », « créatif/culturel », « pro/networking », « fun léger », « romantique »…).
2. **Modération de contenu** sur l'intention (texte libre = danger). Il faut **bloquer** l'explicitement sexuel,
   l'illégal, le pédocriminel, le violent (ex. « gang bang » → refus). Méthode robuste **côté client ET serveur**
   (un filtre JS seul est contournable) : liste noire + normalisation (leetspeak, accents, espaces) + quoi côté DB.
   Comment éviter les **faux positifs** (mots innocents) tout en restant strict ? Ton du refus (bienveillant, pas
   moralisateur) ?
3. **Friction** : rendre l'intention obligatoire **augmente la friction** (surtout pour les femmes — cœur de l'app).
   Est-ce justifié, ou faut-il un garde-fou (ex. suggestions cliquables qui pré-remplissent le texte) ? Une **phrase
   d'aide** courte qui fait comprendre « tu définis ton intention → l'algo te propose les bonnes personnes » : proposez
   3 formulations (FR), max ~12 mots, chaleureuses, non-genrées.

## FORMAT DE SORTIE
1. **CHOIX A** — sémantique multi-sélection retenue (a/b/c) + justification + mini-maquette ASCII des chips.
2. **CHOIX B** — emplacement Quick Clutch retenu + s'il raccourcit la fenêtre.
3. **CHOIX C** — méthode d'inférence mood MVP + liste de moods · méthode de modération (client+serveur) · 3 phrases
   d'aide · verdict sur l'obligation d'intention (+ garde-fou anti-friction).
4. Les **3 pièges** sous-estimés.
Concret, réaliste pour une app statique Next.js export + Supabase. Challengez le fondateur s'il se trompe.

---

FIN DU BLOC ☝️
