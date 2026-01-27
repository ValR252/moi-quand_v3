/**
 * Calendar Links Generator
 * Generates "Add to Calendar" links for Google Calendar, Apple Calendar, Outlook, and .ics file
 */

interface CalendarEvent {
  title: string
  description: string
  location?: string
  startDate: string // YYYY-MM-DD
  startTime: string // HH:MM
  duration: number // in minutes
  timezone?: string // IANA timezone (e.g., "Europe/Paris")
}

/**
 * Format date and time for calendar links
 * Returns ISO datetime string without separators (e.g., "20260107T143000")
 */
function formatDateTime(date: string, time: string): string {
  const [year, month, day] = date.split('-')
  const [hours, minutes] = time.split(':')
  return `${year}${month}${day}T${hours}${minutes}00`
}

/**
 * Calculate end datetime based on start and duration
 */
function getEndDateTime(date: string, time: string, duration: number): string {
  const startDateTime = new Date(`${date}T${time}`)
  const endDateTime = new Date(startDateTime.getTime() + duration * 60000)

  const year = endDateTime.getFullYear()
  const month = String(endDateTime.getMonth() + 1).padStart(2, '0')
  const day = String(endDateTime.getDate()).padStart(2, '0')
  const hours = String(endDateTime.getHours()).padStart(2, '0')
  const minutes = String(endDateTime.getMinutes()).padStart(2, '0')

  return `${year}${month}${day}T${hours}${minutes}00`
}

/**
 * Generate Google Calendar link
 * Opens Google Calendar with pre-filled event
 */
export function generateGoogleCalendarLink(event: CalendarEvent): string {
  const start = formatDateTime(event.startDate, event.startTime)
  const end = getEndDateTime(event.startDate, event.startTime, event.duration)

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: event.description,
    dates: `${start}/${end}`,
    ctz: event.timezone || 'Europe/Zurich'
  })

  if (event.location) {
    params.append('location', event.location)
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * Generate Outlook Calendar link
 * Opens Outlook.com calendar with pre-filled event
 */
export function generateOutlookLink(event: CalendarEvent): string {
  const start = new Date(`${event.startDate}T${event.startTime}`).toISOString()
  const end = new Date(new Date(`${event.startDate}T${event.startTime}`).getTime() + event.duration * 60000).toISOString()

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    body: event.description,
    startdt: start,
    enddt: end
  })

  if (event.location) {
    params.append('location', event.location)
  }

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}

/**
 * Generate Office 365 Calendar link
 */
export function generateOffice365Link(event: CalendarEvent): string {
  const start = new Date(`${event.startDate}T${event.startTime}`).toISOString()
  const end = new Date(new Date(`${event.startDate}T${event.startTime}`).getTime() + event.duration * 60000).toISOString()

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    body: event.description,
    startdt: start,
    enddt: end
  })

  if (event.location) {
    params.append('location', event.location)
  }

  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`
}

/**
 * Generate .ics file content (iCalendar format)
 * Universal format compatible with Apple Calendar, Outlook, etc.
 */
export function generateICSFile(event: CalendarEvent): string {
  const start = formatDateTime(event.startDate, event.startTime)
  const end = getEndDateTime(event.startDate, event.startTime, event.duration)
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  // Escape special characters in text fields
  const escapeText = (text: string) => text.replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n')

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Moi-Quand//Booking System//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${now}@moi-quand.com`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
  ]

  if (event.location) {
    ics.push(`LOCATION:${escapeText(event.location)}`)
  }

  ics.push(
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  )

  return ics.join('\r\n')
}

/**
 * Generate data URL for .ics file download
 */
export function generateICSDataURL(event: CalendarEvent): string {
  const icsContent = generateICSFile(event)
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`
}

/**
 * Generate all calendar links at once
 */
export function generateAllCalendarLinks(event: CalendarEvent) {
  return {
    google: generateGoogleCalendarLink(event),
    outlook: generateOutlookLink(event),
    office365: generateOffice365Link(event),
    ics: generateICSDataURL(event),
  }
}
