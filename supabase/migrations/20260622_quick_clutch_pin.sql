-- ════════════════════════════════════════════════════════════════════════
-- Migration : Quick Clutch (RDV 1h) + Pin RDV fixe (descriptif non modifiable)
-- Design Mel 22.06.2026 — à lancer dans Supabase → SQL Editor
-- ────────────────────────────────────────────────────────────────────────
-- Tant que ces colonnes n'existent pas, le code reste fonctionnel (update
-- défensif des flags, l'erreur est ignorée → la dispo n'est jamais cassée).
-- Une fois lancée : la pastille verte Quick Clutch + l'icône Pin s'affichent
-- pour les AUTRES utilisateurs dans Présences (visibilité cross-user).
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS quick_clutch  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS intent_pinned boolean NOT NULL DEFAULT false;

-- (Optionnel) remettre les flags à false quand une dispo expire/est fermée,
-- pour éviter qu'un vieux flag traîne. Le code les réécrit à chaque "Ouvrir ma
-- Fenêtre", donc pas indispensable, mais propre :
-- UPDATE public.profiles SET quick_clutch=false, intent_pinned=false
--   WHERE is_available=false;

-- RLS : aucune policy à changer — ces colonnes suivent les policies existantes
-- de `profiles` (select authentifié, update self).
