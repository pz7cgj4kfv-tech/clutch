# 🔍 AUDIT COMPLET CLUTCH — 03.07.2026

> Demande David : audit total (code, base, protections, fiabilité, produit, UX, business) + plan « finir en
> 2 semaines » + auto-challenge. Écrit en séquence, étape par étape. Source : scans directs du repo (03.07),
> BIBLE-0/2/3, ~45 docs de challenges, mémoire projet.

**Verdict global d'entrée : 6,5/10.** Produit conceptuellement fort et différencié, moteur métier prouvé par
tests, MAIS un monolithe UI à risque, une protection des données à CONFIRMER côté serveur, et un vrai danger
produit qui n'est pas technique : lancer dans une ville vide. Le détail suit, étape par étape.

---

## ÉTAPE 1 — CODE & ARCHITECTURE

### Chiffres bruts (scannés aujourd'hui)
| Mesure | Valeur | Verdict |
|---|---|---|
| `app/app2/page.tsx` | **14 448 lignes** (40% des 36 012 lignes de app/) | 🔴 monolithe |
| `useState` / `useEffect` dans app2 | **344 / 83** | 🔴 océan d'états, effets de bord difficiles à prévoir |
| console.log / TODO | 4 / 2 | 🟢 hygiène propre |
| Libs métier extraites | 19 fichiers `lib/*.ts` | 🟢 les cerveaux sont sortis du monolithe |
| Suites de test | 9 scripts (forteresse 26, cône 27, travel 15, reach 9/112 combos, etc.) | 🟢 libs · 🔴 zéro test sur les flows UI |
| Migrations SQL | 44 | 🟠 traçabilité OK, application réelle incertaine |
| Routes | 45 dont ~22 internes/test (hq, cockpit, codex, sim, mel-test…) | 🟠 à trier avant lancement |

### Solide
- Logique métier = fonctions pures testées dans `lib/` (forteresse, cône, moteur Dom, ranking). Bonne archi.
- Culture feature-flag (GRAAL2_DOM_LIVE, revert 1 ligne prouvé sur 112 combinaisons).
- Discipline de build (tsc vert, version bumpée, cap copy à chaque livraison).

### Fragile
1. 🔴 **Le monolithe app2**. Chaque modif risque un effet de bord (vécu : builds 240-249, tous les bugs étaient
   dans app2, aucun dans lib/). Bus factor = 1. → **Ne PAS refactorer pendant le rush** (risque > gain) mais
   **GELER** : toute nouveauté = fichier séparé importé.
2. 🔴 **Aucun test des enchaînements UI** (login→dispo→clutch→verrou→checkin→feedback). Le filet actuel =
   David à la main. → checklist de test exécutée systématiquement (étape 4/plan) plutôt que tests unitaires de plus.
3. 🟠 **22 routes internes exposées** dans le build public — dont /hq (mot de passe en clair dans le JS, export
   statique oblige) et /plan-lancement (toute la stratégie lisible). OK en phase amis, pas au lancement.
4. 🟡 25 usages géo/reach encore éparpillés dans app2 malgré la centralisation `foReachable` (résorption en cours).

