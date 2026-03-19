/**
 * API: Cancel Booking (Therapist)
 * Backend Engineer: Cancellation API with Google Calendar sync
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { deleteCalendarEvent } from '@/lib/google-calendar'
import { sendCancellationEmailToPatient, sendCancellationEmailToTherapist } from '@/lib/email'

interface CancelBookingRequest {
  booking_id: string
  reason?: string
}

/**
 * POST /api/bookings/cancel
 * Cancel a booking by therapist with Google Calendar sync
 */
export async function POST(request: NextRequest) {
  try {
    // Get therapist ID from auth
    const authHeader = request.headers.get('cookie')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Get session from cookie
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.split('sb-access-token=')[1]?.split(';')[0]
    )

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: CancelBookingRequest = await request.json()

    if (!body.booking_id) {
      return NextResponse.json(
        { error: 'booking_id requis' },
        { status: 400 }
      )
    }

    // Get therapist by email
    const { data: therapist, error: therapistError } = await supabaseAdmin
      .from('therapists')
      .select('id')
      .eq('email', user.email)
      .single()

    if (therapistError || !therapist) {
      return NextResponse.json(
        { error: 'Thérapeute non trouvé' },
        { status: 404 }
      )
    }

    // Get booking with session and therapist details
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        sessions (
          label,
          duration
        ),
        therapists (
          name,
          email
        )
      `)
      .eq('id', body.booking_id)
      .eq('therapist_id', therapist.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Rendez-vous non trouvé' },
        { status: 404 }
      )
    }

    // Check if already cancelled
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Ce rendez-vous est déjà annulé' },
        { status: 400 }
      )
    }

    // Update booking status
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: 'therapist',
        cancellation_type: 'cancel',
        cancellation_reason: body.reason || 'Annulé par le thérapeute'
      })
      .eq('id', body.booking_id)

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
        // Don't fail the cancellation if calendar delete fails
      }
    }

    // Send cancellation emails
    try {
      const therapistData = (booking as any).therapists
      const sessionData = (booking as any).sessions

      // Email to patient
      await sendCancellationEmailToPatient({
        to: booking.email,
        patientName: `${booking.first_name} ${booking.last_name}`,
        therapistName: therapistData?.name || 'votre thérapeute',
        date: booking.date,
        time: booking.time,
        sessionLabel: sessionData?.label || 'Séance',
        cancelledBy: 'therapist',
        reason: body.reason,
        willBeRefunded: false // Will be determined by therapist settings later
      })

      // Email to therapist
      await sendCancellationEmailToTherapist({
        to: therapistData?.email || user.email || '',
        therapistName: therapistData?.name || 'Thérapeute',
        patientName: `${booking.first_name} ${booking.last_name}`,
        date: booking.date,
        time: booking.time,
        sessionLabel: sessionData?.label || 'Séance',
        cancelledBy: 'therapist',
        reason: body.reason
      })

      console.log('Cancellation emails sent successfully')
    } catch (emailError) {
      console.error('Error sending cancellation emails:', emailError)
      // Don't fail the cancellation if email sending fails
    }

    return NextResponse.json({
      success: true,
      message: 'Rendez-vous annulé avec succès',
      booking_id: body.booking_id
    })

  } catch (error) {
    console.error('Error in cancel booking API:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
