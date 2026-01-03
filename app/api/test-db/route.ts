import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Test endpoint to verify Supabase connection and data access
 * GET /api/test-db
 */
export async function GET() {
  try {
    // Test 1: Check if env vars are set
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!hasUrl || !hasServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        env: {
          NEXT_PUBLIC_SUPABASE_URL: hasUrl,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: hasAnonKey,
          SUPABASE_SERVICE_ROLE_KEY: hasServiceKey
        }
      })
    }

    // Test 2: Try to connect with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Test 3: Try to read schedules
    const { data: schedules, error: schedError } = await supabase
      .from('schedules')
      .select('*')
      .eq('therapist_id', 'da067f75-f9c1-45e4-bece-d1d7f5c51e59')
      .eq('day_of_week', 1) // Monday

    if (schedError) {
      return NextResponse.json({
        success: false,
        error: 'Database query failed',
        details: schedError.message,
        code: schedError.code
      })
    }

    // Test 4: Try to read therapist
    const { data: therapist, error: therapistError } = await supabase
      .from('therapists')
      .select('id, name, email, notice_hours')
      .eq('id', 'da067f75-f9c1-45e4-bece-d1d7f5c51e59')
      .single()

    if (therapistError) {
      return NextResponse.json({
        success: false,
        error: 'Therapist query failed',
        details: therapistError.message,
        code: therapistError.code
      })
    }

    return NextResponse.json({
      success: true,
      message: 'All tests passed',
      data: {
        schedulesFound: schedules?.length || 0,
        schedules: schedules,
        therapist: {
          id: therapist.id,
          name: therapist.name,
          notice_hours: therapist.notice_hours || 'not set (default 48h)'
        }
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
