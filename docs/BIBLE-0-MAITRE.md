# 📕 CLUTCH — LA BIBLE (document de handoff TOTAL)

> Écrit le 02.07.2026 à la demande de David : « fais-moi un audit immense sur absolument tout, comme si c'était
> la dernière fois que je peux donner des infos avant de disparaître. » Objectif : que **n'importe qui** puisse
> reprendre le projet **sans autre contexte**. Rien de caché, rien d'enjolivé.
>
> **Ce document a 3 volets :**
> - `BIBLE-0-MAITRE.md` (ce fichier) — le concept, la vision, ce qui est fait/pas fait, les bugs, les idées, la stratégie, la roadmap.
> - `BIBLE-2-BASE-DE-DONNEES.md` — **tout** ce qui se passe dans la base (tables, colonnes, RPC, triggers, policies, cron, codes).
> - `BIBLE-3-CARTE-DU-CODE.md` — **tout** le code source (routes, fichiers, où est quoi, comment builder/déployer).
> - Le **code brut** = le dépôt Git lui-même (`/Users/saugydavid/Documents/clutch`). ⚠️ Ce n'est **pas du Python** : c'est **TypeScript / Next.js + SQL (Supabase)**.
> - Les ~45 fichiers `docs/` = l'historique complet des idées, challenges IA, décisions (index en §12).

---

## SOMMAIRE
1. Le concept en une page · 2. Le vocabulaire (sacré) · 3. La vision & l'ADN produit · 4. LA FORTERESSE (le cœur) ·
5. Architecture & contraintes dures · 6. Ce qui est FAIT · 7. Ce qui n'est PAS fait / dette · 8. Les BUGS & dérives ·
9. Les IDÉES en vrac · 10. Les DÉCISIONS tranchées · 11. STRATÉGIE & BUSINESS · 12. Les OUTILS DE TEST ·
13. L'ÉQUIPE & les accès · 14. DÉPLOIEMENT · 15. ROADMAP « quoi faire ensuite » · 16. Index de tous les docs.

---

## 1. LE CONCEPT EN UNE PAGE
**Clutch** = une app pour **provoquer des rencontres et des activités RÉELLES, tout de suite**, à Lausanne d'abord.
L'anti-Tinder : au lieu de swiper à l'infini, tu **ouvres une fenêtre de disponibilité** (lieu + rayon + heures, max 18h),
tu vois **qui est dispo près de toi maintenant**, tu envoies un **« Clutch »** (une invitation à un vrai RDV), et si
l'autre accepte, ça se **verrouille** (« Verrou ») en rendez-vous réel — café, verre, sport, yoga, sortie, event de groupe.

**Repositionnement clé (30.06)** : ce n'est PAS qu'une app de célibataires. C'est du **lien social IRL + des activités**,
cœur de cible **25-45 ans** (pas 18-25), célibataires OU non. Le marché « social/activités » est ~7-10× le dating seul.

**La promesse différenciante** : moins de discussions sans fin, plus de **vraies rencontres**, et un moteur qui garantit
que les RDV sont **physiquement tenables** (on ne peut pas être à 2 endroits à la fois, ni accepter un RDV inatteignable).

---

