/**
 * Availability calculation engine
 *
 * This module combines multiple sources to calculate truly available time slots:
 * 1. Therapist's schedule (working hours from `schedule` table)
 * 2. Existing bookings (from `bookings` table)
 * 3. Google Calendar busy times (via API)
 * 4. Holidays (from `holidays` table)
 * 5. Minimum notice period (from `therapists.notice_hours`)
 */

import { getGoogleCalendarBusyTimes, hasGoogleCalendarConnected } from './google-calendar'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'

/**
 * MAIN FUNCTION: Get available time slots for a therapist on a specific date
 *
 * @param therapistId - The therapist's user ID
 * @param date - Date in YYYY-MM-DD format
 * @param sessionDuration - Duration of the session in minutes (default: 60)
 * @returns Array of available time slots in HH:MM format
 */
export async function getAvailableSlots(
  therapistId: string,
  date: string,
  sessionDuration: number = 60
): Promise<string[]> {
  console.log(`Calculating available slots for therapist ${therapistId} on ${date} (${sessionDuration}min session)`)

  // 0. Get therapist timezone
  const { data: therapist } = await supabase
    .from('therapists')
    .select('timezone')
    .eq('id', therapistId)
    .single()

  const therapistTimezone = therapist?.timezone || 'Europe/Zurich'

  // 1. Check if date is a holiday
  const isHolidayDay = await isHoliday(therapistId, date)
  if (isHolidayDay) {
    console.log(`Date ${date} is a holiday - no slots available`)
    return []
  }

  // 2. Get schedule for this day of week
  const dayOfWeek = new Date(date).getDay() // 0=Sunday, 1=Monday, etc.
  const scheduleRanges = await getScheduleForDay(therapistId, dayOfWeek)

  if (scheduleRanges.length === 0) {
    console.log(`No schedule configured for day ${dayOfWeek} - therapist is closed`)
    return []
  }

  // 3. Generate all possible 30-minute slots from schedule
  let allSlots: string[] = []
  for (const range of scheduleRanges) {
    const slots = generateTimeSlots(range.start_time, range.end_time, 30)
    allSlots = allSlots.concat(slots)
  }

  console.log(`Generated ${allSlots.length} potential slots from schedule`)

  // 4. Get existing bookings for this date
  const bookings = await getBookingsForDate(therapistId, date)
  const bookingBusyTimes = bookings.map(b => ({
    start: `${date}T${b.time}`,
    end: addMinutes(`${date}T${b.time}`, b.duration)
  }))

  console.log(`Found ${bookingBusyTimes.length} existing bookings`)

  // 5. Get Google Calendar busy times (if connected)
  let googleBusyTimes: Array<{ start: string; end: string }> = []
  const hasGoogleCal = await hasGoogleCalendarConnected(therapistId)
  if (hasGoogleCal) {
    googleBusyTimes = await getGoogleCalendarBusyTimes(therapistId, date, date, therapistTimezone)
    console.log(`Found ${googleBusyTimes.length} busy periods in Google Calendar`)
  } else {
    console.log('Google Calendar not connected - skipping calendar busy times')
  }

  // 6. Combine all busy times
  const allBusyTimes = [...bookingBusyTimes, ...googleBusyTimes]
  console.log(`Total busy periods: ${allBusyTimes.length}`)

  // 7. Remove slots that conflict with busy times
  let availableSlots = removeConflictingSlots(allSlots, allBusyTimes, sessionDuration, date)

  console.log(`After removing conflicts: ${availableSlots.length} slots available`)

  // 8. Apply minimum notice period
  const noticeHours = await getTherapistNoticeHours(therapistId)
  const now = new Date()
  const earliestAllowed = new Date(now.getTime() + noticeHours * 60 * 60 * 1000)

  availableSlots = availableSlots.filter(slot => {
    const slotDateTime = new Date(`${date}T${slot}`)
    return slotDateTime >= earliestAllowed
  })

  console.log(`After applying ${noticeHours}h notice period: ${availableSlots.length} slots available`)

  return availableSlots.sort()
}

/**
 * Generate time slots in specified intervals
 *
 * @param startTime - Start time in HH:MM format
 * @param endTime - End time in HH:MM format
 * @param intervalMinutes - Interval between slots (default: 30)
 * @returns Array of time slots in HH:MM format
 */
