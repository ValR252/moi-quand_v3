import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getAuthenticatedUserId } from '@/lib/auth'

/**
 * GET /api/therapist
 * Returns the authenticated therapist's profile
 */
export async function GET() {
  try {
    const therapistId = await getAuthenticatedUserId()

    if (!therapistId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: therapist, error } = await supabaseAdmin
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
