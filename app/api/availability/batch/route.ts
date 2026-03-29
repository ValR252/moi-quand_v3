import { NextRequest, NextResponse } from 'next/server'
import { getDateAvailabilityBatch } from '@/lib/availability'

/**
 * GET /api/availability/batch?therapistId=xxx&start=YYYY-MM-DD&end=YYYY-MM-DD&duration=60
 *
 * Returns a map of dates to availability status for the given range.
 * Values: 0 = no availability (grey out), -1 = potentially available (needs slot check on select)
 *
 * This endpoint is optimized for the booking calendar to grey out
 * days with zero availability without checking each day individually.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const therapistId = searchParams.get('therapistId')
  const start = searchParams.get('start')
  const end = searchParams.get('end')
  const durationStr = searchParams.get('duration')
  const duration = durationStr ? parseInt(durationStr) : 60

  if (!therapistId || !start || !end) {
    return NextResponse.json(
      { error: 'therapistId, start, and end parameters are required' },
      { status: 400 }
    )
  }

  try {
    const availability = await getDateAvailabilityBatch(therapistId, start, end, duration)

    return NextResponse.json({ availability })
  } catch (error) {
    console.error('Error fetching batch availability:', error)
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}
