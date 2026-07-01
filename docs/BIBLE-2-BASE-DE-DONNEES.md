# 📖 CLUTCH — BIBLE DE LA BASE DE DONNÉES (Supabase / Postgres)

> Projet Supabase : `fnucdicfcjoxbozpfdau`
> Généré à partir de TOUS les fichiers `supabase/migrations/*.sql` + `supabase-schema.sql` + `supabase-messages-schema.sql`.
> Les fichiers `*-schema 2.sql` sont des **doublons identiques** (sync iCloud/Dropbox — ignorés).
> Fait partie de la BIBLE CLUTCH (voir `BIBLE-0-MAITRE.md`). Généré le 02.07.2026.

## ⚠️ Notes de lecture importantes

- Plusieurs migrations sont marquées **« préparé, ne pas appliquer sans David »** — l'état réel de la base peut donc différer du cumul des fichiers.
- **`create_clutch()` est redéfinie 2 fois** : la version finale (avec `inbox_full`) dans `20260626_received_cap.sql` **supersede** celle de `20260626_cooldown_create_clutch.sql`.
- **`messages` est définie 2 fois** avec des schémas divergents (voir §2). Vérifier laquelle est en base live.
- **Deux systèmes de codes de contrat coexistent** : les RPC gardées « historiques » (`create_clutch`, `qa_test_clutch`) renvoient des codes **minuscules** (`self_clutch`, `blocked`, `cooldown`, `pair_busy`, `inbox_full`) ; les RPC admin Test-Lab (`admin_*`, `join_event`) renvoient des codes **MAJUSCULES** (`SELF`, `BLOCKED`, `COOLDOWN_ACTIVE`, `PAIR_BUSY`, `INBOX_FULL`…). Voir §8.

---

## 1. VUE D'ENSEMBLE — toutes les tables

| Table | Rôle (1 ligne) | Migration source |
|---|---|---|
| `profiles` | Profil utilisateur (extension `auth.users`) : identité, dispo, géo, premium, scores, flags bot/ban | `supabase-schema.sql` + nombreux ALTER |
| `clutches` | Invitations de RDV (le cœur : envoi → accept/refus → Verrou → check-in → feedback) | `supabase-schema.sql` |
| `messages` | Chat entre 2 personnes d'un clutch (après Verrou) | `supabase-schema.sql` / `supabase-messages-schema.sql` |
| `feedback` | Feedback anonyme post-RDV (super/ok/rabbit/ghost) — version historique | `supabase-schema.sql` |
| `rdv_feedbacks` | Feedback post-RDV directionnel (from_id/to_id) — version active | (créée hors migrations lues) |
| `events` | Événements de groupe (spontanés/planifiés, open/curated, âge, géo, occupancy) | `supabase-schema.sql` + ALTER |
| `event_participants` | Inscriptions à un event, avec `state` (requested/accepted/…) = hard/soft hold | `20260620_events_mvp.sql` |
| `event_registrations` | Ancienne table d'inscription simple — antérieure à `event_participants` | `20260606_event_registrations.sql` |
| `event_waitlist` | Liste d'attente d'un event complet (cross-user, en DB) | `20260623_event_waitlist.sql` |
| `availabilities` | Créneaux de dispo multiples (peuvent se chevaucher) | `20260626_availabilities.sql` |
| `occupancies` | Projection dérivée « je suis OCCUPÉ » (forteresse anti-conflit) — jamais écrite à la main | `20260625_occupancies.sql` |
| `clutch_pairs` | État pairwise A→B (refus, cooldown, hard-block) — jamais exposé au front | `20260626_cooldown_create_clutch.sql` |
| `push_subscriptions` | Abonnements Web Push par appareil | `20260606_push_subscriptions.sql` |
| `sos_sessions` | Partage de position SOS en temps réel via token secret | `20260620_sos_live.sql` |
| `public_profiles` (VUE) | Vue publique sûre de `profiles` (coords arrondies ~1 km) | `20260624_hardening.sql` |
| `user_feedbacks` | Feedback utilisateur libre (texte/audio) — RLS durcie (LPD DB-04) | `20260619_security_rls_fixes.sql` |
| `blocks` | Blocages entre utilisateurs (blocker_id/blocked_id) | `20260624_hardening.sql` |
| `favorites` | Favoris (user_id/target_id) | `20260701_delete_test_bots.sql` |
| `reports` | Signalements (reporter_id/reported_id) | `20260701_delete_test_bots.sql` |

