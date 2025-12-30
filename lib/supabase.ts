/**
 * Client Supabase simplifié
 * Backend Engineer
 */

import { createClient } from '@supabase/supabase-js'

// Client navigateur
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Types simples
export type Therapist = {
  id: string
  email: string
  name: string
  title: string | null
  photo_url: string | null
  bio: string | null
  iban: string | null
  created_at: string
}

export type Session = {
  id: string
  therapist_id: string
  label: string
  duration: number
  price: number
  enabled: boolean
  created_at: string
}

export type Schedule = {
  therapist_id: string
  day_of_week: number // 0-6
  start_time: string // "09:00"
  end_time: string // "17:00"
  enabled: boolean
}

export type Holiday = {
  id: string
  therapist_id: string
  start_date: string
  end_date: string
  label: string | null
  created_at: string
}

export type Booking = {
  id: string
  therapist_id: string
  session_id: string | null
  first_name: string
  last_name: string
  email: string
  phone: string | null
  date: string
  time: string
  payment_status: 'pending' | 'paid'
  created_at: string
}
