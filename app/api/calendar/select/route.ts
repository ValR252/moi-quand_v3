import { NextRequest, NextResponse } from 'next/server'
import { saveSelectedCalendar } from '@/lib/google-calendar'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { calendarId } = await request.json()

    if (!calendarId) {
      return NextResponse.json(
        { error: 'calendarId is required' },
        { status: 400 }
      )
    }

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

    await saveSelectedCalendar(user.id, calendarId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error selecting calendar:', error)
    return NextResponse.json(
      { error: 'Failed to save calendar selection' },
      { status: 500 }
    )
  }
}