## 2. LE VOCABULAIRE (droit, non négociable)
- ✅ **Clutch** (l'invitation) · **Verrou** (le RDV confirmé) · **Rendez-vous** · **Créneau** (fenêtre de dispo, max 3, sur 18h) · **la Forteresse / le Cône** (le moteur, INTERNE — jamais montré au user sous ce nom).
- ❌ JAMAIS « match », « swipe », « like ». Le vocabulaire EST la promesse.

---

## 3. LA VISION & L'ADN PRODUIT
- **« Complexité dedans, simplicité dehors »** (Apple). Beau, fun, mémorable AVANT fonctionnel-brut.
- **La friction vers le vrai RDV est un FEATURE, pas un bug.** Toute feature qui rend Clutch « plus confortable depuis le canapé » = dark pattern à rejeter.
- **Sécurité des femmes = la gravité de l'app.** Sans elles, les hommes partent. Radar = **TEMPS restant, jamais la distance GPS à la personne** (anti-triangulation). GPS = zone choisie floue (~1 km), jamais le point exact.
- **Didactique & confiance partout** : réexpliquer chaque chose en douceur (règle permanente).
- **Anti-tension** : refus doux, ghosting silencieux, jamais de message vexant.
- **Palette officielle** (importer de `lib/brand.ts`) : fond prune `#2a1020`, orange/or `#E27C00`/`#C8860A`, pêche `#FFBF9E`, texte `#f5e8de`. JAMAIS de rouge vif, JAMAIS de couleur inventée.

---

## 4. LA FORTERESSE — le cœur technique (le vrai moat)
> **Décision produit (01.07, confirmée GPT+Grok) : la Forteresse reste CACHÉE.** C'est notre « truc de geek » sous
> le capot. On ne la met JAMAIS en avant (ni marketing, ni UI). Côté user, on n'affiche QUE le **ressenti** : quand
> une situation devient impossible, il le **SENT** (le « cône vivant » : slider qui se resserre + tension + haptique).

**Ce que c'est, en clair — 2 garanties :**
1. **On ne peut pas être à 2 endroits à la fois** (Graal 1 — EXCLUSION). Une contrainte de base de données (`occupancies` + EXCLUDE gist) rend **impossible** d'avoir 2 RDV qui se chevauchent. C'est du DUR, pas du JS contournable.
2. **On n'accepte un RDV que si on peut physiquement s'y rendre à temps** (Graal 2 — CAUSALITÉ = « le Cône »). Formule : `distance + rayon ≤ portée(temps restant)`, vitesse ~30 km/h, marge 15 min. Plus c'est loin/tard, plus la « tension » monte (0→10). Pour enchaîner plusieurs RDV : `fin(A) + trajet ≤ début(B)`.

**Preuves** : moteur pur `lib/forteresse-engine.ts` + `lib/cone.ts`, testés par `scripts/test-forteresse.mts` (26/26) et le simulateur **Clutch City** (1000 agents : 14 415 « trous » d'incohérence → 0 quand la forteresse est active).

**État** : l'EXCLUSION est **en base et active** (trigger + EXCLUDE). Le CÔNE côté serveur (`check_cone_feasibility`) est **écrit mais PAS encore branché** dans `create_clutch`/`join_event` — c'est le prochain gros chantier serveur. Côté UI, le cône vivant (ressenti) est déjà codé.
> Détail : `docs/project_forteresse_espacetemps.md`, `docs/spec-dom-moteur-causalite.md`, `/codex` (onglet Forteresse & COQ), `/forteresse`.

---

## 5. ARCHITECTURE & CONTRAINTES DURES (briser = tout casse)
- **Stack** : Next.js `output:'export'` (**ZÉRO serveur** — pas d'API routes/middleware/server actions) + **Supabase** client-side (RLS, RPC gardées SECURITY DEFINER, Realtime, Edge Functions) + **Capacitor** iOS (`appId: app.clutch.lausanne`).
- **Deploy = AUTOMATIQUE** : `git push origin main` → GitHub Action build + publie `out/` sur `pz7cgj4kfv-tech.github.io`. **NE JAMAIS déployer à la main** (corrompt les refs). Web à jour en ~1-2 min.
- **Règle d'or serveur** : aucune action métier (clutch, accept, refuse, dispo, event) ne modifie une table EN DIRECT → tout passe par une **RPC gardée** qui applique les vraies règles et renvoie `{ok, code, message}`.
- **iOS Safari** : `position:fixed` frame + `minHeight:0` sur les flex scrollables + `WebkitOverflowScrolling:touch` (sinon freeze).
- **Gate dispo = 2 conditions** : `is_available && available_until > now()`, vérifié au login ET dans `setTab()`.
- **Contrainte 18h** structurelle sur tout timing.
- Détail complet : `BIBLE-3-CARTE-DU-CODE.md`.

---

## 6. CE QUI EST FAIT ✅
- **Auth** (login/register/mot de passe oublié) + **onboarding** 5 étapes.
- **Disponibilité** : molette heure, **multi-créneaux** (1-3, lieux/heures différents, couleurs 1/2/3), moments intelligents (arbre +18h), carte Leaflet (épingler + rayon).
- **Flow Clutch complet** : envoi (RPC gardé : cooldown 48h, anti-doublon, blocage, boîte pleine) → accept/refuse/contre → **Verrou** → check-in GPS « J'y suis » → Terminer → feedback (à l'heure/absent/lapin) + ⭐ favori.
- **La FORTERESSE** : exclusion (impossible 2 endroits) active en base ; enchaînement multi-engagements ; cône vivant (ressenti) côté UI.
- **Présences** : liste format **carte Mel**, filtres (genre/âge/mode/distance), score de compatibilité (dots) + fiabilité (étoiles), **boîte pleine → invisible → réapparaît** au refus.
- **Événements** : création (titre/lieu/dates/places min-max/prix/âge), **mode curated** (demande → l'orga tranche) avec **dashboard organisateur** (accepter/refuser) + **notice douce de refus** + **liste d'attente**, occupation forteresse.
- **Sécurité** : SOS, blocage 2 sens, signalement, cooldown paliers, RLS serveur, modération de l'intention (bio), radar = temps.
- **Premium** : tiers définis (flow Stripe câblé côté Edge Functions) — pas encore branché en UI.
- **i18n** FR/EN (dico `TR`, parité parfaite ~223 clés) — mais ~640 strings encore FR-only (chantier).
- **Outils de test** : Test Lab (bots, ville vivante, incarnation), Clutch City (simulateur), /codex, /forteresse-lab.
- **App Store** : suppression compte + Edge Function, PrivacyInfo, Info.plist FR, icône 1024. Apple Developer actif (builds sur TestFlight). **Build courant : 240 (0x1f4).**

---

## 7. CE QUI N'EST PAS FAIT / DETTE ⛔
- **Le CÔNE côté serveur** (`check_cone_feasibility`) écrit mais **pas branché** dans les RPC → le Graal 2 n'est pas encore appliqué en dur côté serveur (seulement ressenti UI).
- **Liste d'attente d'EXPÉDITEURS** (le payant qui s'envoie dès qu'une place se libère) — Phase 2.
- **Premium** : flow d'abonnement pas branché en UI (Edge Functions Stripe existent).
- **i18n complet** : ~640 strings FR-only (surtout admin/Test Lab) — chantier multi-sessions (`scripts/i18n-hardcoded.mts`).
- **Chat dans l'event** (discuter avant) — manque. **Post-RDV / favoris unifiés** (gens + events) — partiel.
- **Onboarding guidé 60s** pour non-initiés — manque.
- **Dette technique** : `app/app2/page.tsx` = **14 187 lignes** dans un seul fichier → refactor à prévoir (avec tests, sans régression).
- **Forteresse GPS dynamique** (dispo qui se recale selon les déplacements réels) — Phase 2.
- **Push notifs fiables app fermée** = le risque #1 non-testé (à valider en natif TestFlight).

---

## 8. LES BUGS & DÉRIVES (connus)
- **⚠️ Supabase over-quota** : sursis « until 01 Jul 2026 » dépassé → **passer en Pro d'urgence** sinon la base se bride (l'app plante). LE risque le plus immédiat.
- **Dérives DB repérées** (détail dans `BIBLE-2`) : `create_clutch` défini 2× (la bonne = `20260626_received_cap.sql`) · `messages` 2 schémas divergents · statut `'confirmed'` utilisé mais absent du CHECK · `admin_update_event_status` sans gate admin · `sos_sessions` lecture publique à durcir · toutes les RPC de test (`qa_*`, `create/delete_test_bots`, `reset_*`, `admin_*`) **à retirer/verrouiller avant lancement public**.
- **Bug Supabase `.update()` silencieux** (réussit sans rien modifier) → toujours `.select()` + fallback `upsert`, ou passer par une RPC.
- **Realtime** : 1 seul filtre par channel (créer un channel par filtre).
- **Leaflet fragmenté** : `map.invalidateSize()` dans un `requestAnimationFrame`.
- **Bugs UI ouverts** : post-RDV feedback UI partiel · /scenario étape chat manquante · warnings SVG `flood-color` (cosmétique).

---

## 9. LES IDÉES EN VRAC (tout est capté — jamais perdre les idées de David)
> David dicte en vocal → les idées vivent dans le hub + les docs. Résumé des grandes idées non encore faites :
- **Activités first** : yoga, sport, sorties, apéros, networking — le volet « faire des choses ensemble » (au cœur du repositionnement 25-45).
- **Ville vivante / SimCity POV** : suivre ~10 personnes à la main dans une ville de 1000, voir leur vécu, en incarner une (vue MICRO à finir, cf `project_simcity_pov`).
- **Forteresse GPS dynamique** : dispo publiée qui se recale selon les déplacements réels (GPS continu + recompute serveur).
- **Immersion Tesla / boussole** (`/clutchlive`) : la ville s'allume autour de toi par relèvement.
- **Nommer le ressenti du cône** sans jargon (« ta fenêtre se referme », souffle visuel) → 2-3 directions Mel.
- **Modèle de prix multi-paliers** : 2 abos (entrée ~9.90/14.90 + intermédiaire) + 1 **VIP cher** chargé de fonctionnalités — ⚠️ garde-fou : chaque feature VIP auditée sur l'équilibre H/F avant de coder (jamais de pay-to-play qui force l'attention d'une femme).
- Favoris unifiés (gens + events) · tri events par fiabilité · paliers de places (tournoi) · chat event · icône Mel dans events.
> Historique complet : tous les `docs/project_braindump_*.md` et l'index mémoire.

---

## 10. LES DÉCISIONS TRANCHÉES
- **Forteresse cachée** (jamais un argument marketing) — on n'affiche que le ressenti.
- **Cible 25-45 + activités** (pas 18-25 étudiants seuls, pas seniors 50+ qui sont un piège à 3% d'actifs). Étudiants = carburant de densité, actifs+expats = revenu.
- **Monétiser par l'ÉVÉNEMENT** (take-rate 10-20%, modèle Timeleft/Fever), pas par l'amitié pure.
- **Lancement = offline d'abord** (events physiques), pas de pub payante au début (CAC suisse ~100-230 CHF = mur).
- **1er test = soirée chorégraphiée** (1 soir, 2h, centre Lausanne, rayon 2-5 km, « tout le monde ouvre sa dispo à 19h30 » + groupe WhatsApp). Zéro bot romantique trompeur (LPD).
- **Dispos peuvent se chevaucher** (une dispo = intention) ; l'occupation (Verrou) est exclusive.
- **Créneau = vérité, profil = défauts** ; mode = filtre DUR, mood = soft (jamais exclure).
- **Plafond boîte de réception = TOTAL (5), pas par créneau** (sinon 3 créneaux = 9 clutchs, faille).
- **Boîte pleine → invisible** ; **refus = doux + silencieux** ; ghosting = la personne ne te voit plus, sans message.

---

## 11. STRATÉGIE & BUSINESS (résumé — détail dans `/plan-lancement` + docs)
- **Le risque n°1 = la LIQUIDITÉ SIMULTANÉE** (assez de gens dispo en même temps), pas la technique.
- **Seuils de densité** : <30-50 dispo/soir = mort · 100-150 = ça vit · 200-300 = très bon · 400+ = scale.
- **MAU réalistes Lausanne** : FLOP <250 · MOYEN 550-1100 · BON 1600-2800 · EXCELLENT 4100-5500. (« 12 000 » = fantaisiste ; Tinder = 1,3% de la population CH.)
- **Marché** (sourcé) : apps sociales ~98 Md$ (+28%/an, ×7-10 le dating) · events ~736 Md$ · Lausanne 151k hab / ~50k 25-44 · 84% des Suisses font du sport.
- **Coûts pub réels CH** : CPM Meta 12-17$ (le + cher d'Europe) · CPI ~5-7 CHF · **CAC payant réel 100-230 CHF** → influence + events, pas de paid avant M4.
- **Financement** : ⚠️ **Venture Kick n'est PAS non-dilutif** (10k don + 140k prêts convertibles, lien académique requis) · angels SICTIC (ticket 5k, valo max 8M) · viser levée 250-450k à M6 sur preuve.
- **Rétention = le vrai juge** : dating D30 ≈ 3% vs app sociale 25-30% → viser le profil SOCIAL.
- **Timeline** : été 2026 finir produit → automne bêta + seeding → hiver events → hiver/printemps 2027 lancement Lausanne quand densité tient → puis Genève/Romandie/CH (jamais tout d'un coup).
> Docs : `plan-lancement` (page + PDF), `audit-financier-strategie.md`, `lancement-options-tri.md`, `recherche-marche-30jun.md`, `cible-analyse.md`, `challenge-panels-01jul-synthese.md`.

---

## 12. LES OUTILS DE TEST
- **🎮 Test Lab** (dans /app2, admin) : bots, mise en ligne, clutch/accept/refuse, cycle RDV complet, events + demandes, **🌆 ville vivante** (dynamique aléatoire auto ~7s : bots arrivent/partent, créent events, te clutchent — comme des amis, vraies données), **incarnation** (voir l'app comme un bot + créer event + éditer params), **➕ créer N bots** / **🗑️ vider les 🤖**, resets rangés.
- **2 familles de bots** : les **originaux** (Sophie, Lucas, Jade, Nora, Anaïs, Camille, Thomas — jolies fiches photos) et les **créés** (marqueur 🤖, âge 25-45, basiques). Le 🗑️ ne supprime que les 🤖.
- **Les 3 resets** : ♻️ cooldowns (garde bots) · 🧹 total (interactions + bots offline, les garde) · 🗑️ vider les 🤖 (supprime).
- **Clutch City** (`/clutch-city`) : simulateur d'une ville sur la vraie logique (prouve la LOGIQUE, pas l'adoption).
- **Clutch Test v1** (`/clutch-test`) : cockpit de la soirée chorégraphiée (consigne WhatsApp, compte à rebours, compteur live dispo).
- **Plan de test complet** : `docs/qa-couverture-test.md` (6 parties simple→compliqué, statut ✅/🟦/⛔).
- ⚠️ **Migrations à appliquer en base** (SQL Editor) : `20260630_create_test_bots.sql`, `20260701_delete_test_bots.sql`, `20260627_event_participants_update.sql`.

---

## 13. L'ÉQUIPE & LES ACCÈS (non-secrets)
- **David Saugy** (david.saugy@gmail.com) — fondateur, vision produit, non-dev, ingé son/créatif. Dicte en vocal.
- **Mélanie (Mel)** — co-fondatrice, design (maquettes SVG à calques nommés → rendu géométrie exacte).
- **Dom** — briques autonomes (moteur de trajet/causalité).
- **Claude** — développeur principal (IA).
- **Accès** : QG `/hq` (pw `clutch2026!`) · Supabase projet `fnucdicfcjoxbozpfdau` · repo source `~/Documents/clutch` · repo deploy `~/Documents/pz7cgj4kfv-tech.github.io` · app live `https://pz7cgj4kfv-tech.github.io`.
- ⚠️ **Aucun secret en clair dans le repo** : clés Supabase = publishable (protégée RLS) ; service_role JAMAIS committée ; secrets CI dans GitHub. Allowlist admin = 3 UUID (David×2 + Mel).

---

## 14. DÉPLOIEMENT (comment livrer)
- **Web** : `git push origin main` → l'Action build + déploie (~1-2 min). C'est TOUT.
- **iOS/TestFlight** : bump `V`/`BUILD` dans `app2/page.tsx` + `CURRENT_PROJECT_VERSION` ×2 dans le pbxproj → `npm run build` → `npx cap copy ios` → Xcode : Archive → Distribute → TestFlight → Upload.
- **Build vert obligatoire avant push** (`tsc --noEmit` + `npm run build`), zéro régression.

---

## 15. ROADMAP « SI JE DISPARAIS, VOICI QUOI FAIRE » (par priorité)
1. **🔴 URGENT — Passer Supabase en Pro** (sinon la base se bride, l'app meurt).
2. **Appliquer les 3 migrations** en attente (create/delete_test_bots, event_participants_update).
3. **Tester les push notifs app fermée** (le risque #1) sur TestFlight build 240.
4. **Brancher le CÔNE serveur** (`check_cone_feasibility` dans `create_clutch`/`join_event`) → Graal 2 en dur.
5. **Finir le cycle humain** pour un test crédible (onboarding 60s, zéro écran muet, notifs fiables).
6. **1er test chorégraphié** (soirée Lausanne, `/clutch-test`) → mesurer densité + rétention.
7. **Avant lancement public** : retirer/verrouiller toutes les RPC de test, durcir `sos_sessions`, finir i18n des écrans du flow, brancher le premium, refactor app2.
8. **Business** : déposer marque IGE, candidater Venture Kick, viser levée à M6 sur preuve.
> Le « pourquoi » de chaque point est dans les docs correspondants (§16).

---

## 16. INDEX DE TOUS LES DOCS (le reste du savoir)
- **Ce triptyque** : `BIBLE-0-MAITRE` (ici) · `BIBLE-2-BASE-DE-DONNEES` · `BIBLE-3-CARTE-DU-CODE`.
- **Règles & mémoire** : `CLAUDE.md` (racine — règles projet) · `~/.claude/CLAUDE.md` (culture globale) · `~/.claude/projects/…/memory/MEMORY.md` (index mémoire de toutes les sessions).
- **Forteresse** : `project_forteresse_espacetemps.md`, `project_forteresse_cachee.md`, `spec-dom-moteur-causalite.md`, `audit-extreme-01jul.md`, `/codex`, `/forteresse`.
- **Business/lancement** : `plan-lancement` (page), `audit-financier-strategie.md`, `lancement-options-tri.md`, `recherche-marche-30jun.md`, `cible-analyse.md`, `challenge-lancement-business-prompt.md`, `challenge-panels-01jul-synthese.md`.
- **Test/QA** : `qa-couverture-test.md`, `nuit-30jun-recap.md`.
- **Design/handoff** : `handoff-mel.md`, `i18n-guide.md`.
- **Brain-dumps David** (idées brutes, jamais perdues) : tous les `project_braindump_*.md` + l'index mémoire (~70 entrées).
- **Hub** (tout cliquable) : `https://pz7cgj4kfv-tech.github.io/hub`.

---

*Fin de la bible maître. Si tu ne dois lire qu'une chose : §4 (la Forteresse = le moat), §8+§15 (les risques et quoi faire),
et le triptyque BIBLE-0/2/3. Le reste du savoir est dans `docs/` et la mémoire. — Claude, 02.07.2026.*
