import { NextRequest, NextResponse } from 'next/server'
import { listCalendars } from '@/lib/google-calendar'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const calendars = await listCalendars(user.id)

    // Get currently selected calendar from database
    const { data: therapist } = await supabaseAdmin
      .from('therapists')
      .select('google_calendar_id')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      calendars,
      selectedCalendarId: therapist?.google_calendar_id || 'primary'
    })
  } catch (error) {
    console.error('Error listing calendars:', error)
    return NextResponse.json(
      { error: 'Failed to list calendars' },
      { status: 500 }
    )
  }
}
