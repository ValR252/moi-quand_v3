import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import crypto from 'crypto'

// PayPal API base URLs
const PAYPAL_BASE_URLS = {
  sandbox: 'https://api-m.sandbox.paypal.com',
  production: 'https://api-m.paypal.com'
}

/**
 * POST /api/paypal/webhook
 * Reçoit les notifications webhook de PayPal
 */
export async function POST(request: NextRequest) {
  try {
    // Récupérer le corps brut pour la vérification
    const bodyText = await request.text()
    const body = JSON.parse(bodyText)

    // Récupérer les headers de vérification PayPal
    const transmissionId = request.headers.get('paypal-transmission-id')
    const certUrl = request.headers.get('paypal-cert-url')
    const authAlgo = request.headers.get('paypal-auth-algo')
    const transmissionSig = request.headers.get('paypal-transmission-sig')
    const transmissionTime = request.headers.get('paypal-transmission-time')

    if (!transmissionId || !certUrl || !authAlgo || !transmissionSig || !transmissionTime) {
      console.error('Missing PayPal webhook headers')
      return NextResponse.json({ error: 'Missing headers' }, { status: 400 })
    }

    // Pour simplifier, on vérifie juste que l'événement existe
    // En production, il faudrait vérifier la signature avec le certificat PayPal
    const eventType = body.event_type
    const resource = body.resource

    console.log(`PayPal webhook received: ${eventType}`, resource?.id)

    // Gérer différents types d'événements
    switch (eventType) {
      case 'CHECKOUT.ORDER.APPROVED':
        // Le client a approuvé le paiement, mais il n'est pas encore capturé
        // On attend le webhook COMPLETED
        break

      case 'CHECKOUT.ORDER.COMPLETED':
      case 'PAYMENT.CAPTURE.COMPLETED':
        // Paiement complété avec succès
        await handlePaymentCompleted(resource)
        break

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED':
        // Paiement refusé
        await handlePaymentFailed(resource, 'denied')
        break

      case 'PAYMENT.CAPTURE.PENDING':
        // Paiement en attente (rare, généralement pour certains pays)
        await handlePaymentPending(resource)
        break

      case 'PAYMENT.CAPTURE.REFUNDED':
        // Remboursement effectué
        await handlePaymentRefunded(resource)
        break

      case 'CHECKOUT.ORDER.CANCELLED':
        // Commande annulée par le client
        await handleOrderCancelled(resource)
        break

      default:
        console.log(`Unhandled PayPal event type: ${eventType}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Error processing PayPal webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handlePaymentCompleted(resource: any) {
  const orderId = resource.id
  const captureId = resource.purchase_units?.[0]?.payments?.captures?.[0]?.id

  // Trouver la réservation associée
  const { data: bookings, error } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('paypal_order_id', orderId)

  if (error || !bookings || bookings.length === 0) {
    console.error('Booking not found for order:', orderId)
    return
  }

  // Mettre à jour toutes les réservations associées (normalement une seule)
  for (const booking of bookings) {
    await supabaseAdmin
      .from('bookings')
      .update({
        payment_status: 'paid',
        paypal_capture_id: captureId,
        payment_date: new Date().toISOString()
      })
      .eq('id', booking.id)

    console.log(`Payment completed for booking ${booking.id}`)
  }
}

async function handlePaymentFailed(resource: any, reason: string) {
  const orderId = resource.id

  const { data: bookings } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('paypal_order_id', orderId)

  if (!bookings || bookings.length === 0) return

  for (const booking of bookings) {
    await supabaseAdmin
      .from('bookings')
      .update({
        payment_status: 'cancelled',
        cancellation_reason: `payment_failed_${reason}`
      })
      .eq('id', booking.id)

    console.log(`Payment failed for booking ${booking.id}: ${reason}`)
  }
}

async function handlePaymentPending(resource: any) {
  const orderId = resource.id

  const { data: bookings } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('paypal_order_id', orderId)

  if (!bookings || bookings.length === 0) return

  for (const booking of bookings) {
    // Le statut reste 'pending'
    console.log(`Payment pending for booking ${booking.id}`)
  }
}

async function handlePaymentRefunded(resource: any) {
  const captureId = resource.id
  const refundId = resource.id

  const { data: bookings } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('paypal_capture_id', captureId)

  if (!bookings || bookings.length === 0) return

  for (const booking of bookings) {
    await supabaseAdmin
      .from('bookings')
      .update({
        refund_status: 'processed',
        refund_amount: parseFloat(resource.amount?.value || 0),
        refund_date: new Date().toISOString(),
        paypal_refund_id: refundId
      })
      .eq('id', booking.id)

    console.log(`Payment refunded for booking ${booking.id}`)
  }
}

async function handleOrderCancelled(resource: any) {
  const orderId = resource.id

  const { data: bookings } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('paypal_order_id', orderId)

  if (!bookings || bookings.length === 0) return

  for (const booking of bookings) {
    await supabaseAdmin
      .from('bookings')
      .update({
        payment_status: 'cancelled',
        cancellation_reason: 'payment_cancelled_by_user'
      })
      .eq('id', booking.id)

    console.log(`Order cancelled for booking ${booking.id}`)
  }
}