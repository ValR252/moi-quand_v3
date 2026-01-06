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
  slug?: string | null
  photo_url: string | null
  bio: string | null
  iban: string | null
  created_at: string
  google_access_token?: string | null
  google_refresh_token?: string | null
  google_token_expiry?: string | null
  google_calendar_id?: string | null
  // Phase 2: New profile fields
  phone?: string | null
  address?: string | null
  city?: string | null
  postal_code?: string | null
  country?: string | null
  website?: string | null
  // Phase 2: Configuration
  booking_enabled?: boolean
  auto_confirm?: boolean
  notice_hours?: number
  // Phase 2: JSONB fields
  custom_form?: Record<string, any> | null
  payment_config?: Record<string, any> | null
  email_templates?: Record<string, any> | null
  updated_at?: string
  // Cancellation settings
  cancellation_enabled?: boolean
  cancellation_policy?: 'refund' | 'transfer' | 'both'
  cancellation_deadline_hours?: number
  refund_automatic?: boolean
}

export type Session = {
  id: string
  therapist_id: string
  name?: string
  label: string
  duration: number
  price: number
  enabled: boolean
  created_at: string
  // Phase 2: New fields
  description?: string | null
  color?: string
  max_per_day?: number | null
  display_order?: number
}

export type Schedule = {
  id: string
  therapist_id: string
  day_of_week: number // 0-6
  start_time: string // "09:00"
  end_time: string // "17:00"
  is_available: boolean
  created_at?: string
  updated_at?: string
}

export type Holiday = {
  id: string
  therapist_id: string
  start_date: string
  end_date: string
  reason?: string | null
  created_at: string
}

export type Booking = {
  id: string
  therapist_id: string
  session_id: string | null
  client_name?: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  date: string
  time: string
  duration?: number
  created_at: string
  google_event_id?: string | null
  // Phase 2: Payment tracking
  payment_status?: 'pending' | 'paid' | 'cancelled'
  payment_method?: string | null
  payment_date?: string | null
  // Phase 2: Communication tracking
  reminder_sent?: boolean
  confirmation_sent?: boolean
  // Phase 2: Custom form data
  form_data?: Record<string, any> | null
  // Phase 2: Therapist notes
  therapist_notes?: string | null
  // Phase 2: Booking lifecycle
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  cancellation_reason?: string | null
  cancelled_at?: string | null
  // Notification system
  viewed_at?: string | null
  // Cancellation tracking
  cancelled_by?: 'patient' | 'therapist'
  cancellation_type?: 'cancel' | 'transfer'
  cancellation_token?: string | null
  // Refund tracking
  refund_status?: 'pending' | 'processed' | 'rejected'
  refund_amount?: number
  refund_date?: string | null
  // Transfer tracking
  original_booking_id?: string | null
  transferred_to_booking_id?: string | null
}
