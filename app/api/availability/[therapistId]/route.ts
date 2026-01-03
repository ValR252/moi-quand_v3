import { NextRequest, NextResponse } from 'next/server'
import { getAvailableSlots } from '@/lib/availability'

/**
 * GET /api/availability/[therapistId]?date=YYYY-MM-DD&duration=60
 *
 * Returns available time slots for a therapist on a specific date,
 * taking into account:
 * - Therapist's working hours (schedule table)
 * - Existing bookings
 * - Google Calendar busy times
 * - Holidays
 * - Minimum notice period
 *
 * Query parameters:
 * - date (required): Date in YYYY-MM-DD format
 * - duration (optional): Session duration in minutes (default: 60)
 *
 * Response:
 * {
 *   "date": "2026-01-05",
 *   "duration": 60,
 *   "availableSlots": ["09:00", "09:30", "10:00", "14:00", "14:30"],
 *   "count": 5
 * }
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ therapistId: string }> }
) {
  const { therapistId } = await context.params
  const { searchParams } = new URL(request.url)

  const date = searchParams.get('date')
  const durationStr = searchParams.get('duration')
  const duration = durationStr ? parseInt(durationStr) : 60

  // Validate required parameters
  if (!date) {
    return NextResponse.json(
      { error: 'Date parameter is required (format: YYYY-MM-DD)' },
      { status: 400 }
    )
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date)) {
    return NextResponse.json(
      { error: 'Invalid date format. Expected YYYY-MM-DD' },
      { status: 400 }
    )
  }

  // Validate duration
  if (isNaN(duration) || duration <= 0) {
    return NextResponse.json(
      { error: 'Duration must be a positive number' },
      { status: 400 }
    )
  }

  try {
    console.log(`API: Fetching availability for therapist ${therapistId} on ${date} (${duration}min)`)

    const availableSlots = await getAvailableSlots(therapistId, date, duration)

    console.log(`API: Returning ${availableSlots.length} available slots`)

    return NextResponse.json({
      date,
      duration,
      availableSlots,
      count: availableSlots.length
    })
  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch availability',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
