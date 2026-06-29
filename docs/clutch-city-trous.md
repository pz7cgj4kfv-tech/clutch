# 🕳️ CLUTCH CITY — CHASSE AUX TROUS (c'est MON job de tout trouver, pas David)

> David : « ce n'est pas normal que ce soit moi qui pense à ça et pas toi. Trouve TOUS les trous. »
> Énumération **systématique** des edge-cases, asymétries, courses, exploits et règles manquantes.
> Chaque trou = un **invariant que le COQ doit vérifier** dans le simulateur. ⬜ = pas encore couvert par le code.
> Méthode : je passe chaque transition d'état × chaque acteur malveillant × chaque course concurrente.

## 🧱 Légende
`⬜ TROU` = comportement non géré / à décider · `🟧 PARTIEL` = géré mais incomplet · `✅` = déjà robuste (RPC gardé).

---

## A. CLUTCH — cycle de vie & anti-harcèlement
- ⬜ **A1. Cooldown empilé / contourné** : A se fait refuser par B (cooldown 48h). A ouvre un **nouveau créneau ailleurs/plus tard** → peut-il re-cibler B avant 48h ? Le cooldown doit être **par paire (A→B)**, pas par créneau.
- ⬜ **A2. Mute asymétrique (ton exemple)** : B **mute/masque** A. A **ne le sait pas** et continue d'« envoyer » → A croit avoir clutché, B ne reçoit rien. Que voit A ? (faux espoir = dark pattern). Règle : côté A = message neutre « indisponible », **jamais** « tu es mute ».
- ⬜ **A3. Block vs Mute** : différence ? Block = 2 sens, invisible mutuel. Mute = je ne reçois plus mais je reste visible ? À **définir** (aujourd'hui il y a `block`, pas de `mute` séparé).
- ⬜ **A4. Re-clutch après refus via un AUTRE mode** : refusé en Romance, A revient en « Amical » → contourne-t-il le cooldown ? (le cooldown doit être indépendant du mode).
- ⬜ **A5. Decline farming** : A envoie à 50 personnes, 49 refusent → A accumule 49 cooldowns mais a saturé 49 boîtes. Coût d'envoi ? (anti-spam : 3 clutchs/jour hommes était prévu — vérifier qu'il est appliqué).
- ⬜ **A6. Inbox flooding ♀** : 5 reçus/jour atteint → les suivants ? File d'attente ? rejet silencieux ? L'envoyeur voit quoi ?
- 🟧 **A7. Doublon pending** : 2 clutchs A→B simultanés → `pair_busy` ✅ côté RPC. Mais 2 clutchs A→B sur 2 **créneaux différents** ? (un seul engagement possible à la fois).
- ⬜ **A8. Ghosting** : A accepte puis ne vient jamais (pas de check-in). Conséquence sur fiabilité ? Récidive premium qui ghoste pour « tester » → détecté ?
- ⬜ **A9. Clutch sur quelqu'un qui vient de passer hors-ligne / a fermé son créneau** entre l'affichage et l'envoi (course).
- ⬜ **A10. Auto-clutch** ✅ (`self_clutch` RPC) — mais via event (rejoindre son propre event) ?

