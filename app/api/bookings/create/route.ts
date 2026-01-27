// API Route: Create a booking and auto-sync to Google Calendar
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { autoSyncBooking } from '@/lib/booking-sync'
import { sendBookingConfirmationEmail } from '@/lib/email'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      therapist_id,
      session_id,
      first_name,
      last_name,
      email,
      phone,
      date,
      time,
      patient_timezone
    } = body

    // Validate required fields
    if (!therapist_id || !session_id || !first_name || !last_name || !email || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate unique cancellation token
    const cancellationToken = crypto.randomBytes(32).toString('hex')

    // Get therapist timezone first
    const { data: therapistData } = await supabase
      .from('therapists')
      .select('name, cancellation_deadline_hours, timezone')
      .eq('id', therapist_id)
      .single()

    const therapistTimezone = therapistData?.timezone || 'Europe/Zurich'

    // Create booking in Supabase
    // Note: time is stored in therapist's timezone
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        therapist_id,
        session_id,
        first_name,
        last_name,
        email,
        phone,
        date,
        time,
        payment_status: 'pending',
        cancellation_token: cancellationToken,
        patient_timezone: patient_timezone || null,
        therapist_timezone: therapistTimezone
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating booking:', error)
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      )
    }

    const { data: sessionData } = await supabase
      .from('sessions')
      .select('label, duration')
      .eq('id', session_id)
      .single()

    // Auto-sync to Google Calendar (async, don't block response)
    // This will only sync if therapist has Google Calendar connected
    autoSyncBooking(booking.id).catch(err => {
      console.error('Error syncing booking to calendar:', err)
      // Don't fail the booking creation if sync fails
    })

    // Send confirmation email with cancellation link (async)
    sendBookingConfirmationEmail({
      to: email,
      patientName: `${first_name} ${last_name}`,
      therapistName: therapistData?.name || 'votre thérapeute',
      date,
      time,
      duration: sessionData?.duration || 60,
      sessionLabel: sessionData?.label || 'Séance',
      cancellationToken,
      cancellationDeadlineHours: therapistData?.cancellation_deadline_hours || 24,
      therapistTimezone: therapistTimezone,
      patientTimezone: patient_timezone || undefined
    }).catch(err => {
      console.error('Error sending confirmation email:', err)
      // Don't fail the booking creation if email fails
    })

    return NextResponse.json({
      success: true,
      booking
    })
  } catch (error) {
    console.error('Error in booking creation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
