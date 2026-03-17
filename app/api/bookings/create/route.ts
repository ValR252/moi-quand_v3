// API Route: Create a booking and auto-sync to Google Calendar + Zoom for online sessions
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { autoSyncBooking } from '@/lib/booking-sync'
import { sendBookingConfirmationEmail } from '@/lib/email'
import { createZoomMeeting, hasZoomConnected } from '@/lib/zoom'
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
      patient_timezone,
      payment_method,
      is_online
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

    // Get therapist timezone and session info first
    const { data: therapistData } = await supabase
      .from('therapists')
      .select('name, cancellation_deadline_hours, timezone')
      .eq('id', therapist_id)
      .single()

    const therapistTimezone = therapistData?.timezone || 'Europe/Zurich'

    // Get session details (including is_online)
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('label, duration, is_online')
      .eq('id', session_id)
      .single()

    const sessionIsOnline = is_online || sessionData?.is_online || false

    // Prepare booking data
    const bookingData: any = {
      therapist_id,
      session_id,
      first_name,
      last_name,
      email,
      phone,
      date,
      time,
      payment_status: 'pending',
      payment_method: payment_method || 'bank_transfer',
      cancellation_token: cancellationToken,
      patient_timezone: patient_timezone || null,
      therapist_timezone: therapistTimezone,
      is_online: sessionIsOnline,
    }

    // If online session and Zoom is connected, create Zoom meeting
    let zoomMeeting: { id: string; join_url: string; start_url: string; password?: string } | null = null
    
    if (sessionIsOnline) {
      const zoomConnected = await hasZoomConnected(therapist_id)
      
      if (zoomConnected) {
        try {
          // Create Zoom meeting
          const startDateTime = new Date(`${date}T${time}`)
          const meeting = await createZoomMeeting(therapist_id, {
            topic: `${sessionData?.label || 'Séance'} - ${first_name} ${last_name}`,
            start_time: startDateTime.toISOString(),
            duration: sessionData?.duration || 60,
            timezone: therapistTimezone,
          })
          
          zoomMeeting = {
            id: meeting.id.toString(),
            join_url: meeting.join_url,
            start_url: meeting.start_url,
            password: meeting.password,
          }
          
          // Add Zoom data to booking
          bookingData.zoom_meeting_id = zoomMeeting.id
          bookingData.zoom_join_url = zoomMeeting.join_url
          bookingData.zoom_start_url = zoomMeeting.start_url
        } catch (zoomError) {
          console.error('Error creating Zoom meeting:', zoomError)
          // Don't fail booking creation if Zoom fails
          // Booking will be created without Zoom link
        }
      }
    }

    // Create booking in Supabase
    // Note: time is stored in therapist's timezone
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single()

    if (error) {
      console.error('Error creating booking:', error)
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      )
    }

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
      patientTimezone: patient_timezone || undefined,
      // Zoom data for online sessions
      zoomMeeting: zoomMeeting ? {
        joinUrl: zoomMeeting.join_url,
        password: zoomMeeting.password,
      } : undefined,
      isOnline: sessionIsOnline,
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
