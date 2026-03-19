/**
 * API Route: Get Zoom connection status
 * Backend Engineer: Returns whether therapist has Zoom connected
 */

import { NextRequest, NextResponse } from 'next/server'
import { getZoomStatus } from '@/lib/zoom'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    // Get therapist session
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify session
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('therapist_id')
      .eq('token', sessionToken)
      .single()

    if (sessionError || !sessionData) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    const therapistId = sessionData.therapist_id

    // Get Zoom status
    const status = await getZoomStatus(therapistId)

    return NextResponse.json(status)
  } catch (error) {
    console.error('Error getting Zoom status:', error)
    return NextResponse.json(
      { error: 'Failed to get Zoom status' },
      { status: 500 }
    )
  }
}