'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Confirmation du paiement en cours...')

  useEffect(() => {
    const token = searchParams.get('token')
    const payerId = searchParams.get('PayerID')

    if (!token) {
      setStatus('error')
      setMessage('Token de paiement manquant.')
      return
    }

    capturePayment(token, payerId)
  }, [searchParams])

  async function capturePayment(orderId: string, payerId: string | null) {
    try {
      const response = await fetch(`/api/bookings/by-paypal-order?order_id=${orderId}`)
      
      if (!response.ok) {
        setStatus('error')
        setMessage('Réservation non trouvée.')
        return
      }

      const { booking } = await response.json()

      const captureResponse = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          booking_id: booking.id
        })
      })

      if (captureResponse.ok) {
        setStatus('success')
        setMessage('Votre paiement a été confirmé et votre réservation est enregistrée !')
      } else {
        const error = await captureResponse.json()
        setStatus('error')
        setMessage(error.error || 'Erreur lors de la confirmation du paiement.')
      }
    } catch (error) {
      console.error('Error capturing payment:', error)
      setStatus('error')
      setMessage('Une erreur est survenue lors de la confirmation.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-animated flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent mb-4"></div>
            <h2 className="text-xl font-bold mb-2">Traitement en cours...</h2>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-4 text-green-600">Paiement confirmé !</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
            <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-4 mb-6 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">
                Un email de confirmation vous a été envoyé avec les détails de votre réservation.
              </p>
            </div>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all"
            >
              Retour à l'accueil
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-4 text-red-600">Erreur de paiement</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
            <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-4 mb-6 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">
                Votre réservation a été créée mais le paiement n'a pas pu être confirmé. 
                Veuillez contacter votre thérapeute pour régler ce problème.
              </p>
            </div>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all"
            >
              Retour à l'accueil
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
