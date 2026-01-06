/**
 * Public Cancellation Page
 * Frontend Developer: Patient-facing cancellation/transfer interface
 */

'use client'

import { use, useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import ThemeToggle from '@/components/ThemeToggle'

interface BookingDetails {
  id: string
  therapist_name: string
  therapist_slug: string
  patient_name: string
  date: string
  time: string
  duration: number
  session_label: string
  status: string
  cancellation_policy: 'refund' | 'transfer' | 'both'
  cancellation_deadline_hours: number
  can_cancel: boolean
  can_transfer: boolean
  deadline_message: string
}

export default function CancelPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadBooking()
  }, [])

  async function loadBooking() {
    try {
      const res = await fetch(`/api/bookings/by-token/${token}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Rendez-vous introuvable')
        return
      }

      setBooking(data.booking)
    } catch (err) {
      console.error('Error loading booking:', err)
      setError('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel() {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) return

    setProcessing(true)
    try {
      const res = await fetch('/api/bookings/cancel-by-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'cancel' }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
      } else {
        alert(data.error || 'Erreur lors de l\'annulation')
      }
    } catch (err) {
      console.error('Error cancelling booking:', err)
      alert('Erreur lors de l\'annulation')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Lien invalide
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {error || 'Ce lien d\'annulation n\'est pas valide ou a expiré.'}
          </p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Rendez-vous annulé
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Votre rendez-vous a été annulé avec succès. Vous recevrez un email de confirmation.
          </p>
          <a
            href={`/${booking.therapist_slug}`}
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Prendre un nouveau rendez-vous
          </a>
        </div>
      </div>
    )
  }

  if (booking.status === 'cancelled') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-6xl mb-4">ℹ️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Rendez-vous déjà annulé
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Ce rendez-vous a déjà été annulé.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
            moi-quand
          </h1>
          <ThemeToggle />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">Gérer votre rendez-vous</h2>
            <p className="text-indigo-100">Vous pouvez annuler ou modifier votre rendez-vous</p>
          </div>

          {/* Booking Details */}
          <div className="p-6">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 mb-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                Détails du rendez-vous
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Thérapeute</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {booking.therapist_name}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Patient</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {booking.patient_name}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Date</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {format(parseISO(booking.date), 'EEEE d MMMM yyyy', { locale: fr })}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Heure</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {booking.time}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Durée</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {booking.duration} minutes
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Type de séance</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {booking.session_label}
                  </span>
                </div>
              </div>
            </div>

            {/* Policy Info */}
            {!booking.can_cancel && !booking.can_transfer ? (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⚠️</div>
                  <div>
                    <h4 className="font-medium text-amber-900 dark:text-amber-300 mb-1">
                      Délai dépassé
                    </h4>
                    <p className="text-sm text-amber-800 dark:text-amber-400">
                      {booking.deadline_message}
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-400 mt-2">
                      Veuillez contacter directement votre thérapeute pour toute modification.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Action Buttons */}
                <div className="space-y-3">
                  {booking.can_transfer && (
                    <a
                      href={`/cancel/${token}/transfer`}
                      className="w-full flex items-center justify-between p-4 border-2 border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">🔄</div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-white">
                            Transférer vers un autre créneau
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Choisissez une nouvelle date gratuitement
                          </div>
                        </div>
                      </div>
                      <div className="text-indigo-600 dark:text-indigo-400">→</div>
                    </a>
                  )}

                  {booking.can_cancel && (
                    <button
                      onClick={handleCancel}
                      disabled={processing}
                      className="w-full flex items-center justify-between p-4 border-2 border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">❌</div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {processing ? 'Annulation en cours...' : 'Annuler le rendez-vous'}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {booking.cancellation_policy === 'refund' || booking.cancellation_policy === 'both'
                              ? 'Vous serez remboursé selon la politique du thérapeute'
                              : 'Annulation définitive'}
                          </div>
                        </div>
                      </div>
                      <div className="text-red-600 dark:text-red-400">→</div>
                    </button>
                  )}
                </div>

                {/* Info */}
                <div className="mt-6 text-sm text-gray-500 dark:text-gray-400 text-center">
                  Délai limite : {booking.cancellation_deadline_hours} heures avant le rendez-vous
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Des questions ? Contactez directement votre thérapeute.</p>
          <p className="mt-2">Propulsé par <span className="font-medium">moi-quand.com</span></p>
        </div>
      </main>
    </div>
  )
}
