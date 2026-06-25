# 💻 CODEX — CODE & ALGORITHMES DE CLUTCH (bible pédagogique)

> Objectif : qu'un **non-codeur comprenne**, qu'un **dev puisse reprendre** chaque algorithme, et qu'on saisisse **toute la machinerie** (forteresse, sélection, filtres). Mis à jour sur « Codex ».
> Pour la version ligne-à-ligne (chaque fonction commentée) : dis **« Codex complet »**.

---

## 0. Vue d'ensemble en une page

Clutch = app de rencontre **spontanée en personne** (Lausanne). Tu te déclares **disponible** (un créneau : heure + lieu + rayon). Tu vois les autres **présences** autour de toi, triées par **compatibilité**. Tu envoies un **Clutch** (invitation 1-1) ou tu rejoins un **événement**. Si c'est accepté → **Verrou** (RDV confirmé). Tout se joue dans une fenêtre de **18h**.

**Stack** : front statique (Next.js `output:'export'`, ZÉRO serveur) + **Supabase** (Postgres, RLS, triggers, RPC, Realtime) comme seul backend. App native iOS/Android via **Capacitor** (emballe le web). La logique « dure » vit **dans Postgres** (incontournable, non contournable par un client modifié).

Il y a **6 algorithmes**. On les explique un par un.

---

## 1. 🔍 Le filtre des Présences — « qui je vois »

**But** : afficher les bonnes personnes disponibles autour de moi, maintenant.
**Où** : `app/app2/page.tsx`, composant Présences (filtre `filtered`).

