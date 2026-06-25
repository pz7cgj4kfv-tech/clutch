import { createClient } from '@supabase/supabase-js'

// ⚠️ Repli = vraies valeurs PUBLIQUES (URL + clé PUBLISHABLE, déjà dans le bundle web + page /hq, protégées par RLS,
// donc AUCUN secret exposé). Sans ça, les builds LOCAUX (→ app iOS via Capacitor) tombaient sur un placeholder
// inexistant → « Load failed » au login natif. La clé service_role (secrète) n'est JAMAIS ici.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fnucdicfcjoxbozpfdau.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_TXWkldkILlJ5G9OTOfiCLg_NYZLVMTZ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type Profile = {
  id: string
  name: string
  age: number
  gender: 'woman' | 'man' | 'nb'
  bio: string
  job: string
  neighborhood: string
  photo_url: string | null
  interests: string[]
  languages: string[]
  reliability_score: number
  badge: string
  is_available: boolean
  available_city: string | null
  available_from: string | null
  available_until: string | null
  available_modes: string[] | null
  account_type: string | null
  invitations_this_week: number
  created_at: string
}

export type Clutch = {
  id: string
  sender_id: string
  receiver_id: string
  venue: string
  venue_safety: 'safe' | 'neutral' | 'alert'
  proposed_time: string
  message: string
  status: 'pending' | 'accepted' | 'counter' | 'declined' | 'timeout' | 'cancelled' | 'completed'
  counter_time: string | null
  counter_venue: string | null
  expires_at: string
  created_at: string
  sender?: Profile
  receiver?: Profile
}

export type Message = {
  id: string
  clutch_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: Profile
}

export type Feedback = {
  id: string
  clutch_id: string
  given_by: string
  rating: 'super' | 'ok' | 'rabbit' | 'ghost'
  created_at: string
}
