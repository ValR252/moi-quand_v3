/**
 * API Route: Disconnect Zoom
 * Backend Engineer: Removes Zoom tokens for therapist
 */

import { NextRequest, NextResponse } from 'next/server'
import { disconnectZoom } from '@/lib/zoom'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
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
    const { data: sessionData, error: sessionError } = await supabase
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

    // Disconnect Zoom
    await disconnectZoom(therapistId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error disconnecting Zoom:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect Zoom' },
      { status: 500 }
    )
  }
}