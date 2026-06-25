# 🏰 Architecture des engagements temporels — la « forteresse » anti-conflit

> Spec validée le 2026-06-25 (David + Claude + challenge GPT, panel 3 experts).
> Problème résolu : **un humain ne peut pas être à deux endroits en même temps.**
> Source de vérité unique pour les états d'un Clutch et l'anti-chevauchement.
> Rien n'est codé encore — c'est le plan validé. On code par étapes, testable, AVEC David.

---

## 0. Le principe en une phrase

On ne raisonne plus en « clutchs ». On raisonne en **engagements temporels** (`occupancies`) :
un Clutch verrouillé occupe un créneau, un événement accepté occupe un créneau.
Le chevauchement devient **impossible par construction** au niveau Postgres — pas par du JS qu'on espère.

---

## 1. Deux dimensions séparées (ne JAMAIS mélanger)

GPT avait raison : on séparait à tort « engagement » et « présence physique ». Ce sont deux axes.

### A) État RELATIONNEL (l'engagement)
```
pending ──┬─> refused      (l'autre dit non)
          ├─> expired      (personne n'a répondu dans la fenêtre 18h)
          ├─> cancelled    (annulé avant le RDV)
          └─> locked  ──┬─> cancelled
                        ├─> completed   (RDV honoré + feedback)
                        └─> no_show      (quelqu'un n'est pas venu)
```
- `counter_propose` = **transition** (pending → pending avec nouveaux termes), **jamais un état**.
- États terminaux : `refused`, `expired`, `cancelled`, `completed`, `no_show`. **Monotones** : un terminal ne redevient jamais actif.

