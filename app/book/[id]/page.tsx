'use client'

/**
 * Page de réservation publique
 * Frontend Developer: Formulaire de réservation avec animations
 * Backend Engineer: Données de démo en fallback
 */

import { use, useEffect, useState } from 'react'
import { supabase, type Therapist, type Session } from '@/lib/supabase'
import { MOCK_THERAPIST, MOCK_SESSIONS } from '@/lib/mock-data'
import { format, addDays, startOfWeek, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  // Next.js 15: params est maintenant une Promise, il faut la unwrapper
  const { id } = use(params)
  const [therapist, setTherapist] = useState<Therapist | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    loadTherapistData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadTherapistData() {
    try {
      // Si l'ID est "demo", utiliser directement les données de démo
      if (id === 'demo') {
        setIsDemoMode(true)
        setTherapist(MOCK_THERAPIST as any)
        setSessions(MOCK_SESSIONS as any)
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
      } else {
        // Fallback vers données de démo si thérapeute non trouvé
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
        // Fallback vers sessions de démo
        setSessions(MOCK_SESSIONS as any)
      }

      setLoading(false)
    } catch (error) {
      // En cas d'erreur Supabase, utiliser les données de démo
      console.warn('Supabase error, using demo data:', error)
      setIsDemoMode(true)
      setTherapist(MOCK_THERAPIST as any)
      setSessions(MOCK_SESSIONS as any)
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedSession || !selectedDate || !selectedTime) {
      alert('Veuillez sélectionner une séance, une date et un horaire')
      return
    }

    setSubmitting(true)

    // En mode démo, simuler la réservation sans toucher à Supabase
    if (isDemoMode) {
      setTimeout(() => {
        setSuccess(true)
        setSubmitting(false)
      }, 1000)
      return
    }

    const { error } = await supabase.from('bookings').insert({
      therapist_id: id,
      session_id: selectedSession.id,
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: selectedTime,
      payment_status: 'pending',
    })

    if (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la réservation. Veuillez réessayer.')
      setSubmitting(false)
      return
    }

    setSuccess(true)
    setSubmitting(false)
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
    return (
      <div className="min-h-screen bg-gradient-animated flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-8 text-center animate-[scaleIn_0.5s_ease-out]">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-4">
            {isDemoMode ? 'Réservation simulée !' : 'Réservation confirmée !'}
          </h2>
          {isDemoMode ? (
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              🎭 <strong>Mode Démo</strong> - Dans la version réelle, vous recevriez un email de confirmation à <strong>{formData.email}</strong> avec les instructions de paiement.
            </p>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Vous recevrez un email de confirmation à <strong>{formData.email}</strong> avec les instructions de paiement.
            </p>
          )}
          <div className="bg-indigo-50 dark:bg-indigo-950 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Paiement :</strong> Virement bancaire<br />
              Les informations bancaires vous seront envoyées par email.
            </p>
          </div>
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

  // Générer les 14 prochains jours
  const availableDates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i))

  // Horaires disponibles (simplifiés pour la démo - devrait venir de la DB)
  const availableTimes = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ]

  return (
    <div className="min-h-screen bg-gradient-animated py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Mode démo banner */}
        {isDemoMode && (
          <div className="bg-amber-100 dark:bg-amber-900 border border-amber-300 dark:border-amber-700 rounded-xl p-4 mb-6 text-center">
            <div className="text-amber-800 dark:text-amber-200">
              🎭 <strong>Mode Démo</strong> - Ceci est un exemple avec des données fictives. Aucune vraie réservation ne sera créée.
            </div>
          </div>
        )}

        {/* Header du thérapeute */}
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
          {/* Étape 1 : Choisir la séance */}
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
                    <div className="text-2xl font-bold text-indigo-600">{session.price}€</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Étape 2 : Choisir la date */}
          {selectedSession && (
            <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-8 animate-[fadeIn_0.7s_ease-out]">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-sm">2</span>
                Choisissez une date
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {availableDates.map((date) => (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    className={`p-4 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 ${
                      selectedDate?.toDateString() === date.toDateString()
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 shadow-lg'
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                    }`}
                  >
                    <div className="text-xs text-gray-500 mb-1">
                      {format(date, 'EEE', { locale: fr })}
                    </div>
                    <div className="text-2xl font-bold">
                      {format(date, 'd')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(date, 'MMM', { locale: fr })}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Étape 3 : Choisir l'heure */}
          {selectedDate && (
            <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-8 animate-[fadeIn_0.8s_ease-out]">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-sm">3</span>
                Choisissez un horaire
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {availableTimes.map((time) => (
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
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Étape 4 : Informations */}
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
                    placeholder="06 12 34 56 78"
                  />
                </div>
              </div>

              {/* Récapitulatif */}
              <div className="mt-8 p-6 bg-indigo-50 dark:bg-indigo-950 rounded-xl">
                <h3 className="font-bold mb-4">Récapitulatif de votre réservation</h3>
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
                  <div className="border-t border-indigo-200 dark:border-indigo-800 mt-4 pt-4 flex justify-between text-lg font-bold">
                    <span>Total :</span>
                    <span className="text-indigo-600">{selectedSession?.price}€</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-6 px-6 py-4 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {submitting ? '⏳ Réservation en cours...' : '✓ Confirmer la réservation'}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Le paiement se fait par virement bancaire. Vous recevrez les instructions par email.
              </p>
            </div>
          )}
        </form>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}
