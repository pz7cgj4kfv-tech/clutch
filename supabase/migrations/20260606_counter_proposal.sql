-- Counter-proposal sur les clutches
ALTER TABLE clutches
  ADD COLUMN IF NOT EXISTS counter_time timestamptz,
  ADD COLUMN IF NOT EXISTS counter_venue text,
  ADD COLUMN IF NOT EXISTS counter_by uuid REFERENCES profiles(id);
