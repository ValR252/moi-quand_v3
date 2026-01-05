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
      const response = await fetch('/api/calendar/disconnect', {
        method: 'POST'
      })
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
          <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10zm0-12H5V5h14v2z"/>
                    <path d="M7 11h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Synchronisation Google Calendar
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Bloquez automatiquement vos créneaux occupés
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {therapist.google_refresh_token ? (
                <div className="space-y-4">
                  {/* Status Card */}
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-500 rounded-lg">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-green-900 dark:text-green-100">
                            Calendrier connecté
                          </h3>
                        </div>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Vos événements bloquent automatiquement les créneaux de réservation
                        </p>
                        {therapist.google_calendar_id && therapist.google_calendar_id !== 'primary' && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-mono">
                            Calendrier: {therapist.google_calendar_id}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={handleShowCalendarSelector}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 dark:from-brand-500 dark:to-indigo-500 dark:hover:from-brand-600 dark:hover:to-indigo-600 text-white rounded-xl transition-all font-medium shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Changer de calendrier</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnectGoogleCalendar}
                      className="px-4 py-3 bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all font-medium border-2 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Déconnecter</span>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Not Connected State */}
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/50 dark:to-slate-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-400 dark:bg-gray-600 rounded-lg">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          Calendrier non connecté
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Connectez votre Google Calendar pour bloquer automatiquement les créneaux déjà réservés et éviter les doubles réservations
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Connect Button */}
                  <button
                    type="button"
                    onClick={handleConnectGoogleCalendar}
                    className="w-full px-6 py-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 dark:from-brand-500 dark:to-indigo-500 dark:hover:from-brand-600 dark:hover:to-indigo-600 text-white rounded-xl transition-all font-semibold shadow-xl shadow-brand-500/30 hover:shadow-2xl hover:shadow-brand-500/40 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor" fillOpacity="0.9"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" fillOpacity="0.8"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor" fillOpacity="0.7"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor" fillOpacity="0.6"/>
                      </svg>
                      <span>Connecter avec Google Calendar</span>
                    </div>
                  </button>
                </div>
              )}
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
