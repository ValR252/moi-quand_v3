import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getAuthenticatedUserId } from '@/lib/auth'

/**
 * GET /api/schedules
 * Returns all schedules for the authenticated therapist
 */
export async function GET() {
  try {
    const therapistId = await getAuthenticatedUserId()

    if (!therapistId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: schedules, error } = await supabaseAdmin
      .from('schedules')
      .select('*')
      .eq('therapist_id', therapistId)
      .order('day_of_week', { ascending: true })

    if (error) throw error

    return NextResponse.json({ schedules: schedules || [] })
  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/schedules
 * Adds a new time slot for a day
 */
export async function POST(request: NextRequest) {
  try {
    const therapistId = await getAuthenticatedUserId()

    if (!therapistId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { day_of_week, start_time, end_time } = body

    if (!start_time || !end_time) {
      return NextResponse.json(
        { error: 'start_time and end_time are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('schedules')
      .insert({
        therapist_id: therapistId,
        day_of_week,
        start_time,
        end_time,
        is_available: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ schedule: data }, { status: 201 })
  } catch (error) {
    console.error('Error saving schedule:', error)
    return NextResponse.json(
      { error: 'Failed to save schedule' },
      { status: 500 }
    )
  }
}
