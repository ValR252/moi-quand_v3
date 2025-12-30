'use client'

/**
 * Dashboard thérapeute - Version lean
 * Frontend Developer: Liste des RDV avec animations fluides
 */

import { useEffect, useState } from 'react'
import { supabase, type Booking, type Therapist } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function DashboardPage() {
  const [therapist, setTherapist] = useState<Therapist | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    await loadTherapistData(user.id)
    await loadBookings(user.id)
  }

  async function loadTherapistData(userId: string) {
    const { data } = await supabase
      .from('therapists')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) {
      setTherapist(data)
    }
    setLoading(false)
  }

  async function loadBookings(userId: string) {
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('therapist_id', userId)
      .order('date', { ascending: true })
      .order('time', { ascending: true })

    if (data) {
      setBookings(data)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/'
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
                    <div className="text-right">
                      <span
                        className={`inline-block px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          booking.payment_status === 'paid'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}
                      >
                        {booking.payment_status === 'paid' ? '✓ Payé' : '⏳ En attente'}
                      </span>
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
