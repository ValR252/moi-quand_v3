'use client'

/**
 * Dashboard thérapeute - Version lean
 * Frontend Developer: Liste des RDV avec animations fluides
 * Backend Engineer: Données de démo en fallback
 */

import { useEffect, useState } from 'react'
import { type Booking, type Therapist } from '@/lib/supabase'
import { MOCK_THERAPIST, MOCK_BOOKINGS } from '@/lib/mock-data'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function DashboardPage() {
  const [therapist, setTherapist] = useState<Therapist | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [hasGoogleCalendar, setHasGoogleCalendar] = useState(false)
  const [calendarLoading, setCalendarLoading] = useState(false)

  useEffect(() => {
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function checkAuth() {
    try {
      // Use API route to check auth (uses SSR cookies)
      const response = await fetch('/api/test-auth')
      const authData = await response.json()

      if (!authData.authenticated || !authData.user) {
        // Mode démo : pas d'utilisateur connecté
        loadDemoData()
        return
      }

      await loadTherapistData(authData.user.id)
      await loadBookings(authData.user.id)
    } catch (error) {
      // Fallback en mode démo si erreur
      console.warn('Auth check error, using demo data:', error)
      loadDemoData()
    }
  }

  function loadDemoData() {
    setIsDemoMode(true)
    setTherapist(MOCK_THERAPIST as any)
    setBookings(MOCK_BOOKINGS as any)
    setLoading(false)
  }

  async function loadTherapistData(userId: string) {
    try {
      const response = await fetch(`/api/therapist/${userId}`)
      if (!response.ok) {
        loadDemoData()
        return
      }
      
      const data = await response.json()
      if (data.therapist) {
        setTherapist(data.therapist)
        setHasGoogleCalendar(!!data.therapist.google_access_token)
      } else {
        loadDemoData()
        return
      }
      setLoading(false)
    } catch (error) {
      console.warn('Error loading therapist:', error)
      loadDemoData()
    }
  }

  async function loadBookings(userId: string) {
    try {
      const response = await fetch(`/api/bookings?therapist_id=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings || [])
      }
    } catch (error) {
      console.warn('Error loading bookings:', error)
    }
  }

  async function handleLogout() {
    if (isDemoMode) {
      window.location.href = '/'
      return
    }
    
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  async function handleConnectGoogleCalendar() {
    setCalendarLoading(true)
    try {
      const response = await fetch('/api/calendar/connect')

      // Vérifier le status de la réponse
      if (response.status === 401) {
        alert('❌ Session expirée. Veuillez vous reconnecter.')
        window.location.href = '/login'
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        alert(`❌ Erreur ${response.status}: ${errorData.error || 'Erreur inconnue'}`)
        setCalendarLoading(false)
        return
      }

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('❌ Aucune URL de connexion reçue')
        setCalendarLoading(false)
      }
    } catch (error) {
      console.error('Error connecting calendar:', error)
      alert('Erreur lors de la connexion à Google Calendar. Vérifiez la console (F12).')
      setCalendarLoading(false)
    }
  }

  async function handleDisconnectGoogleCalendar() {
    if (!confirm('Êtes-vous sûr de vouloir déconnecter Google Calendar ?')) return

    setCalendarLoading(true)
    try {
      const response = await fetch('/api/calendar/disconnect', { method: 'POST' })
      if (response.ok) {
        // Reload therapist data to get fresh state from database
        if (therapist) {
          await loadTherapistData(therapist.id)
        }
        alert('Google Calendar déconnecté avec succès ✓')
      }
    } catch (error) {
      console.error('Error disconnecting calendar:', error)
      alert('Erreur lors de la déconnexion')
    }
    setCalendarLoading(false)
  }

  async function handleSyncBooking(bookingId: string) {
    try {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId })
      })

      if (response.ok) {
        alert('Réservation synchronisée avec Google Calendar ✓')
        // Refresh bookings to get updated google_event_id
        if (therapist) {
          await loadBookings(therapist.id)
        }
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('Error syncing booking:', error)
      alert('Erreur lors de la synchronisation')
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

  const now = new Date()
  const upcomingBookings = bookings.filter(b => {
    const bookingDate = new Date(`${b.date}T${b.time}`)
    return bookingDate >= now
  })

  const pastBookings = bookings.filter(b => {
    const bookingDate = new Date(`${b.date}T${b.time}`)
    return bookingDate < now
  })

  const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://moi-quand.com'}/book/${therapist?.id || ''}`

  return (
    <div className="min-h-screen bg-gradient-animated">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mode démo banner */}
        {isDemoMode && (
          <div className="bg-amber-100 dark:bg-amber-900 border border-amber-300 dark:border-amber-700 rounded-xl p-4 mb-6 text-center">
            <div className="text-amber-800 dark:text-amber-200">
              🎭 <strong>Mode Démo</strong> - Ceci est un exemple avec des données fictives
            </div>
          </div>
        )}

        {/* Header avec animation fade-in */}
        <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6 mb-6 animate-[fadeIn_0.5s_ease-out]">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {therapist?.photo_url ? (
                <img
                  src={therapist.photo_url}
                  alt={therapist.name}
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-indigo-200 dark:ring-indigo-800"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-2xl text-white font-bold">
                  {therapist?.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {therapist?.name || 'Thérapeute'}
                </h1>
                {therapist?.title && (
                  <p className="text-gray-600 dark:text-gray-400">{therapist.title}</p>
                )}
                <p className="text-sm text-gray-500">{therapist?.email}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <a
                href="/dashboard/settings"
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
              >
                ⚙️ Paramètres
              </a>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>

        {/* Lien de réservation */}
        {therapist && (
          <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6 mb-6 animate-[fadeIn_0.6s_ease-out]">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              🔗 Votre page de réservation
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="text"
                readOnly
                value={bookingUrl}
                className="flex-1 min-w-[300px] px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 font-mono text-sm"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(bookingUrl)
                  alert('Lien copié dans le presse-papier ! 📋')
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
              >
                📋 Copier
              </button>
              <a
                href={`/book/${therapist.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border-2 border-indigo-600 text-indigo-600 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all hover:scale-105 active:scale-95"
              >
                👁️ Aperçu
              </a>
            </div>
          </div>
        )}

        {/* Google Calendar Integration */}
        {therapist && !isDemoMode && (
          <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6 mb-6 animate-[fadeIn_0.65s_ease-out]">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              📅 Synchronisation Google Calendar
            </h2>

            {hasGoogleCalendar ? (
              <div>
                <div className="flex items-center gap-3 mb-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl">
                  <div className="text-3xl">✅</div>
                  <div className="flex-1">
                    <div className="font-medium text-green-800 dark:text-green-200">
                      Google Calendar connecté
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">
                      Vos nouvelles réservations seront automatiquement ajoutées à votre calendrier Google
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleDisconnectGoogleCalendar}
                  disabled={calendarLoading}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {calendarLoading ? '⏳ Déconnexion...' : '🔌 Déconnecter Google Calendar'}
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <div className="text-3xl">📆</div>
                  <div className="flex-1">
                    <div className="font-medium text-blue-800 dark:text-blue-200">
                      Connectez votre Google Calendar
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      Synchronisez automatiquement vos réservations avec votre calendrier Google
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleConnectGoogleCalendar}
                  disabled={calendarLoading}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {calendarLoading ? '⏳ Connexion...' : '🔗 Connecter Google Calendar'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Stats rapides avec animations décalées */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6 hover:shadow-2xl transition-all animate-[fadeIn_0.7s_ease-out]">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">📅 RDV à venir</div>
            <div className="text-4xl font-bold text-indigo-600">{upcomingBookings.length}</div>
          </div>
          <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6 hover:shadow-2xl transition-all animate-[fadeIn_0.8s_ease-out]">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">✅ RDV passés</div>
            <div className="text-4xl font-bold text-gray-600">{pastBookings.length}</div>
          </div>
          <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6 hover:shadow-2xl transition-all animate-[fadeIn_0.9s_ease-out]">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">📊 Total</div>
            <div className="text-4xl font-bold text-gray-900 dark:text-white">{bookings.length}</div>
          </div>
        </div>

        {/* Liste des RDV à venir */}
        <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6 animate-[fadeIn_1s_ease-out]">
          <h2 className="text-xl font-bold mb-4">📆 Rendez-vous à venir</h2>

          {upcomingBookings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-lg">Aucun rendez-vous à venir</p>
              <p className="text-sm mt-2">Partagez votre lien de réservation pour recevoir des demandes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking, index) => (
                <div
                  key={booking.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:scale-[1.02] hover:shadow-lg"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex-1">
                      <div className="font-semibold text-lg flex items-center gap-2">
                        👤 {booking.first_name} {booking.last_name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mt-2">
                        <div className="flex items-center gap-2">
                          📅 {format(parseISO(booking.date), 'EEEE d MMMM yyyy', { locale: fr })}
                        </div>
                        <div className="flex items-center gap-2">
                          🕐 {booking.time}
                        </div>
                        <div className="flex items-center gap-2">
                          ✉️ {booking.email}
                        </div>
                        {booking.phone && (
                          <div className="flex items-center gap-2">
                            📞 {booking.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <span
                        className={`inline-block px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          booking.payment_status === 'paid'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}
                      >
                        {booking.payment_status === 'paid' ? '✓ Payé' : '⏳ En attente'}
                      </span>
                      {hasGoogleCalendar && !isDemoMode && (
                        <div>
                          {(booking as any).google_event_id ? (
                            <div className="text-xs text-green-600 dark:text-green-400 flex items-center justify-end gap-1">
                              <span>📅</span> Synchronisé
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSyncBooking(booking.id)}
                              className="text-xs px-3 py-1 bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-200 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all"
                            >
                              📅 Sync Calendar
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RDV passés (collapsible) */}
        {pastBookings.length > 0 && (
          <details className="mt-6 group">
            <summary className="cursor-pointer bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6 hover:bg-white/90 dark:hover:bg-gray-900/80 transition-all list-none">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">📚 Historique ({pastBookings.length} RDV passés)</span>
                <span className="text-2xl group-open:rotate-180 transition-transform">▼</span>
              </div>
            </summary>
            <div className="mt-4 bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6 space-y-4">
              {pastBookings.reverse().map((booking) => (
                <div
                  key={booking.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 opacity-70 hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex-1">
                      <div className="font-semibold">
                        {booking.first_name} {booking.last_name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {format(parseISO(booking.date), 'EEEE d MMMM yyyy', { locale: fr })} à {booking.time}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}
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
      `}</style>
    </div>
  )
}
