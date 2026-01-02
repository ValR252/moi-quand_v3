import { NextRequest, NextResponse } from 'next/server'
import { listCalendars } from '@/lib/google-calendar'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

    return NextResponse.json({ calendars })
  } catch (error) {
    console.error('Error listing calendars:', error)
    return NextResponse.json(
      { error: 'Failed to list calendars' },
      { status: 500 }
    )
  }
}
