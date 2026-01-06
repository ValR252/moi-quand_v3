/**
 * API: Transfer Booking
 * Backend Engineer: Transfer appointment to new date/time
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { deleteCalendarEvent, createCalendarEvent } from '@/lib/google-calendar'
import { sendTransferEmailToPatient, sendCancellationEmailToTherapist } from '@/lib/email'
import crypto from 'crypto'

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

interface TransferRequest {
  token: string
  new_date: string
  new_time: string
}

/**
 * POST /api/bookings/transfer
 * Transfer a booking to a new date/time
 */
export async function POST(request: NextRequest) {
  try {
    const body: TransferRequest = await request.json()

    if (!body.token || !body.new_date || !body.new_time) {
      return NextResponse.json(
        { error: 'Token, nouvelle date et heure requis' },
        { status: 400 }
      )
    }

    // Get original booking with all related data
    const { data: originalBooking, error: bookingError } = await supabase
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
          email,
          cancellation_enabled,
          cancellation_policy,
          cancellation_deadline_hours
        )
      `)
      .eq('cancellation_token', body.token)
      .single()

    if (bookingError || !originalBooking) {
      return NextResponse.json(
        { error: 'Rendez-vous introuvable' },
        { status: 404 }
      )
    }

    const therapist = (originalBooking as any).therapists
    const session = (originalBooking as any).sessions

    // Check if already cancelled
    if (originalBooking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Ce rendez-vous est déjà annulé' },
        { status: 400 }
      )
    }

    // Check if transfer is enabled
    if (!therapist?.cancellation_enabled) {
      return NextResponse.json(
        { error: 'Les modifications ne sont pas autorisées' },
        { status: 403 }
      )
    }

    const policy = therapist.cancellation_policy || 'both'
    if (policy !== 'transfer' && policy !== 'both') {
      return NextResponse.json(
        { error: 'Le transfert n\'est pas autorisé' },
        { status: 403 }
      )
    }

    // Check deadline
    const bookingDateTime = new Date(`${originalBooking.date}T${originalBooking.time}`)
    const now = new Date()
    const hoursUntil = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    const deadlineHours = therapist.cancellation_deadline_hours || 24

    if (hoursUntil < deadlineHours) {
      return NextResponse.json(
        { error: `Trop tard ! Vous devez transférer au moins ${deadlineHours}h avant le rendez-vous.` },
        { status: 403 }
      )
    }

    // Validate new date is in the future
    const newBookingDateTime = new Date(`${body.new_date}T${body.new_time}`)
    if (newBookingDateTime <= now) {
      return NextResponse.json(
        { error: 'La nouvelle date doit être dans le futur' },
        { status: 400 }
      )
    }

    // Check if new slot is available (call availability API)
    const availabilityRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/availability/${therapist.id}?date=${body.new_date}&session_id=${session.id}`,
      { method: 'GET' }
    )

    if (!availabilityRes.ok) {
      return NextResponse.json(
        { error: 'Impossible de vérifier la disponibilité' },
        { status: 500 }
      )
    }

    const availabilityData = await availabilityRes.json()
    const requestedSlot = availabilityData.slots?.find((s: any) => s.time === body.new_time)

    if (!requestedSlot || !requestedSlot.available) {
      return NextResponse.json(
        { error: 'Ce créneau n\'est plus disponible' },
        { status: 409 }
      )
    }

    // Generate new cancellation token for the new booking
    const newCancellationToken = crypto.randomBytes(32).toString('hex')

    // Create new booking
    const { data: newBooking, error: createError } = await supabase
      .from('bookings')
      .insert({
        therapist_id: originalBooking.therapist_id,
        session_id: originalBooking.session_id,
        first_name: originalBooking.first_name,
        last_name: originalBooking.last_name,
        email: originalBooking.email,
        phone: originalBooking.phone,
        date: body.new_date,
        time: body.new_time,
        payment_status: originalBooking.payment_status,
        status: 'confirmed',
        cancellation_token: newCancellationToken,
        original_booking_id: originalBooking.id,
        form_data: originalBooking.form_data
      })
      .select()
      .single()

    if (createError || !newBooking) {
      console.error('Error creating new booking:', createError)
      return NextResponse.json(
        { error: 'Erreur lors de la création du nouveau rendez-vous' },
        { status: 500 }
      )
    }

    // Update original booking to mark as transferred
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: 'patient',
        cancellation_type: 'transfer',
        cancellation_reason: 'Transféré vers un nouveau créneau',
        transferred_to_booking_id: newBooking.id
      })
      .eq('id', originalBooking.id)

    if (updateError) {
      console.error('Error updating original booking:', updateError)
      // Don't fail the transfer, the new booking is created
    }

    // Update Google Calendar
    if (originalBooking.google_event_id) {
      try {
        // Delete old event
        await deleteCalendarEvent(therapist.id, originalBooking.google_event_id)
        console.log(`Deleted old Google Calendar event: ${originalBooking.google_event_id}`)
      } catch (calendarError) {
        console.error('Error deleting old calendar event:', calendarError)
      }
    }

    // Create new calendar event
    try {
      const googleEventId = await createCalendarEvent(therapist.id, {
        id: newBooking.id,
        first_name: newBooking.first_name,
        last_name: newBooking.last_name,
        email: newBooking.email,
        phone: newBooking.phone || '',
        date: newBooking.date,
        time: newBooking.time,
        duration: session?.duration || 60,
        session_label: session?.label || 'Séance'
      })

      // Save Google event ID to new booking
      await supabase
        .from('bookings')
        .update({ google_event_id: googleEventId })
        .eq('id', newBooking.id)

      console.log(`Created new Google Calendar event: ${googleEventId}`)
    } catch (calendarError) {
      console.error('Error creating new calendar event:', calendarError)
      // Don't fail the transfer
    }

    // Send transfer emails
    try {
      // Email to patient
      await sendTransferEmailToPatient({
        to: newBooking.email,
        patientName: `${newBooking.first_name} ${newBooking.last_name}`,
        therapistName: therapist?.name || 'votre thérapeute',
        oldDate: originalBooking.date,
        oldTime: originalBooking.time,
        newDate: newBooking.date,
        newTime: newBooking.time,
        sessionLabel: session?.label || 'Séance',
        duration: session?.duration || 60,
        newCancellationToken,
        cancellationDeadlineHours: therapist.cancellation_deadline_hours || 24
      })

      // Email to therapist
      await sendCancellationEmailToTherapist({
        to: therapist?.email || '',
        therapistName: therapist?.name || 'Thérapeute',
        patientName: `${newBooking.first_name} ${newBooking.last_name}`,
        date: originalBooking.date,
        time: originalBooking.time,
        sessionLabel: session?.label || 'Séance',
        cancelledBy: 'patient',
        reason: `Transféré vers le ${body.new_date} à ${body.new_time}`
      })

      console.log('Transfer emails sent successfully')
    } catch (emailError) {
      console.error('Error sending transfer emails:', emailError)
      // Don't fail the transfer
    }

    return NextResponse.json({
      success: true,
      message: 'Rendez-vous transféré avec succès',
      new_booking: {
        id: newBooking.id,
        date: newBooking.date,
        time: newBooking.time,
        cancellation_token: newCancellationToken
      }
    })

  } catch (error) {
    console.error('Error in transfer booking API:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