function generateTimeSlots(startTime: string, endTime: string, intervalMinutes: number = 30): string[] {
  const slots: string[] = []
  let current = parseTime(startTime)
  const end = parseTime(endTime)

  while (current < end) {
    slots.push(formatTime(current))
    current = new Date(current.getTime() + intervalMinutes * 60 * 1000)
  }

  return slots
}

/**
 * Remove slots that overlap with busy times
 * Checks if the entire session duration would fit without conflicts
 *
 * @param slots - Array of time slots to check
 * @param busyTimes - Array of busy time ranges
 * @param duration - Session duration in minutes
 * @param date - Date in YYYY-MM-DD format
 * @returns Filtered array of available slots
 */
function removeConflictingSlots(
  slots: string[],
  busyTimes: Array<{ start: string; end: string }>,
  duration: number,
  date: string
): string[] {
  return slots.filter(slot => {
    const slotStart = new Date(`${date}T${slot}`)
    const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000)

    // Check if this slot overlaps with any busy time
    const hasConflict = busyTimes.some(busy => {
      const busyStart = new Date(busy.start)
      const busyEnd = new Date(busy.end)

      // Overlap occurs if: slot starts before busy ends AND slot ends after busy starts
      return slotStart < busyEnd && slotEnd > busyStart
    })

    return !hasConflict
  })
}

/**
 * Get therapist's schedule for a specific day of week
 *
 * @param therapistId - The therapist's user ID
 * @param dayOfWeek - Day of week (0=Sunday, 6=Saturday)
 * @returns Array of schedule ranges with start_time and end_time
 */
async function getScheduleForDay(therapistId: string, dayOfWeek: number) {
  const { data } = await supabase
    .from('schedules')
    .select('*')
    .eq('therapist_id', therapistId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_available', true)

  return data || []
}

/**
 * Check if a date is a holiday for the therapist
 *
 * @param therapistId - The therapist's user ID
 * @param date - Date in YYYY-MM-DD format
 * @returns True if the date falls within a holiday period
 */
async function isHoliday(therapistId: string, date: string): Promise<boolean> {
  const { data } = await supabase
    .from('holidays')
    .select('*')
    .eq('therapist_id', therapistId)
    .lte('start_date', date)
    .gte('end_date', date)

  return (data?.length || 0) > 0
}

/**
 * Get existing bookings for a specific date
 *
 * @param therapistId - The therapist's user ID
 * @param date - Date in YYYY-MM-DD format
 * @returns Array of bookings with time and duration
 */
async function getBookingsForDate(therapistId: string, date: string) {
  const { data } = await supabase
    .from('bookings')
    .select(`
      time,
      cancelled_at,
      sessions (duration)
    `)
    .eq('therapist_id', therapistId)
    .eq('date', date)

  // Filter out cancelled bookings
  return (data || [])
    .filter(b => !b.cancelled_at) // Only count non-cancelled bookings
    .map(b => ({
      time: b.time,
      duration: (b.sessions as any)?.duration || 60
    }))
}

/**
 * Get therapist's minimum notice hours
 *
 * @param therapistId - The therapist's user ID
 * @returns Notice hours (defaults to 48 if not set)
 */
async function getTherapistNoticeHours(therapistId: string): Promise<number> {
  const { data } = await supabase
    .from('therapists')
    .select('notice_hours')
    .eq('id', therapistId)
    .single()

  return data?.notice_hours || 48 // Default: 48 hours notice
}

/**
 * Parse a time string into a Date object
 *
 * @param time - Time in HH:MM format
 * @returns Date object
 */
function parseTime(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number)
  const d = new Date()
  d.setHours(hours, minutes, 0, 0)
  return d
}

/**
 * Format a Date object into HH:MM format
 *
 * @param date - Date object
 * @returns Time in HH:MM format
 */
function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 5) // "HH:MM"
}

/**
 * Add minutes to an ISO datetime string
 *
 * @param timeStr - ISO datetime string
 * @param minutes - Minutes to add
 * @returns New ISO datetime string
 */
function addMinutes(timeStr: string, minutes: number): string {
  const date = new Date(timeStr)
  date.setMinutes(date.getMinutes() + minutes)
  return date.toISOString()
}
