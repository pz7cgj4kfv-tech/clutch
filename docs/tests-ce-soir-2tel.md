# 📱📱 Tests CE SOIR — 2 téléphones (David × sa mère)

> Objectif : éprouver la **forteresse** et le **flow clutch/event** en conditions réelles, à 2 comptes.
> Note tes retours en vrac (verbatim) → je trie. ⚠️ Pour avoir les fixes (départ +1h, friction, créneaux 15 min,
> icônes events), mets l'app à jour (build 222) **ou** teste sur le web : pz7cgj4kfv-tech.github.io/app2.
> A = ton tél · B = tél de ta mère.

## 1. Mise en ligne / créneaux
- [ ] A et B se mettent dispo. Le **départ proposé** est ~+1h (pas +5 min) ? Créneaux **toutes les 15 min** ?
- [ ] A pose un créneau **ce soir**, B un créneau **ce soir** aussi, qui **se chevauchent** dans le temps.
- [ ] **Modifier** un créneau (A) : garde-t-il la **position + l'heure** d'origine ? *(bug connu — à vérifier)*

## 2. Curseur de rayon (forteresse)
- [ ] A : départ **dans 1h**, pin sur soi → le rayon monte **large** sans blocage ?
- [ ] De **1 à 5 km** : fluide ? Après 5 km vers la droite : **résistance** ? Vers la gauche : **libre** ?
- [ ] A rapproche l'heure (départ bientôt) → le **plafond se resserre** tout seul ?

## 3. Clutch A → B (le cœur)
- [ ] A voit B dans les présences (et inversement) quand leurs zones/horaires collent.
- [ ] A clutche B avec un lieu **dans** la zone de B → pas d'alerte. Avec un lieu **hors** zone de B → **alerte** « ce lieu est à X km du centre de B » (mais ça **laisse** envoyer ?).
- [ ] B reçoit dans **🔥 À répondre** → **🔒 accepte** / **✕ refuse**. Le verrou se pose chez A et B ?
- [ ] Refus → A peut **contre-proposer** ?

## 4. 🌌 LE TEST CLÉ — enchaînement (forteresse multi-engagements)
> C'est le trou logique #1. À tester pour confirmer.
- [ ] A a **déjà un RDV/event confirmé à 20h30** (durée 2h par défaut → occupe jusqu'à ~22h30).
- [ ] A essaie de clutcher B **à 22h30 dans un lieu LOIN** (autre ville).
- [ ] **Attendu (cible)** : alerte « tu ne pourras pas enchaîner — ton RDV de 20h30 finit à 22h30 + trajet ». **⚠️ Aujourd'hui ce n'est PAS encore vérifié** → note ce qu'il fait réellement (il laisse passer ?).

## 5. Events
- [ ] A crée un **événement** (page Organiser). Les **dates proposées** sont-elles cohérentes avec l'heure (ce soir / cette nuit / **demain matin**) ?
- [ ] L'event créé apparaît-il dans **Clutchs → Prochain RDV** (mis en avant) ? Est-il **retrouvable** dans Événements (pas perdu au milieu) ?
- [ ] B **rejoint** l'event de A → place décrémentée ? Les **paliers de places** (min pour avoir lieu) marchent-ils ? *(refonte à venir)*

## 6. Post-RDV
- [ ] A et B vont au bout : **J'y suis** → **Terminer**.
- [ ] **Attendu (cible)** : écran feedback **à l'heure / présent / lapin** + **étoile favori**. *(⚠️ pas encore implémenté — note l'absence.)*

## 7. Divers à l'œil
- [ ] **Écran blanc qui flashe** au démarrage ?
- [ ] **Carte** : zoom d'ouverture trop serré ? Cercle « mangé » ? Zoom qui s'emballe quand tu déplaces ?
- [ ] **Recherche de lieu** : propose-t-elle au fur et à mesure (Sion…) ou faut-il Enter ? Zoom après recherche trop fort ?
- [ ] **Messages forteresse** clairs (« 69 km de ta zone », « garder/recaler ici ») ou confus ?

---
### Priorité si peu de temps
1. **§4 enchaînement** (le trou logique) — note exactement ce qu'il autorise.
2. **§3 clutch A→B** complet (accepter/refuser/verrou).
3. **§2 curseur** (fluidité + asymétrie).
