'use client'

/**
 * Page de réservation publique
 * Features: Booking limit check + PayPal payment option
 */

import { use, useEffect, useState } from 'react'
import { supabase, type Therapist, type Session } from '@/lib/supabase'
import { MOCK_THERAPIST, MOCK_SESSIONS } from '@/lib/mock-data'
import { format, addDays, startOfWeek, parseISO, addMonths, startOfDay, isAfter, isBefore } from 'date-fns'
import { fr } from 'date-fns/locale'
import { generateAllCalendarLinks } from '@/lib/calendar-links'
import { detectUserTimezone, convertTimeToPatientTZ, formatTimeWithLabel } from '@/lib/timezone-helper'
import { CompactTimezoneSelector } from '@/components/TimezoneSelector'

export default function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [therapist, setTherapist] = useState<Therapist | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [patientTimezone, setPatientTimezone] = useState<string>('')
  const [therapistTimezone, setTherapistTimezone] = useState<string>('Europe/Zurich')
  
  // Feature 1: Booking limit
  const [bookingLimit, setBookingLimit] = useState<number>(2)
  const [maxBookingDate, setMaxBookingDate] = useState<Date>(addMonths(new Date(), 2))
  
  // Feature 2: Payment
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'paypal'>('bank_transfer')
  const [paypalLoading, setPaypalLoading] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)

  useEffect(() => {
    const detected = detectUserTimezone()
    setPatientTimezone(detected)
    loadTherapistData()
  }, [id])

  useEffect(() => {
    if (selectedDate && selectedSession && therapist && !isDemoMode) {
      fetchAvailableSlots()
    }
  }, [selectedDate, selectedSession])

  async function loadTherapistData() {
    try {
      if (id === 'demo') {
        setIsDemoMode(true)
        setTherapist(MOCK_THERAPIST as any)
        setSessions(MOCK_SESSIONS as any)
        setBookingLimit(2)
        setMaxBookingDate(addMonths(new Date(), 2))
        setLoading(false)
        return
      }

      const { data: therapistData } = await supabase
        .from('therapists')
        .select('*')
        .eq('id', id)
        .single()

      if (therapistData) {
        setTherapist(therapistData)
        setTherapistTimezone(therapistData.timezone || 'Europe/Zurich')
        // Feature 1: Set booking limit
        const limitMonths = therapistData.booking_limit_months ?? 2
        setBookingLimit(limitMonths)
        setMaxBookingDate(addMonths(startOfDay(new Date()), limitMonths))
      } else {
        setIsDemoMode(true)
        setTherapist(MOCK_THERAPIST as any)
      }

      const { data: sessionsData } = await supabase
        .from('sessions')
        .select('*')
        .eq('therapist_id', id)
        .eq('enabled', true)

      if (sessionsData && sessionsData.length > 0) {
        setSessions(sessionsData)
      } else {
        setSessions(MOCK_SESSIONS as any)
      }

      setLoading(false)
    } catch (error) {
      console.warn('Supabase error, using demo data:', error)
      setIsDemoMode(true)
      setTherapist(MOCK_THERAPIST as any)
      setSessions(MOCK_SESSIONS as any)
      setLoading(false)
    }
  }

  async function fetchAvailableSlots() {
    if (!selectedDate || !selectedSession || !therapist) return

    setLoadingSlots(true)
    setAvailableTimes([])
    setSelectedTime(null)

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const duration = selectedSession.duration

      const response = await fetch(
        `/api/availability/${therapist.id}?date=${dateStr}&duration=${duration}`
      )

      if (response.ok) {
        const data = await response.json()
        setAvailableTimes(data.availableSlots || [])
      } else {
        setAvailableTimes([])
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
      setAvailableTimes([])
    }

    setLoadingSlots(false)
  }

  // Feature 1: Check if date is within booking limit
  function isDateWithinLimit(date: Date): boolean {
    const today = startOfDay(new Date())
    const limitDate = addMonths(today, bookingLimit)
    return date >= today && date <= limitDate
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedSession || !selectedDate || !selectedTime) {
      alert('Veuillez sélectionner une séance, une date et un horaire')
      return
    }

    // Feature 1: Verify booking limit
    if (!isDateWithinLimit(selectedDate)) {
      alert(`Les réservations ne sont possibles que jusqu'à ${bookingLimit} mois à l'avance.`)
      return
    }

    setSubmitting(true)

    if (isDemoMode) {
      setTimeout(() => {
        setSuccess(true)
        setSubmitting(false)
      }, 1000)
      return
    }

    try {
      // Create booking via API
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          therapist_id: id,
          session_id: selectedSession.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: selectedTime,
          patient_timezone: patientTimezone,
          payment_method: paymentMethod,
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Erreur:', errorData)
        alert(errorData.error || 'Erreur lors de la réservation. Veuillez réessayer.')
        setSubmitting(false)
        return
      }

      const bookingData = await response.json()
      setBookingId(bookingData.booking.id)

      // Feature 2: If PayPal selected, create PayPal order
      if (paymentMethod === 'paypal' && therapist?.paypal_enabled) {
        setPaypalLoading(true)
        const paypalResponse = await fetch('/api/paypal/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            therapist_id: id,
            session_id: selectedSession.id,
            booking_id: bookingData.booking.id,
            return_url: `${window.location.origin}/payment/success`,
            cancel_url: `${window.location.origin}/payment/cancel`,
          })
        })

        if (paypalResponse.ok) {
          const paypalData = await paypalResponse.json()
          // Redirect to PayPal
          window.location.href = paypalData.approvalUrl
          return
        } else {
          const paypalError = await paypalResponse.json()
          console.error('PayPal error:', paypalError)
          alert('Erreur lors de la création du paiement PayPal. Vous pouvez payer par virement.')
          setPaypalLoading(false)
          setSuccess(true)
        }
      } else {
        setSuccess(true)
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      alert('Erreur lors de la réservation. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-animated flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!therapist) {
    return (
      <div className="min-h-screen bg-gradient-animated flex items-center justify-center">
        <div className="text-center bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl p-8">
          <p className="text-xl">Thérapeute non trouvé</p>
        </div>
      </div>
    )
  }

  if (success) {
    const calendarLinks = selectedDate && selectedTime && selectedSession ? generateAllCalendarLinks({
      title: `${selectedSession.label} - ${therapist.name}`,
      description: `Rendez-vous avec ${therapist.name}\nDurée: ${selectedSession.duration} minutes\nType: ${selectedSession.label}`,
      startDate: format(selectedDate, 'yyyy-MM-dd'),
      startTime: selectedTime,
      duration: selectedSession.duration,
      timezone: patientTimezone
    }) : null

    return (
      <div className="min-h-screen bg-gradient-animated flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-8 text-center animate-[scaleIn_0.5s_ease-out]">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-4">
            {isDemoMode ? 'Réservation simulée !' : 'Réservation confirmée !'}
          </h2>
          {isDemoMode ? (
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              🎭 <strong>Mode Démo</strong> - Dans la version réelle, vous recevriez un email de confirmation.
            </p>
          ) : paymentMethod === 'paypal' ? (
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Vous allez être redirigé vers PayPal pour finaliser le paiement.
            </p>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Vous recevrez un email de confirmation à <strong>{formData.email}</strong> avec les instructions de paiement.
            </p>
          )}

          {selectedDate && selectedTime && (
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 mb-6 border border-blue-200 dark:border-blue-800 text-left">
              <p className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                📅 {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
              </p>
              {therapistTimezone !== patientTimezone ? (
                <>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                    🕐 <strong>Votre heure:</strong> {convertTimeToPatientTZ(
                      format(selectedDate, 'yyyy-MM-dd'),
                      selectedTime,
                      therapistTimezone,
                      patientTimezone
                    )}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    🕐 <strong>Heure du thérapeute:</strong> {selectedTime}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  🕐 <strong>Heure:</strong> {selectedTime}
                </p>
              )}
            </div>
          )}

          {calendarLinks && (
            <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-4 mb-6 border border-green-200 dark:border-green-800">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                📅 Ajouter à votre agenda
              </p>
              <div className="flex flex-col gap-2">
                <a href={calendarLinks.google} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors">
                  Google Calendar
                </a>
                <a href={calendarLinks.outlook} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
                  Outlook
                </a>
                <a href={calendarLinks.ics} download="rendez-vous.ics" className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors">
                  Télécharger .ics
                </a>
              </div>
            </div>
          )}

          {paymentMethod === 'bank_transfer' && (
            <div className="bg-indigo-50 dark:bg-indigo-950 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Paiement :</strong> Virement bancaire<br />
                Les informations bancaires vous seront envoyées par email.
              </p>
            </div>
          )}

          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
          >
            Nouvelle réservation
          </button>
        </div>
      </div>
    )
  }

  // Generate available dates (respecting booking limit)
  const availableDates = Array.from({ length: 60 }, (_, i) => addDays(new Date(), i))
    .filter(date => isDateWithinLimit(date))

  const demoTimes = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ]

  const displayTimes = isDemoMode ? demoTimes : availableTimes

  return (
    <div className="min-h-screen bg-gradient-animated py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Mode démo banner */}
        {isDemoMode && (
          <div className="bg-amber-100 dark:bg-amber-900 border border-amber-300 dark:border-amber-700 rounded-xl p-4 mb-6 text-center">
            <div className="text-amber-800 dark:text-amber-200">
              🎭 <strong>Mode Démo</strong> - Ceci est un exemple avec des données fictives.
            </div>
          </div>
        )}

        {/* Feature 1: Booking limit info */}
        {!isDemoMode && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-6 text-center">
            <div className="text-blue-800 dark:text-blue-200 text-sm">
              📅 Les réservations sont possibles jusqu'au <strong>{format(maxBookingDate, 'd MMMM yyyy', { locale: fr })}</strong> ({bookingLimit} mois à l'avance)
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-8 mb-8 animate-[fadeIn_0.5s_ease-out]">
          <div className="flex items-center gap-6">
            {therapist.photo_url ? (
              <img
                src={therapist.photo_url}
                alt={therapist.name}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-indigo-200 dark:ring-indigo-800"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-4xl text-white font-bold">
                {therapist.name[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {therapist.name}
              </h1>
              {therapist.title && (
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">{therapist.title}</p>
              )}
              {therapist.bio && (
                <p className="text-gray-600 dark:text-gray-400">{therapist.bio}</p>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Session */}
          <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-8 animate-[fadeIn_0.6s_ease-out]">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-sm">1</span>
              Choisissez votre séance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => setSelectedSession(session)}
                  className={`text-left p-6 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 ${
                    selectedSession?.id === session.id
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 shadow-lg'
                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                  }`}
                >
                  <div className="font-semibold text-lg mb-2">{session.label}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <div>⏱️ {session.duration} minutes</div>
                    <div className="text-2xl font-bold text-indigo-600">{session.price} CHF</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Date */}
          {selectedSession && (
            <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-8 animate-[fadeIn_0.7s_ease-out]">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-sm">2</span>
                  Choisissez une date
                </h2>
                {patientTimezone && (
                  <div className="ml-10 flex items-center gap-2 text-sm">
                    <CompactTimezoneSelector
                      value={patientTimezone}
                      onChange={setPatientTimezone}
                    />
                  </div>
                )}
              </div>
              
              {/* Feature 1: Show limited dates - Grouped by month with headers */}
              <div className="space-y-6">
                {(() => {
                  // Group dates by month
                  const groupedDates: { [key: string]: Date[] } = {}
                  const today = new Date()
                  const currentMonth = today.getMonth()
                  const currentYear = today.getFullYear()
                  
                  availableDates.forEach((date) => {
                    const monthKey = format(date, 'yyyy-MM', { locale: fr })
                    if (!groupedDates[monthKey]) {
                      groupedDates[monthKey] = []
                    }
                    groupedDates[monthKey].push(date)
                  })
                  
                  return Object.entries(groupedDates).map(([monthKey, dates]) => {
                    const [year, month] = monthKey.split('-').map(Number)
                    const isCurrentMonth = month - 1 === currentMonth && year === currentYear
                    const monthLabel = format(dates[0], 'MMMM yyyy', { locale: fr })
                    
                    return (
                      <div key={monthKey} className="space-y-3">
                        {/* Month Header - More visible for current month */}
                        <div className={`flex items-center gap-3 py-2 px-4 rounded-lg ${
                          isCurrentMonth 
                            ? 'bg-indigo-100 dark:bg-indigo-900/50 border-l-4 border-indigo-600' 
                            : 'bg-gray-100 dark:bg-gray-800/50 border-l-4 border-gray-400'
                        }`}>
                          <span className={`text-lg font-bold ${
                            isCurrentMonth 
                              ? 'text-indigo-800 dark:text-indigo-200' 
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {isCurrentMonth ? '📅 ' : ''}{monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
                          </span>
                          {isCurrentMonth && (
                            <span className="text-xs font-medium px-2 py-1 bg-indigo-600 text-white rounded-full">
                              Ce mois
                            </span>
                          )}
                        </div>
                        
                        {/* Dates grid for this month */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                          {dates.map((date) => {
                            const isSelected = selectedDate?.toDateString() === date.toDateString()
                            const isPast = date < startOfDay(today)
                            
                            return (
                              <button
                                key={date.toISOString()}
                                type="button"
                                onClick={() => setSelectedDate(date)}
                                disabled={isPast}
                                className={`p-4 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 ${
                                  isSelected
                                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 shadow-lg'
                                    : isPast
                                      ? 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 opacity-50 cursor-not-allowed'
                                      : isCurrentMonth
                                        ? 'border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-800 hover:border-indigo-400'
                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300'
                                }`}
                              >
                                <div className={`text-xs mb-1 ${
                                  isSelected 
                                    ? 'text-indigo-600 dark:text-indigo-400' 
                                    : isPast 
                                      ? 'text-gray-400 dark:text-gray-600'
                                      : isCurrentMonth
                                        ? 'text-indigo-500 dark:text-indigo-400 font-medium'
                                        : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {format(date, 'EEE', { locale: fr })}
                                </div>
                                <div className={`text-2xl font-bold ${
                                  isSelected 
                                    ? 'text-indigo-700 dark:text-indigo-300' 
                                    : isPast 
                                      ? 'text-gray-400 dark:text-gray-600'
                                      : isCurrentMonth
                                        ? 'text-gray-900 dark:text-white'
                                        : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                  {format(date, 'd')}
                                </div>
                                <div className={`text-xs ${
                                  isSelected 
                                    ? 'text-indigo-500 dark:text-indigo-400' 
                                    : isPast 
                                      ? 'text-gray-300 dark:text-gray-700'
                                      : 'text-gray-400 dark:text-gray-500'
                                }`}>
                                  {format(date, 'MMM', { locale: fr })}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
              
              {availableDates.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Aucune date disponible dans la limite de réservation.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Time */}
          {selectedDate && (
            <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-8 animate-[fadeIn_0.8s_ease-out]">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-sm">3</span>
                Choisissez un horaire
              </h2>

              {loadingSlots ? (
                <div className="text-center py-12">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement des créneaux...</p>
                </div>
              ) : displayTimes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-lg font-medium">Aucun créneau disponible ce jour-là</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {displayTimes.map((time) => {
                    const patientTime = therapistTimezone !== patientTimezone && selectedDate
                      ? convertTimeToPatientTZ(
                          format(selectedDate, 'yyyy-MM-dd'),
                          time,
                          therapistTimezone,
                          patientTimezone
                        )
                      : time

                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`p-3 rounded-xl border-2 font-medium transition-all hover:scale-105 active:scale-95 ${
                          selectedTime === time
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 shadow-lg'
                            : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                        }`}
                      >
                        <div className="text-base">{patientTime}</div>
                        {therapistTimezone !== patientTimezone && (
                          <div className="text-xs text-gray-500 mt-1">
                            ({time})
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Info + Payment */}
          {selectedTime && (
            <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-8 animate-[fadeIn_0.9s_ease-out]">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-sm">4</span>
                Vos informations
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nom *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Dupont"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="jean.dupont@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="+41 XX XXX XX XX"
                  />
                </div>
              </div>

              {/* Feature 2: Payment Method Selection */}
              {!isDemoMode && therapist?.paypal_enabled && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Méthode de paiement</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === 'bank_transfer'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950'
                          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          🏦
                        </div>
                        <div className="text-left">
                          <div className="font-semibold">Virement bancaire</div>
                          <div className="text-sm text-gray-500">Payer après la réservation</div>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('paypal')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === 'paypal'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                          P
                        </div>
                        <div className="text-left">
                          <div className="font-semibold">PayPal</div>
                          <div className="text-sm text-gray-500">Paiement sécurisé en ligne</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="mt-8 p-6 bg-indigo-50 dark:bg-indigo-950 rounded-xl">
                <h3 className="font-bold mb-4">Récapitulatif</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Séance :</span>
                    <span className="font-medium">{selectedSession?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date :</span>
                    <span className="font-medium">
                      {selectedDate && format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Heure :</span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Durée :</span>
                    <span className="font-medium">{selectedSession?.duration} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paiement :</span>
                    <span className="font-medium">
                      {paymentMethod === 'paypal' ? 'PayPal' : 'Virement bancaire'}
                    </span>
                  </div>
                  <div className="border-t border-indigo-200 dark:border-indigo-800 mt-4 pt-4 flex justify-between text-lg font-bold">
                    <span>Total :</span>
                    <span className="text-indigo-600">{selectedSession?.price} CHF</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || paypalLoading}
                className="w-full mt-6 px-6 py-4 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {submitting || paypalLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {paypalLoading ? 'Redirection vers PayPal...' : 'Réservation en cours...'}
                  </span>
                ) : (
                  paymentMethod === 'paypal' ? 'Payer avec PayPal' : 'Confirmer la réservation'
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                {paymentMethod === 'paypal' 
                  ? 'Vous serez redirigé vers PayPal pour finaliser le paiement.'
                  : 'Le paiement se fait par virement bancaire. Vous recevrez les instructions par email.'}
              </p>
            </div>
          )}
        </form>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
