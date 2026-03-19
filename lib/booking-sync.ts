// Booking synchronization helpers for Google Calendar
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  hasGoogleCalendarConnected
} from './google-calendar'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'

// Auto-sync a booking to Google Calendar after creation
export async function autoSyncBooking(bookingId: string) {
  try {
    // Fetch booking with session details
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        id,
        therapist_id,
        first_name,
        last_name,
        email,
        phone,
        date,
        time,
        therapist_timezone,
        sessions (
          label,
          duration
        )
      `)
      .eq('id', bookingId)
      .single()

    if (error || !booking) {
      console.error('Booking not found:', bookingId)
      return
    }

    // Check if therapist has Google Calendar connected
    const hasCalendar = await hasGoogleCalendarConnected(booking.therapist_id)
    if (!hasCalendar) {
      console.log('Therapist does not have Google Calendar connected')
      return
    }

    // Get therapist timezone (fallback to Europe/Zurich if not set)
    const therapistTimezone = booking.therapist_timezone || 'Europe/Zurich'

    // Get session data (Supabase returns array for relations)
    const session = Array.isArray(booking.sessions) ? booking.sessions[0] : booking.sessions

    if (!session) {
      console.error('Session not found for booking:', bookingId)
      return
    }

    // Create event in Google Calendar with therapist's timezone
    const eventId = await createCalendarEvent(booking.therapist_id, {
      id: booking.id,
      first_name: booking.first_name,
      last_name: booking.last_name,
      email: booking.email,
      phone: booking.phone,
      date: booking.date,
      time: booking.time,
      duration: session.duration,
      session_label: session.label
    }, therapistTimezone)

    // Save event ID back to booking
    await supabase
      .from('bookings')
      .update({ google_event_id: eventId })
      .eq('id', bookingId)

    console.log(`✅ Booking ${bookingId} synced to Google Calendar`)
  } catch (error) {
    console.error('Error auto-syncing booking:', error)
    // Don't throw - we don't want to fail the booking creation
  }
}

// Sync an existing booking update to Google Calendar
export async function syncBookingUpdate(
  bookingId: string,
  updates: {
    date?: string
    time?: string
  }
) {
  try {
    const { data: booking } = await supabase
      .from('bookings')
      .select('therapist_id, google_event_id, therapist_timezone, sessions(duration)')
      .eq('id', bookingId)
      .single()

    if (!booking?.google_event_id) return

    // Get session data (Supabase returns array for relations)
    const session = Array.isArray(booking.sessions) ? booking.sessions[0] : booking.sessions
    const therapistTimezone = booking.therapist_timezone || 'Europe/Zurich'

    await updateCalendarEvent(
      booking.therapist_id,
      booking.google_event_id,
      {
        ...updates,
        duration: session?.duration || 60
      },
      therapistTimezone
    )

    console.log(`✅ Booking ${bookingId} updated in Google Calendar`)
  } catch (error) {
    console.error('Error syncing booking update:', error)
  }
}

// Sync booking deletion to Google Calendar
export async function syncBookingDeletion(bookingId: string) {
  try {
    const { data: booking } = await supabase
      .from('bookings')
      .select('therapist_id, google_event_id')
      .eq('id', bookingId)
      .single()

    if (!booking?.google_event_id) return

    await deleteCalendarEvent(booking.therapist_id, booking.google_event_id)

    console.log(`✅ Booking ${bookingId} deleted from Google Calendar`)
  } catch (error) {
    console.error('Error syncing booking deletion:', error)
  }
}
