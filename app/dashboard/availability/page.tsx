/**
 * Availability Management Page
 * Manages weekly schedules with multiple time slots per day, holidays, and notice period
 */

'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Modal, { ModalActions } from '@/components/ui/Modal'
import { Schedule, Holiday } from '@/lib/supabase'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

export default function AvailabilityPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [noticeHours, setNoticeHours] = useState(2)
  const [bookingLimitMonths, setBookingLimitMonths] = useState(2)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Day editor state
  const [editingDay, setEditingDay] = useState<number | null>(null)
  const [newSlot, setNewSlot] = useState({
    start_time: '09:00',
    end_time: '17:00',
  })

  // Holiday modal state
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false)
  const [holidayForm, setHolidayForm] = useState({
    start_date: '',
    end_date: '',
    reason: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [schedulesRes, holidaysRes, therapistRes] = await Promise.all([
        fetch('/api/schedules'),
        fetch('/api/holidays'),
        fetch('/api/therapist'),
      ])

      const schedulesData = await schedulesRes.json()
      const holidaysData = await holidaysRes.json()
      const therapistData = await therapistRes.json()

      setSchedules(schedulesData.schedules || [])
      setHolidays(holidaysData.holidays || [])
      
      if (therapistData.therapist) {
        setNoticeHours(therapistData.therapist.notice_hours ?? 2)
        setBookingLimitMonths(therapistData.therapist.booking_limit_months ?? 2)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  function getDaySchedules(day: number): Schedule[] {
    return schedules
      .filter((s) => s.day_of_week === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }

  async function addTimeSlot() {
    if (editingDay === null) return

    setSaving(true)

    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_of_week: editingDay,
          start_time: newSlot.start_time,
          end_time: newSlot.end_time,
        }),
      })

      if (res.ok) {
        await loadData()
        setNewSlot({ start_time: '09:00', end_time: '17:00' })
      }
    } catch (error) {
      console.error('Error adding time slot:', error)
    } finally {
      setSaving(false)
    }
  }

  async function deleteTimeSlot(id: string) {
    if (!confirm('Supprimer ce créneau ?')) return

    try {
      const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' })
      if (res.ok) {
        await loadData()
      }
    } catch (error) {
      console.error('Error deleting time slot:', error)
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
      alert('Délai de préavis enregistré')
    } catch (error) {
      console.error('Error saving notice hours:', error)
    }
  }

  async function saveBookingLimit() {
    try {
      await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_limit_months: bookingLimitMonths }),
      })
      alert('Limite de réservation enregistrée')
    } catch (error) {
      console.error('Error saving booking limit:', error)
    }
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

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Disponibilités
        </h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Weekly Schedule */}
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Horaires hebdomadaires
              </h2>

              <div className="space-y-3">
                {DAYS.map((dayName, dayIndex) => {
                  const daySchedules = getDaySchedules(dayIndex)

                  return (
                    <div
                      key={dayIndex}
                      className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="w-32 font-medium text-gray-900 dark:text-gray-100">
                        {dayName}
                      </div>

                      <div className="flex-1">
                        {daySchedules.length === 0 ? (
                          <span className="text-gray-500 dark:text-gray-400">Fermé</span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {daySchedules.map((schedule) => (
                              <div
                                key={schedule.id}
                                className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm"
                              >
                                <span>
                                  {schedule.start_time} - {schedule.end_time}
                                </span>
                                <button
                                  onClick={() => deleteTimeSlot(schedule.id)}
                                  className="text-indigo-400 hover:text-red-600 dark:hover:text-red-400"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setEditingDay(dayIndex)}
                        className="px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors whitespace-nowrap"
                      >
                        + Ajouter
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

            {/* Booking Limit */}
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Limite de réservation
              </h2>

              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={bookingLimitMonths}
                  onChange={(e) => setBookingLimitMonths(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="w-24 text-center font-medium text-indigo-600 dark:text-indigo-400">
                  {bookingLimitMonths} mois
                </span>
                <button
                  onClick={saveBookingLimit}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Enregistrer
                </button>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Les clients peuvent réserver jusqu'à {bookingLimitMonths} mois à l'avance
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

        {/* Add Time Slot Modal */}
        <Modal
          isOpen={editingDay !== null}
          onClose={() => setEditingDay(null)}
          title={`Ajouter un créneau - ${editingDay !== null ? DAYS[editingDay] : ''}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Heure de début
                </label>
                <input
                  type="time"
                  value={newSlot.start_time}
                  onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Heure de fin
                </label>
                <input
                  type="time"
                  value={newSlot.end_time}
                  onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <ModalActions
              onCancel={() => setEditingDay(null)}
              onConfirm={addTimeSlot}
              isLoading={saving}
              confirmText="Ajouter"
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
