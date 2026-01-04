// Google Calendar API Configuration & Helpers
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// OAuth2 Client Configuration
export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    process.env.NEXT_PUBLIC_APP_URL + '/api/calendar/callback'
  )
}

// Generate OAuth URL for therapist to connect their Google Calendar
export function getAuthUrl(therapistId: string) {
  const oauth2Client = getOAuth2Client()

  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Get refresh token
    prompt: 'consent', // Force consent screen to get refresh_token even if already authorized
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ],
    state: therapistId // Pass therapist ID to callback
  })
}

// Exchange authorization code for tokens
export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

// Save tokens to Supabase for a therapist
export async function saveTokensForTherapist(
  therapistId: string,
  tokens: {
    access_token?: string | null
    refresh_token?: string | null
    expiry_date?: number | null
  }
) {
  const { error } = await supabase
    .from('therapists')
    .update({
      google_access_token: tokens.access_token,
      google_refresh_token: tokens.refresh_token,
      google_token_expiry: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null
    })
    .eq('id', therapistId)

  if (error) throw error
}

// Get authenticated calendar client for a therapist
export async function getCalendarClient(therapistId: string) {
  // Fetch tokens from Supabase
  const { data: therapist, error } = await supabase
    .from('therapists')
    .select('google_access_token, google_refresh_token, google_token_expiry')
    .eq('id', therapistId)
    .single()

  if (error || !therapist) throw new Error('Therapist not found')
  if (!therapist.google_access_token) throw new Error('Google Calendar not connected')

  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({
    access_token: therapist.google_access_token,
    refresh_token: therapist.google_refresh_token,
    expiry_date: therapist.google_token_expiry
      ? new Date(therapist.google_token_expiry).getTime()
      : undefined
  })

  // Auto-refresh token if expired
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.refresh_token) {
      await saveTokensForTherapist(therapistId, tokens)
    }
  })

  return google.calendar({ version: 'v3', auth: oauth2Client })
}

// Create a Google Calendar event from a booking
export async function createCalendarEvent(
  therapistId: string,
  booking: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone?: string
    date: string
    time: string
    duration: number
    session_label: string
  }
) {
  const calendar = await getCalendarClient(therapistId)

  // Combine date and time to create ISO datetime
  const startDateTime = new Date(`${booking.date}T${booking.time}`)
  const endDateTime = new Date(startDateTime.getTime() + booking.duration * 60000)

  const event = {
    summary: `${booking.session_label} - ${booking.first_name} ${booking.last_name}`,
    description: `
Réservation via Moi-Quand.com

Client: ${booking.first_name} ${booking.last_name}
Email: ${booking.email}
${booking.phone ? `Téléphone: ${booking.phone}` : ''}

Booking ID: ${booking.id}
    `.trim(),
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: 'Europe/Zurich'
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: 'Europe/Zurich'
    },
    attendees: [
      { email: booking.email }
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 30 }
      ]
    }
  }

  const response = await calendar.events.insert({
    calendarId: await getSelectedCalendarId(therapistId),
    requestBody: event,
    sendUpdates: 'all' // Send email to attendee
  })

  return response.data.id // Google Calendar event ID
}

// Update a Google Calendar event
export async function updateCalendarEvent(
  therapistId: string,
  eventId: string,
  updates: {
    date?: string
    time?: string
    duration?: number
  }
) {
  const calendar = await getCalendarClient(therapistId)

  const startDateTime = new Date(`${updates.date}T${updates.time}`)
  const endDateTime = new Date(startDateTime.getTime() + (updates.duration || 60) * 60000)

  await calendar.events.patch({
    calendarId: await getSelectedCalendarId(therapistId),
    eventId,
    requestBody: {
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'Europe/Zurich'
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Europe/Zurich'
      }
    },
    sendUpdates: 'all'
  })
}

// Delete a Google Calendar event
export async function deleteCalendarEvent(
  therapistId: string,
  eventId: string
) {
  const calendar = await getCalendarClient(therapistId)

  await calendar.events.delete({
    calendarId: await getSelectedCalendarId(therapistId),
    eventId,
    sendUpdates: 'all'
  })
}

// Check if therapist has Google Calendar connected
export async function hasGoogleCalendarConnected(therapistId: string): Promise<boolean> {
  const { data } = await supabase
    .from('therapists')
    .select('google_access_token')
    .eq('id', therapistId)
    .single()

  return !!data?.google_access_token
}

// Disconnect Google Calendar for a therapist
export async function disconnectGoogleCalendar(therapistId: string) {
  console.log('disconnectGoogleCalendar called with therapistId:', therapistId)

  const { data, error } = await supabase
    .from('therapists')
    .update({
      google_access_token: null,
      google_refresh_token: null,
      google_token_expiry: null,
      google_calendar_id: null
    })
    .eq('id', therapistId)
    .select()

  console.log('Supabase update result:', { data, error })

  if (error) {
    console.error('Supabase error in disconnectGoogleCalendar:', error)
    throw error
  }

  console.log('Google Calendar disconnected successfully')
  return data
}

// List all calendars available to the therapist
export async function listCalendars(therapistId: string) {
  const calendar = await getCalendarClient(therapistId)
  
  const response = await calendar.calendarList.list()
  
  return response.data.items?.map(cal => ({
    id: cal.id,
    summary: cal.summary,
    description: cal.description,
    primary: cal.primary,
    backgroundColor: cal.backgroundColor
  })) || []
}

// Save selected calendar ID for a therapist
export async function saveSelectedCalendar(therapistId: string, calendarId: string) {
  const { error } = await supabase
    .from('therapists')
    .update({ google_calendar_id: calendarId })
    .eq('id', therapistId)

  if (error) throw error
}

/**
 * Get busy times from Google Calendar for a date range
 * Uses the freebusy API to check when the therapist is occupied
 *
 * @param therapistId - The therapist's user ID
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Array of busy time ranges with ISO datetime strings
 */
export async function getGoogleCalendarBusyTimes(
  therapistId: string,
  startDate: string,
  endDate: string
): Promise<Array<{ start: string; end: string }>> {
  try {
    console.log(`Fetching Google Calendar busy times for ${therapistId} from ${startDate} to ${endDate}`)

    const calendar = await getCalendarClient(therapistId)
    const calendarId = await getSelectedCalendarId(therapistId)

    // Create ISO datetime strings for the start and end of the date range
    const timeMin = new Date(`${startDate}T00:00:00`).toISOString()
    const timeMax = new Date(`${endDate}T23:59:59`).toISOString()

    console.log(`Querying freebusy API with timeMin=${timeMin}, timeMax=${timeMax}, calendarId=${calendarId}`)

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        timeZone: 'Europe/Zurich',
        items: [{ id: calendarId }]
      }
    })

    const busyTimes = response.data.calendars?.[calendarId]?.busy || []

    console.log(`Found ${busyTimes.length} busy periods in Google Calendar`)

    return busyTimes.map(busy => ({
      start: busy.start!,
      end: busy.end!
    }))
  } catch (error) {
    console.error('Error fetching Google Calendar busy times:', error)
    // Fail gracefully - return empty array so booking system continues to work
    // even if Google Calendar is temporarily unavailable
    return []
  }
}

// Get the selected calendar ID for a therapist
export async function getSelectedCalendarId(therapistId: string): Promise<string> {
  const { data } = await supabase
    .from('therapists')
    .select('google_calendar_id')
    .eq('id', therapistId)
    .single()
  
  return data?.google_calendar_id || 'primary'
}
