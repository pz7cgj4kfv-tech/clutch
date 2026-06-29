# ✅ Tests à faire — Build 220 (0x1e0) — TestFlight

> Liste exhaustive de tout ce qu'on a fait avant ce build. Coche au fur et à mesure.
> Pour chaque test : **où aller** · **ce qui doit se passer** · **❌ ce qui serait un bug**.
> Test Lab = bouton dev pour simuler les bots (« Je clutche David », bots en ligne, etc.).

---

## 🏰 1. FORTERESSE / CÔNE — le gros morceau (moteur unique recâblé)

> Le moteur a été entièrement refait (`lib/forteresse-engine.ts`, 1 seule inégalité `D+R ≤ portée(temps)`),
> prouvé 26/26. Tout le démarrage (curseur, pin, Suivant, confirmation) tape maintenant dessus.

### 1a. Curseur de rayon (page « Ouvrir ma fenêtre »)
- [ ] Le curseur bouge **fluide**, sans pulsations anxiogènes (curseur « décoratif », pas stressant).
- [ ] Le dégradé du curseur = **couleurs de l'app uniquement** : vert → rose → violet. ❌ jamais de rouge plein.
- [ ] Au défaut (**dans 1h, pin sur moi**) : je peux pousser le rayon **large (~25-28 km)** sans blocage.
      ❌ bug = ça bloque à 8 km alors que le RDV est dans 1h+.
- [ ] Quand je **rapproche l'heure** (départ bientôt) : le plafond du rayon **se resserre** tout seul.
- [ ] Quand je **décale plus tard** : le plafond **s'agrandit**.
- [ ] Le curseur **ne dépasse jamais** le plafond (il s'arrête à la limite = tension 10/10).

### 1b. Pin ↔ GPS (le lieu doit être atteignable depuis ma position)
- [ ] Je pose le pin **loin** de moi avec une **heure proche** → bandeau clair « trop loin de toi pour cette heure »
      + bouton **Suivant bloqué**. ❌ bug = je peux valider un lieu inatteignable.
- [ ] **Zone atteignable visuelle** : un cercle pointillé prune montre « pose ton lieu dans cette zone ».
      Il **se resserre** quand l'heure approche.
- [ ] Cas réels à retester (ceux qui buggaient avant) :
  - [ ] **18 km à ~1h** → doit être **possible** (avant : « impossible » à tort).
  - [ ] **RDV dans ~2h20, je suis au-dessus de Morges** → Genève/loin doit passer. ❌ bug = « trop loin ».
  - [ ] **« cette nuit »** (heure tardive, donc beaucoup de temps) → ne doit **pas** dire « trop loin ».

### 1c. La « monstre phrase » trop loin
- [ ] Le message « trop loin » est **court et clair**, pas un pavé. ❌ bug = phrase à rallonge confuse.

### 1d. Moments intelligents (boutons ce soir / cette nuit / demain…)
- [ ] Les boutons de moment sont **exclusifs** (1 clic = 1 fenêtre réelle).
- [ ] Aucun moment ne **dépasse 18h** (ex. « demain 13h20 » ne doit pas apparaître si > +18h).

### 1e. Créneaux multiples
- [ ] Pastille **📍 N/3 toujours visible**, y compris **0/3** au départ. ❌ bug = pastille cachée à 0.
- [ ] « + Créneau » ajoute bien une fenêtre.
- [ ] **Le créneau s'affiche dès le départ** (avant il n'apparaissait pas au 1er chargement).
- [ ] **Le créneau est bien sauvé** et **n'est pas effacé** quand le GPS se recentre (drift).

### 1f. Cône vivant (temps réel)
- [ ] Si je reste sur la page, le rayon **rétrécit tout seul** quand la fenêtre se ferme (tick ~30s).

### 1g. Canevas / mise en page
- [ ] Le bas de l'écran **ne saute pas** quand « X créneaux » apparaît (hauteurs fixes).
- [ ] Intention = **optionnelle** (plus obligatoire). On peut valider sans rien écrire.

### 1h. Bac à sable (vérif visuelle, page dev)
- [ ] Ouvre **/forteresse-lab** : les curseurs + la matrice s'affichent (plus de « page can't load »).
      Sert juste à voir toutes les possibilités du moteur d'un coup d'œil.

---

## 📍 2. CARTE & LIEU

- [ ] **Recherche de lieu par nom** sur la carte (ex. « Flon », « gare ») → résultats centrés près de moi (GPS).
- [ ] Épingler en déplaçant la carte + le rayon visible autour du pin.
- [ ] Sur la carte de présence : **l'épingle 📍 générique a disparu** (elle ne doit plus s'afficher sur tous).

