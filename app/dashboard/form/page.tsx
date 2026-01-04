/**
 * Custom Form Builder Page
 * Allows therapists to create custom intake forms for bookings
 */

'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Modal, { ModalActions } from '@/components/ui/Modal'

type FormField = {
  id: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox'
  required: boolean
  options?: string[]
  placeholder?: string
}

export default function FormBuilderPage() {
  const [fields, setFields] = useState<FormField[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingField, setEditingField] = useState<FormField | null>(null)
  const [formData, setFormData] = useState({
    label: '',
    type: 'text' as FormField['type'],
    required: false,
    options: '',
    placeholder: '',
  })

  useEffect(() => {
    loadForm()
  }, [])

  async function loadForm() {
    try {
      const res = await fetch('/api/therapist')
      const data = await res.json()

      if (data.therapist?.custom_form?.fields) {
        setFields(data.therapist.custom_form.fields)
      }
    } catch (error) {
      console.error('Error loading form:', error)
    } finally {
      setLoading(false)
    }
  }

  function openAddModal() {
    setEditingField(null)
    setFormData({
      label: '',
      type: 'text',
      required: false,
      options: '',
      placeholder: '',
    })
    setIsModalOpen(true)
  }

  function openEditModal(field: FormField) {
    setEditingField(field)
    setFormData({
      label: field.label,
      type: field.type,
      required: field.required,
      options: field.options?.join('\n') || '',
      placeholder: field.placeholder || '',
    })
    setIsModalOpen(true)
  }

  async function handleSubmit() {
    const newField: FormField = {
      id: editingField?.id || `field_${Date.now()}`,
      label: formData.label,
      type: formData.type,
      required: formData.required,
      placeholder: formData.placeholder || undefined,
      options: ['select', 'radio', 'checkbox'].includes(formData.type)
        ? formData.options.split('\n').filter(o => o.trim())
        : undefined,
    }

    let updatedFields: FormField[]
    if (editingField) {
      updatedFields = fields.map(f => f.id === editingField.id ? newField : f)
    } else {
      updatedFields = [...fields, newField]
    }

    await saveForm(updatedFields)
  }

  async function deleteField(id: string) {
    if (!confirm('Supprimer ce champ ?')) return
    const updatedFields = fields.filter(f => f.id !== id)
    await saveForm(updatedFields)
  }

  async function moveField(index: number, direction: 'up' | 'down') {
    const newFields = [...fields]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= newFields.length) return

    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]]
    await saveForm(newFields)
  }

  async function saveForm(updatedFields: FormField[]) {
    setSaving(true)

    try {
      const res = await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          custom_form: { fields: updatedFields }
        }),
      })

      if (res.ok) {
        setFields(updatedFields)
        setIsModalOpen(false)
      }
    } catch (error) {
      console.error('Error saving form:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const FIELD_TYPES = [
    { value: 'text', label: 'Texte court' },
    { value: 'textarea', label: 'Texte long' },
    { value: 'select', label: 'Liste déroulante' },
    { value: 'radio', label: 'Choix unique' },
    { value: 'checkbox', label: 'Cases à cocher' },
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Formulaire de réservation
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Personnalisez les informations demandées lors de la réservation
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Ajouter un champ
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          {fields.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Aucun champ personnalisé configuré
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Les champs par défaut (nom, email, téléphone) sont toujours demandés
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                Champs par défaut : Nom, Email, Téléphone
              </div>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                >
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => moveField(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveField(index, 'down')}
                      disabled={index === fields.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {field.label}
                      </h3>
                      {field.required && (
                        <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
                          Obligatoire
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Type: {FIELD_TYPES.find(t => t.value === field.type)?.label}
                      {field.options && ` • ${field.options.length} option(s)`}
                    </div>
                    {field.placeholder && (
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Placeholder: "{field.placeholder}"
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(field)}
                      className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteField(field.id)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Field Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingField ? 'Modifier le champ' : 'Nouveau champ'}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Libellé de la question *
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Ex: Motif de la consultation"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type de champ *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as FormField['type'] })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {FIELD_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Placeholder (optionnel)
              </label>
              <input
                type="text"
                value={formData.placeholder}
                onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Ex: Décrivez brièvement..."
              />
            </div>

            {['select', 'radio', 'checkbox'].includes(formData.type) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Options (une par ligne)
                </label>
                <textarea
                  value={formData.options}
                  onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={4}
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="required"
                checked={formData.required}
                onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
              />
              <label htmlFor="required" className="text-sm text-gray-700 dark:text-gray-300">
                Champ obligatoire
              </label>
            </div>

            <ModalActions
              onCancel={() => setIsModalOpen(false)}
              onConfirm={handleSubmit}
              isLoading={saving}
              confirmText={editingField ? 'Enregistrer' : 'Ajouter'}
            />
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
