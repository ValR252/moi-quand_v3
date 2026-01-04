/**
 * Availability Management Page
 * Manages weekly schedules, holidays, and notice period
 */

'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Modal, { ModalActions } from '@/components/ui/Modal'
import Toggle from '@/components/ui/Toggle'
import { Schedule, Holiday } from '@/lib/supabase'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

export default function AvailabilityPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [noticeHours, setNoticeHours] = useState(2)
  const [loading, setLoading] = useState(true)
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false)
  const [holidayForm, setHolidayForm] = useState({
    start_date: '',
    end_date: '',
    reason: '',
  })
  const [saving, setSaving] = useState(false)

  // Day editor state
  const [editingDay, setEditingDay] = useState<number | null>(null)
  const [dayForm, setDayForm] = useState({
    start_time: '09:00',
    end_time: '17:00',
    is_available: true,
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [schedulesRes, holidaysRes] = await Promise.all([
        fetch('/api/schedules'),
        fetch('/api/holidays'),
      ])

      const schedulesData = await schedulesRes.json()
      const holidaysData = await holidaysRes.json()

      setSchedules(schedulesData.schedules || [])
      setHolidays(holidaysData.holidays || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  function openDayEditor(day: number) {
    const existing = schedules.find((s) => s.day_of_week === day)

    if (existing) {
      setDayForm({
        start_time: existing.start_time,
        end_time: existing.end_time,
        is_available: existing.is_available,
      })
    } else {
      setDayForm({
        start_time: '09:00',
        end_time: '17:00',
        is_available: false,
      })
    }

    setEditingDay(day)
  }

  async function saveDaySchedule() {
    if (editingDay === null) return

    setSaving(true)

    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_of_week: editingDay,
          ...dayForm,
        }),
      })

      if (res.ok) {
        await loadData()
        setEditingDay(null)
      }
    } catch (error) {
      console.error('Error saving schedule:', error)
    } finally {
      setSaving(false)
    }
  }

  async function saveHoliday() {
    setSaving(true)

    try {
      const res = await fetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(holidayForm),
      })

      if (res.ok) {
        await loadData()
        setIsHolidayModalOpen(false)
        setHolidayForm({ start_date: '', end_date: '', reason: '' })
      }
    } catch (error) {
      console.error('Error saving holiday:', error)
    } finally {
      setSaving(false)
    }
  }

  async function deleteHoliday(id: string) {
    if (!confirm('Supprimer cette période de congé ?')) return

    try {
      const res = await fetch(`/api/holidays/${id}`, { method: 'DELETE' })
      if (res.ok) {
        await loadData()
      }
    } catch (error) {
      console.error('Error deleting holiday:', error)
    }
  }

  async function saveNoticeHours() {
    try {
      await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notice_hours: noticeHours }),
      })
    } catch (error) {
      console.error('Error saving notice hours:', error)
    }
  }

  function getScheduleForDay(day: number) {
    return schedules.find((s) => s.day_of_week === day)
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Disponibilités
        </h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Weekly Schedule */}
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Horaires hebdomadaires
              </h2>

              <div className="space-y-2">
                {DAYS.map((dayName, dayIndex) => {
                  const schedule = getScheduleForDay(dayIndex)
                  const isAvailable = schedule?.is_available || false

                  return (
                    <div
                      key={dayIndex}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <span className="w-24 font-medium text-gray-900 dark:text-gray-100">
                          {dayName}
                        </span>

                        {isAvailable && schedule ? (
                          <span className="text-gray-600 dark:text-gray-400">
                            {schedule.start_time} - {schedule.end_time}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 italic">
                            Fermé
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => openDayEditor(dayIndex)}
                        className="px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors"
                      >
                        Modifier
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Notice Period */}
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Délai de préavis
              </h2>

              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={noticeHours}
                  onChange={(e) => setNoticeHours(parseInt(e.target.value) || 0)}
                  className="w-24 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  min="0"
                />
                <span className="text-gray-600 dark:text-gray-400">heures minimum</span>
                <button
                  onClick={saveNoticeHours}
                  className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Enregistrer
                </button>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Les clients doivent réserver au moins {noticeHours}h à l'avance
              </p>
            </section>

            {/* Holidays */}
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Congés et vacances
                </h2>

                <button
                  onClick={() => setIsHolidayModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                >
                  + Ajouter
                </button>
              </div>

              {holidays.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Aucune période de congé configurée
                </p>
              ) : (
                <div className="space-y-2">
                  {holidays.map((holiday) => (
                    <div
                      key={holiday.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {format(new Date(holiday.start_date), 'dd MMM yyyy', { locale: fr })}
                          {' → '}
                          {format(new Date(holiday.end_date), 'dd MMM yyyy', { locale: fr })}
                        </div>
                        {holiday.reason && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {holiday.reason}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => deleteHoliday(holiday.id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Day Schedule Editor Modal */}
        <Modal
          isOpen={editingDay !== null}
          onClose={() => setEditingDay(null)}
          title={editingDay !== null ? `Horaires du ${DAYS[editingDay]}` : ''}
        >
          <div className="space-y-4">
            <Toggle
              checked={dayForm.is_available}
              onChange={(checked) => setDayForm({ ...dayForm, is_available: checked })}
              label="Ouvert ce jour"
            />

            {dayForm.is_available && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Début
                  </label>
                  <input
                    type="time"
                    value={dayForm.start_time}
                    onChange={(e) => setDayForm({ ...dayForm, start_time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fin
                  </label>
                  <input
                    type="time"
                    value={dayForm.end_time}
                    onChange={(e) => setDayForm({ ...dayForm, end_time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            )}

            <ModalActions
              onCancel={() => setEditingDay(null)}
              onConfirm={saveDaySchedule}
              isLoading={saving}
            />
          </div>
        </Modal>

        {/* Holiday Modal */}
        <Modal
          isOpen={isHolidayModalOpen}
          onClose={() => setIsHolidayModalOpen(false)}
          title="Nouvelle période de congé"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date de début
              </label>
              <input
                type="date"
                value={holidayForm.start_date}
                onChange={(e) => setHolidayForm({ ...holidayForm, start_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date de fin
              </label>
              <input
                type="date"
                value={holidayForm.end_date}
                onChange={(e) => setHolidayForm({ ...holidayForm, end_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Raison (optionnel)
              </label>
              <input
                type="text"
                value={holidayForm.reason}
                onChange={(e) => setHolidayForm({ ...holidayForm, reason: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Ex: Vacances d'été"
              />
            </div>

            <ModalActions
              onCancel={() => setIsHolidayModalOpen(false)}
              onConfirm={saveHoliday}
              isLoading={saving}
              confirmText="Ajouter"
            />
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
