/**
 * Transfer Appointment Page
 * Frontend Developer: Allows patient to select a new time slot
 */

'use client'

import { use, useEffect, useState } from 'react'
import { format, parseISO, addDays, startOfWeek, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import ThemeToggle from '@/components/ThemeToggle'

interface BookingDetails {
  id: string
  therapist_id: string
  therapist_name: string
  therapist_slug: string
  patient_name: string
  session_id: string
  session_label: string
  duration: number
  old_date: string
  old_time: string
  cancellation_token: string
}

interface TimeSlot {
  time: string
  available: boolean
}

export default function TransferPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Date and time selection
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Transfer process
  const [transferring, setTransferring] = useState(false)
  const [success, setSuccess] = useState(false)

  // Generate next 14 days for selection
  const [availableDates, setAvailableDates] = useState<Date[]>([])

  useEffect(() => {
    loadBooking()
    generateAvailableDates()
  }, [])

  useEffect(() => {
    if (selectedDate && booking) {
      loadAvailableSlots(selectedDate)
    }
  }, [selectedDate])

  function generateAvailableDates() {
    const dates: Date[] = []
    const today = new Date()

    for (let i = 1; i <= 14; i++) {
      dates.push(addDays(today, i))
    }

    setAvailableDates(dates)
  }

  async function loadBooking() {
    try {
      const res = await fetch(`/api/bookings/by-token/${token}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Rendez-vous introuvable')
        return
      }

      // Transform data for transfer
      setBooking({
        id: data.booking.id,
        therapist_id: data.booking.therapist_id || '',
        therapist_name: data.booking.therapist_name,
        therapist_slug: data.booking.therapist_slug,
        patient_name: data.booking.patient_name,
        session_id: data.booking.session_id || '',
        session_label: data.booking.session_label,
        duration: data.booking.duration,
        old_date: data.booking.date,
        old_time: data.booking.time,
        cancellation_token: token
      })
    } catch (err) {
      console.error('Error loading booking:', err)
      setError('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  async function loadAvailableSlots(date: string) {
    if (!booking) return

    setLoadingSlots(true)
    try {
      const res = await fetch(
        `/api/availability/${booking.therapist_id}?date=${date}&session_id=${booking.session_id}`
      )
      const data = await res.json()

      if (res.ok && data.slots) {
        setAvailableSlots(data.slots)
      } else {
        setAvailableSlots([])
      }
    } catch (err) {
      console.error('Error loading slots:', err)
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  async function handleTransfer() {
    if (!selectedDate || !selectedTime || !booking) return

    setTransferring(true)
    try {
      const res = await fetch('/api/bookings/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          new_date: selectedDate,
          new_time: selectedTime
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
      } else {
        alert(data.error || 'Erreur lors du transfert')
      }
    } catch (err) {
      console.error('Error transferring booking:', err)
      alert('Erreur lors du transfert')
    } finally {
      setTransferring(false)
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
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
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
            Rendez-vous déplacé !
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Votre rendez-vous a été transféré avec succès.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Vous recevrez un email de confirmation avec les nouveaux détails.
          </p>
          <a
            href={`/${booking.therapist_slug}`}
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retour à la page de réservation
          </a>
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
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">Transférer votre rendez-vous</h2>
            <p className="text-cyan-100">Choisissez un nouveau créneau gratuitement</p>
          </div>

          {/* Current booking info */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              Rendez-vous actuel
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {format(parseISO(booking.old_date), 'EEEE d MMMM yyyy', { locale: fr })}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {booking.old_time} • {booking.duration} min • {booking.session_label}
                  </p>
                </div>
                <div className="text-2xl">📅</div>
              </div>
            </div>
          </div>

          {/* Date Selection */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              1. Choisissez une nouvelle date
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {availableDates.map((date) => {
                const dateStr = format(date, 'yyyy-MM-dd')
                const isSelected = selectedDate === dateStr

                return (
                  <button
                    key={dateStr}
                    onClick={() => {
                      setSelectedDate(dateStr)
                      setSelectedTime('')
                    }}
                    className={`
                      p-4 rounded-lg border-2 text-left transition-colors
                      ${isSelected
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                      }
                    `}
                  >
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {format(date, 'EEE', { locale: fr })}
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {format(date, 'd MMM', { locale: fr })}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Time Selection */}
          {selectedDate && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                2. Choisissez un horaire
              </h3>

              {loadingSlots ? (
                <div className="text-center py-8">
                  <div className="inline-block w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Chargement des créneaux...
                  </p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">😕</div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Aucun créneau disponible pour cette date
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {availableSlots
                    .filter(slot => slot.available)
                    .map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => setSelectedTime(slot.time)}
                        className={`
                          p-3 rounded-lg border-2 text-center transition-colors font-medium
                          ${selectedTime === slot.time
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:border-indigo-300 dark:hover:border-indigo-700'
                          }
                        `}
                      >
                        {slot.time}
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Transfer Button */}
          {selectedDate && selectedTime && (
            <div className="p-6 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleTransfer}
                disabled={transferring}
                className="w-full px-6 py-4 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {transferring ? 'Transfert en cours...' : 'Confirmer le transfert'}
              </button>

              <p className="mt-4 text-sm text-center text-gray-600 dark:text-gray-400">
                Nouveau rendez-vous : {format(parseISO(selectedDate), 'EEEE d MMMM', { locale: fr })} à {selectedTime}
              </p>
            </div>
          )}
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <a
            href={`/cancel/${token}`}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            ← Retour aux options d'annulation
          </a>
        </div>
      </main>
    </div>
  )
}