## B. FORTERESSE — espace-temps & enchaînements
- ⬜ **B1. Enchaînement (LE trou #1)** : RDV confirmé 20h30 (2h) puis clutch accepté 22h30 LOIN → physiquement impossible, autorisé aujourd'hui. `fin(A)+trajet(A→B) ≤ début(B)`.
- ⬜ **B2. Event + clutch qui se chevauchent** : je rejoins un event 20h-22h ET j'accepte un clutch 21h → double-booking. L'event doit occuper l'agenda exactement comme un clutch.
- ⬜ **B3. Modifier un créneau APRÈS qu'un clutch y soit accepté** : je déplace le lieu/heure → le RDV verrouillé devient infaisable. Doit être **bloqué** ou **re-validé**.
- ⬜ **B4. GPS drift pendant le RDV imminent** : je m'éloigne, je ne peux plus arriver à l'heure → alerte à l'autre ?
- ⬜ **B5. Minuit / changement de jour** : créneau « demain matin » mal calculé, fenêtre 18h qui saute un jour (déjà vu : « demain 13h20 »).
- ⬜ **B6. Durée RDV par défaut** : si non spécifiée = 2h. Mais 2 RDV à 1h d'intervalle au même endroit → faisable ? La durée doit entrer dans l'enchaînement (B1).
- ⬜ **B7. Lieu hors zone du receveur** : alerte ✅ (garder) mais **ne pas bloquer** (décision). Vérifier que l'alerte est **symétrique** (les deux comprennent).
- ⬜ **B8. Marge « 1h avant »** vs marge trajet réelle : laquelle gagne ? (cohérence des deux règles).
- ⬜ **B9. Plusieurs créneaux chevauchants** : dispo = intention (peut chevaucher) mais 1 seule **occupation** à la fois → quand un clutch est accepté sur le créneau 1, les créneaux 2 et 3 qui chevauchent l'occupation doivent **se mettre en pause**.

## C. FILTRES & VISIBILITÉ
- ⬜ **C1. Asymétrie de filtre** : A voit B (B passe les filtres de A) mais B ne voit pas A → A clutche B, B est surpris. Le clutch doit respecter **aussi** les filtres de B (genre, âge, mode, réception).
- ⬜ **C2. Changement de filtre après envoi** : A clutche B, puis B passe en « Pause » / change de genre recherché → le pending devient-il invalide ?
- ⬜ **C3. Mode réception « Pause »** : personne ne peut m'envoyer → mais un clutch déjà pending ? un re-clutch ?
- ⬜ **C4. Mood « n'exclut jamais »** : confirmé — vérifier qu'aucun code ne l'utilise comme filtre dur.
- ⬜ **C5. Premium « filtres avancés »** : un free contourne-t-il en lisant l'API ? (sécurité serveur).
- ⬜ **C6. Genre non-binaire** dans le filtre symétrique H/F : où tombe-t-il ? (trou de logique probable).

## D. ÉVÉNEMENTS
- ⬜ **D1. Waitlist + alerte premium (ton exemple)** : event plein → liste d'attente. Une place se libère (qqn quitte) → **premium reçoit une alerte** « place dispo », peut s'inscrire en priorité. Free ? Ordre de la file ?
- ⬜ **D2. Paliers / tournoi** : 8 places, actives par paliers (5-8 que si pleines). Si on reste à 7 → l'event a-t-il lieu à 6 ? Remboursement de la 7e ?
- ⬜ **D3. Places impaires** : 3 demandées (pétanque) → la logique pair/impair.
- ⬜ **D4. Hôte annule** un event avec N inscrits → notifs + remboursement + libère leurs agendas.
- ⬜ **D5. Limite d'âge** de l'event vs âge des inscrits déjà là (course si l'hôte change la limite).
- ⬜ **D6. L'event de l'hôte occupe SON agenda** → il ne peut pas accepter un clutch en parallèle (B2 appliqué à l'hôte).
- ⬜ **D7. Double-inscription** au même event · **rejoindre 2 events** qui se chevauchent.
- ⬜ **D8. Event plein — course** : 2 dernières inscriptions simultanées sur la dernière place.
- ⬜ **D9. Combien d'events max** je peux créer/rejoindre sur 18h ? (cap à fixer ; premium = plus).
- ⬜ **D10. Event payant** : si je m'inscris et n'y vais pas (lapin) → remboursement ? pénalité ?

## E. CAPS & PREMIUM
- ⬜ **E1. ♀ : 5 reçus/jour vs 20 actifs simultanés** : cohérence des deux plafonds.
- ⬜ **E2. Liste d'attente de CLUTCHS** (ton idée) : si ma boîte est pleine, les clutchs entrants attendent ? premium alerté quand une place se libère dans MA boîte ?
- ⬜ **E3. Premium spot-open** : quand une place (event OU boîte) se libère → premium notifié en premier. Mécanisme commun.
- ⬜ **E4. Free atteint son cap (3 actifs)** → 4e bloqué. Message ? incitation premium (pas dark pattern).
- ⬜ **E5. Premium mode invisible** : je vois sans être vu → peut-on clutcher en invisible ? (asymétrie : l'autre reçoit d'un fantôme).
- ⬜ **E6. Downgrade premium→free** avec 5 clutchs actifs (plafond free = 3) → que deviennent les 2 en trop ?

## F. CONCURRENCE / COURSES (le simulateur excelle à les trouver)
- ⬜ **F1. Double accept** : B et C acceptent en même temps un créneau de A qui ne peut en honorer qu'un (occupation exclusive).
- ⬜ **F2. Accept après expiry** : le pending expire pile au moment où B accepte.
- ⬜ **F3. Accept après block** : A bloque B juste avant que B accepte.
- ⬜ **F4. Place event + clutch** : je prends la dernière place d'event ET j'accepte un clutch au même créneau.
- ⬜ **F5. Modif simultanée** : A déplace le lieu pendant que B fait check-in.

## G. FIABILITÉ & FEEDBACK
- ⬜ **G1. Feedback asymétrique** : A dit « présent », B dit « lapin » → qui croire ? (double feedback caché 3h — vérifier la résolution du conflit).
- ⬜ **G2. No-show gaming** : marquer l'autre « lapin » par vengeance.
- ⬜ **G3. Fenêtre 3h** : feedback hors fenêtre → ignoré ? score figé ?
- ⬜ **G4. Pas de check-in mais « terminer »** : interdit (check-in obligatoire) — vérifier.

## H. SÉCURITÉ / MALVEILLANCE (CLAUDE.md)
- ⬜ **H1. Triangulation** : un homme change son rayon/centre plusieurs fois pour localiser une femme (le radar = temps, jamais distance GPS — vérifier qu'aucune fuite de position).
- ⬜ **H2. Faux comptes en masse** : 50 comptes → flood. Rate-limit ? certification selfie obligatoire avant d'envoyer ?
- ⬜ **H3. Extraction de positions** via l'API présences (RLS serveur).
- ⬜ **H4. Screenshot d'un profil partagé** (hors app — au moins ne pas exposer données sensibles à l'écran).
- ⬜ **H5. Premium qui ghoste en série** pour saturer/tester (E5 + A8).

## I. ÉTAT / PERSISTANCE
- ⬜ **I1. Modifier un créneau ne garde pas position+heure** (bug confirmé walkthrough §4).
- ⬜ **I2. localStorage périmé** : recepMode/seek figés après changement de compte.
- ⬜ **I3. Offline** : actions faites hors-ligne (accepter, créer) → resync, conflits.
- ⬜ **I4. Update Supabase silencieux** (0 rows) → toujours `.select()` + upsert (leçon connue).

---

## 🎯 Ce que le simulateur fait de cette liste
Chaque ⬜ devient un **test actif** : le simulateur **provoque** la situation (avec des agents qui se refusent,
mutent, saturent, annulent, se déplacent…) et **le COQ lève une alerte** dès qu'un invariant casse, avec
l'**état rejouable** (seed + tick + agents impliqués) → on ouvre le « film » à cet instant et on corrige.

> ⚠️ Honnêteté : cette liste n'est pas finie par définition (c'est le but — le simulateur en révélera d'autres).
> Mais on part avec **~50 trous identifiés** au lieu de les découvrir un par un en prod.
