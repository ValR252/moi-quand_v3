import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUserId } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/holidays
 * Returns all holidays for the authenticated therapist
 */
export async function GET() {
  try {
    const therapistId = await getAuthenticatedUserId()

    if (!therapistId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: holidays, error } = await supabase
      .from('holidays')
      .select('*')
      .eq('therapist_id', therapistId)
      .order('start_date', { ascending: true })

    if (error) throw error

    return NextResponse.json({ holidays: holidays || [] })
  } catch (error) {
    console.error('Error fetching holidays:', error)
    return NextResponse.json(
      { error: 'Failed to fetch holidays' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/holidays
 * Creates a new holiday period
 */
export async function POST(request: NextRequest) {
  try {
    const therapistId = await getAuthenticatedUserId()

    if (!therapistId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { start_date, end_date, reason } = body

    if (!start_date || !end_date) {
      return NextResponse.json(
        { error: 'start_date and end_date are required' },
        { status: 400 }
      )
    }

    const { data: holiday, error } = await supabase
      .from('holidays')
      .insert({
        therapist_id: therapistId,
        start_date,
        end_date,
        reason: reason || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ holiday }, { status: 201 })
  } catch (error) {
    console.error('Error creating holiday:', error)
    return NextResponse.json(
      { error: 'Failed to create holiday' },
      { status: 500 }
    )
  }
}
