import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/sessions
 * Returns all sessions for the authenticated therapist
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const therapistId = cookieStore.get('therapist_id')?.value

    if (!therapistId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('therapist_id', therapistId)
      .order('display_order', { ascending: true })

    if (error) throw error

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sessions
 * Creates a new session for the authenticated therapist
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const therapistId = cookieStore.get('therapist_id')?.value

    if (!therapistId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, label, duration, price, description, color, max_per_day, display_order } = body

    // Validation
    if (!name || !duration || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, duration, price' },
        { status: 400 }
      )
    }

    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        therapist_id: therapistId,
        name,
        label: label || name,
        duration: parseInt(duration),
        price: parseFloat(price),
        description,
        color: color || '#6366f1',
        max_per_day,
        display_order: display_order || 0,
        enabled: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}
