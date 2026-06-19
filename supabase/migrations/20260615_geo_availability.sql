-- Migration : colonnes geo pour le filtre de disponibilité
-- Permet l'intersection de cercles entre utilisateurs disponibles
-- center_lat/center_lng = centre du cercle de disponibilité choisi par l'user
-- available_radius_km = rayon en km
-- available_from = début du créneau (ISO timestamp)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS center_lat double precision,
  ADD COLUMN IF NOT EXISTS center_lng double precision,
  ADD COLUMN IF NOT EXISTS available_radius_km integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS available_from timestamptz;