Une personne apparaît si **TOUTES** ces conditions sont vraies :
1. **Disponible maintenant** : `is_available && available_until > now` (le « gate », vérifié à 6 endroits — cf. forteresse §3).
2. **Dans mon rayon** : distance(centre d'elle, centre de moi) ≤ mon rayon (km).
3. **Passe mes filtres** : genre, tranche d'âge, mode (romance/amical/pro), métier si mode Pro.
4. **Pas bloquée** : ni elle m'a bloqué, ni moi (table `blocks`, 2 sens).
5. **Mode Démo/Réel** : en Réel, les bots (`is_bot`) et profils de test sont cachés ; en Démo, ils apparaissent (étiquetés 🤖). Géré par `demoOn()` (localStorage `clutch_demo_mode`).

**Multi-créneaux** : si j'ai 3 créneaux à des heures différentes, `syncCurrentSlot()` (cf. §3) « promeut » le créneau **courant** dans `profiles` → je suis visible au bon endroit/heure, automatiquement.

---

## 2. 🎯 L'algorithme de SÉLECTION (tri par compatibilité)

**But** : classer les présences visibles, les plus pertinentes en haut.
**Où** : `lib/clutch-algo.ts` (pur, partagé app + simulateur).

Score d'une personne = **moyenne pondérée** de 3 composantes (poids par défaut dans `DEFAULT_WEIGHTS`) :
```
score = 0.5 · compatibilité  +  0.3 · proximité  +  0.2 · fiabilité
```
- **Compatibilité** : centres d'intérêt en commun (Jaccard : intérêts partagés / intérêts totaux). Plus on partage, plus c'est haut.
- **Proximité** : plus c'est proche (km), plus c'est haut (décroissant avec la distance).
- **Fiabilité** : le score de fiabilité de la personne (0..100), qui se **mérite** (RDV honorés) et **ne s'achète pas**.

**Le thermostat de densité** (`THERMO_OFF_BELOW`, etc.) : quand il y a **beaucoup** de monde, on **resserre** le filtre (plus sélectif) ; quand il y a **peu** de monde, on **relâche** (plus permissif). L'algo s'adapte à la foule pour qu'il y ait toujours « assez » de profils sans noyer.

→ Pour **reprendre cet algo** : tout est dans `lib/clutch-algo.ts` (`scoreProfile`, `DEFAULT_WEIGHTS`, le thermostat). Changer les poids = changer le comportement, sans rien casser ailleurs.

---

## 3. 🏰 La FORTERESSE anti-conflit — « jamais à 2 endroits à la fois »

**But** : rendre IMPOSSIBLE qu'une personne ait deux engagements (RDV ou event) qui se chevauchent dans le temps.
**Où** : `lib/clutch-states.ts` (moteur pur testé) + 4 migrations SQL (en prod).

### Le principe
On ne raisonne pas en « clutchs » mais en **occupations temporelles**. Un Clutch verrouillé OU un event accepté inscrit une ligne dans la table `occupancies` : *« user X, de telle heure à telle heure »*. La contrainte Postgres `EXCLUDE USING gist` **refuse physiquement** deux occupations qui se croisent pour le même user. Deux confirmations simultanées → 1 réussit, 1 échoue (atomique).

### Les 7 invariants (règles toujours vraies)
1. Aucun chevauchement d'occupations actives par user (clutch + event). *← le cœur.*
2. On ne se clutche pas soi-même.
3. Pas 2 conversations actives entre la même paire.
4. Un event accepté occupe un créneau (même moteur).
5. Un état terminal (terminé/refusé…) ne redevient jamais actif.
6. Début < fin, toujours.
7. Transitions à sens unique (pas de marche arrière illogique).

### Détails clés
- **Occupation = projection dérivée** : un trigger Postgres la crée/supprime automatiquement quand un clutch/event change. Jamais saisie à la main (sinon « occupation fantôme » bloquant à vie).
- **Buffer de prépa 1h** : une occupation = `[heure − 1h, heure + durée]`. On ne peut plus verrouiller dans cette fenêtre (le temps de s'y rendre). Durée : 2h (clutch normal), 1h (Quick), 3h (event).
- **« En pause » + revival** : un pending qui chevauche un RDV est calmé (calculé, pas stocké) → revit seul si le RDV s'annule.
- **Le gate de dispo** (`is_available && available_until > now`) est vérifié à **6 endroits** (règle dure : ne jamais en modifier un sans les autres). Le multi-créneaux ne les touche PAS : `syncCurrentSlot()` promeut le créneau courant dans `profiles` (promote-only), et le gate lit `profiles` comme avant.

### Le fuzzer (la preuve)
`scripts/fuzz-clutch-states.mts` joue **800 000 actions aléatoires** + ~25 tests ciblés, vérifie les invariants après chaque pas. `npm run fuzz` → **0 violation**. Il a déjà attrapé un vrai bug (garde au verrou ≠ plage occupée). En prod (26.06) : **0 chevauchement** (cf. requête §8).

---

## 4. 🗓️ La taxonomie des ÉVÉNEMENTS — « quand puis-je m'inscrire »

**But** : décider si l'inscription à un event est permise.
**Où** : `canRegisterEvent()` dans `lib/clutch-states.ts`.

Deux familles (axe `event_mode`, indépendant du type de compte) :
- **SPONTANÉ** (un individu / Clutch Driver, présence) → doit tomber **dans un de mes créneaux de dispo** + dans les **18h**.
- **PLANIFIÉ** (un partenaire / business) → **libre** de ma dispo, jusqu'à **7 jours** avant, avec rappels.
- Les **deux** créent une occupation (donc bloquent les chevauchements via la forteresse).

3 axes orthogonaux en base : `event_mode` (spontaneous|planned) · `host_type` (events.type: user|clutch_driver|partner) · `approval_mode` (auto|curated).

---

## 5. 🛡️ Le COOLDOWN anti-harcèlement

**But** : empêcher de re-clutcher en boucle quelqu'un qui a refusé, **sans jamais le lui dire**.
**Où** : RPC `create_clutch()` + trigger `register_clutch_refusal()` (Postgres) + `clutch_cooldown_interval()`.

- B refuse A → cooldown par **paliers** : 1er refus 48h · 2e 7j · 3e 30j · 4e+ 180j. Fenêtre glissante 90j (3 refus le même jour ≠ 3 sur 6 mois).
- **Pas de blocage automatique** : l'algo **dé-priorise** (propose moins), mais ne coupe jamais seul. Le blocage **total** = décision de l'utilisateur (table `blocks`, réversible, invisibilité mutuelle).
- **Anti-sonde** : un refus, un cooldown et un blocage produisent **le MÊME** message générique (« cette proposition n'est pas disponible »). A ne peut jamais déduire qu'il a été refusé.
- Tout l'envoi passe par le **gardien unique `create_clutch()`** (côté serveur) : vérifie self / blocage / cooldown / doublon. Le frontend ne décide jamais.

---

## 6. 🤍 La BIENVEILLANCE — aider les sous-exposés

**But** : aider ceux pour qui ça ne marche pas, **sans les stigmatiser**.
**Où** : `shouldNudgeGroupEvent()` + `underExposureScore()` dans `lib/clutch-states.ts`.

- On ne détecte PAS « l'impopularité » (métrique toxique) mais la **SOUS-EXPOSITION** (peu vu / peu proposé malgré activité, après 14j).
- **Meilleure aide = orienter vers les événements de groupe** (succès réel, sans la violence d'« améliore ton profil »). Slice 1 = nudge doux dans l'onglet Événements (1×/sem, jamais de push, dignité totale). ✅ branché.
- Slice 2 (boost de ranking plafonné +20%, dans le pool compatible — jamais une femme exposée à un homme qu'elle n'aurait pas vu) = besoin du **logging d'impressions** → après l'upgrade Supabase.

---

## 7. 🗂️ Carte des fichiers
| Fichier | Rôle |
|---|---|
| `lib/clutch-states.ts` | Forteresse (états, 7 invariants, occupations) + gate event + cooldown + bienveillance. Pur, 0 dépendance. |
| `lib/clutch-algo.ts` | Algo de sélection (compat / proximité / fiabilité / thermostat). |
| `lib/clutch-config.ts` | TOUS les paramètres réglables (durées, buffer, horizons, cooldown, boost). |
| `scripts/fuzz-clutch-states.mts` | Fuzzer : 800k actions + tests ciblés. `npm run fuzz`. |
| `supabase/migrations/20260625_occupancies.sql` | occupancies + EXCLUDE + trigger clutch (PROD). |
| `supabase/migrations/20260626_events_occupancy.sql` | events starts_at + triggers (PROD). |
| `supabase/migrations/20260626_availabilities.sql` | multi-créneaux + event_mode (PROD). |
| `supabase/migrations/20260626_cooldown_create_clutch.sql` | clutch_pairs + cooldown + RPC create_clutch + set_block (PROD). |
| `app/app2/page.tsx` | L'app (~11,8k l) : filtre présences, envoi via RPC, feuille créneaux, syncCurrentSlot, nudge. |
| `app/codex/page.tsx` | Page Codex (résumé navigable). |

## 8. 🧪 Tester
**En local / sur TestFlight** :
- **Seul** : mode Démo → bots (BotLab : « tout en ligne », « remplir ma boîte », créer un event bot). Tester 1-1, event, conflit.
- **En vrai** : mode Réel (bots cachés) → toi + Mel/amis. Le « J'y suis » GPS = besoin de 2 vrais téléphones (test terrain).
- **Reset cooldowns** (entre deux tests) : `delete from public.clutch_pairs;` dans Supabase SQL (les occupations se nettoient seules via les triggers).

**Vérifier la forteresse en PROD (30 s, aucun clic dans l'app)** :
```sql
select count(*) as chevauchements_interdits
from public.occupancies a join public.occupancies b
  on a.user_id=b.user_id and a.id<b.id
 and tstzrange(a.start_at,a.end_at,'[)') && tstzrange(b.start_at,b.end_at,'[)');
-- attendu : 0   (vérifié le 26.06 → 0 ✅)
```

## 9. Déployer
- **Web** : `git push origin main` → GitHub Action build + déploie (auto, ~2 min).
- **iOS TestFlight** : `npm run build` + `npx cap sync ios` (fait), puis Xcode → bump version → Archive → Upload. Compte Apple actif.
