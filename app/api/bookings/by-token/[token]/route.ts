/**
 * API: Get Booking by Cancellation Token
 * Backend Engineer: Retrieve booking details for patient cancellation page
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

/**
 * GET /api/bookings/by-token/[token]
 * Retrieve booking details and cancellation policy
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Get booking with related data
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        sessions (
          id,
          label,
          duration
        ),
        therapists (
          id,
          name,
          slug,
          cancellation_enabled,
          cancellation_policy,
          cancellation_deadline_hours
        )
      `)
      .eq('cancellation_token', token)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Rendez-vous introuvable' },
        { status: 404 }
      )
    }

    const therapist = (booking as any).therapists
    const session = (booking as any).sessions

    // Check if cancellation is enabled
    if (!therapist?.cancellation_enabled) {
      return NextResponse.json(
        { error: 'Les annulations ne sont pas autorisées pour ce thérapeute' },
        { status: 403 }
      )
    }

    // Calculate hours until booking
    const bookingDateTime = new Date(`${booking.date}T${booking.time}`)
    const now = new Date()
    const hoursUntil = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    // Check if within cancellation deadline
    const deadlineHours = therapist.cancellation_deadline_hours || 24
    const canModify = hoursUntil >= deadlineHours

    // Determine available actions based on policy
    const policy = therapist.cancellation_policy || 'both'
    const canCancel = canModify && (policy === 'refund' || policy === 'both')
    const canTransfer = canModify && (policy === 'transfer' || policy === 'both')

    // Build response
    const response = {
      booking: {
        id: booking.id,
        therapist_id: therapist?.id || '',
        therapist_name: therapist?.name || 'Thérapeute',
        therapist_slug: therapist?.slug || '',
        patient_name: `${booking.first_name} ${booking.last_name}`,
        session_id: session?.id || '',
        date: booking.date,
        time: booking.time,
        duration: session?.duration || 60,
        session_label: session?.label || 'Séance',
        status: booking.status || 'pending',
        cancellation_policy: policy,
        cancellation_deadline_hours: deadlineHours,
        can_cancel: canCancel,
        can_transfer: canTransfer,
        deadline_message: canModify
          ? `Vous pouvez modifier ce rendez-vous jusqu'à ${deadlineHours}h avant.`
          : `Le délai de ${deadlineHours}h avant le rendez-vous est dépassé.`
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching booking by token:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
