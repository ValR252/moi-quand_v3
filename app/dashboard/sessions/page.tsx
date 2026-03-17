/**
 * Sessions Management Page
 * Frontend Developer: Complete CRUD interface for session types
 */

'use client'

import { use, useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Modal, { ModalActions } from '@/components/ui/Modal'
import Toggle from '@/components/ui/Toggle'
import Badge from '@/components/ui/Badge'
import { Session } from '@/lib/supabase'

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    duration: '60',
    price: '',
    description: '',
    color: '#6366f1',
    max_per_day: '',
    is_online: false,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSessions()
  }, [])

  async function loadSessions() {
    try {
      const res = await fetch('/api/sessions')
      const data = await res.json()
      setSessions(data.sessions || [])
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingSession(null)
    setFormData({
      name: '',
      label: '',
      duration: '60',
      price: '',
      description: '',
      color: '#6366f1',
      max_per_day: '',
      is_online: false,
    })
    setIsModalOpen(true)
  }

  function openEditModal(session: Session) {
    setEditingSession(session)
    setFormData({
      name: session.name || session.label,
      label: session.label,
      duration: session.duration.toString(),
      price: session.price.toString(),
      description: session.description || '',
      color: session.color || '#6366f1',
      max_per_day: session.max_per_day?.toString() || '',
      is_online: session.is_online || false,
    })
    setIsModalOpen(true)
  }

  async function handleSubmit() {
    setSaving(true)

    try {
      const url = editingSession ? `/api/sessions/${editingSession.id}` : '/api/sessions'
      const method = editingSession ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          label: formData.label || formData.name,
          duration: parseInt(formData.duration),
          price: parseFloat(formData.price),
          description: formData.description || null,
          color: formData.color,
          max_per_day: formData.max_per_day ? parseInt(formData.max_per_day) : null,
          is_online: formData.is_online,
        }),
      })

      if (res.ok) {
        await loadSessions()
        setIsModalOpen(false)
      } else {
        alert('Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Error saving session:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleEnabled(session: Session) {
    try {
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !session.enabled }),
      })

      if (res.ok) {
        await loadSessions()
      }
    } catch (error) {
      console.error('Error toggling session:', error)
    }
  }

  async function handleDelete(session: Session) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${session.name || session.label}" ?`)) {
      return
    }

    try {
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        await loadSessions()
      } else {
        alert('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting session:', error)
      alert('Erreur lors de la suppression')
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Types de séances
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Gérez les différents types de consultations que vous proposez
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="
              px-4 py-2 bg-indigo-600 text-white rounded-lg
              hover:bg-indigo-700 transition-colors
              font-medium flex items-center gap-2
            "
          >
            <span className="text-xl">+</span>
            Nouvelle séance
          </button>
        </div>

        {/* Sessions list */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">
              Aucune séance configurée. Créez votre première séance !
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="
                  bg-white dark:bg-gray-800
                  border border-gray-200 dark:border-gray-700
                  rounded-xl p-6
                  hover:shadow-lg transition-shadow
                "
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {/* Color indicator */}
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: session.color }}
                      />

                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {session.name || session.label}
                      </h3>

                      {!session.enabled && (
                        <Badge variant="neutral" size="sm">Désactivé</Badge>
                      )}
                      
                      {session.is_online && (
                        <Badge variant="success" size="sm">📹 En ligne</Badge>
                      )}
                    </div>

                    {session.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {session.description}
                      </p>
                    )}

                    <div className="flex items-center gap-6 mt-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">⏱️</span>
                        <span className="text-gray-900 dark:text-gray-100">
                          {session.duration} min
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">💰</span>
                        <span className="text-gray-900 dark:text-gray-100">
                          {session.price} CHF
                        </span>
                      </div>

                      {session.max_per_day && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 dark:text-gray-400">📊</span>
                          <span className="text-gray-900 dark:text-gray-100">
                            Max {session.max_per_day}/jour
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    <Toggle
                      checked={session.enabled}
                      onChange={() => handleToggleEnabled(session)}
                    />

                    <button
                      onClick={() => openEditModal(session)}
                      className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      title="Modifier"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    <button
                      onClick={() => handleDelete(session)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Supprimer"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingSession ? 'Modifier la séance' : 'Nouvelle séance'}
          size="lg"
        >
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom de la séance *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Ex: Consultation initiale"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Durée (minutes) *
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  min="15"
                  step="15"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prix (CHF) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                rows={3}
                placeholder="Description visible par les clients"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Couleur
                </label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max par jour (optionnel)
                </label>
                <input
                  type="number"
                  value={formData.max_per_day}
                  onChange={(e) => setFormData({ ...formData, max_per_day: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  min="1"
                  placeholder="Illimité"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Toggle
                checked={formData.is_online}
                onChange={(checked) => setFormData({ ...formData, is_online: checked })}
                label="Consultation en ligne"
                description="Cette séance se déroule en visioconférence (Zoom)"
              />
            </div>

            <ModalActions
              onCancel={() => setIsModalOpen(false)}
              onConfirm={handleSubmit}
              cancelText="Annuler"
              confirmText={editingSession ? 'Mettre à jour' : 'Créer'}
              isLoading={saving}
            />
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
