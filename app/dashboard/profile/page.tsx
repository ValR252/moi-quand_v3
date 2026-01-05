/**
 * Profile Management Page
 * Complete therapist profile editor with photo, bio, contact info, and settings
 */

'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Toggle from '@/components/ui/Toggle'
import Badge from '@/components/ui/Badge'
import { Therapist } from '@/lib/supabase'

export default function ProfilePage() {
  const [therapist, setTherapist] = useState<Therapist | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [calendars, setCalendars] = useState<Array<{ id: string; summary: string; primary?: boolean }>>([])
  const [loadingCalendars, setLoadingCalendars] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    title: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'CH',
    bio: '',
    website: '',
    booking_enabled: true,
    auto_confirm: false,
  })

  useEffect(() => {
    loadProfile()

    // Check for calendar success and reload if present
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('calendar_success') === 'true') {
      console.log('Calendar connected successfully! Reloading profile...')
      // Wait a bit for Supabase to finish saving, then reload
      setTimeout(() => {
        loadProfile()
      }, 1000)
    }
  }, [])

  async function loadProfile() {
    try {
      const res = await fetch('/api/therapist')
      const data = await res.json()

      if (data.therapist) {
        setTherapist(data.therapist)
        setFormData({
          name: data.therapist.name || '',
          email: data.therapist.email || '',
          title: data.therapist.title || '',
          phone: data.therapist.phone || '',
          address: data.therapist.address || '',
          city: data.therapist.city || '',
          postal_code: data.therapist.postal_code || '',
          country: data.therapist.country || 'CH',
          bio: data.therapist.bio || '',
          website: data.therapist.website || '',
          booking_enabled: data.therapist.booking_enabled ?? true,
          auto_confirm: data.therapist.auto_confirm ?? false,
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        await loadProfile()
        alert('Profil mis à jour avec succès !')
      } else {
        alert('Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  async function handleConnectGoogleCalendar() {
    try {
      const response = await fetch('/api/calendar/connect')

      if (response.status === 401) {
        alert('❌ Session expirée. Veuillez vous reconnecter.')
        window.location.href = '/login'
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        alert(`❌ Erreur ${response.status}: ${errorData.error || 'Erreur inconnue'}`)
        return
      }

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('❌ Aucune URL de connexion reçue')
      }
    } catch (error) {
      console.error('Error connecting calendar:', error)
      alert('Erreur lors de la connexion à Google Calendar')
    }
  }

  async function handleDisconnectGoogleCalendar() {
    if (!confirm('Voulez-vous vraiment déconnecter Google Calendar ?')) {
      return
    }

    try {
      const response = await fetch('/api/calendar/disconnect')
      if (response.ok) {
        await loadProfile()
        alert('Google Calendar déconnecté avec succès')
      } else {
        alert('Erreur lors de la déconnexion')
      }
    } catch (error) {
      console.error('Error disconnecting calendar:', error)
      alert('Erreur lors de la déconnexion')
    }
  }

  async function handleShowCalendarSelector() {
    setShowCalendarModal(true)
    setLoadingCalendars(true)

    try {
      const response = await fetch('/api/calendar/list')
      if (response.ok) {
        const data = await response.json()
        setCalendars(data.calendars || [])
      } else {
        alert('Erreur lors du chargement des calendriers')
        setShowCalendarModal(false)
      }
    } catch (error) {
      console.error('Error loading calendars:', error)
      alert('Erreur lors du chargement des calendriers')
      setShowCalendarModal(false)
    } finally {
      setLoadingCalendars(false)
    }
  }

  async function handleSelectCalendar(calendarId: string) {
    try {
      const response = await fetch('/api/calendar/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarId })
      })

      if (response.ok) {
        await loadProfile()
        setShowCalendarModal(false)
        alert('Calendrier sélectionné avec succès')
      } else {
        alert('Erreur lors de la sélection du calendrier')
      }
    } catch (error) {
      console.error('Error selecting calendar:', error)
      alert('Erreur lors de la sélection')
    }
  }

  function copyBookingLink() {
    if (!therapist) return
    const bookingUrl = `${window.location.origin}/book/${therapist.id}`
    navigator.clipboard.writeText(bookingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    )
  }

  const bookingUrl = therapist ? `${typeof window !== 'undefined' ? window.location.origin : ''}/book/${therapist.id}` : ''

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Profil thérapeute
        </h1>

        {/* Booking Link Section */}
        <section className="bg-gradient-to-br from-brand-50 to-indigo-50 dark:from-brand-950 dark:to-indigo-950 rounded-xl border border-brand-200 dark:border-brand-800 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-brand-500 dark:bg-brand-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Votre lien de réservation
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Partagez ce lien avec vos clients pour qu'ils puissent réserver une séance
              </p>

              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 font-mono text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
                  {bookingUrl}
                </div>

                <button
                  type="button"
                  onClick={copyBookingLink}
                  className="flex-shrink-0 px-4 py-3 bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copié!
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copier
                    </>
                  )}
                </button>
              </div>

              <div className="mt-4 flex items-center gap-4 text-sm">
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Voir ma page de réservation
                </a>
              </div>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Informations personnelles
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Titre professionnel
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Ex: Psychothérapeute FSP"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="+41 XX XXX XX XX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Rue et numéro"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    NPA
                  </label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Site web
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="https://..."
                />
              </div>
            </div>
          </section>

          {/* Professional Bio */}
          <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Présentation professionnelle
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Biographie
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                rows={6}
                placeholder="Présentez votre parcours, vos spécialités, votre approche thérapeutique..."
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Cette description sera visible sur votre page de réservation publique
              </p>
            </div>
          </section>

          {/* Settings */}
          <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Paramètres
            </h2>

            <div className="space-y-4">
              <Toggle
                checked={formData.booking_enabled}
                onChange={(checked) => setFormData({ ...formData, booking_enabled: checked })}
                label="Réservations activées"
                description="Les clients peuvent réserver en ligne"
              />

              <Toggle
                checked={formData.auto_confirm}
                onChange={(checked) => setFormData({ ...formData, auto_confirm: checked })}
                label="Confirmation automatique"
                description="Les réservations sont confirmées sans votre intervention"
              />
            </div>
          </section>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>

        {/* Google Calendar - Outside form to prevent submission issues */}
        {therapist && (
          <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Google Calendar
            </h2>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                {therapist.google_refresh_token ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="success">Connecté</Badge>
                      {therapist.google_calendar_id && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {therapist.google_calendar_id}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Vos événements Google Calendar bloquent automatiquement les créneaux
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="neutral">Non connecté</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Connectez votre calendrier pour synchroniser vos disponibilités
                    </p>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                {therapist.google_refresh_token ? (
                  <>
                    <button
                      type="button"
                      onClick={handleShowCalendarSelector}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      Changer de calendrier
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnectGoogleCalendar}
                      className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors text-sm font-medium border border-red-300 dark:border-red-700"
                    >
                      Déconnecter
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleConnectGoogleCalendar}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white rounded-lg transition-colors text-sm font-medium cursor-pointer"
                  >
                    Connecter Google Calendar
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Calendar Selector Modal */}
        {showCalendarModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Sélectionner un calendrier
              </h3>

              {loadingCalendars ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">Chargement des calendriers...</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {calendars.map((calendar) => (
                    <button
                      key={calendar.id}
                      onClick={() => handleSelectCalendar(calendar.id!)}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                        calendar.id === therapist?.google_calendar_id
                          ? 'bg-brand-50 dark:bg-brand-950 border-brand-500 dark:border-brand-600'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {calendar.summary}
                          </div>
                          {calendar.primary && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">Principal</span>
                          )}
                        </div>
                        {calendar.id === therapist?.google_calendar_id && (
                          <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowCalendarModal(false)}
                className="mt-4 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