### B) État de PRÉSENCE (l'observation, stocké à part)
```
none ──> arrived ──> both_arrived
```
- C'est le « J'y suis » / check-in GPS. **N'a rien à voir** avec l'engagement.
- Évite l'explosion d'états (`retard`, `presque arrivé`, etc. vivent ICI, pas dans l'engagement).

---

## 2. La table `occupancies` = objet de premier rang

```sql
occupancies (
  id          uuid pk,
  user_id     uuid,
  start_at    timestamptz,
  end_at      timestamptz,
  source_type text,          -- 'clutch_locked' | 'event_accepted'
  source_id   uuid,
  status      text           -- 'active' | 'released'
)
```

### ⚠️ Règle d'or de correction : `occupancies` est une PROJECTION DÉRIVÉE
- On ne l'écrit **jamais à la main**. Elle est créée/libérée **dans la même transaction** que le lock/accept/cancel.
- Sinon → « occupation fantôme » (event supprimé mais occupation restée) → l'user est **bloqué à vie**. Piège #1, gravité max.

### La contrainte qui rend le conflit IMPOSSIBLE
```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE occupancies
  ADD CONSTRAINT no_overlap
  EXCLUDE USING gist (
    user_id WITH =,
    tstzrange(start_at, end_at, '[]') WITH &&
  )
  WHERE (status = 'active');
```
→ Postgres **refuse** physiquement deux engagements actifs qui se croisent pour le même user.
Deux personnes cliquent « Verrouiller » à 20 ms d'écart : **1 réussit, 1 échoue.** Jamais 2.

---

## 3. Durée d'un Clutch (décision David 25.06)

- **V1 : 1h fixe** à partir de l'heure proposée → `end_at = start_at + 1h`.
- Le plus simple, invisible, juste dans ~90 % des cas. Raffinage (durée par type) = plus tard, au test terrain.
- Sans cette durée, `tstzrange` est indéfini → c'était un trou de la reco GPT, comblé ici.

---

## 4. `pending` ≠ `occupancy` (subtilité clé)

- Un clutch **en attente** ne crée **PAS** d'occupation.
- → On peut **recevoir plusieurs propositions qui se chevauchent** (elle en choisit une). C'est voulu (cf. règle « marge volontaire »).
- L'occupation naît **seulement au Verrou** (et à l'acceptation d'event).

---

## 5. « Suspendre puis revivre » les pendings chevauchants (décision David 25.06)

Choix produit : quand un Verrou occupe un créneau, mes autres pendings qui le chevauchent
**ne sont pas tués** — ils sont **mis en pause** et **reviennent** si j'annule le Verrou.

### Comment, SANS exploser la machine à états
- Le pending **reste `pending`** (on ne mute jamais son statut sur conflit).
- « En pause ? » = **propriété CALCULÉE** : `pending && chevauche(une de mes occupancies actives)`.
- UI : un pending en conflit s'affiche « ⏸ En pause — tu as déjà un RDV à cette heure », hors de 🔥 Action requise.
- On **ne peut pas** verrouiller un pending en conflit (de toute façon `lock_clutch` re-checke la contrainte → échec propre).
- Le Verrou s'annule → l'occupation passe `released` → le chevauchement disparaît → le pending **revient tout seul**. Zéro écriture, zéro transition non-monotone.
- Sa fenêtre 18h continue de tourner ; s'il expire pendant la pause, il expire normalement.

---

## 6. La fonction unique `lock_clutch(clutch_id)` (Supabase RPC)

Appelée depuis l'app **sans serveur custom** : `supabase.rpc('lock_clutch', { clutch_id })`.
Compatible 100 % avec `output:'export'`. `SECURITY DEFINER` (pour écrire les occupancies + côté de l'autre user sous RLS).

```
BEGIN  -- transaction atomique
  1. Vérifier que le clutch est encore 'pending' et m'appartient
  2. Calculer [start_at, end_at] (= proposed_time, +1h)
  3. INSERER occupancy (moi)  + occupancy (l'autre)
     → si la contrainte EXCLUDE échoue : ROLLBACK, retourner 'conflict'
  4. Passer le clutch en 'locked'
  5. (les pendings chevauchants deviennent "en pause" automatiquement — calculé, rien à écrire)
  6. Notifier via Realtime (1 channel par filtre — cf. CLAUDE.md)
COMMIT
```
Idempotent : appeler 2× `lock_clutch(id)` = même résultat.

---

## 7. Invariants garantis (la liste finale)

| # | Invariant | Garanti par |
|---|-----------|-------------|
| INV1 | Aucun chevauchement entre engagements confirmés (clutch locked **+** event accepté) | contrainte `EXCLUDE gist` |
| INV2 | `sender_id ≠ receiver_id` | contrainte CHECK |
| INV3 | Pas 2 conversations actives entre la même paire (anti A→B & B→A simultané) | clé canonique `least/greatest` unique |
| INV4 | Un event accepté occupe un créneau | même table `occupancies` |
| INV5 | Un RDV terminé ne redevient jamais actif | transitions monotones (guard) |
| INV6 | `start_at < end_at` toujours | contrainte CHECK |
| INV7 | Toutes les transitions sont monotones (pas `completed→locked`) | table de transitions autorisées |

---

## 8. Plan de test — property-based (fast-check)

Le robot joue des milliers de séquences aléatoires d'événements et vérifie après CHAQUE pas :
1. INV1 jamais violé (aucun overlap dans `occupancies` actives).
2. Jamais `sender == receiver`.
3. Aucune paire active en double.
4. Aucun overlap résiduel.
5. Un état terminal reste terminal.
6. Concurrence : 2 `lock` simultanés → exactement 1 succès.
7. Après chaque transition, les pendings incompatibles sont bien « en pause » (calculé).
8. Idempotence de `lock_clutch`.

---

## 9. Anti-malveillance (parades intégrées)

- **Sonde de disponibilité** (un malveillant envoie 30 clutchs pour déduire un emploi du temps) :
  message d'auto-annulation **générique** — « Cette proposition n'est plus disponible. »
  JAMAIS « la personne a accepté autre chose ». (cohérent avec la règle anti-triangulation GPS.)
- **Occupation fantôme** : occupation = projection dérivée, jamais saisie manuelle (cf. §2).

---

## 10. Ce qui touche la PROD (à faire AVEC David)

- La migration SQL (`occupancies`, contrainte `EXCLUDE`, fonction `lock_clutch`) **modifie la base Supabase de prod** → on l'applique ensemble, jamais en douce.
- Le pur `lib/clutch-states.ts` (machine à états + invariants) + le fuzzer = sans risque, testables hors-ligne d'abord.

---

## Statut
- [x] Architecture validée (challenge GPT trié : occupancies + EXCLUDE = adopté ; durée + revive = tranché David).
- [ ] `lib/clutch-states.ts` (pur) + fuzzer fast-check.
- [ ] Migration SQL Supabase (AVEC David).
- [ ] Branchement `lock_clutch` dans l'app2 + UI « en pause ».
