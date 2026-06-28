-- 🛡️ MODÉRATION SERVEUR du texte d'intention (profiles.bio) — David + GPT/Grok 28.06.
-- Le filtre JS (lib/intent-moderation.ts) est la 1re ligne MAIS contournable (requête directe Supabase).
-- Ici = la VRAIE garantie : un trigger BEFORE INSERT/UPDATE rejette tout contenu interdit AU NIVEAU DE LA BASE.
-- Tolérance zéro : sexuel explicite, prostitution, pédocriminel, violence sexuelle.
-- ⚠️ Garder la liste noire SYNCHRONISÉE avec lib/intent-moderation.ts.

-- 1) Normalisation : minuscules · accents · leetspeak · on ne garde que lettres + espaces · espaces compressés.
create or replace function clutch_normalize_text(t text)
returns text language sql immutable as $$
  select trim(regexp_replace(
    regexp_replace(
      translate(
        translate(lower(coalesce(t,'')),
          'àâäáãéèêëíìîïóòôöõúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn'),     -- accents
          '@43!|10$578', 'aaeiiiosstb'                                  -- leetspeak (@,4→a · 3→e · 1,!,|→i · 0→o · $,5→s · 7→t · 8→b)
      ),
      '[^a-z ]', ' ', 'g'                                              -- vire tout sauf lettres + espace
    ),
    '\s+', ' ', 'g'                                                    -- compresse les espaces
  ));
$$;

-- 2) Bloqué ? — teste le texte normalisé ET sa version sans espaces (attrape « g a n g b a n g »).
create or replace function clutch_intent_is_blocked(t text)
returns boolean language plpgsql immutable as $$
declare
  norm text := clutch_normalize_text(t);
  nospace text := replace(norm, ' ', '');
  -- termes mono-bloc (testés sans espaces) — distinctifs, peu de faux positifs
  bad text[] := array[
    'gangbang','partouze','plancul','planq','baise','baiser','sucer','suce','sodomie','fellation',
    'cunnilingus','ejacul','penetration','bukkake','creampie','blowjob','handjob','orgasme','masturb',
    'fuck','fucking','nude','nudes','sexfriend','escort','escorte','prostit','sugardaddy','sugarbaby',
    'lolita','viol','violer','pedophil','pedocrim'
  ];
  -- expressions multi-mots (testées avec espaces)
  bad_phrase text[] := array[
    'plan cul','plan q','sexe rapide','sexe sans','cul rapide','paye pour','argent contre','tarif horaire',
    'petite fille','petit garcon','enfant sexe','ado sexe','jeune vierge','sans consentement','force toi'
  ];
  term text;
begin
  foreach term in array bad loop
    if position(term in nospace) > 0 then return true; end if;
  end loop;
  foreach term in array bad_phrase loop
    if position(term in norm) > 0 then return true; end if;
  end loop;
  return false;
end;
$$;

-- 3) Trigger : rejette l'écriture si la bio (= texte d'intention) contient du contenu interdit.
create or replace function clutch_guard_bio()
returns trigger language plpgsql as $$
begin
  if new.bio is not null and clutch_intent_is_blocked(new.bio) then
    raise exception 'INTENT_BLOCKED: contenu non conforme à l''esprit de Clutch'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_clutch_guard_bio on profiles;
create trigger trg_clutch_guard_bio
  before insert or update of bio on profiles
  for each row execute function clutch_guard_bio();

-- Test rapide (à lancer à la main si besoin) :
--   select clutch_intent_is_blocked('un café pour discuter');  -- false
--   select clutch_intent_is_blocked('g4ng b4ng ce soir');      -- true
--   select clutch_intent_is_blocked('plan cul rapide');        -- true
