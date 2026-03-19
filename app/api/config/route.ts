import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getAuthenticatedUserId } from '@/lib/auth'
import { isValidTimezone } from '@/lib/timezone-helper'

/**
 * PATCH /api/config
 * Updates therapist configuration (notice_hours, etc.)
 */
export async function PATCH(request: NextRequest) {
  try {
    const therapistId = await getAuthenticatedUserId()

    if (!therapistId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate timezone if provided
    if (body.timezone && !isValidTimezone(body.timezone)) {
      return NextResponse.json(
        { error: 'Invalid timezone' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('therapists')
      .update(body)
      .eq('id', therapistId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ therapist: data })
  } catch (error) {
    console.error('Error updating config:', error)
    return NextResponse.json(
      { error: 'Failed to update config' },
      { status: 500 }
    )
  }
}
