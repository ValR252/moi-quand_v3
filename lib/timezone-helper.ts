/**
 * Timezone Helper
 * Utilities for converting and displaying times across different timezones
 */

import { format, parse } from 'date-fns'
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz'
import { fr } from 'date-fns/locale'

/**
 * List of supported timezones with labels
 */
export const TIMEZONE_LIST = [
  { value: 'Europe/Paris', label: 'Paris (France)', flag: '🇫🇷' },
  { value: 'Europe/Zurich', label: 'Zurich (Suisse)', flag: '🇨🇭' },
  { value: 'Europe/Brussels', label: 'Bruxelles (Belgique)', flag: '🇧🇪' },
  { value: 'America/Montreal', label: 'Montréal (Québec)', flag: '🇨🇦' },
  { value: 'America/Toronto', label: 'Toronto (Ontario)', flag: '🇨🇦' },
  { value: 'America/New_York', label: 'New York (USA Est)', flag: '🇺🇸' },
  { value: 'America/Chicago', label: 'Chicago (USA Centre)', flag: '🇺🇸' },
  { value: 'America/Denver', label: 'Denver (USA Montagne)', flag: '🇺🇸' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (USA Ouest)', flag: '🇺🇸' },
  { value: 'Pacific/Auckland', label: 'Auckland (Nouvelle-Zélande)', flag: '🇳🇿' },
] as const

export type TimezoneValue = typeof TIMEZONE_LIST[number]['value']

/**
 * Detect user's timezone from browser
 */
export function detectUserTimezone(): string {
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone

    // Check if detected timezone is in our supported list
    const isSupported = TIMEZONE_LIST.some(tz => tz.value === detected)

    if (isSupported) {
      return detected
    }

    // Fallback to Europe/Paris if not in our list
    return 'Europe/Paris'
  } catch (error) {
    console.error('Error detecting timezone:', error)
    return 'Europe/Paris'
  }
}

/**
 * Get timezone label from value
 */
export function getTimezoneLabel(timezone: string): string {
  const tz = TIMEZONE_LIST.find(t => t.value === timezone)
  return tz ? tz.label : timezone
}

/**
 * Get timezone flag emoji from value
 */
export function getTimezoneFlag(timezone: string): string {
  const tz = TIMEZONE_LIST.find(t => t.value === timezone)
  return tz ? tz.flag : '🌍'
}

/**
 * Get short timezone name (e.g., "CET", "EST")
 */
export function getTimezoneAbbreviation(timezone: string, date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short'
    })
    const parts = formatter.formatToParts(date)
    const timeZonePart = parts.find(part => part.type === 'timeZoneName')
    return timeZonePart?.value || timezone
  } catch (error) {
    return timezone
  }
}

/**
 * Convert a time from one timezone to another
 *
 * @param date - Date string in format "YYYY-MM-DD"
 * @param time - Time string in format "HH:MM"
 * @param fromTimezone - Source timezone
 * @param toTimezone - Target timezone
 * @returns Converted time in format "HH:MM"
 *
 * @example
 * convertTime('2026-01-08', '09:00', 'America/Montreal', 'Europe/Paris')
 * // Returns: "15:00" (Montreal 9:00 AM = Paris 3:00 PM)
 */
export function convertTime(
  date: string,
  time: string,
  fromTimezone: string,
  toTimezone: string
): string {
  try {
    // Parse the date and time in the source timezone
    const dateTimeStr = `${date}T${time}:00`
    const sourceDate = new Date(dateTimeStr)

    // Create a zoned date in the source timezone
    const zonedDate = fromZonedTime(sourceDate, fromTimezone)

    // Convert to target timezone
    const targetDate = toZonedTime(zonedDate, toTimezone)

    // Format as HH:MM
    return format(targetDate, 'HH:mm')
  } catch (error) {
    console.error('Error converting time:', error)
    return time // Return original time if conversion fails
  }
}

/**
 * Convert time from patient timezone to therapist timezone
 */
export function convertTimeToTherapistTZ(
  date: string,
  time: string,
  patientTimezone: string,
  therapistTimezone: string
): string {
  return convertTime(date, time, patientTimezone, therapistTimezone)
}

/**
 * Convert time from therapist timezone to patient timezone
 */
export function convertTimeToPatientTZ(
  date: string,
  time: string,
  therapistTimezone: string,
  patientTimezone: string
): string {
  return convertTime(date, time, therapistTimezone, patientTimezone)
}

/**
 * Format time with timezone indicator
 *
 * @example
 * formatTimeWithTZ('14:00', 'Europe/Paris')
 * // Returns: "14:00 (CET)"
 */
export function formatTimeWithTZ(time: string, timezone: string, date?: Date): string {
  const abbr = getTimezoneAbbreviation(timezone, date)
  return `${time} (${abbr})`
}

/**
 * Format time with timezone label
 *
 * @example
 * formatTimeWithLabel('14:00', 'Europe/Paris')
 * // Returns: "14:00 (heure de Paris)"
 */
export function formatTimeWithLabel(time: string, timezone: string): string {
  const label = getTimezoneLabel(timezone)
  // Extract city name from label (e.g., "Paris (France)" -> "Paris")
  const cityMatch = label.match(/^([^(]+)/)
  const city = cityMatch ? cityMatch[1].trim() : label
  return `${time} (heure de ${city})`
}

/**
 * Check if two dates in different timezones fall on the same calendar day
 */
export function isSameDay(
  date1: string,
  time1: string,
  timezone1: string,
  date2: string,
  time2: string,
  timezone2: string
): boolean {
  try {
    const dt1 = fromZonedTime(new Date(`${date1}T${time1}:00`), timezone1)
    const dt2 = fromZonedTime(new Date(`${date2}T${time2}:00`), timezone2)

    return dt1.getTime() === dt2.getTime()
  } catch (error) {
    return false
  }
}

/**
 * Get UTC offset for a timezone
 *
 * @example
 * getUTCOffset('Europe/Paris')
 * // Returns: "+01:00" or "+02:00" depending on DST
 */
export function getUTCOffset(timezone: string, date: Date = new Date()): string {
  try {
    const formatted = formatInTimeZone(date, timezone, 'XXX')
    return formatted
  } catch (error) {
    return '+00:00'
  }
}

/**
 * Format a complete date-time with timezone
 *
 * @example
 * formatDateTimeWithTZ('2026-01-08', '14:00', 'Europe/Paris')
 * // Returns: "mercredi 8 janvier 2026 à 14:00 (CET)"
 */
export function formatDateTimeWithTZ(
  date: string,
  time: string,
  timezone: string
): string {
  try {
    const dateTime = new Date(`${date}T${time}:00`)
    const zonedDate = toZonedTime(dateTime, timezone)

    const dateStr = format(zonedDate, "EEEE d MMMM yyyy", { locale: fr })
    const abbr = getTimezoneAbbreviation(timezone, zonedDate)

    return `${dateStr} à ${time} (${abbr})`
  } catch (error) {
    return `${date} ${time}`
  }
}

/**
 * Convert an array of time slots from one timezone to another
 */
export function convertTimeSlots(
  date: string,
  timeSlots: string[],
  fromTimezone: string,
  toTimezone: string
): string[] {
  return timeSlots.map(time => convertTime(date, time, fromTimezone, toTimezone))
}

/**
 * Validate if a string is a valid IANA timezone
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return true
  } catch (error) {
    return false
  }
}
