import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/schedules
 * Returns all schedules for the authenticated therapist
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const therapistId = cookieStore.get('therapist_id')?.value

    if (!therapistId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: schedules, error } = await supabase
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
 * Creates or updates schedules for a day
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const therapistId = cookieStore.get('therapist_id')?.value

    if (!therapistId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { day_of_week, start_time, end_time, is_available } = body

    // Delete existing schedules for this day
    await supabase
      .from('schedules')
      .delete()
      .eq('therapist_id', therapistId)
      .eq('day_of_week', day_of_week)

    // Insert new schedule if available
    if (is_available && start_time && end_time) {
      const { data, error } = await supabase
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

      return NextResponse.json({ schedule: data })
    }

    return NextResponse.json({ schedule: null })
  } catch (error) {
    console.error('Error saving schedule:', error)
    return NextResponse.json(
      { error: 'Failed to save schedule' },
      { status: 500 }
    )
  }
}
