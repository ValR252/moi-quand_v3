import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getAuthenticatedUserId } from '@/lib/auth'

/**
 * GET /api/bookings?status=pending&limit=50
 * Returns bookings for the authenticated therapist or public bookings
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const therapist_id = searchParams.get('therapist_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    // For public booking page
    if (therapist_id) {
      const { data: bookings, error } = await supabaseAdmin
        .from('bookings')
        .select('*')
        .eq('therapist_id', therapist_id)
        .order('date', { ascending: true })
        .order('time', { ascending: true })

      if (error) throw error
      return NextResponse.json({ bookings: bookings || [] })
    }

    // For authenticated dashboard
    const authTherapistId = await getAuthenticatedUserId()

    if (!authTherapistId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabaseAdmin
      .from('bookings')
      .select('*, sessions(name, label, duration, price)')
      .eq('therapist_id', authTherapistId)
      .order('date', { ascending: false })
      .order('time', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: bookings, error } = await query

    if (error) throw error

    return NextResponse.json({ bookings: bookings || [] })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}
