/**
 * API: Cancel Booking by Patient
 * Backend Engineer: Patient-initiated cancellation with policy validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { deleteCalendarEvent } from '@/lib/google-calendar'
import { sendCancellationEmailToPatient, sendCancellationEmailToTherapist } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

interface CancelByPatientRequest {
  token: string
  action: 'cancel' | 'transfer'
  reason?: string
}

/**
 * POST /api/bookings/cancel-by-patient
 * Cancel or transfer a booking using cancellation token
 */
export async function POST(request: NextRequest) {
  try {
    const body: CancelByPatientRequest = await request.json()

    if (!body.token || !body.action) {
      return NextResponse.json(
        { error: 'Token et action requis' },
        { status: 400 }
      )
    }

    // Get booking with related data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        sessions (
          label,
          duration
        ),
        therapists (
          id,
          name,
          email,
          cancellation_enabled,
          cancellation_policy,
          cancellation_deadline_hours,
          refund_automatic
        )
      `)
      .eq('cancellation_token', body.token)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Rendez-vous introuvable' },
        { status: 404 }
      )
    }

    const therapist = (booking as any).therapists
    const session = (booking as any).sessions

    // Check if already cancelled
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Ce rendez-vous est déjà annulé' },
        { status: 400 }
      )
    }

    // Check if cancellation is enabled
    if (!therapist?.cancellation_enabled) {
      return NextResponse.json(
        { error: 'Les annulations ne sont pas autorisées' },
        { status: 403 }
      )
    }

    // Calculate hours until booking
    const bookingDateTime = new Date(`${booking.date}T${booking.time}`)
    const now = new Date()
    const hoursUntil = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    // Check deadline
    const deadlineHours = therapist.cancellation_deadline_hours || 24
    if (hoursUntil < deadlineHours) {
      return NextResponse.json(
        { error: `Trop tard ! Vous devez annuler au moins ${deadlineHours}h avant le rendez-vous.` },
        { status: 403 }
      )
    }

    // Check if action is allowed by policy
    const policy = therapist.cancellation_policy || 'both'

    if (body.action === 'cancel' && policy !== 'refund' && policy !== 'both') {
      return NextResponse.json(
        { error: 'L\'annulation avec remboursement n\'est pas autorisée' },
        { status: 403 }
      )
    }

    if (body.action === 'transfer' && policy !== 'transfer' && policy !== 'both') {
      return NextResponse.json(
        { error: 'Le transfert n\'est pas autorisé' },
        { status: 403 }
      )
    }

    // Handle transfer (Sprint 4 - for now, just return not implemented)
    if (body.action === 'transfer') {
      return NextResponse.json(
        { error: 'Le transfert sera implémenté dans le Sprint 4' },
        { status: 501 }
      )
    }

    // Update booking status (CANCEL)
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: 'patient',
        cancellation_type: 'cancel',
        cancellation_reason: body.reason || 'Annulé par le patient',
        refund_status: (policy === 'refund' || policy === 'both') ? 'pending' : null
      })
      .eq('id', booking.id)

    if (updateError) {
      console.error('Error updating booking:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'annulation' },
        { status: 500 }
      )
    }

    // Delete Google Calendar event if exists
    if (booking.google_event_id) {
      try {
        await deleteCalendarEvent(therapist.id, booking.google_event_id)
        console.log(`Deleted Google Calendar event: ${booking.google_event_id}`)
      } catch (calendarError) {
        console.error('Error deleting Google Calendar event:', calendarError)
        // Don't fail the cancellation
      }
    }

    // Send cancellation emails
    try {
      const willBeRefunded = policy === 'refund' || policy === 'both'

      // Email to patient
      await sendCancellationEmailToPatient({
        to: booking.email,
        patientName: `${booking.first_name} ${booking.last_name}`,
        therapistName: therapist?.name || 'votre thérapeute',
        date: booking.date,
        time: booking.time,
        sessionLabel: session?.label || 'Séance',
        cancelledBy: 'patient',
        reason: body.reason,
        willBeRefunded
      })

      // Email to therapist
      await sendCancellationEmailToTherapist({
        to: therapist?.email || '',
        therapistName: therapist?.name || 'Thérapeute',
        patientName: `${booking.first_name} ${booking.last_name}`,
        date: booking.date,
        time: booking.time,
        sessionLabel: session?.label || 'Séance',
        cancelledBy: 'patient',
        reason: body.reason
      })

      console.log('Cancellation emails sent successfully')
    } catch (emailError) {
      console.error('Error sending cancellation emails:', emailError)
      // Don't fail the cancellation
    }

    return NextResponse.json({
      success: true,
      message: 'Rendez-vous annulé avec succès',
      refund_pending: (policy === 'refund' || policy === 'both')
    })

  } catch (error) {
    console.error('Error in cancel-by-patient API:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
