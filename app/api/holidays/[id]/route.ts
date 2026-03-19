import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getAuthenticatedUserId } from '@/lib/auth'

/**
 * DELETE /api/holidays/[id]
 * Deletes a holiday period
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const therapistId = await getAuthenticatedUserId()

    if (!therapistId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('holidays')
      .select('therapist_id')
      .eq('id', id)
      .single()

    if (!existing || existing.therapist_id !== therapistId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { error } = await supabaseAdmin
      .from('holidays')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting holiday:', error)
    return NextResponse.json(
      { error: 'Failed to delete holiday' },
      { status: 500 }
    )
  }
}
