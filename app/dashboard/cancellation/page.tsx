/**
 * Cancellation Policy Configuration Page
 * Allows therapists to configure their cancellation and transfer policies
 */

'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Toggle from '@/components/ui/Toggle'
import { Therapist } from '@/lib/supabase'

export default function CancellationPage() {
  const [therapist, setTherapist] = useState<Therapist | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    cancellation_enabled: true,
    cancellation_policy: 'both' as 'refund' | 'transfer' | 'both',
    cancellation_deadline_hours: 24,
    refund_automatic: false,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const res = await fetch('/api/therapist')
      const data = await res.json()

      if (data.therapist) {
        setTherapist(data.therapist)
        setFormData({
          cancellation_enabled: data.therapist.cancellation_enabled ?? true,
          cancellation_policy: data.therapist.cancellation_policy || 'both',
          cancellation_deadline_hours: data.therapist.cancellation_deadline_hours || 24,
          refund_automatic: data.therapist.refund_automatic ?? false,
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      setMessage({ type: 'error', text: 'Erreur lors du chargement des paramètres' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/therapist/cancellation-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Paramètres enregistrés avec succès !' })
        // Reload settings to ensure sync
        await loadSettings()
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Erreur lors de la sauvegarde' })
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Chargement...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Politique d'Annulation
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Configurez comment vos patients peuvent annuler ou modifier leurs rendez-vous
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Enable/Disable Cancellation */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <label className="text-lg font-semibold text-gray-900 dark:text-white">
                  Autoriser les annulations
                </label>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Permettre aux patients d'annuler ou de modifier leurs rendez-vous
                </p>
              </div>
              <Toggle
                enabled={formData.cancellation_enabled}
                onChange={(enabled) => setFormData({ ...formData, cancellation_enabled: enabled })}
              />
            </div>
          </div>

          {/* Cancellation Options - Only shown if enabled */}
          {formData.cancellation_enabled && (
            <>
              {/* Policy Type */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Options disponibles pour le patient
                </h3>

                <div className="space-y-3">
                  {/* Refund Option */}
                  <label className="flex items-start p-4 rounded-lg border-2 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    style={{
                      borderColor: formData.cancellation_policy === 'refund' || formData.cancellation_policy === 'both'
                        ? 'rgb(99, 102, 241)'
                        : 'rgb(229, 231, 235)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.cancellation_policy === 'refund' || formData.cancellation_policy === 'both'}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            cancellation_policy: formData.cancellation_policy === 'transfer' ? 'both' : 'refund'
                          })
                        } else {
                          setFormData({
                            ...formData,
                            cancellation_policy: 'transfer'
                          })
                        }
                      }}
                      className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Annulation avec remboursement
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Le patient peut annuler et être remboursé
                      </p>
                    </div>
                  </label>

                  {/* Transfer Option */}
                  <label className="flex items-start p-4 rounded-lg border-2 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    style={{
                      borderColor: formData.cancellation_policy === 'transfer' || formData.cancellation_policy === 'both'
                        ? 'rgb(99, 102, 241)'
                        : 'rgb(229, 231, 235)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.cancellation_policy === 'transfer' || formData.cancellation_policy === 'both'}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            cancellation_policy: formData.cancellation_policy === 'refund' ? 'both' : 'transfer'
                          })
                        } else {
                          setFormData({
                            ...formData,
                            cancellation_policy: 'refund'
                          })
                        }
                      }}
                      className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Transfert vers un autre créneau
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Le patient peut déplacer son rendez-vous gratuitement
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Deadline Hours */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <label className="block">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    Délai minimum
                  </span>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Nombre d'heures minimum avant le rendez-vous pour annuler ou modifier
                  </p>

                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min="1"
                      max="168"
                      value={formData.cancellation_deadline_hours}
                      onChange={(e) => setFormData({
                        ...formData,
                        cancellation_deadline_hours: parseInt(e.target.value) || 24
                      })}
                      className="w-24 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <span className="text-gray-600 dark:text-gray-400">heures avant le rendez-vous</span>
                  </div>

                  <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                    Suggestions : 24h (1 jour), 48h (2 jours), 72h (3 jours)
                  </div>
                </label>
              </div>

              {/* Refund Settings - Only shown if refund is enabled */}
              {(formData.cancellation_policy === 'refund' || formData.cancellation_policy === 'both') && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Gestion des remboursements
                  </h3>

                  <div className="space-y-3">
                    {/* Manual Refund */}
                    <label className="flex items-start p-4 rounded-lg border-2 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      style={{
                        borderColor: !formData.refund_automatic
                          ? 'rgb(99, 102, 241)'
                          : 'rgb(229, 231, 235)'
                      }}
                    >
                      <input
                        type="radio"
                        checked={!formData.refund_automatic}
                        onChange={() => setFormData({ ...formData, refund_automatic: false })}
                        className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Manuel (recommandé)
                        </span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Vous gérez vous-même les remboursements (virement, espèces, etc.)
                        </p>
                      </div>
                    </label>

                    {/* Automatic Refund */}
                    <label className="flex items-start p-4 rounded-lg border-2 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      style={{
                        borderColor: formData.refund_automatic
                          ? 'rgb(99, 102, 241)'
                          : 'rgb(229, 231, 235)'
                      }}
                    >
                      <input
                        type="radio"
                        checked={formData.refund_automatic}
                        onChange={() => setFormData({ ...formData, refund_automatic: true })}
                        className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Automatique via Stripe
                        </span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Remboursement automatique sur la carte bancaire (nécessite Stripe configuré)
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Message */}
          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>

        {/* Preview Section */}
        <div className="mt-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
          <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-300 mb-3">
            Aperçu de votre politique
          </h3>

          {formData.cancellation_enabled ? (
            <div className="text-sm text-indigo-800 dark:text-indigo-200 space-y-2">
              <p>
                ✓ Les patients peuvent{' '}
                {formData.cancellation_policy === 'both'
                  ? 'annuler avec remboursement ou transférer leur rendez-vous'
                  : formData.cancellation_policy === 'refund'
                  ? 'annuler avec remboursement'
                  : 'transférer leur rendez-vous vers un autre créneau'}
              </p>
              <p>
                ⏰ Délai minimum : {formData.cancellation_deadline_hours} heures avant le rendez-vous
              </p>
              {(formData.cancellation_policy === 'refund' || formData.cancellation_policy === 'both') && (
                <p>
                  💰 Remboursement : {formData.refund_automatic ? 'Automatique via Stripe' : 'Manuel'}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-indigo-800 dark:text-indigo-200">
              ✕ Les annulations sont désactivées. Les patients devront vous contacter directement.
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
