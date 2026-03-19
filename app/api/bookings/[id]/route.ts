import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getAuthenticatedUserId } from '@/lib/auth'

/**
 * PATCH /api/bookings/[id]
 * Updates a booking (status, payment, notes, etc.)
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const therapistId = await getAuthenticatedUserId()

    if (!therapistId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('bookings')
      .select('therapist_id')
      .eq('id', id)
      .single()

    if (!existing || existing.therapist_id !== therapistId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Update booking
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .update(body)
      .eq('id', id)
      .select('*, sessions(name, label, duration, price)')
      .single()

    if (error) throw error

    return NextResponse.json({ booking })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/bookings/[id]
 * Deletes/cancels a booking
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
      .from('bookings')
      .select('therapist_id')
      .eq('id', id)
      .single()

    if (!existing || existing.therapist_id !== therapistId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Mark as cancelled instead of deleting
    const { error } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error cancelling booking:', error)
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    )
  }
}
