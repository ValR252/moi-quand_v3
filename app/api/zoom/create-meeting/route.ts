/**
 * API Route: Create a Zoom meeting
 * Backend Engineer: Creates a Zoom meeting for an online session
 */

import { NextRequest, NextResponse } from 'next/server'
import { createZoomMeeting, hasZoomConnected } from '@/lib/zoom'
import { supabaseAdmin } from '@/lib/supabase-server'

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

    // Check if Zoom is connected
    const isConnected = await hasZoomConnected(therapistId)
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Zoom not connected' },
        { status: 400 }
      )
    }

    // Get meeting details from request
    const body = await request.json()
    const { topic, start_time, duration, timezone, patientName } = body

    if (!topic || !start_time || !duration || !timezone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create Zoom meeting
    const meeting = await createZoomMeeting(therapistId, {
      topic: patientName ? `${topic} - ${patientName}` : topic,
      start_time,
      duration,
      timezone,
    })

    return NextResponse.json({
      success: true,
      meeting: {
        id: meeting.id.toString(),
        join_url: meeting.join_url,
        start_url: meeting.start_url,
        password: meeting.password,
      },
    })
  } catch (error) {
    console.error('Error creating Zoom meeting:', error)
    return NextResponse.json(
      { error: 'Failed to create Zoom meeting' },
      { status: 500 }
    )
  }
}