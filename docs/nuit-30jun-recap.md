# 🌙 Récap de la nuit (30.06 → 01.07) — pour David à son réveil

> Travail autonome pendant que tu dormais. Tout est **buildé vert + poussé + iOS synced** (builds 232→236).
> Web à jour. Pour le natif : **Xcode → Archive → Upload le build 236** (il contient tout).

## ✅ Ce qui a été fait

### 1. Ta question (events × forteresse) — RÉPONDU + IMPLÉMENTÉ
Décision : un event est **flagué « ⛔ trop loin pour l'heure » + grisé** quand tu ne peux plus l'atteindre depuis
ta position GPS pour son heure (`distance(toi→event) > portée(temps restant)`). **On ne touche JAMAIS au rayon**,
on prévient. Quand tu t'éloignes (Lausanne→Genève) ou que le temps passe, des events deviennent injoignables tout
seuls — sur la **liste** (badge + opacité) ET la **carte 🗺️** (point creux pointillé). (build 234)

### 2. Page event — places refondues (ta frustration « aucune modif faite »)
2 réglages : **« Ça a lieu dès N »** (seuil de lancement) + **« Places max »**, en steppers ±, **NOMBRES IMPAIRS
autorisés** (ex : 3 pour une pétanque) + ligne d'explication. Min persisté via tag (sûr). Description guidée
enrichie (transport / parking / à boire-manger). (build 234-235)

### 3. Events — le lot complet (vu plus tôt mais récap)
Badge 📅 sur l'avatar (qui a un event) · couleurs créneaux 1/2/3 · tag « Créneau N » coloré + distance sur chaque
event · **générateur 🧪** (events test placés dans tes cercles, hôtés par des bots = zéro conflit, visibles en Démo,
+ 🧹 pour nettoyer) · **carte 🗺️** (cercles colorés + events par créneau).

### 4. i18n (anglais) — lot ciblé SÛR
« Créneau »→« Slot » (liste, tag event, carte) · « moi »→« me » + helper carte bilingue · **9 toasts de
sauvegarde profil** bilingues (Saved/Bio/Name/Job/Gender/Height/Photos/SOS…). (builds 235-236)

## ⚠️ i18n — décision honnête (à lire)
Le « tout traduire » = **~640 strings** = chantier multi-sessions. Je n'ai **PAS** fait de sweep massif cette nuit :
en autonomie sans personne pour rattraper un bug, un mass-replace risquerait de **casser le build/l'UI** jusqu'au
matin (règle « build vert obligatoire »). J'ai fait les strings **que tu vois** + les miennes de la nuit. Le reste =
à faire en **session attendue**, par écran, avec `node scripts/i18n-hardcoded.mts` (outil existant) + le guide
`docs/i18n-guide.md`. ~80% du gros volume restant = panneaux **admin/Test Lab** (à migrer en dernier).

## 📒 Backlog capté (pas fait, pour décider ensemble)
- Tri events « fiabilité » (besoin de joindre le profil hôte).
- Page event : **icône de Mel** au lieu de l'emoji · **dates intelligentes** (dayParts au lieu d'Aujourd'hui/Demain).
- Paliers de places (tournoi : places 5-8 actives que si pleines) — au-delà du min/max actuel.
- Wording « 135 km depuis ton lieu publié » à reformuler.

## 📱 À faire à ton réveil
1. **Xcode → Archive → Upload le build 236** sur TestFlight.
2. Teste : génère des events (🧪), regarde la carte (🗺️), déplace-toi → events qui se grisent, places min/max impaires.
3. Balance les retours en vrac, on enchaîne.
