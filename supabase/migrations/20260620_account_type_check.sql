-- Élargit la contrainte account_type pour autoriser les tiers (éléments) + driver + free/premium
-- (l'ancienne contrainte ne tolérait que 'user'/'admin' → toggle Driver & types premium cassés)
DO $$
DECLARE c text;
BEGIN
  SELECT conname INTO c FROM pg_constraint
   WHERE conrelid='profiles'::regclass AND contype='c'
     AND pg_get_constraintdef(oid) ILIKE '%account_type%';
  IF c IS NOT NULL THEN EXECUTE 'ALTER TABLE profiles DROP CONSTRAINT '||quote_ident(c); END IF;
END $$;
ALTER TABLE profiles ADD CONSTRAINT profiles_account_type_check
  CHECK (account_type IN ('user','admin','bot','free','premium','driver','establishment','host','H','Au','Rh','At'));
