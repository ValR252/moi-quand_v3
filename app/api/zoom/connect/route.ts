/**
 * API Route: Initiate Zoom OAuth connection
 * Backend Engineer: Redirects to Zoom OAuth consent screen
 */

import { NextRequest, NextResponse } from 'next/server'
import { getZoomAuthUrl } from '@/lib/zoom'
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
      .select('therapist_id, expires_at')
      .eq('token', sessionToken)
      .single()

    if (sessionError || !sessionData) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Check if session is expired
    if (new Date(sessionData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      )
    }

    const therapistId = sessionData.therapist_id

    // Check if Zoom credentials are configured
    if (!process.env.ZOOM_CLIENT_ID || !process.env.ZOOM_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Zoom OAuth not configured' },
        { status: 500 }
      )
    }

    // Generate OAuth URL
    const authUrl = getZoomAuthUrl(therapistId)

    return NextResponse.json({ url: authUrl })
  } catch (error) {
    console.error('Error in Zoom connect:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}