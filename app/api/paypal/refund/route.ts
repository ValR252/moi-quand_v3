import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getAuthenticatedUserId } from '@/lib/auth'

// PayPal API base URLs
const PAYPAL_BASE_URLS = {
  sandbox: 'https://api-m.sandbox.paypal.com',
  production: 'https://api-m.paypal.com'
}

/**
 * POST /api/paypal/refund
 * Effectue un remboursement PayPal (protégé - thérapeute uniquement)
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const therapistId = await getAuthenticatedUserId()
    if (!therapistId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { booking_id, amount, reason } = body

    if (!booking_id) {
      return NextResponse.json(
        { error: 'Missing required field: booking_id' },
        { status: 400 }
      )
    }

    // Récupérer la réservation
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('therapist_id, paypal_capture_id, payment_status, refund_status')
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Vérifier que le thérapeute est propriétaire de la réservation
    if (booking.therapist_id !== therapistId) {
      return NextResponse.json(
        { error: 'Unauthorized - not your booking' },
        { status: 403 }
      )
    }

    // Vérifier que le paiement a été capturé
    if (booking.payment_status !== 'paid' || !booking.paypal_capture_id) {
      return NextResponse.json(
        { error: 'Payment not captured or already refunded' },
        { status: 400 }
      )
    }

    // Vérifier qu'un remboursement n'est pas déjà en cours
    if (booking.refund_status === 'processed') {
      return NextResponse.json(
        { error: 'Already refunded' },
        { status: 400 }
      )
    }

    // Récupérer la configuration PayPal
    const { data: therapist, error: therapistError } = await supabaseAdmin
      .from('therapists')
      .select('paypal_client_id, paypal_client_secret, paypal_environment')
      .eq('id', therapistId)
      .single()

    if (therapistError || !therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }

    if (!therapist.paypal_client_id || !therapist.paypal_client_secret) {
      return NextResponse.json(
        { error: 'PayPal credentials not configured' },
        { status: 400 }
      )
    }

    const environment = therapist.paypal_environment || 'sandbox'
    const baseUrl = PAYPAL_BASE_URLS[environment]

    // Obtenir un token d'accès PayPal
    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${therapist.paypal_client_id}:${therapist.paypal_client_secret}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    })

    if (!authResponse.ok) {
      const authError = await authResponse.text()
      console.error('PayPal auth error:', authError)
      return NextResponse.json(
        { error: 'Failed to authenticate with PayPal' },
        { status: 500 }
      )
    }

    const { access_token } = await authResponse.json()

    // Effectuer le remboursement
    const refundPayload: any = {
      note_to_payer: reason || 'Remboursement demandé par le thérapeute'
    }

    // Si un montant spécifique est demandé (remboursement partiel)
    if (amount) {
      refundPayload.amount = {
        value: amount.toFixed(2),
        currency_code: 'CHF'
      }
    }

    const refundResponse = await fetch(
      `${baseUrl}/v2/payments/captures/${booking.paypal_capture_id}/refund`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
          'PayPal-Request-Id': `refund-${booking_id}-${Date.now()}`
        },
        body: JSON.stringify(refundPayload)
      }
    )

    if (!refundResponse.ok) {
      const refundError = await refundResponse.text()
      console.error('PayPal refund error:', refundError)
      return NextResponse.json(
        { error: 'Failed to process refund' },
        { status: 500 }
      )
    }

    const refundData = await refundResponse.json()

    // Mettre à jour la réservation
    await supabaseAdmin
      .from('bookings')
      .update({
        refund_status: 'processed',
        refund_amount: parseFloat(refundData.amount?.value || amount || 0),
        refund_date: new Date().toISOString(),
        paypal_refund_id: refundData.id
      })
      .eq('id', booking_id)

    return NextResponse.json({
      success: true,
      refundId: refundData.id,
      status: refundData.status,
      amount: refundData.amount?.value
    })

  } catch (error) {
    console.error('Error processing PayPal refund:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}