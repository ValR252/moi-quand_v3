// API Route: Manually sync a booking to Google Calendar
import { NextRequest, NextResponse } from 'next/server'
import { createCalendarEvent, hasGoogleCalendarConnected } from '@/lib/google-calendar'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json()

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID required' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const cookieStore = await cookies()

    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if therapist has Google Calendar connected
    const hasCalendar = await hasGoogleCalendarConnected(user.id)
    if (!hasCalendar) {
      return NextResponse.json(
        { error: 'Google Calendar not connected' },
        { status: 400 }
      )
    }

    // Create service role client for data access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch booking details with session info
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        date,
        time,
        therapist_id,
        session_id,
        sessions (
          label,
          duration
        )
      `)
      .eq('id', bookingId)
      .eq('therapist_id', user.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Get session data (Supabase returns array for relations)
    const session = Array.isArray(booking.sessions) ? booking.sessions[0] : booking.sessions

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Create Google Calendar event
    const eventId = await createCalendarEvent(user.id, {
      id: booking.id,
      first_name: booking.first_name,
      last_name: booking.last_name,
      email: booking.email,
      phone: booking.phone,
      date: booking.date,
      time: booking.time,
      duration: session.duration,
      session_label: session.label
    })

    // Save event ID to booking
    await supabase
      .from('bookings')
      .update({ google_event_id: eventId })
      .eq('id', bookingId)

    return NextResponse.json({
      success: true,
      eventId
    })
  } catch (error) {
    console.error('Error syncing to calendar:', error)
    return NextResponse.json(
      { error: 'Failed to sync to Google Calendar' },
      { status: 500 }
    )
  }
}