### Actions
- [ ] 🔴 GEL du monolithe (rien de neuf dedans jusqu'au test réel).
- [ ] 🟠 Trier les 45 routes : publique / interne / hors build prod.
- [ ] 🟠 /hq & docs stratégie hors du site public (ou vraie protection).

---

## ÉTAPE 2 — BASE DE DONNÉES & CONFIDENTIALITÉ (protection des utilisateurs)

### La découverte n°1 de l'audit
`20260624_hardening.sql` est la pièce maîtresse : RLS partout, policies par table, trigger anti-élévation
(score/premium/ban non modifiables par l'utilisateur), contrainte 18+, et la **vue `public_profiles`** qui
arrondit la position à ~1 km (protection de la localisation des utilisatrices — cohérent avec l'ADN produit).

**Mais 3 indices forts disent qu'elle n'est PAS (entièrement) appliquée en prod :**
1. Son en-tête dit « ⚠️ NE PAS LANCER EN AVEUGLE — tester sur staging, adapter les noms de colonnes ».
2. L'app lit `center_lat/center_lng` en direct **41×** et fait 8× `profiles.select('*')` — si le REVOKE du
   hardening était actif, ces appels échoueraient. L'app fonctionne → le REVOKE n'est probablement pas actif.
3. La vue `public_profiles` n'est utilisée **nulle part** dans l'app (grep : 0 usage).

**Conséquence si non appliqué** : un compte connecté peut lire le centre de zone exact des profils via l'API.
C'est LE point à lever avant de vraies utilisatrices. **Première action du plan : le diagnostic SQL (lecture
seule, 5 min) pour établir le statut réel** — puis appliquer/finaliser si besoin et faire lire la vue floutée à l'app.

### Confirmé bon
- `collab_log` (mur d'équipe) parfaitement confiné : seule table avec INSERT anon, longueurs bornées,
  append-only (aucune policy update/delete). Le risque « outil externe écrit ailleurs » est écarté.
- Contraintes dures : `no_self_clutch`, `occ_no_overlap` (double-booking physiquement impossible en base),
  cooldown via RPC gardées `{ok,code,message}`, trigger `handle_new_user` blindé (03.07).
- Architecture RPC SECURITY DEFINER avec garde admin allowlist : le Test Lab ne touche jamais les tables en direct.

### Risques classés
1. 🔴 Statut du hardening incertain → diagnostic SQL immédiat, puis application adaptée.
2. 🔴 L'app doit lire `public_profiles` (floutée) au lieu de `profiles` pour les AUTRES profils (sa propre ligne
   reste lisible en direct). Chantier ciblé : remplacer les selects de listing.
3. 🟠 `availabilities.avail_select using(true)` : tout connecté lit lat/lng exacts des créneaux → aligner sur la
   même règle de floutage/restriction que profiles.
4. 🟠 Base réelle vs repo : 44 migrations, aucune preuve de ce qui tourne. → tenir un registre « appliquée le X ».
5. 🟡 Pas de barrière anti-multi-comptes (rate limit / vérif téléphone) — décision produit pour le lancement public.

### Actions
- [ ] 🔴 Diagnostic SQL (4 requêtes lecture seule, fournies au plan J1).
- [ ] 🔴 Finaliser le hardening + basculer l'app sur la vue floutée.
- [ ] 🟠 Aligner availabilities. · [ ] 🟠 Registre des migrations appliquées.

---

## ÉTAPE 3 — PROTECTIONS UTILISATEURS & CONFIANCE

Pour chaque protection : est-elle réelle côté serveur, ou seulement dans l'interface ?

| Protection | État | Niveau réel |
|---|---|---|
| **Blocage** | table `blocks` + usage app (upsert/delete/lecture croisée) | 🟢 serveur — mais vérifier que le RPC `create_clutch` refuse bien un envoi vers/depuis un bloqué (prévu dans les invariants du hardening) |
| **Signalement** | bouton « ⚠️ Report » + `gps_verified_by_reporter` sur no-show | 🟠 la donnée est stockée MAIS **aucun back-office de modération** : personne ne voit/traite les signalements → à minima un canal (mail/table lue chaque jour) avant lancement |
| **SOS** | migration `sos_live` (partage de position par lien) + UI | 🟢 existe ; à re-tester en réel sur device |
| **Contrôle 18+** | `validate18` côté app + contrainte `profiles_age_18plus` (dans le hardening) | 🟠 la contrainte DB dépend de l'application du hardening → sinon JS-only (contournable) |
| **Vérification profil (selfie)** | concept présent (textes UI) | 🔴 **non implémenté** — décision : V1 sans certif (assumé) ou bloquant ? Ma reco : V1 sans, mais l'app ne doit PAS afficher « profils vérifiés » tant que ce n'est pas vrai (promesse mensongère = perte de confiance) |
| **Fiabilité / no-show** | score + double feedback + pénalité | 🟢 logique en place ; protégée contre l'auto-modification par le trigger anti-élévation (dépend du hardening) |
| **Anti-spam envois** | cooldown 48h + boîte plafonnée (`received_cap`) côté serveur | 🟢 RPC gardé |
| **Suppression compte (LPD)** | Edge Function `delete-account` déployée + modal 2 étapes | 🟢 |

### Le point de cohérence le plus important
Plusieurs protections « dures » (18+, anti-élévation du score, colonnes sensibles) **vivent dans le hardening**
→ tout converge vers la même action racine : **confirmer/appliquer le hardening**. Une action, quatre protections.

### Actions
- [ ] 🔴 (= étape 2) hardening → active 18+, anti-élévation, colonnes protégées d'un coup.
- [ ] 🟠 Mini-boucle de modération : les signalements doivent être VUS (même un simple mail quotidien).
- [ ] 🟠 Retirer/adoucir les textes « profils vérifiés » tant que la certif n'existe pas.
- [ ] 🟡 Re-test SOS sur device réel.

---

## ÉTAPE 4 — FIABILITÉ & BUGS

### Bugs / trous CONNUS et confirmés (sources : backlog mémoire + qa-couverture-test.md)
1. 🔴 **Push notifications jamais validées en réel** sur TestFlight. C'est le maillon vital : sans notif reçue,
   un Clutch expire sans réponse et l'app paraît morte. À tester J1 de la semaine device.
2. 🔴 **Boîte pleine → invisible → réapparaît** : le cycle complet n'est pas vérifié de bout en bout (le compteur
   📥 X/5 est neuf ; l'invisibilité et le retour doivent être prouvés).
3. 🟠 **UX du refus** : le « non » doit être doux côté envoyeur (message neutre) — risque n°1 de churn émotionnel.
4. 🟠 **Post-RDV feedback UI** : l'écran « comment ça s'est passé ? » manque dans app2 (le déblocage asymétrique
   des présences pendant le Verrou a déjà été signalé comme confusant).
5. 🟡 Notification douce de refus d'event + waitlist expéditeurs : ⛔ pas construits (assumables post-V1).

### Edge cases structurels à garder à l'œil
- **Realtime Supabase** : 1 filtre par channel (règle connue, respectée — 3 channels par user). À 1000 users
  simultanés ça tient, mais chaque onglet ouvert = connexions ; prévoir le jour où on paginera les présences.
- **`profiles.select('*')` sans pagination** sur les présences : OK à 50 dispo, à revoir au-delà de quelques
  centaines (et de toute façon à remplacer par la vue floutée → une pierre deux coups).
- **Horloges/timezones** : tout est en timestamptz + epochs côté client, bon réflexe. Cas limite connu : slots
  proposés légèrement hors créneau = décision produit assumée (marge volontaire).
- **Offline/GPS refusé** : les flux dégradent sans crash (try/catch systématiques) mais l'utilisateur n'a pas
  toujours un message clair → polish, pas bloquant.

### Ce qui tient à 30 amis mais pas à 1000
- Les selects larges + le tri côté client (le « cerveau » trie en mémoire) → OK Lausanne early, à optimiser
  quand les présences dépassent ~200 profils simultanés. Pas un sujet des 2 semaines.

### Actions
- [ ] 🔴 Push notifs réelles (envoi → réception → tap → navigation) sur 2 devices.
- [ ] 🔴 Prouver le cycle boîte pleine (Test Lab le permet : saturer avec 5 bots).
- [ ] 🟠 UX refus (textes + parcours envoyeur). · [ ] 🟠 Écran feedback post-RDV.

---

## ÉTAPE 5 — PRODUIT & CONCEPTS (cohérence de la vision)

### Ce qui est remarquablement cohérent
- **Le vocabulaire est tenu** (Clutch/Verrou/RDV, jamais match/swipe/like) — dans le code, les textes, les docs.
- **La contrainte 18h est structurelle** partout (molettes bornées, expiry cron, forteresse).
- **La Forteresse existe vraiment** : Graal 1 (exclusion) prouvé en base (`occ_no_overlap`, 0 trou sur 1000+
  agents simulés) ; Graal 2 (causalité/trajet réel) LIVE depuis le build 248 avec le moteur de Dom, revert prouvé.
  Et la règle « forteresse CACHÉE » (on montre le ressenti, jamais le jargon) est une vraie bonne décision produit.
- **L'ADN anti-canapé** est appliqué : pas de chat infini, friction assumée vers le RDV réel.

### Les tensions internes à trancher (décisions produit, pas du code)
1. **Cible 25-45 « activités + rencontres » vs UI encore très « dating »** : les modes
   Romance/Amitié/Pro/Famille existent, mais la première impression (présences, profils, intentions) reste
   codée dating. Si le repositionnement est sérieux, la V1 doit le MONTRER (events en avant, langage
   « sortir », pas « rencontrer »). Sinon assumer dating d'abord, activités ensuite. **À trancher : lequel
   raconte-t-on au lancement ?**
2. **Premium CHF 19.90** vs cible réelle : décision ouverte depuis des semaines (9.90/14.90/19.90). Ma reco
   pour la V1 : **premium OFF au lancement** (tout gratuit, on mesure), prix décidé avec des vraies données.
3. **Mood / Mode / Intention / Quick Clutch** : quatre concepts proches qui se marchent dessus (voir étape 6).

### Le vrai risque produit (répété par tous les panels)
**Pas la technique : la liquidité.** <30-50 dispo/soir = ville morte = churn immédiat. Le produit est conçu pour
la densité (Lausanne, rayon court, 18h) mais rien dans l'app ne SAUVE la soirée vide. Deux amortisseurs V1 :
- les **events** (une seule inscription crée de l'activité visible pour tous) ;
- le premier test **choréographié** (tout le monde ouvre sa fenêtre à la même heure) — outil `/clutch-test` prêt.

### Actions
- [ ] 🔴 Trancher le récit V1 (dating-first ou social/activités-first) — ça pilote textes + onboarding + App Store.
- [ ] 🟠 Premium : OFF au lancement (reco) ou prix tranché.
- [ ] 🟠 Brancher la « tension 0-10 » du cône sur la sortie du moteur de Dom (prochaine brique Dom, pas bloquant).

---

## ÉTAPE 6 — SIMPLIFICATION UX (« complexité dedans, simplicité dehors »)

### Le constat honnête
L'app est puissante mais **demande trop de décisions à l'utilisateur** avant la première rencontre :
genre recherché, tranche d'âge (bidirectionnelle), modes (×4), mood, intention, rayon, jusqu'à 3 créneaux,
quick clutch, lieu… Un nouvel utilisateur peut se perdre AVANT d'avoir vécu le moment magique (le premier
Verrou). Or le funnel vital = **ouvrir une fenêtre → voir des gens → recevoir/envoyer un Clutch → Verrou**.

### La règle de simplification proposée : « 3 gestes, le reste en réglages »
1. **Ouvrir ma fenêtre** = UN écran : « Où ? (pin+rayon) · Quand ? (chips ce soir/maintenant) · C'est parti ».
   Tout le reste (mode, mood, intention) = optionnel, replié, avec **défauts intelligents** (dernier réglage mémorisé).
2. **Voir qui est là** = UNE liste déjà triée par LE cerveau (compatibilité+fiabilité+distance). Les filtres
   manuels (genre/âge/modes) migrent dans un panneau « affiner » — le tri intelligent rend les filtres rarement
   nécessaires. Les dots CD score : jargon interne → à masquer ou remplacer par un simple « ✨ recommandé ».
3. **Clutcher** = 1 tap → heure+lieu proposés par défaut (créneau commun + lieu mi-chemin sûr) → modifier si envie.

### Quick wins concrets (peu de code, gros effet)
- Fusionner **Mood et Intention** en un seul champ « Ton envie du moment » (60 car.) — deux concepts pour la
  même chose aujourd'hui.
- L'onboarding réexplique chaque concet une seule fois, au moment où il apparaît (didactique douce déjà dans
  l'ADN), pas tout d'avance.
- Le « Geek Setup » existe déjà → y déplacer TOUS les réglages fins (fabs, modes avancés, notifications fines).
- Chaque écran : UNE action primaire évidente (le bouton prune), le reste en secondaire.

### Auto-challenge
« Simplifier = perdre la puissance ? » Non : rien n'est supprimé, tout est **replié avec de bons défauts**.
La puissance (forteresse, tri, filtres) travaille en silence — exactement la promesse « complexité dedans ».

### Actions
- [ ] 🟠 Écran « Ouvrir ma fenêtre » resserré (défauts mémorisés, options repliées).
- [ ] 🟠 Fusion Mood+Intention. · [ ] 🟡 Masquer le jargon (CD dots → « recommandé »).
- [ ] 🟡 Filtres présences → panneau « affiner ».

---

## ÉTAPE 7 — BUSINESS & GO-TO-MARKET

### Ce qui ferait que ça MARCHE (les 4 conditions, dans l'ordre)
1. **Densité simultanée** : 100-150 dispo/soir à Lausanne = ça vit (seuils validés par les panels : <30-50 mort,
   200-300 très bon). Tout le GTM doit viser CE chiffre, pas des downloads.
2. **Confiance des femmes** : protections réelles (étapes 2-3) + première expérience impeccable. Une seule
   histoire moche tue l'app localement.
3. **Qualité des events** : le pilier qui crée la liquidité sans attendre l'effet réseau (1 event = 10 dispo).
4. **La boucle « ça a eu lieu »** : chaque RDV réussi → feedback → réouverture de fenêtre. La rétention est là.

### Ce qui ferait que ça ÉCHOUE
- Lancer trop tôt dans une ville vide (le risque n°1, unanime).
- Payer de l'acquisition avant M4 (CPM suisse le plus cher d'Europe, CAC réel 100-230 CHF → brûle le cash).
- La complexité UX qui fait fuir avant le premier Verrou (étape 6).
- L'équipe qui continue d'AJOUTER au lieu de finir (gel du scope).

### La séquence validée (tri de l'or, 01.07)
Events + B2B bars → campus → micro-influence → paid (M4+). Funding : Venture Kick (~150k, attention : 10k don
+ prêts convertibles, lien académique exigé) puis angels 200-400k à M6. Monétisation V1 : premium OFF,
mesurer ; events take-rate 10-20% = la vraie piste (comparable Timeleft 18M€).

### Honnêteté des probabilités
Base rate startups consumer social : ~60-70% d'échec même en exécutant bien. Ce qui améliore VRAIMENT les
odds : la soirée test choréographiée réussie (preuve de liquidité reproductible) avant tout investissement marketing.

---

## 🗓️ LE PLAN « FINIR EN 2 SEMAINES » (J1 → J14)

**Prérequis (aujourd'hui) : GEL DES FEATURES. Trois décisions David : récit V1 (dating vs social-first) ·
premium OFF ou prix · DATE de la soirée test (la fixer force tout).**

| Jour | Quoi | Qui |
|---|---|---|
| **J1** | Diagnostic SQL sécurité (lecture seule) → statut réel · gel scope acté · date soirée fixée | David (5 min SQL) + Claude |
| **J2** | Appliquer/finaliser le hardening adapté + contraintes (18+, anti-élévation) | Claude prépare, David exécute |
| **J3** | App bascule sur la vue floutée pour les listings (+ availabilities alignées) | Claude |
| **J4** | Push notifs réelles : envoi→réception→tap sur 2 devices TestFlight | David + Dom |
| **J5** | Cycle boîte pleine prouvé (Test Lab : saturer à 5) + UX du refus (textes doux) | Claude + David |
| **J6** | Écran feedback post-RDV + retrait des « vérifiés » mensongers + mini-boucle signalements | Claude |
| **J7** | **Test complet à 2 téléphones** (checklist qa-couverture, David+Dom, cycle entier) | David + Dom |
| **J8** | Corrections du J7 + tri des routes internes hors build public | Claude |
| **J9** | Simplification quick-wins : fenêtre resserrée + fusion mood/intention + défauts mémorisés | Claude |
| **J10** | Build candidat (TestFlight) + APK Android pour Dom (capacitor add android) | Claude + David |
| **J11** | **🎪 SOIRÉE TEST CHORÉOGRAPHIÉE** (10-15 amis, 2h, centre Lausanne, /clutch-test en cockpit) | Tous |
| **J12** | Tri des retours de la soirée → la SEULE liste de correctifs qui compte | Claude + David |
| **J13** | Corrections critiques de la soirée + re-test rapide | Claude + David |
| **J14** | Build final · screenshots App Store (Mel, 6.9" ×5) · fiche + notes de review | Tous |

**Comment tester chaque partie** : la matrice existe déjà (`docs/qa-couverture-test.md`, 6 parties) + le Test
Lab (bots réels via RPC gardées) + `/clutch-test` (cockpit de soirée). Rien à construire, tout à EXÉCUTER.

---

## 🥊 AUTO-CHALLENGE FINAL (l'IA sceptique)

1. « **Ton plan à 14 jours suppose zéro imprévu.** » Vrai. C'est pour ça que J8/J12/J13 sont des jours de
   correction, pas de production. Si le hardening révèle des surprises (noms de colonnes), J2-J3 peuvent
   devenir J2-J4 — le tampon existe.
2. « **Tu gèles les features mais David a des idées chaque jour.** » Oui — le hub capture les idées (règle :
   zéro perte), le code n'en absorbe plus jusqu'au J14. La discipline vient du rituel, pas de la volonté.
3. « **La soirée test peut échouer socialement (personne ne vient).** » C'est LE point : l'invitation WhatsApp
   choréographiée est aussi importante que le code. David doit la préparer dès J1 (liste des 15, message,
   relance J-1) — c'est dans /clutch-test.
4. « **Tu recommandes premium OFF : tu tues le business model ?** » Non : à <1000 users le premium rapporte
   ~rien (audit financier : ~CHF 1000/mois au mieux) et il AJOUTE de la friction. La V1 prouve la densité ;
   la monétisation (events + premium calibré) vient avec les données.
5. « **Et si les protections serveur prennent plus que J2-J3 ?** » Alors on repousse la soirée, pas l'inverse.
   Règle absolue : pas de vraies utilisatrices hors cercle de confiance tant que le statut n'est pas confirmé.

## VERDICT FINAL
- **Technique** : 7/10 — solide au cœur (libs testées, contraintes DB dures), fragile en périphérie (monolithe, statut hardening).
- **Produit** : 8/10 — vision différenciée, cohérente, défendable ; 2 décisions à trancher (récit, premium).
- **Prêt au lancement** : 5/10 aujourd'hui → **8/10 atteignable au J14** si le plan est suivi et le scope gelé.
- **La phrase de l'audit** : *l'app n'a plus besoin de nouvelles idées ; elle a besoin de 14 jours de discipline.*
