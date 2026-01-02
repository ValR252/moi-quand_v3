/**
 * Client Supabase simplifié
 * Backend Engineer: Rendu optionnel pour fonctionner sans env vars
 */

import { createClient } from '@supabase/supabase-js'

// Valeurs de fallback pour le build (permet de builder sans Supabase configuré)
// En production, les vraies env vars prendront le relais
// Si absentes, le mode démo sera utilisé par les pages
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

// Client navigateur
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  google_access_token?: string | null
  google_refresh_token?: string | null
  google_token_expiry?: string | null
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
  google_event_id?: string | null
}
