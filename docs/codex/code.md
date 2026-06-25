# 💻 CODEX — DOCUMENTATION DU CODE & DES ALGORITHMES (dense)

> Référence technique exhaustive. Version navigable, écran : page `/codex` (10 onglets).
> Pour la version géante (dizaines de pages, chaque fonction commentée) : dis **« Codex complet »**.
> Mis à jour sur « Codex ».

## Carte des fichiers (qui vit où)
| Fichier | Rôle |
|---|---|
| `lib/clutch-states.ts` | Moteur pur : états, 7 invariants, `clutchOccRange`, `isPaused`, réducteur `apply`, `canRegisterEvent`, `clutchCooldownMs`, `canSendClutch`, `shouldNudgeGroupEvent`, `underExposureScore`. 0 dépendance. |
| `lib/clutch-config.ts` | **Tous** les paramètres réglables (durées, buffer, horizons, cooldown paliers, boost). |
| `scripts/fuzz-clutch-states.mts` | Fuzzer : 22 tests ciblés + 800k actions aléatoires. `npm run fuzz`. |
| `supabase/migrations/20260625_occupancies.sql` | Table occupancies + EXCLUDE + trigger clutch (PROD). |
| `supabase/migrations/20260626_events_occupancy.sql` | starts_at events + triggers occupation (PROD). |
| `supabase/migrations/20260626_availabilities.sql` | Multi-créneaux + colonnes event_mode/approval_mode (PROD). |
| `supabase/migrations/20260626_cooldown_create_clutch.sql` | clutch_pairs + cooldown + RPC `create_clutch` + `set_block` (PROD). |
| `app/app2/page.tsx` | L'app (~11,8k lignes). Branchements forteresse : occupations, gate spontané, envoi via RPC, feuille créneaux. |
| `app/codex/page.tsx` | La page Codex (résumé navigable dense). |
| `docs/architecture-engagements.md` | Spec longue de la forteresse. |
| `docs/codex/*.md` | Histoire · Décisions · Code (ce dossier). |

## Les concepts clés (résumé — détail sur /codex)
- **Occupation** = `[début − buffer 1h, fin]`. Source unique `clutchOccRange()`. Contrainte `EXCLUDE gist` = chevauchement impossible.
- **Gardien `create_clutch()`** (SECURITY DEFINER) : self · blocage (table `blocks`, 2 sens) · cooldown (clutch_pairs) · doublon pending. Le frontend ne décide jamais.
- **Cooldown** : paliers `clutch_cooldown_interval(n)` = 48h/7j/30j/180j, fenêtre 90j (trigger `register_clutch_refusal`).
- **Gate event spontané** : `canRegisterEvent` (dans une dispo + 18h) ; partenaire = libre + 7j.
- **Aide sous-exposés** : `shouldNudgeGroupEvent` (slice 1) · `underExposureScore` (slice 2, besoin impressions).

## Comment tester le moteur
```
npm run fuzz
→ 22 tests ciblés (forteresse, gate, cooldown, aide) + 800 000 actions aléatoires
→ 0 violation
```

→ Pour l'expansion exhaustive (chaque fonction, chaque invariant, chaque trigger commenté ligne à ligne) : **« Codex complet »**.
