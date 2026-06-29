# 🧍 CLUTCH CITY — Étude 1 : LE COMPORTEMENT HUMAIN COMPLET (l'espace d'actions)

> « La première étude : quel est le comportement d'une personne sur Clutch qui utilise TOUTES les options ? »
> (David 30.06). Catalogue **exhaustif** de tout ce qu'un humain peut faire — fondé sur le **vrai code**
> (chiffres réels, pas inventés). C'est la **fondation** : un agent du simulateur = un humain qui pioche
> dans CETTE liste. Si une action manque ici, l'agent ne saura pas la faire → on la complète AVANT de coder.
> 👉 David : relis et dis-moi ce que j'ai raté. C'est le contrat de départ.

---

## 🏷️ Vocabulaire & 2 briques
- **La FORTERESSE** = le modèle espace-temps (les règles du jeu : `D+R ≤ portée(Δt)`, horizon 18h, exclusion).
- **Le validateur logique** = le moteur qui **surveille** la forteresse et **crie** quand un invariant casse.
  → **Nom de code proposé : « le COQ »** (clin d'œil au prouveur *Coq* + « Cohérence · Ordre · Quanta »).
  Alternatives : *la Sentinelle* · *Logicoque* (ton mot). À trancher — je pars sur **le COQ** en attendant.

---

## 📊 LES CHIFFRES RÉELS (extraits du code — le cadre dur)
| Règle | Valeur | Source |
|---|---|---|
| Horizon de dispo | **18 h** | `HORIZON_H` |
| Marge mini avant début | **15 min** | `MIN_LEAD_MIN` |
| Début par défaut | **+1 h** | `DEFAULT_LEAD_MIN` |
| Durée créneau | **30 min → 18 h** | `MIN/MAX_DURATION_MIN` |
| Rayon | **1 → 50 km** | `RAYON_MIN/MAX_KM` |
| Créneaux simultanés | **max 3** (premium = +) | « cap 3 » |
| Clutchs actifs simultanés | **♀ 20 · ♂ free 3 · premium 5** | l.2264 |
| Clutchs reçus/jour (♀) | **5** | `MAX_CLUTCHS_PER_DAY_WOMEN` |
| Cooldown après refus | **48 h** | `COOLDOWN_MS` |
| Pas des créneaux | **15 min** (variable) | `SLOT_STEP_MIN` |
| Durée RDV défaut | **2 h** (à câbler dans le moteur) | walkthrough §9 |
| Paliers premium | Au · Rh · At | `account_type` |

---

## 1. IDENTITÉ (état quasi-statique de l'agent)
- Genre (H / F / non-binaire) · âge · photo · intérêts/tags · métier (mode Pro).
- Plan : **free** ou **premium** (Au/Rh/At) → change les plafonds + mode invisible.
- Scores : **fiabilité** (étoiles, trust_score), **CD/compatibilité** (dots), historique no-shows, GPS check-ins.
- Compte spécial : **Clutch Driver** (business, à part — pas un agent social standard).

## 2. SE METTRE DISPO (le plus gros levier de stress forteresse)
- **Ouvrir un créneau** : choisir **lieu** (= pin sur carte) · **rayon** (1-50 km) · **début** & **fin** (dans l'horizon 18h) · **modes** recherchés (Romance/Amitié/Pro/Famille) · **mood** (soft).
- **Où** : *là où je suis* (GPS) · *ailleurs* (je pose le pin autre part) · **plusieurs endroits** via plusieurs créneaux.
- **Multi-créneaux** : **1, 2 ou 3** créneaux (chevauchants OU non) → la dispo est une **intention**, l'occupation (RDV) est exclusive.
- **Moments rapides** : boutons « ce soir / cette nuit / demain matin… » (calculés maintenant→+18h, exclusifs).
- **Dynamique** : le **temps avance** (le créneau se rapproche → portée se resserre) · je peux **me déplacer** (GPS bouge → dérive → recalage) · **modifier** un créneau · **retirer** la dispo · **fermer** un seul créneau.
- **Premium** : **mode invisible** (explorer sans être vu) · plus de créneaux / clutchs.

## 2bis. PRÉFÉRENCES & FILTRES (⚠️ « il faut absolument TOUT partout » — David)
> Ce qui décide **QUI VOIT QUI** (avec la forteresse) + **le classement** (avec l'algo). Valeurs réelles du code :
- **Genre recherché** (`seekGender`) : **tous / homme / femme** (filtre **symétrique** : si je cherche F et que F cherche M, on ne se voit pas).
- **Mode de rencontre** (`looking_for`, niveau profil) : **❤️ Romantique · 🤝 Amical · 💼 Pro/Réseau · ✨ Tout**.
- **Modes par créneau** (`available_modes`) : romantic / friend / **pro** (filtre **métier**) / **parent** (exclusif).
- **Mood** (`seekMood`, soft) : café/balade/apéro/dîner/sport/culture — **n'exclut jamais**, oriente.
- **Distance de recherche** (`seekDist`) : **quartier / ville / région**.
- **Tranche d'âge** (premium) : min–max.
- **Mode réception** (♀, `recepMode`) : **🟢 Ouverte · 🟡 Sélective · 🔴 Pause** — gouverne qui peut m'envoyer un clutch.
- **Filtres EVENTS** : **catégories** (7 icônes Mel, multi-select, 0 = toutes) · **moment de la journée** · **genre de l'event** (tous/F/X) · **limite d'âge** de l'event.
- **Premium** : « Filtres de recherche » avancés (genre + âge + distance) + mode invisible.

## 2ter. L'ALGORITHME (qui voit qui · classement) — `lib/clutch-algo.ts` (source de vérité)
- **Visibilité** = forteresse (intersection espace-temps) **∩** filtres ci-dessus. Si l'un coupe → invisible.
- **Score de classement** = `scoreProfile` : **compatibilité 0.5** (intérêts communs) · **proximité 0.3** · **fiabilité 0.2**.
- **Thermostat de densité** : sous 30 dispos = éteint ; au-dessus (→2000) on déplace du poids de la **proximité vers la compatibilité** (foule → on privilégie le match). `isClutchable()` filtre les non-éligibles.
- ⚠️ **Le simulateur DOIT appeler CE module** (pas un algo dupliqué) — sinon il teste un faux système. `generatePopulation()` existe déjà → réutilisé pour peupler la ville.

## 3. DÉCOUVRIR (présences & events)
- **Parcourir** les présences (qui est dispo et compatible — filtré + classé par l'algo ci-dessus).
- **Ouvrir un profil** · **mettre en favori** · **bloquer** · **signaler**.
- Voir un agent **dépend de la forteresse ∩ filtres ∩ algo** (cf. 2bis/2ter).

## 4. CLUTCHER (envoyer une invitation)
- Choisir **qui** · **quel lieu** (dans ou **hors** zone du receveur → alerte, jamais bloquer [reco]) · **quelle heure** · **intention** (optionnelle) · **message** (optionnel) · **durée** (sinon 2h défaut).
- **Refus serveur possible** (RPC `create_clutch`) : self · bloqué (2 sens) · **cooldown 48h** · **inbox pleine** · **doublon pending** (`pair_busy`). Prod = message neutre, Test = vraie raison.
- Plafond : pas plus de **N clutchs actifs** (3/5/20 selon genre/plan).

## 5. RECEVOIR UN CLUTCH (À répondre)
- **Accepter** (🔒 → pose le **Verrou**) · **Refuser** (✕ → libère, crée un cooldown 48h) · **Contre-proposer** (autre lieu/heure) · **Ignorer** (laisse **expirer**).
- ♀ : plafond **5 reçus/jour**. Inbox pleine → refus côté envoyeur.

## 6. LE VERROU → LE RDV
- **J'y suis** : **check-in GPS** (~100 m, -15 min avant) → débloque « Terminer ».
- **Modifier le lieu** du Verrou · être **en retard** · **annuler** (→ recrée un créneau libre ? à décider) · **Terminer**.
- **Feedback post-RDV** (3 issues, décision Mel+David) : **à l'heure / présent / lapin** + **⭐ garder en favori ?** *(à implémenter — walkthrough §7)*.
- Double feedback **caché 3h** (symétrique) → met à jour la fiabilité.

## 7. ÉVÉNEMENTS
- **Créer** (jusqu'à **3** ? cap à fixer ; premium = plus) : **icône** (Mel) · **titre** · **lieu** (autocomplete) · **event fixe** (oui/non) · **dates** intelligentes (maintenant→+18h) · **durée** · **places** (pairs/impairs + **paliers** : déjà combien / min pour avoir lieu / max ; ex pétanque 8, places 5-8 actives que si pleines) · **limite d'âge** (option) · **prix** (gratuit/5/10/20…) · **description** guidée (transport, parking, à amener, niveau).
- **Rejoindre** / **quitter** un event · **annuler** son event · **discuter** (chat — manque) · l'event **se remplit** dynamiquement (waitlist si plein).
- **Mes events** apparaissent dans **Clutchs → Prochain RDV** (en avant) + **alerte** avant + (Phase 2) **GPS 30 min avant** → forteresse vérifie que j'y arrive.
- ⚠️ Un event **EST un engagement** comme un clutch → il occupe l'agenda (cf. multi-engagements).

## 8. SÉCURITÉ & MODÉRATION
- **SOS** · **bloquer** (hard, 2 sens) · **signaler** · **certification selfie** · modération du texte d'intention.

## 9. DYNAMIQUE TEMPORELLE (ce qui « vit » tout seul)
- Le **temps avance** · créneaux **expirent** · cooldowns **s'éteignent** · clutchs pending **expirent** · l'agent **se met online/offline** · **se déplace** (GPS) · la **masse locale** monte/descend (heure, jour).

---

## 🎲 LE PANEL STATISTIQUE (les curseurs du simulateur)
Pour chaque axe ci-dessus, une **distribution réglable** (c'est ça « toutes les possibilités ») :
- **Population** : N online (slider 100→10 000), %H/F, distribution d'âge, %premium.
- **Dispo** : proba d'ouvrir 0/1/2/3 créneaux · *ici / ailleurs / multi-lieux* · distribution rayon · durée · heure de début (collée à maintenant vs étalée sur 18h).
- **Mobilité** : %qui se déplacent, vitesse, fréquence.
- **Clutch** : proba d'envoi/h · cible (compatibilité vs aléatoire) · proba d'accept/refus/contre/ignore · délai de réponse.
- **Events** : proba de créer · taille · prix · remplissage · annulation.
- **Honnêteté** : %à l'heure / retard / lapin (nourrit la fiabilité).
- **Churn** : online↔offline, arrivées/départs dans la fenêtre.
- **Horloge** : vitesse (×1 → ×3600), **pause**, **retour arrière** (seed rejouable).

---

## 🛡️ CE QUE LE COQ SURVEILLE (invariants → alertes)
À chaque tick, sur chaque agent et chaque paire d'engagements :
1. **Horizon** : aucun engagement hors [maintenant, +18h].
2. **Portée** : tout RDV accepté respecte `D+R ≤ portée(Δt)` (pin atteignable).
3. **Enchaînement (le trou #1)** : pour 2 engagements A→B d'un même agent, `fin(A)+trajet(A→B) ≤ début(B)`. Sinon **ALERTE**.
4. **Exclusion** : pas 2 occupations (RDV) qui se chevauchent dans le temps.
5. **Plafonds** : ≤3 créneaux · ≤N clutchs actifs · ≤5 reçus/jour ♀ · cooldown 48h respecté.
6. **Cohérence sociale** : pas de clutch sur soi · pas via un blocage · inbox jamais > max.
7. **Places events** : jamais > max · paliers cohérents · pas de double-inscription.
8. **Filtres cohérents** : visibilité **symétrique** (si A voit B via les filtres, le clutch A→B respecte aussi les filtres de B : genre, mode, âge, distance, réception ≠ Pause). Pas de clutch qui contourne un filtre. Classement = `scoreProfile` réel (jamais un tri ad hoc).
→ Toute violation = **alerte horodatée + état rejouable (seed + tick)** + explication (règle dure, puis IA).

---

## ➡️ PROCHAINE ÉTAPE (dès que tu valides/complètes ce catalogue)
1. Traduire ce catalogue en **types** (`lib/sim/types.ts` : `AgentState` + `Action`) — la grammaire des agents.
2. **Moteur de pas** `lib/sim/step.ts` (pur, seedé) qui applique les actions via la **vraie** logique forteresse.
3. **Le COQ** `scripts/coq.mts` (validateur exhaustif) + alertes live dans la sim.
4. **Cockpit** `/clutch-city` : carte Lausanne, ~10 profils suivis en direct, horloge (vitesse/pause/retour), graphes, panneau d'alertes du COQ, « film » rejouable.
