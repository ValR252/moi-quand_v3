/**
 * Email Templates Management Page
 * Allows therapists to customize automated email messages
 */

'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Modal, { ModalActions } from '@/components/ui/Modal'

type EmailTemplate = {
  subject: string
  body: string
}

type EmailTemplates = {
  confirmation?: EmailTemplate
  reminder?: EmailTemplate
  cancellation?: EmailTemplate
}

export default function MessagesPage() {
  const [templates, setTemplates] = useState<EmailTemplates>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<keyof EmailTemplates | null>(null)
  const [formData, setFormData] = useState({
    subject: '',
    body: '',
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    try {
      const res = await fetch('/api/therapist')
      const data = await res.json()

      if (data.therapist?.email_templates) {
        setTemplates(data.therapist.email_templates)
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  function openEditModal(type: keyof EmailTemplates) {
    setEditingTemplate(type)
    const template = templates[type] || getDefaultTemplate(type)
    setFormData({
      subject: template.subject,
      body: template.body,
    })
  }

  function getDefaultTemplate(type: keyof EmailTemplates): EmailTemplate {
    const defaults = {
      confirmation: {
        subject: 'Confirmation de votre rendez-vous',
        body: `Bonjour {{client_name}},

Votre rendez-vous a bien été confirmé :

📅 Date : {{date}}
🕐 Heure : {{time}}
⏱️ Durée : {{duration}} minutes
💰 Tarif : {{price}}€

{{therapist_name}}
{{therapist_phone}}`,
      },
      reminder: {
        subject: 'Rappel : Rendez-vous demain',
        body: `Bonjour {{client_name}},

Nous vous rappelons votre rendez-vous prévu demain :

📅 Date : {{date}}
🕐 Heure : {{time}}

À bientôt,
{{therapist_name}}`,
      },
      cancellation: {
        subject: 'Annulation de votre rendez-vous',
        body: `Bonjour {{client_name}},

Votre rendez-vous du {{date}} à {{time}} a été annulé.

Si vous souhaitez reprendre rendez-vous, n'hésitez pas à nous contacter.

{{therapist_name}}
{{therapist_phone}}`,
      },
    }

    return defaults[type]
  }

  async function handleSubmit() {
    if (!editingTemplate) return

    setSaving(true)

    try {
      const updatedTemplates = {
        ...templates,
        [editingTemplate]: {
          subject: formData.subject,
          body: formData.body,
        },
      }

      const res = await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_templates: updatedTemplates
        }),
      })

      if (res.ok) {
        setTemplates(updatedTemplates)
        setEditingTemplate(null)
      }
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const TEMPLATE_TYPES = [
    {
      key: 'confirmation' as const,
      title: 'Email de confirmation',
      description: 'Envoyé automatiquement après une réservation',
      icon: '✅',
    },
    {
      key: 'reminder' as const,
      title: 'Email de rappel',
      description: 'Envoyé 24h avant le rendez-vous',
      icon: '⏰',
    },
    {
      key: 'cancellation' as const,
      title: 'Email d\'annulation',
      description: 'Envoyé en cas d\'annulation',
      icon: '❌',
    },
  ]

  const VARIABLES = [
    { var: '{{client_name}}', desc: 'Nom du client' },
    { var: '{{client_email}}', desc: 'Email du client' },
    { var: '{{client_phone}}', desc: 'Téléphone du client' },
    { var: '{{date}}', desc: 'Date du rendez-vous' },
    { var: '{{time}}', desc: 'Heure du rendez-vous' },
    { var: '{{duration}}', desc: 'Durée en minutes' },
    { var: '{{price}}', desc: 'Prix de la séance' },
    { var: '{{session_name}}', desc: 'Type de séance' },
    { var: '{{therapist_name}}', desc: 'Votre nom' },
    { var: '{{therapist_phone}}', desc: 'Votre téléphone' },
    { var: '{{therapist_email}}', desc: 'Votre email' },
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Messages automatiques
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Personnalisez les emails envoyés automatiquement à vos clients
          </p>
        </div>

        <div className="space-y-4">
          {TEMPLATE_TYPES.map((type) => {
            const template = templates[type.key] || getDefaultTemplate(type.key)
            const isCustomized = !!templates[type.key]

            return (
              <div
                key={type.key}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{type.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {type.title}
                        </h3>
                        {isCustomized && (
                          <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded">
                            Personnalisé
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {type.description}
                      </p>

                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Objet : {template.subject}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                          {template.body.substring(0, 200)}
                          {template.body.length > 200 && '...'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => openEditModal(type.key)}
                    className="px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors"
                  >
                    Modifier
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Edit Template Modal */}
        {editingTemplate && (
          <Modal
            isOpen={true}
            onClose={() => setEditingTemplate(null)}
            title={TEMPLATE_TYPES.find(t => t.key === editingTemplate)?.title || ''}
            size="lg"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Objet de l'email
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contenu de l'email
                </label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm"
                  rows={12}
                />
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-950 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Variables disponibles
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {VARIABLES.map((v) => (
                    <div key={v.var} className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-indigo-600 dark:text-indigo-400">
                        {v.var}
                      </code>
                      <span className="text-gray-600 dark:text-gray-400">{v.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <ModalActions
                onCancel={() => setEditingTemplate(null)}
                onConfirm={handleSubmit}
                isLoading={saving}
                confirmText="Enregistrer"
              />
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  )
}
