import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/therapist
 * Returns the authenticated therapist's profile
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const therapistId = cookieStore.get('therapist_id')?.value

    if (!therapistId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: therapist, error } = await supabase
      .from('therapists')
      .select('*')
      .eq('id', therapistId)
      .single()

    if (error) throw error

    return NextResponse.json({ therapist })
  } catch (error) {
    console.error('Error fetching therapist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch therapist' },
      { status: 500 }
    )
  }
}
