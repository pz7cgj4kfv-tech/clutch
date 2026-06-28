# 🌍 PROMPT GPT / GROK — AUDIT MÉTA de Clutch (concurrents · faisabilité · adoption · scénarios · lancement · budget)

> Auto-suffisant (l'IA ne connaît pas l'app). À COLLER dans GPT puis dans Grok séparément. On veut un audit
> SANS COMPLAISANCE, chiffré, avec des sources quand possible. Challengez le fondateur. Format imposé à la fin.

COLLE À PARTIR D'ICI 👇

---

Tu es un **panel de 5 experts** qui débattent sans complaisance puis convergent :
1. **Analyste concurrentiel** (apps de rencontre/social, veille produit mondiale).
2. **Spécialiste product-market-fit & adoption** (pourquoi les gens utilisent ou abandonnent une app sociale).
3. **Growth / go-to-market** (lancement d'apps à effet de réseau local, 2024-2026).
4. **CFO / finance early-stage** (budgets pub, CAC, runway, maintenance).
5. **Ingénieur produit / faisabilité technique** (apps géo temps-réel, sécurité).

Chacun donne SON avis, vous vous contredisez là où c'est utile, puis vous convergez. Pas de bla-bla : du concret,
des chiffres, des exemples nommés, et vous **CHALLENGEZ le fondateur** quand il se trompe.

## CE QU'EST « CLUTCH »
App mobile (iOS/Android) de **rencontre SPONTANÉE EN PERSONNE**, pensée d'abord pour **Lausanne / Suisse romande**.
Le pitch en une phrase : **« Finis de swiper dans le vide — un vrai rendez-vous en personne, dans les 18 heures, ou ça expire. »**

Différences assumées vs Tinder/Bumble/Thursday/Timeleft :
- **Pas de swipe, pas de chat infini, pas de match qui dort.** On se déclare **disponible** sur un **créneau** (heure
  + lieu sur une carte + rayon), quelqu'un propose un **RDV réel** (« Clutch »), l'autre accepte → **Verrou** → on se voit.
- **Fenêtre de 18 h max** : tout est spontané, rien ne se planifie à 3 semaines.
- **Vocabulaire propre** : Clutch / Verrou / Rendez-vous (jamais match/swipe/like).
- **Sécurité au centre** (cœur = femmes) : check-in GPS « j'y suis », score de fiabilité, cooldown anti-relance après
  refus, SOS, certification selfie, signalement.
- **« La Forteresse »** (la brique technique différenciante) : un **moteur espace-temps** qui empêche les configs
  physiquement incrédibles. Deux garanties : (1) une personne ne peut pas être à 2 endroits en même temps
  (exclusion) ; (2) **cône de causalité** — ta dispo {position GPS · lieu · rayon · heure} doit être CRÉDIBLE :
  tu dois pouvoir physiquement être au point de RDV à l'heure dite, sinon tu n'es pas proposable là. Version
  dynamique en cours : la fenêtre **se réduit selon ta position GPS réelle dans le temps** (si tu ne bouges pas,
  l'heure recule). Anti-triangulation : on ne montre jamais la distance à une personne, seulement le temps.
- Modèle éco visé : **freemium**, prix égaux H/F (gratuité femmes abandonnée pour raison éthique), features premium
  différenciées par usage (CHF ~19.90/mois en hypothèse).

État actuel : **app fonctionnelle en TestFlight** (auth, profils, carte, flow Clutch complet, Verrou, feedback,
modération de contenu client+serveur, events de groupe, Test Lab interne). Built en solo (fondateur non-dev + IA).
Réseau encore froid (0 utilisateur réel — test avec des bots). **Le fondateur estime la complexité de Clutch comme
élevée (8/10).** Challengez honnêtement cette estimation en la comparant à Uber, Tinder, BlaBlaCar et Citymapper.

## CE QU'ON VEUT DE VOUS (audit en 6 volets)

### 1. CONCURRENTS — qui fait déjà ça ?
Recensez les apps/produits **réellement comparables** (spontané, en personne, fenêtre courte, anti-swipe) — mondiaux
et européens. Citez-les nommément (ex. Thursday, Timeleft, IRL, Pie, 222, Honeypot, Meeting/Happn « live », Sortir,
applis « apéro/dîner entre inconnus », « Softday » si ça existe…). Pour chacune : ce qu'elle fait, où elle marche/échoue,
si elle a une brique « causalité physique » comme la Forteresse (probablement aucune). **Y a-t-il un trou de marché réel,
ou est-ce un cimetière d'apps mortes ?** Soyez francs.

### 2. FAISABILITÉ & COMPLEXITÉ TECHNIQUE
Le fondateur estime Clutch à 8/10. **Challengez cette note honnêtement** face à Uber, Tinder, BlaBlaCar, Citymapper. Situez la complexité réelle de Clutch (moteur géo
temps-réel + cône de causalité + sécurité + anti-abus) par rapport à : Uber, Tinder, Doodle, BlaBlaCar, Citymapper.
Qu'est-ce qui est DÉJÀ résolu par des libs/services (geocoding, maps, push, RLS) vs ce qui est vraiment dur
(estimation de trajet multimodale, forteresse dynamique GPS, anti-triangulation, modération à l'échelle) ? Le risque
technique #1 ?

### 3. ADOPTION — les gens vont-ils l'utiliser ?
Le pari : les gens préfèrent un VRAI RDV bientôt à du swipe infini. **Est-ce vrai, ou les gens AIMENT scroller ?**
Quels sont les vrais freins (friction de se déclarer dispo, peur de l'engagement en personne, masse critique,
sécurité femmes, « je ne suis jamais prêt là maintenant ») ? Quels critères font qu'une femme de 23 ans à Lausanne,
seule un soir, l'ouvre une 2e fois ? Le problème de l'**œuf-poule masse critique** (sans gens dispo = vide = on part) :
comment d'autres l'ont résolu (events comme amorce ? heures « golden » ? villes denses ?) ?

### 4. POTENTIEL & PRÉVISIONS CHIFFRÉES par région (⚠️ partie LA PLUS IMPORTANTE — soyez RIGOUREUX, pas de chiffres ronds en l'air)
Donnez de VRAIES prévisions, pas des estimations vagues. Pour CHAQUE échelle (Lausanne · Canton de Vaud · Suisse
romande · Suisse · **pays francophones (= France + Belgique francophone + Suisse romande + Luxembourg + Québec francophone)** ·
Europe occidentale · monde), donnez **4 scénarios — MAUVAIS / MOYEN / BON /
EXCELLENT** avec, pour chacun :
- **MAU (utilisateurs actifs mensuels)** à **M3 · M6 · M12 · M24** (4 échéances, courbe de croissance, pas un seul chiffre).
- **% de probabilité** que vous assignez à CHAQUE scénario (les 4 doivent sommer à 100 %).
- **La rétention** (D1 / D30) supposée et le **ratio dispo-simultanés / inscrits** un soir typique.
- **La MÉTHODE** : sur quelles données réelles vous basez-vous (population de la zone, % cible 18-35 célibataires,
  taux de pénétration observé sur des apps comparables — Tinder, Thursday, Timeleft — à un stade équivalent, CAC, viralité k).
  Citez les chiffres réels des comparables quand vous les connaissez.
- Le **point de bascule** chiffré : masse critique minimale par ville (inscrits ET dispo simultanés un soir) en dessous
  de laquelle l'app meurt, et au-dessus de laquelle elle s'auto-entretient.
**Si vous donnez des chiffres ronds sans méthode, c'est un échec.** On veut une fourchette défendable + l'hypothèse derrière.
**Si une donnée réelle manque, donnez une hypothèse EXPLICITE et écrivez « hypothèse » — pas une pseudo-certitude.**

### 5. LANCEMENT 2026 — la meilleure stratégie
On n'achète plus des affiches à 1M. En 2026, pour une app sociale locale à effet de réseau, quelle est la MEILLEURE
approche ? Challengez ces options : **teaser mystère** (logo sablier partout pendant des semaines + date, façon
« hype », idée de Shirley) · **business angel** vs bootstrap · **micro-influenceurs locaux** · **une seule ville
hyper-dense d'abord** (Lausanne, campus, soirées) vs plusieurs · events réels comme amorce. Donnez UNE séquence de
lancement recommandée, étape par étape.

### 6. BUDGET pub + maintenance (chiffré)
Proposez un budget réaliste pour un lancement Lausanne (3-6 mois) : acquisition (social/TikTok/Insta/micro-influenceurs,
CAC estimé), création de contenu, et **maintenance** (serveurs Supabase, push, modération, support). Fourchettes en CHF.
Quel est le coût RÉEL de « faire vivre » la masse critique d'une première ville ?

### 7. LA FORTERESSE est-elle un vrai MOAT, ou juste un outil interne ?
Techniquement la Forteresse est originale. Mais **commercialement** : est-ce une vraie barrière à l'entrée (un
concurrent ne peut pas copier), ou surtout un **outil de qualité produit interne que l'utilisateur ne percevra
jamais** ? Donnez : valeur perçue utilisateur (faible/moyenne/forte) · valeur produit interne · défendabilité du moat.
Le fondateur surestime-t-il l'avantage compétitif de la Forteresse ?

### 8. POURQUOI Clutch pourrait MOURIR malgré un bon produit ? (la question qui tue)
Donnez les **5 raisons d'échec les plus probables** (liquidité/masse critique · sécurité femmes · comportement humain
& habitude · économie unitaire/CAC · concurrence indirecte : WhatsApp, Insta, amis, Meetup), **classées par probabilité**,
et dites **LAQUELLE est la plus probable** + ce qu'il faudrait pour la désamorcer.

## FORMAT DE SORTIE (impératif)
1. **Verdict en 3 lignes** (le projet a-t-il une vraie chance ? oui/non/à conditions).
2. **Concurrents** : tableau (nom · ce qu'ils font · forces · faiblesses · ont-ils la « forteresse » ?).
3. **Complexité** : note /10 justifiée + comparaison Uber/Tinder + risque technique #1.
4. **Adoption** : 3 freins majeurs + 3 leviers + la réponse au problème masse critique.
5. **Scénarios** : tableau 4 scénarios × 7 régions. **Inclure M3/M6/M12/M24 dans CHAQUE cellule** (ou un sous-tableau par région) + la proba de chaque scénario + la condition de bascule. Ne PAS simplifier.
6. **Lancement** : la séquence recommandée (numérotée) + le piège à éviter.
7. **Budget** : fourchettes CHF (acquisition / contenu / maintenance) pour Lausanne 3-6 mois.
8. **Les 3 vérités dures** que le fondateur ne veut pas entendre.
Chiffré, sourcé quand possible, sans complaisance.

---

FIN DU BLOC ☝️ — colle-le tel quel dans GPT, puis dans Grok. Renvoie-moi les 2 réponses, je les re-challenge.
