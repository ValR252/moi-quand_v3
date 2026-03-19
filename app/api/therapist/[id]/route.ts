import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  try {
    const { data: therapist, error } = await supabaseAdmin
      .from('therapists')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ therapist })
  } catch (error) {
    console.error('Error fetching therapist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
