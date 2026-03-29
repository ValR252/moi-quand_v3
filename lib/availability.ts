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
  // Parse date parts manually to avoid UTC timezone shift
  // new Date('YYYY-MM-DD') creates UTC midnight, getDay() could return wrong day
  const [year, month, day] = date.split('-').map(Number)
  const dayOfWeek = new Date(year, month - 1, day).getDay() // 0=Sunday, 1=Monday, etc.
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
    // Use local date parsing to avoid UTC shift
    const slotDateTime = new Date(year, month - 1, day, ...slot.split(':').map(Number) as [number, number])
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
 * BATCH: Get unavailable dates for a date range
 * Returns a set of dates (YYYY-MM-DD) that have zero availability.
 * Uses schedule + holidays to quickly identify closed days without
 * running full slot calculation for each day.
 *
 * @param therapistId - The therapist's user ID
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @param sessionDuration - Session duration in minutes (default: 60)
 * @returns Object mapping date strings to slot counts
 */
export async function getDateAvailabilityBatch(
  therapistId: string,
  startDate: string,
  endDate: string,
  sessionDuration: number = 60
): Promise<Record<string, number>> {
  // 1. Fetch all schedules for this therapist (all days at once)
  const { data: allSchedules } = await supabase
    .from('schedules')
    .select('day_of_week, start_time, end_time, is_available')
    .eq('therapist_id', therapistId)
    .eq('is_available', true)

  // Build a set of working days (0-6)
  const workingDays = new Set((allSchedules || []).map(s => s.day_of_week))

  // 2. Fetch all holidays in range
  const { data: holidays } = await supabase
    .from('holidays')
    .select('start_date, end_date')
    .eq('therapist_id', therapistId)
    .lte('start_date', endDate)
    .gte('end_date', startDate)

  // 3. Fetch notice hours
  const noticeHours = await getTherapistNoticeHours(therapistId)
  const now = new Date()
  const earliestAllowed = new Date(now.getTime() + noticeHours * 60 * 60 * 1000)

  // 4. Iterate through each date in range
  const result: Record<string, number> = {}
  const [startY, startM, startD] = startDate.split('-').map(Number)
  const [endY, endM, endD] = endDate.split('-').map(Number)
  const start = new Date(startY, startM - 1, startD)
  const end = new Date(endY, endM - 1, endD)

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const dayOfWeek = d.getDay()

    // Quick check 1: not a working day
    if (!workingDays.has(dayOfWeek)) {
      result[dateStr] = 0
      continue
    }

    // Quick check 2: is a holiday
    const isHol = (holidays || []).some(h => dateStr >= h.start_date && dateStr <= h.end_date)
    if (isHol) {
      result[dateStr] = 0
      continue
    }

    // Quick check 3: entire day is before notice period
    // Get the schedule for this day to find the last possible slot
    const daySchedules = (allSchedules || []).filter(s => s.day_of_week === dayOfWeek)
    const latestEnd = daySchedules.reduce((max, s) => {
      const [h, m] = s.end_time.split(':').map(Number)
      const t = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m)
      return t > max ? t : max
    }, new Date(0))

    if (latestEnd <= earliestAllowed) {
      result[dateStr] = 0
      continue
    }

    // Day potentially has slots — mark as available (estimate)
    // We use -1 to mean "has schedule, needs detailed check"
    result[dateStr] = -1
  }

  return result
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
