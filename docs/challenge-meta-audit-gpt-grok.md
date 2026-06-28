# 🌍 AUDIT MÉTA CLUTCH — le vrai (v4 · 28.06.2026)

> ⚠️ CE PROMPT ANNULE ET REMPLACE tous les audits précédents. Dis à l'IA : « ignore tout audit Clutch précédent, on
> recommence proprement ». On veut un **VRAI audit de ~10 pages**, dense, **DATÉ**, avec de vraies **PROJECTIONS DE
> REVENUS** (pas des coûts fantaisistes), **PLUSIEURS options** de lancement (pas une seule vérité imposée), et des
> **hypothèses explicites** (« hypothèse : … » dès qu'une donnée manque). À coller dans GPT, puis dans Grok.

COLLE À PARTIR D'ICI 👇

---

Tu es un **cabinet d'audit** (5 experts : analyste concurrentiel · finance/revenus early-stage · growth/go-to-market ·
product/adoption · tech). Tu produis un **rapport long (~10 pages), structuré, daté, chiffré, sans complaisance.**
Trois règles dures :
1. **Donne PLUSIEURS scénarios/options, jamais une seule « bonne » réponse.** C'est un produit social et dynamique en
   2026 — il n'y a pas de vérité unique. Pour chaque grande question, propose 2-4 voies avec leurs trade-offs.
