-- ============================================================================
-- FIX handle_new_user (02.07) — le trigger de création de profil ne doit JAMAIS
-- bloquer la création d'un compte. Cause racine : le formulaire dashboard n'envoie
-- pas de `name` → profiles.name (NOT NULL) → « Database error creating new user ».
--
-- Correctif défensif :
--   • name = prénom des métadonnées, sinon full_name, sinon préfixe email, sinon 'Nouveau'.
--   • on conflict (id) do nothing (idempotent).
--   • exception avalée + warning : même si le profil échoue, le COMPTE se crée toujours
--     (le profil se complète de toute façon côté app à l'onboarding).
-- ⚠️ À APPLIQUER dans le SQL Editor.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into public.profiles (id, name)
    values (
      new.id,
      coalesce(
        nullif(new.raw_user_meta_data->>'name', ''),
        nullif(new.raw_user_meta_data->>'full_name', ''),
        nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
        'Nouveau'
      )
    )
    on conflict (id) do nothing;
  exception when others then
    -- Ne JAMAIS faire échouer la création du compte à cause du profil.
    raise warning 'handle_new_user: profil non créé pour % : %', new.id, sqlerrm;
  end;
  return new;
end;
$$;