> **Tables « fantômes »** (référencées par FK/DELETE mais dont le `CREATE TABLE` n'est pas dans les migrations lues) : `rdv_feedbacks`, `blocks`, `favorites`, `reports`, `user_feedbacks`. Elles existent (le code les manipule) mais leur schéma complet a été créé à la main / dans un fichier non versionné.

---

## 2. TABLES EN DÉTAIL

### 2.1 `profiles`
**Colonnes de base :** `id` (PK, FK→`auth.users` CASCADE) · `name` (NOT NULL) · `age` · `gender` (CHECK woman/man/nb) · `bio` (= l'intention, modérée serveur) · `job` · `neighborhood` (défaut Lausanne) · `photo_url` · `interests[]` · `languages[]` (défaut {FR}) · `reliability_score` (défaut 100) · `badge` · `is_available` (défaut false) · `invitations_this_week` · `created_at`/`updated_at`.
**Ajoutées par ALTER :** `is_banned` (ban_system) · `is_premium`/`stripe_customer_id`/`stripe_subscription_id`/`premium_until` (stripe) · `center_lat`/`center_lng` (⚠️ **REVOKE SELECT** — anti-triangulation) · `available_radius_km` (défaut 5) · `available_from` · `account_type` (CHECK large) · `quick_clutch`/`intent_pinned` · `is_bot` (défaut false) · `max_received_clutchs` (défaut **5**) · `default_moods[]`.
**Référencées ailleurs :** `available_until`, `available_modes`, `looking_for`, `current_activity`, `rdv_locked_until`, `rdv_locked_from`, `deleted_at`.
**Contraintes :** gender CHECK · account_type CHECK (`user/admin/bot/free/premium/driver/establishment/host/H/Au/Rh/At`) · `age >= 18` OU NULL. **RLS activée.**

### 2.2 `clutches`
`id` (PK) · `sender_id`/`receiver_id` (FK profiles CASCADE) · `venue` · `venue_safety` (CHECK safe/neutral/alert) · `proposed_time` · `message` · `status` (CHECK `pending/accepted/counter/declined/timeout/cancelled/completed/noshow`) · `counter_time`/`counter_venue`/`counter_by` · `expires_at` (défaut now+2h) · `checked_in_sender`/`checked_in_receiver` · `duration_minutes` (défaut 120) · `is_quick_date` · `reminded` (idempotence rappel push).
**Contraintes :** `no_self_clutch` (sender≠receiver) · **UNIQUE partiel** `(sender_id,receiver_id) WHERE status IN ('pending','confirmed','accepted')` (anti-doublon) · index rappel. **RLS activée.**

### 2.3 `messages` — ⚠️ 2 définitions
**Version B (probablement active)** : `id` · `clutch_id` (FK clutches) · `sender_id`/`receiver_id` (FK profiles) · `content` · `created_at` · `read_at`. RLS activée.

### 2.4 `feedback`
`id` · `clutch_id` (FK) · `given_by` (FK profiles) · `rating` (CHECK super/ok/rabbit/ghost) · UNIQUE (clutch_id, given_by). → déclenche `update_reliability`.

### 2.6 `events`
Base : `id` · `title` · `emoji` (📅) · `venue` · `date_label` · `price` (Gratuit) · `spots` (6) · `description` · `type` (CHECK clutch/partner/user) · `status` (CHECK pending/approved/rejected) · `created_by` (FK profiles SET NULL).
ALTER : `locked` · `min_participants` (2) · `min_age`/`max_age` · `venue_lat`/`venue_lng` · `taken` (compteur d'acceptés maintenu serveur) · `event_mode` (spontaneous/planned) · `approval_mode` (auto/curated) · `starts_at` · `duration_minutes` (180) · `age_min`/`age_max` · `mode` (**open/curated**, défaut curated). **RLS activée.**

### 2.7 `event_participants`
`event_id`+`user_id` (PK composite) · `joined_at` · `state` (CHECK `requested/waitlisted/accepted/declined/expired/cancelled`) · `requested_at`/`responded_at`. **Règle clé : seul `accepted` crée une occupancy** (hard hold) ; `requested`/`waitlisted` = soft hold. **RLS activée.**

### 2.10 `availabilities`
`id` · `user_id` (FK auth.users) · `start_at`/`end_at` · `place` · `lat`/`lng` · `radius_km` (5) · `active` · `modes[]` (filtre DUR : romance/amical/pro/activite/parent) · `mood` (soft : cafe/balade/apero/diner/sport/culture).
⚠️ L'EXCLUDE de non-chevauchement a été **AJOUTÉ puis SUPPRIMÉ** → **les dispos PEUVENT se chevaucher** (pivot : une dispo = intention). Max 3 slots = **app-side**, pas SQL. **RLS activée.**

### 2.11 `occupancies` — LA FORTERESSE
Projection « je suis occupé », **jamais écrite par l'app** (triggers uniquement). `id` · `user_id` · `start_at`/`end_at` · `source_type` (clutch/event) · `source_id`.
**EXCLUDE `occ_no_overlap`** : `EXCLUDE USING gist (user_id WITH =, tstzrange(start_at,end_at,'[)') WITH &&)` → **chevauchement IMPOSSIBLE** (nécessite `btree_gist`). Range `'[)'` → RDV dos-à-dos OK. **RLS : SELECT own seulement, AUCUNE écriture** (anti-sondage d'agenda).
Constantes moteur : buffer prépa **60 min** · durée clutch **120** (Quick 60) · durée event **180** · début = `coalesce(counter_time, proposed_time)` ou `starts_at`.

### 2.12 `clutch_pairs`
`actor_id`+`target_id` (PK) · `refusals_count` · `last_refusal_at` · `cooldown_until` · `hard_blocked`. **RLS activée, AUCUNE policy** (serveur uniquement).

### Autres
`push_subscriptions` (subscription JSONB, UNIQUE user+endpoint) · `sos_sessions` (token = secret, ⚠️ lecture publique anon à durcir, dans `supabase_realtime`) · `public_profiles` VUE (coords arrondies 2 décimales, masque bannis/supprimés) · `user_feedbacks` (SELECT admin-only, LPD).

---

## 3. FONCTIONS / RPC

### 3.A RPC GARDÉES MÉTIER (contrat `{ok,code,message}`)
- **`create_clutch`** (`20260626_received_cap.sql`, version finale) : gardien unique de l'envoi en prod. Guards : `not_authenticated`, `self_clutch`, `blocked`, `cooldown`, `pair_busy`, **`inbox_full`** (plafond `max_received_clutchs`, ne compte que les `pending`). Actor = `auth.uid()`.
- **`set_block`** : blocage mutuel réversible (upsert clutch_pairs 2 sens).
- **`feasible_windows`** : fenêtres communes serveur `(ma_dispo − mes_occ) ∩ (sa_dispo − ses_occ)`, 18h, buffer 60 min. Renvoie QUE l'intersection.
- **`check_cone_feasibility`** (`20260629_cone_feasibility.sql`) : LE CÔNE serveur (trajet ≈ vol×1.35 ÷30km/h, marge 15min, tension 0→10). Codes UNKNOWN/OUT_OF_CONE/OK. ⚠️ **PRÉPARÉ, pas encore branché**.
- **`join_event`** (`20260629_event_rpc_dispo.sql`) : rejoindre avec règle DISPO↔EVENT serveur. Actor = `p_actor` si `qa_is_admin()` sinon `auth.uid()`. Codes RLS_FORBIDDEN/NOT_FOUND/NOT_EVENT_VISIBLE/OWN_EVENT/ALREADY/NO_COMPATIBLE_AVAILABILITY/JOINED/WAITLISTED.
- **RPC admin Test-Lab** (actor=bot, gate `qa_is_admin()`) : `admin_create_clutch`, `admin_accept_clutch`, `admin_refuse_clutch`, `admin_set_availability`, `admin_create_event`.
- **`admin_update_event_status`** : ⚠️ SECURITY DEFINER **sans gate admin** (convention seule).

### 3.B RPC DE TEST / QA (⚠️ à retirer/verrouiller avant lancement public)
`qa_is_admin()` (allowlist 3 UUID) · `qa_test_clutch` (dry-run) · `create_test_bots(N)` (1-60, âge 25-45, 🤖) · `delete_test_bots()` (supprime les 🤖, garde les originaux) · `reset_my_test_state()` (⚠️ pas de gate allowlist) · `reset_total_qa()` (efface interactions + monde des bots, bots restent).

**Allowlist admin (3 UUID, partout) :** `bad38f3e-…-75c03b58d72b` (David gmail) · `409e83dc-…-3ea900857d35` (David Tafit) · `9626a0ba-…-ebd37e58a864` (Mel).

### 3.C TRIGGERS & MAINTENANCE
`handle_new_user` (crée profil) · `expire_clutches` · `reset_weekly_invitations` · `update_reliability` (ghost −20 / rabbit −10 / super +5) · `protect_sensitive_profile_cols` (anti-escalade) · `guard_clutch_insert`/`guard_clutch_transition` · `sync_clutch_occupancy` + `sync_event_occupancy` + `resync_event_participants` (**la forteresse**) · `refresh_event_taken` (compte les acceptés) · `clutch_cooldown_interval` (48h/7j/30j/180j) · `register_clutch_refusal` · `clutch_guard_bio` (modération intention → `INTENT_BLOCKED`) · `expire_event_requests`.

---

## 4. POLICIES RLS (résumé)
- `profiles` : SELECT public · CUD sur soi · bot_admin (3 admins) · REVOKE SELECT sur center_lat/lng.
- `clutches` : SELECT/UPDATE si sender ou receiver · INSERT si sender=moi · bot_admin.
- `messages` : SELECT si participant · INSERT si sender=moi ET clutch accepted/confirmed.
- `events` : SELECT (approved ou mien) · CUD si created_by=moi · bot_admin.
- `event_participants` : SELECT public · INSERT/DELETE self · **UPDATE : self + ORGANISATEUR (accepter/refuser) + bot_admin**.
- `availabilities` : SELECT public · CUD self.
- `occupancies` : SELECT own · **aucune écriture** (triggers only).
- `clutch_pairs` : **aucune policy** (serveur only).
- `sos_sessions` : ⚠️ SELECT anon (par token).
- `user_feedbacks` : SELECT **admin-only** (LPD).

---

## 5. CRON
- `expire-clutches` : `*/10 * * * *` → `expire_clutches()`.
- `expire-event-requests` : `*/10 * * * *` → `expire_event_requests()` (`20260627_event_expire_cron.sql`).
- Edge Functions (cron externe) : `delete-account`, `rdv-reminders` (~30 min avant, idempotent via `clutches.reminded`).

---

## 6. FEATURE FLAGS / CONSTANTES
Buffer prépa **60 min** · durée clutch **120** (Quick **60**) · event **180** · plafond boîte **5** · horizon **18h** · cooldown **48h/7j/30j/180j** · fenêtre refus **90j** · cône : détour **×1.35**, vitesse **30 km/h**, marge **15 min** · max slots **3** (app-side) · bots **1-60**, âge **25-45** · Lausanne `46.5197, 6.6323` · extension **btree_gist**.

---

## 7. CODES DE CONTRAT
**Minuscules (create_clutch, qa_test_clutch) :** `not_authenticated`, `self_clutch`, `blocked`, `cooldown`, `pair_busy`, `inbox_full`, `INTENT_BLOCKED`.
**MAJUSCULES (admin_*, join_event) :** `RLS_FORBIDDEN`, `SELF`, `BLOCKED`, `COOLDOWN_ACTIVE`, `PAIR_BUSY`, `INBOX_FULL`, **`OVERLAP_OCCUPANCY`** (forteresse rejette), `NO_COMPATIBLE_AVAILABILITY`, `NOT_EVENT_VISIBLE`, `OWN_EVENT`, `NOT_FOUND`, `INVALID_TIME`, `ALREADY`, `JOINED`, `WAITLISTED`, `REFUSED`, `OK`, `ERR`, `UNKNOWN`/`OUT_OF_CONE` (cône).
> `EVENT_FULL`/`WAITLIST_FULL` sont dans la spec mais **PAS émis** (event complet → waitlist sans plafond).

---

## 8. ⚠️ POINTS D'ATTENTION (dérives & risques repérés)
1. `create_clutch` ×2 → la bonne est dans `20260626_received_cap.sql`.
2. `messages` ×2 schémas → vérifier lequel est live (probablement version B avec receiver_id).
3. Dérive de statut clutch : `'confirmed'` utilisé dans des index/guards mais absent du CHECK de base.
4. `admin_update_event_status` : SECURITY DEFINER **sans gate**.
5. `reset_my_test_state` : `GRANT TO authenticated` sans allowlist (chacun n'agit que sur soi).
6. `sos_sessions` : lecture publique anon par token → à durcir avant lancement.
7. **Toutes les RPC de test** (`qa_*`, `create/delete_test_bots`, `reset_*`, `admin_*`) → à retirer/verrouiller avant prod public.
8. 2 allowlists admin coexistent (3 UUID partout vs 2 UUID pour `user_feedbacks`).
9. `check_cone_feasibility` : préparée mais **branchée nulle part** (le CÔNE serveur pas encore appliqué).
10. Tables « fantômes » : schéma complet hors migrations versionnées.