2. **Quand une donnée réelle te manque, écris « hypothèse : … » et donne ta fourchette.** Pas de pseudo-certitude.
3. **Date chaque section** (mois/année de la donnée ou de l'estimation).

## CE QU'EST CLUTCH (lis bien, il y a un point souvent mal compris)
App mobile de **rencontre SPONTANÉE EN PERSONNE**, d'abord **Lausanne / Suisse romande**.
Pitch : **« Finis de swiper dans le vide — un vrai rendez-vous en personne, dans les 18 h, ou ça expire. »**
Pas de swipe, pas de chat infini : on se déclare **dispo** (heure + lieu sur carte + rayon), quelqu'un propose un **RDV
réel** (« Clutch »), l'autre accepte → **Verrou** → on se voit. Sécurité au cœur (femmes) : check-in GPS, score de
fiabilité, cooldown anti-relance, SOS, certification.

**⚠️ LA « FORTERESSE » N'EST PAS UN ARGUMENT MARKETING.** C'est un **moteur INTERNE** (cône de causalité espace-temps)
qui empêche les configs physiquement impossibles (être à 2 endroits à la fois ; se déclarer joignable à un lieu qu'on ne
peut pas atteindre à temps). **L'utilisateur ne la voit jamais comme une feature.** Sa SEULE manifestation visible : un
curseur de rayon qui **rougit progressivement** quand on pousse une config peu crédible (pur ressenti visuel, sans texte).
**Ne perds donc pas de temps à juger si « la Forteresse est un moat marketing » — ce n'est pas la question.** La vraie
question : améliore-t-elle la QUALITÉ des rencontres (moins de faux RDV, plus de confiance) — valeur interne uniquement ?

État (28.06.2026) : **app fonctionnelle en TestFlight** (auth, profils, carte, flow Clutch complet, Verrou, feedback,
modération client+serveur, events de groupe, Test Lab). **L'app a encore beaucoup de bugs — on n'est PAS prêt à chercher
de vrais utilisateurs.** Built en solo (fondateur non-dev + IA). Le fondateur estime la complexité **technique à construire**
à 8/10 — challenge honnête vs Uber, Tinder, BlaBlaCar, Citymapper.

Modèle éco visé : **freemium**. Sources de revenus à projeter : (a) **abonnements** (paliers ~10 CHF et ~20 CHF/mois) ·
(b) **partenaires** (bars/cafés/events sponsorisés, commission, mise en avant) · (c) **clutchs/crédits** (ex. crédits
d'envoi pour hommes, boosts) · (d) **events payants** éventuels. Prix égaux H/F.

## LE RAPPORT (8 volets — ~10 pages)

### 1. CONCURRENTS (daté)
Recense les apps réellement comparables (spontané/IRL/fenêtre courte/anti-swipe), mondiales et européennes, avec
**dates** (lancement, pivot, fermeture, levées). Nomme-les (Thursday, Timeleft, IRL, Pie, 222, Honeypot, Happn « live »,
apéros/dîners entre inconnus, etc.). Tableau : nom · ce qu'ils font · traction connue (chiffres + date) · ce qui marche/échoue.
**Quelqu'un fait-il déjà le « cône de causalité » / la contrainte physique ? Trou de marché réel, ou cimetière ?**

### 2. FAISABILITÉ & COMPLEXITÉ TECHNIQUE (à CONSTRUIRE)
Note /10 **justifiée** la complexité de Clutch (moteur géo temps-réel + cône + sécurité + anti-abus) vs Uber/Tinder/
BlaBlaCar/Citymapper. Distingue ce qui est **déjà résolu par des libs** (maps, push, RLS, geocoding) de ce qui est
**vraiment dur** (cône dynamique GPS, anti-triangulation, modération à l'échelle, estimation de trajet multimodale). Risque #1.

### 3. ADOPTION
Plusieurs angles. Les gens préfèrent-ils un vrai RDV bientôt, ou aiment-ils scroller ? 3-5 freins, 3-5 leviers. Le
problème **œuf-poule (masse critique)** : donne **2-3 façons différentes** de l'amorcer (events ? golden hours ? communauté
de filles d'abord ? B2B avec des bars ?). Pas une seule recette.

### 4. 💰 PROJECTIONS DE REVENUS (LE CŒUR — sois rigoureux, daté, chiffré)
C'est la partie la plus importante. Donne, **par scénario FAIBLE / MOYEN / FORT / EXCELLENT** (+ une probabilité par
scénario, somme = 100 %), et pour chaque échelle (Lausanne · Vaud · Suisse romande · Suisse · pays francophones
[= France + Belgique fr. + Suisse romande + Luxembourg + Québec fr.] · Europe occidentale) :
- **Le MRR (revenu mensuel récurrent) à M3 / M6 / M12 / M24** — pas un seul chiffre, une courbe.
- **La décomposition par SOURCE** : combien d'abonnés ×ARPU (paliers 10/20 CHF), combien de revenus partenaires, combien
  de revenus clutchs/crédits/boosts.
- **Les hypothèses** : MAU, % qui payent (conversion freemium typique 2-8 % — situe-toi), ARPU, churn, mix H/F.
- Et le **ARR / l'argent cumulé à 24 mois** par scénario.
Méthode : appuie-toi sur des comparables réels (Tinder/Bumble ARPU, taux de conversion d'apps freemium sociales) et
**écris « hypothèse »** quand tu extrapoles. **Pas de chiffres ronds sans justification.**

### 5. STRATÉGIES DE LANCEMENT 2026 — PLUSIEURS OPTIONS (pas une seule)
Donne **3-4 stratégies DISTINCTES**, pas une vérité unique. Pour chacune : pour qui ça marche, coût d'amorçage, risque,
vitesse, et dans quel cas la choisir. Couvre au moins : **teaser mystère** (logo sablier + date, idée Shirley) ·
**micro-influenceurs locaux** · **events réels d'abord** (à la Timeleft) · **B2B partenaires (bars) d'abord** ·
**une seule ville hyper-dense** vs **plusieurs** · **communauté noyau (ex. groupe de filles) d'abord**. Ne dis pas
« la masse critique dans une ville parce que c'est comme ça qu'on faisait » — challenge cette idée pour 2026.

### 6. LA FORTERESSE — valeur INTERNE + intégration visuelle (PAS un moat marketing)
(a) Améliore-t-elle réellement la qualité produit (moins de faux RDV, confiance) ? Valeur interne faible/moyenne/forte.
(b) **Question design** : quelle est la MEILLEURE façon de la rendre sensible à l'utilisateur **purement visuellement**
sur le curseur de rayon (toute la course qui rougit progressivement, résistance ressentie), **sans texte explicatif** ?
Donne 2-3 directions visuelles.

### 7. POURQUOI Clutch pourrait MOURIR (classé par probabilité)
5 raisons d'échec les plus probables (liquidité · friction/peur IRL · économie unitaire · concurrence indirecte
WhatsApp/Insta/amis · sécurité). Classe-les, dis LAQUELLE est la plus probable, et **comment la désamorcer** (plusieurs pistes).

### 8. VERDICT & RECOMMANDATIONS
3-5 voies possibles pour aller au bout (pas une seule), avec leurs conditions. Les 3 vérités dures. Ce que ferait un VC.

## FORMAT
~10 pages, dense, **daté section par section**, tableaux, hypothèses explicites, PLUSIEURS options partout. Chiffré
(CHF, MAU, MRR, %). Pas de coûts de maintenance fantaisistes (une app qui marche croît au bouche-à-oreille — concentre-toi
sur les ENTRÉES, pas sur des dépenses inventées).

---

FIN DU BLOC ☝️ — colle dans GPT puis Grok. Renvoie-moi les 2 rapports : Claude (moi) les croise, les challenge, et on
en fait UN document daté qui ira dans un onglet « Audit » de l'app.
