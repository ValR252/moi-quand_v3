import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

// PayPal API base URLs
const PAYPAL_BASE_URLS = {
  sandbox: 'https://api-m.sandbox.paypal.com',
  production: 'https://api-m.paypal.com'
}

/**
 * POST /api/paypal/capture-order
 * Capture un paiement PayPal après approbation du client
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { order_id, booking_id } = body

    if (!order_id || !booking_id) {
      return NextResponse.json(
        { error: 'Missing required fields: order_id and booking_id' },
        { status: 400 }
      )
    }

    // Récupérer la réservation
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('therapist_id, paypal_order_id')
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Vérifier que l'order_id correspond
    if (booking.paypal_order_id !== order_id) {
      return NextResponse.json(
        { error: 'Order ID mismatch' },
        { status: 400 }
      )
    }

    // Récupérer la configuration PayPal du thérapeute
    const { data: therapist, error: therapistError } = await supabaseAdmin
      .from('therapists')
      .select('paypal_client_id, paypal_client_secret, paypal_environment')
      .eq('id', booking.therapist_id)
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

    // Capturer le paiement
    const captureResponse = await fetch(`${baseUrl}/v2/checkout/orders/${order_id}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
        'PayPal-Request-Id': `capture-${booking_id}-${Date.now()}`
      }
    })

    if (!captureResponse.ok) {
      const captureError = await captureResponse.text()
      console.error('PayPal capture error:', captureError)
      return NextResponse.json(
        { error: 'Failed to capture payment' },
        { status: 500 }
      )
    }

    const captureData = await captureResponse.json()

    // Vérifier que le paiement a été capturé avec succès
    if (captureData.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: `Payment status is ${captureData.status}`, details: captureData },
        { status: 400 }
      )
    }

    // Extraire l'ID de capture
    const captureId = captureData.purchase_units[0]?.payments?.captures[0]?.id

    // Mettre à jour la réservation
    await supabaseAdmin
      .from('bookings')
      .update({
        payment_status: 'paid',
        paypal_capture_id: captureId,
        payment_date: new Date().toISOString()
      })
      .eq('id', booking_id)

    return NextResponse.json({
      success: true,
      status: captureData.status,
      captureId: captureId,
      amount: captureData.purchase_units[0]?.amount?.value
    })

  } catch (error) {
    console.error('Error capturing PayPal order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}