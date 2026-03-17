import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// PayPal API base URLs
const PAYPAL_BASE_URLS = {
  sandbox: 'https://api-m.sandbox.paypal.com',
  production: 'https://api-m.paypal.com'
}

/**
 * POST /api/paypal/create-order
 * Crée une commande PayPal pour une réservation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { therapist_id, session_id, booking_id, return_url, cancel_url } = body

    if (!therapist_id || !session_id || !booking_id) {
      return NextResponse.json(
        { error: 'Missing required fields: therapist_id, session_id, booking_id' },
        { status: 400 }
      )
    }

    // Récupérer la configuration PayPal du thérapeute
    const { data: therapist, error: therapistError } = await supabase
      .from('therapists')
      .select('paypal_enabled, paypal_client_id, paypal_client_secret, paypal_environment, name')
      .eq('id', therapist_id)
      .single()

    if (therapistError || !therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }

    // Vérifier que PayPal est activé
    if (!therapist.paypal_enabled) {
      return NextResponse.json(
        { error: 'PayPal is not enabled for this therapist' },
        { status: 400 }
      )
    }

    // Vérifier que les credentials sont configurés
    if (!therapist.paypal_client_id || !therapist.paypal_client_secret) {
      return NextResponse.json(
        { error: 'PayPal credentials not configured' },
        { status: 400 }
      )
    }

    // Récupérer les infos de la session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('label, price, duration')
      .eq('id', session_id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Récupérer les infos de la réservation
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('first_name, last_name, email, date, time')
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
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

    // Créer la commande PayPal
    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
        'PayPal-Request-Id': `booking-${booking_id}-${Date.now()}`
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: booking_id,
          description: `${session.label} avec ${therapist.name} - ${booking.date} ${booking.time}`,
          amount: {
            currency_code: 'CHF',
            value: session.price.toFixed(2)
          },
          custom_id: booking_id
        }],
        application_context: {
          brand_name: therapist.name,
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          return_url: return_url || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
          cancel_url: cancel_url || `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`
        }
      })
    })

    if (!orderResponse.ok) {
      const orderError = await orderResponse.text()
      console.error('PayPal order creation error:', orderError)
      return NextResponse.json(
        { error: 'Failed to create PayPal order' },
        { status: 500 }
      )
    }

    const orderData = await orderResponse.json()

    // Mettre à jour la réservation avec l'ID de commande PayPal
    await supabase
      .from('bookings')
      .update({
        paypal_order_id: orderData.id,
        payment_method: 'paypal'
      })
      .eq('id', booking_id)

    return NextResponse.json({
      success: true,
      orderId: orderData.id,
      approvalUrl: orderData.links.find((link: any) => link.rel === 'approve')?.href
    })

  } catch (error) {
    console.error('Error creating PayPal order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}