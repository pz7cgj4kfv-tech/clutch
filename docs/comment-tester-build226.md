# 🧪 Comment tester — build 226 (0x1e6) + le cockpit

> Tout ce qu'on a fait dans la session du 30.06, et comment l'éprouver. Web à jour ~1-2 min après push.
> Pour le natif : Xcode → Archive → Upload (build 226) ; sinon teste sur le web (pz7cgj4kfv-tech.github.io/app2).

## A. 🏙️ LE COCKPIT — `/clutch-city` (testable tout de suite, web ou tél)
1. Règle **Agents / % femmes / Seed** → **▶︎ Lancer**. La ville s'anime (🌸 ♀, 🔵 ♂, 🟢 en RDV).
2. Le **🐓 COQ** (droite) compte les trous en direct. Clique une **alerte** → le film saute à l'instant du bug.
3. Clique **🏰 Forteresse permissive ↔ CORRIGÉE** → tous les compteurs **fondent à 0** (« X RDV impossibles bloqués »). Re-clique pour revoir les trous.
4. **Curseur du temps** = avance/recule le film · **Vitesse** = ×1→×20 · même **seed** = même film.
5. Change le **seed** ou le **% femmes** → autres scénarios. (Rapport texte aussi : `npx tsx scripts/clutch-city.mts 1000 7 50`.)

## B. 🗓️ LA PROTECTION ENCHAÎNEMENT (le trou #1) — à 2 téléphones / Test Lab
> But : vérifier que la forteresse t'alerte si tu acceptes un RDV que tu ne peux pas enchaîner.
1. Aie **un RDV confirmé** (ex : via Test Lab « Je clutche David » puis accepte, ou un event) à **20h30**.
2. Reçois/accepte un **2ᵉ clutch** à **~22h30 dans un lieu LOIN** (autre ville).
3. **Attendu** : au moment d'accepter → toast **« ⚠️ Enchaînement serré : ~X min de trajet, ~Y min libres »**.
   - Si les 2 RDV **se chevauchent** (même heure) → c'est l'autre garde-fou : carte **⏸ en pause** + « tu as déjà un RDV à cette heure » (déjà en place).
   - ⚠️ Pour l'instant l'alerte est à l'**ACCEPTATION** seulement. Côté **ENVOI** (quand TOI tu proposes) = prochaine étape.

## C. 🐛 LES BUGS CORRIGÉS (build 223→226)
- [ ] **Modifier un créneau** (Mes créneaux → ✏️ Modifier) garde **position + heure + rayon** (avant : ça remettait à ta position actuelle).
- [ ] **Bouger le rayon** ne déplace **plus** ta position/pin.
- [ ] **Ouverture de la carte** : pas ultra-zoomée — tu vois ~**5 km** (une petite ville), même avec un rayon de 1 km.
- [ ] **Recherche de lieu** (Sion…) : se pose à ~**10 km** de contexte, plus collée à 1 km.
- [ ] **Messages forteresse clairs** : « Tu as bougé de ~X depuis **ton lieu publié** · Les recaler sur ta position ? » + **Laisser / Recaler sur moi**.
- [ ] **Plus d'écran blanc** qui flashe au démarrage (fond prune).
- [ ] **Post-RDV** : à « Terminer », l'écran feedback a les **3 issues** (à l'heure / présent / lapin) **+ une ⭐** « Garder X en favori » (fini la 2ᵉ fenêtre séparée). Le favori atterrit dans l'onglet **Favoris**.
- [ ] **Départ proposé +1h** par défaut · **créneaux toutes les 15 min**.
- [ ] **Icônes catégories d'events** (Affiner → Catégories) = les badges de Mel.

## D. ⏳ PAS ENCORE FAIT (à venir / sur device)
- Curseur de rayon **fluidité** 1→5 km (à régler en te voyant le manipuler — le ressenti).
- **Autocomplete** de la recherche de lieu (propositions au fur et à mesure).
- **Refonte page Organiser un event** (icône Mel, titre, places impaires/paliers, description guidée, dates intelligentes).
- Protection enchaînement **côté envoi** + **events**.

→ Note tes retours en vrac, je trie et je corrige.