---

## 🎨 3. CARTE PRÉSENCE de Mel (vraies personnes vs bots)

> Règle : **bots = carte riche** (tous les pictos, pour tester) · **vraies personnes = carte épurée de Mel**.

- [ ] Une **vraie personne** s'affiche avec la **carte de Mel** (épurée, géométrie exacte).
- [ ] Un **bot** (Test Lab) s'affiche avec **l'ancienne carte riche** (tous les badges/scores).
- [ ] Sur la carte de Mel : **prénom + âge collés** avec un **petit espace fixe** (pas aligné en colonne).
- [ ] **Ombre douce sous les cartes** (comme l'original de Mel).
- [ ] L'intention longue passe sur **2 lignes** proprement (pas de débordement).
- [ ] L'icône **genre** (femme/homme/non-binaire) et le **pin RDV** s'affichent bien.

---

## 📑 4. ONGLET CLUTCH — mini-onglets en haut

> Avant : tout en liste. Maintenant : 3 **mini-onglets** en haut.

- [ ] En haut de l'onglet Clutch : **🔥 À répondre · 📍 Prochain RDV · ⏳ En attente** avec compteurs.
- [ ] Chaque mini-onglet ne montre **que** ses cartes (À répondre = reçus ; En attente = envoyés/verrous ; Prochain RDV = confirmé).
- [ ] Chaque onglet vide a son **petit message** « rien ici ».

### Carte Clutch de Mel (dans « À répondre »)
> Test : Test Lab → **« Je clutche David »** (un bot t'envoie un clutch) → va dans 🔥 À répondre.
- [ ] La carte Clutch de Mel s'affiche : avatar + prénom + âge + lieu (2 lignes) + heure + 🔒 + ✕.
- [ ] Tap sur le **🔒 (lock)** = **accepter** → passe en Verrou. ❌ bug = rien / mauvaise action.
- [ ] Tap sur le **✕ (cancel)** = **refuser**.
- [ ] Tap **ailleurs sur la carte** ouvre le profil (sans déclencher accepter/refuser).
- [ ] Le lien **« contre-proposer »** est présent sous la carte.

---

## 🎟️ 5. EVENTS

- [ ] Onglet **Événements → Affiner → Catégories** : les **icônes de Mel** (badges on/off) remplacent les emojis.
      7 catégories : Sport · Bien-être · Culture · Gastro · Soirée · Lifestyle · Communauté.
- [ ] Tap sur une icône → elle **s'allume** (fond prune + couleur) et **filtre** les events.
      ❌ bug = icône qui ne change pas d'état / ne filtre pas.
- [ ] « Effacer » remet tout à zéro.
- [ ] **Dates des events cohérentes avec maintenant** (plus de dates passées en dur dans le catalogue).
- [ ] Les **bots** restent visibles dans les présences même en mode réel (pour que tu puisses tester).

---

## 🧪 6. TEST LAB (outil dev)

- [ ] Les **bots ont un âge** affiché.
- [ ] Le bouton **« en ligne »** d'un bot **change bien d'état** (online/offline).
- [ ] Le **thumb du curseur est vide** au départ (pas pré-rempli).
- [ ] Bouton **« Je clutche David »** fonctionne (sert au test #4).
- [ ] Note : le **reset cooldown** — le double-tap « Reset total » nettoie le cooldown 48h.
      (Un bouton dédié plus léger reste à faire si ça te gêne — dis-moi demain.)

---

## 🔔 7. DIVERS / RÉGRESSIONS À VÉRIFIER (rien ne doit avoir cassé)

- [ ] **Login → présences → carte → profil** : le flow de base tourne sans crash.
- [ ] La version affichée tout en bas = **0x1e0 / build 220**.
- [ ] Pas de **« This page couldn't load »** nulle part (le service worker a été corrigé).
- [ ] **iPhone réel** : pas de freeze, safe-area OK (encoche pas mangée), swipe-back fonctionne.
- [ ] Les **couleurs** sont la palette Mel partout (pas d'orange/rouge parasite).

---

### 🎯 Priorité si tu manques de temps
1. **Forteresse** (§1) — le plus gros changement, le plus risqué.
2. **Carte Clutch de Mel + mini-onglets** (§4) — nouvelle UI.
3. **Icônes catégories events** (§5) — vérif rapide.
4. Le reste = régression.

> Note tes retours (verbatim, en vrac, peu importe) → je trie et je corrige.
