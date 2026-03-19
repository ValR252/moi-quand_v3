/**
 * API: Update Therapist Cancellation Settings
 * Backend Engineer: Type-safe API for updating cancellation policy configuration
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getAuthenticatedUserId } from '@/lib/auth'

// Input validation types
type CancellationPolicy = 'refund' | 'transfer' | 'both'

interface CancellationSettingsInput {
  cancellation_enabled: boolean
  cancellation_policy: CancellationPolicy
  cancellation_deadline_hours: number
  refund_automatic: boolean
}

/**
 * PATCH /api/therapist/cancellation-settings
 * Updates cancellation policy settings for authenticated therapist
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get authenticated user ID
    const userId = await getAuthenticatedUserId()

    if (!userId) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body: CancellationSettingsInput = await request.json()

    // Validate input
    const validationError = validateInput(body)
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      )
    }

    // Get therapist by user ID
    const { data: therapist, error: therapistError } = await supabaseAdmin
      .from('therapists')
      .select('id')
      .eq('id', userId)
      .single()

    if (therapistError || !therapist) {
      return NextResponse.json(
        { error: 'Thérapeute non trouvé' },
        { status: 404 }
      )
    }

    // Update cancellation settings
    const { error: updateError } = await supabaseAdmin
      .from('therapists')
      .update({
        cancellation_enabled: body.cancellation_enabled,
        cancellation_policy: body.cancellation_policy,
        cancellation_deadline_hours: body.cancellation_deadline_hours,
        refund_automatic: body.refund_automatic,
        updated_at: new Date().toISOString(),
      })
      .eq('id', therapist.id)

    if (updateError) {
      console.error('Error updating cancellation settings:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Paramètres d\'annulation mis à jour avec succès'
    })

  } catch (error) {
    console.error('Error in cancellation-settings API:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * Validate input data
 * Returns error message if invalid, null if valid
 */
function validateInput(body: any): string | null {
  // Check required fields
  if (typeof body.cancellation_enabled !== 'boolean') {
    return 'cancellation_enabled doit être un booléen'
  }

  // Validate policy
  const validPolicies: CancellationPolicy[] = ['refund', 'transfer', 'both']
  if (!validPolicies.includes(body.cancellation_policy)) {
    return 'cancellation_policy doit être "refund", "transfer", ou "both"'
  }

  // Validate deadline hours
  if (typeof body.cancellation_deadline_hours !== 'number') {
    return 'cancellation_deadline_hours doit être un nombre'
  }

  if (body.cancellation_deadline_hours < 1 || body.cancellation_deadline_hours > 168) {
    return 'cancellation_deadline_hours doit être entre 1 et 168 heures (1 semaine)'
  }

  // Validate refund_automatic
  if (typeof body.refund_automatic !== 'boolean') {
    return 'refund_automatic doit être un booléen'
  }

  return null
}
