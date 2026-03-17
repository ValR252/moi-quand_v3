/**
 * Profile Management Page
 * Complete therapist profile editor with photo, bio, contact info, and settings
 * Features: Booking limit + PayPal configuration
 */

'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Toggle from '@/components/ui/Toggle'
import { Therapist } from '@/lib/supabase'
import TimezoneSelector from '@/components/TimezoneSelector'

export default function ProfilePage() {
  const [therapist, setTherapist] = useState<Therapist | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [calendars, setCalendars] = useState<Array<{ id: string; summary: string; primary?: boolean }>>([])
  const [loadingCalendars, setLoadingCalendars] = useState(false)
  const [showPaypalSecret, setShowPaypalSecret] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    title: '',
    slug: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'CH',
    bio: '',
    website: '',
    booking_enabled: true,
    auto_confirm: false,
    timezone: 'Europe/Zurich',
    // Feature 1: Booking limit
    booking_limit_months: 2,
    // Feature 2: PayPal
    paypal_enabled: false,
    paypal_client_id: '',
    paypal_client_secret: '',
    paypal_webhook_id: '',
    paypal_environment: 'sandbox' as 'sandbox' | 'production',
  })

  useEffect(() => {
    loadProfile()

    // Check for calendar success and reload if present
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('calendar_success') === 'true') {
      console.log('Calendar connected successfully! Reloading profile...')
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
          slug: data.therapist.slug || '',
          phone: data.therapist.phone || '',
          address: data.therapist.address || '',
          city: data.therapist.city || '',
          postal_code: data.therapist.postal_code || '',
          country: data.therapist.country || 'CH',
          bio: data.therapist.bio || '',
          website: data.therapist.website || '',
          booking_enabled: data.therapist.booking_enabled ?? true,
          auto_confirm: data.therapist.auto_confirm ?? false,
          timezone: data.therapist.timezone || 'Europe/Zurich',
          // Feature 1
          booking_limit_months: data.therapist.booking_limit_months ?? 2,
          // Feature 2
          paypal_enabled: data.therapist.paypal_enabled ?? false,
          paypal_client_id: data.therapist.paypal_client_id || '',
          paypal_client_secret: data.therapist.paypal_client_secret || '',
          paypal_webhook_id: data.therapist.paypal_webhook_id || '',
          paypal_environment: data.therapist.paypal_environment || 'sandbox',
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
    const path = therapist.slug || `book/${therapist.id}`
    const bookingUrl = `${window.location.origin}/${path}`
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

  const path = therapist?.slug || `book/${therapist?.id}`
  const bookingUrl = therapist ? `${typeof window !== 'undefined' ? window.location.origin : ''}/${path}` : ''

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
                  URL personnalisée *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">moi-quand.com/</span>
                  <input
                    type="text"
                    value={formData.slug || ''}
                    onChange={(e) => {
                      const slug = e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^a-z0-9-]/g, '')
                      setFormData({ ...formData, slug })
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono"
                    placeholder="prenom-nom"
                    pattern="[a-z0-9-]+"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Seules les lettres minuscules, chiffres et tirets sont autorisés
                </p>
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

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <TimezoneSelector
                  value={formData.timezone}
                  onChange={(timezone) => setFormData({ ...formData, timezone })}
                  label="Fuseau horaire"
                  showFlag={true}
                />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Tous vos horaires de disponibilité et rendez-vous seront affichés dans ce fuseau horaire.
                </p>
              </div>
            </div>
          </section>

          {/* FEATURE 1: Booking Limit Settings */}
          <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Limite de réservation
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Combien de temps à l'avance les clients peuvent-ils réserver ?
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="12"
                    value={formData.booking_limit_months}
                    onChange={(e) => setFormData({ ...formData, booking_limit_months: parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600"
                  />
                  <span className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 min-w-[80px]">
                    {formData.booking_limit_months} mois
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Les clients ne pourront pas réserver au-delà de {formData.booking_limit_months} mois à l'avance.
                </p>
              </div>
            </div>
          </section>

          {/* FEATURE 2: PayPal Configuration */}
          <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .757-.629h6.69c2.838 0 5.098.835 5.936 2.45.43.822.583 1.69.448 2.592-.185 1.238-.805 2.34-1.79 3.18-1.277 1.09-3.006 1.68-5.028 1.68h-.002c-.396 0-.655.26-.755.515l-.002.006-.88 5.82a.418.418 0 0 1-.414.345H7.076z"/>
                <path d="M20.067 8.94c-.01.1-.024.2-.043.303-.31 1.87-1.36 3.16-2.96 3.7-.38.13-.79.2-1.22.2h-3.14l-.15.94-.42 2.74-.13.84a.314.314 0 0 0 .31.37h2.8c.23 0 .45-.05.65-.14.32-.14.53-.4.6-.73l.03-.15.53-3.4.03-.16.08-.52.04-.26a.314.314 0 0 0-.31-.37h-1.44c-.17 0-.31-.14-.28-.31l.04-.26.08-.52.15-.94h1.45c.57 0 1.1-.08 1.58-.24 1.2-.4 2.03-1.3 2.35-2.6.1-.4.14-.8.1-1.2z"/>
              </svg>
              Paiement PayPal
            </h2>

            <div className="space-y-6">
              <Toggle
                checked={formData.paypal_enabled}
                onChange={(checked) => setFormData({ ...formData, paypal_enabled: checked })}
                label="Activer les paiements PayPal"
                description="Permettre aux clients de payer directement en ligne via PayPal"
              />

              {formData.paypal_enabled && (
                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {/* Environment Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Environnement
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="paypal_environment"
                          value="sandbox"
                          checked={formData.paypal_environment === 'sandbox'}
                          onChange={(e) => setFormData({ ...formData, paypal_environment: e.target.value as 'sandbox' | 'production' })}
                          className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Sandbox (test)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="paypal_environment"
                          value="production"
                          checked={formData.paypal_environment === 'production'}
                          onChange={(e) => setFormData({ ...formData, paypal_environment: e.target.value as 'sandbox' | 'production' })}
                          className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Production (live)</span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Utilisez Sandbox pour tester, passez en Production quand vous êtes prêt à accepter de vrais paiements.
                    </p>
                  </div>

                  {/* Client ID */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Client ID
                    </label>
                    <input
                      type="text"
                      value={formData.paypal_client_id}
                      onChange={(e) => setFormData({ ...formData, paypal_client_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm"
                      placeholder="Votre Client ID PayPal"
                    />
                  </div>

                  {/* Client Secret */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Client Secret
                    </label>
                    <div className="relative">
                      <input
                        type={showPaypalSecret ? "text" : "password"}
                        value={formData.paypal_client_secret}
                        onChange={(e) => setFormData({ ...formData, paypal_client_secret: e.target.value })}
                        className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm"
                        placeholder="Votre Client Secret PayPal"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPaypalSecret(!showPaypalSecret)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {showPaypalSecret ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M12 12l-2.122-2.122m2.122 2.122L12 12m0 0l2.122-2.122M12 12l-2.122 2.122" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Webhook ID */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Webhook ID (optionnel)
                    </label>
                    <input
                      type="text"
                      value={formData.paypal_webhook_id}
                      onChange={(e) => setFormData({ ...formData, paypal_webhook_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm"
                      placeholder="Votre Webhook ID PayPal"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Nécessaire pour recevoir les notifications de paiement automatiques.
                    </p>
                  </div>

                  {/* Instructions */}
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Comment obtenir vos credentials PayPal :
                    </h4>
                    <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
                      <li>Connectez-vous à <a href="https://developer.paypal.com" target="_blank" rel="noopener noreferrer" className="underline">developer.paypal.com</a></li>
                      <li>Allez dans "Apps & Credentials"</li>
                      <li>Créez une nouvelle app ou utilisez une existante</li>
                      <li>Copiez le Client ID et le Secret</li>
                      <li>Pour le webhook, allez dans "Webhooks" et créez un webhook pointant vers :<br/>
                        <code className="text-xs bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">{typeof window !== 'undefined' ? window.location.origin : ''}/api/paypal/webhook</code>
                      </li>
                    </ol>
                  </div>
                </div>
              )}
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

        {/* Google Calendar - Outside form */}
        {therapist && (
          <section className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10zm0-12H5V5h14v2z"/>
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
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={handleShowCalendarSelector}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white rounded-xl transition-all font-medium"
                    >
                      Changer de calendrier
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnectGoogleCalendar}
                      className="px-4 py-3 bg-white text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium border-2 border-red-200"
                    >
                      Déconnecter
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Connectez votre Google Calendar pour bloquer automatiquement les créneaux déjà réservés
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleConnectGoogleCalendar}
                    className="w-full px-6 py-4 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl transition-all font-semibold"
                  >
                    Connecter avec Google Calendar
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
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {calendars.map((calendar) => (
                    <button
                      key={calendar.id}
                      onClick={() => handleSelectCalendar(calendar.id!)}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                        calendar.id === therapist?.google_calendar_id
                          ? 'bg-brand-50 border-brand-500'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium">{calendar.summary}</div>
                      {calendar.primary && (
                        <span className="text-xs text-gray-500">Principal</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowCalendarModal(false)}
                className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
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
