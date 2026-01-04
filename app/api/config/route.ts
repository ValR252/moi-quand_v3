import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * PATCH /api/config
 * Updates therapist configuration (notice_hours, etc.)
 */
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const therapistId = cookieStore.get('therapist_id')?.value

    if (!therapistId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const { data, error } = await supabase
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
