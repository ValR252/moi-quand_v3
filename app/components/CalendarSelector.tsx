'use client'

import { useState, useEffect } from 'react'

type Calendar = {
  id: string
  summary: string
  description?: string
  primary?: boolean
  backgroundColor?: string
}

type Props = {
  onSelect: (calendarId: string) => void
  onClose: () => void
}

export default function CalendarSelector({ onSelect, onClose }: Props) {
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string>('')

  useEffect(() => {
    loadCalendars()
  }, [])

  async function loadCalendars() {
    try {
      const response = await fetch('/api/calendar/list')
      if (response.ok) {
        const data = await response.json()
        setCalendars(data.calendars || [])

        // Pre-select the currently selected calendar from database
        if (data.selectedCalendarId) {
          setSelectedId(data.selectedCalendarId)
          console.log('Currently selected calendar:', data.selectedCalendarId)
        } else {
          // Fallback to primary calendar if none selected
          const primary = data.calendars?.find((c: Calendar) => c.primary)
          if (primary) {
            setSelectedId(primary.id)
          }
        }
      }
    } catch (error) {
      console.error('Error loading calendars:', error)
    }
    setLoading(false)
  }

  async function handleConfirm() {
    if (!selectedId) {
      alert('Veuillez sélectionner un agenda')
      return
    }

    try {
      const response = await fetch('/api/calendar/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarId: selectedId })
      })

      if (response.ok) {
        onSelect(selectedId)
      } else {
        alert('Erreur lors de la sauvegarde de la sélection')
      }
    } catch (error) {
      console.error('Error saving calendar selection:', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-[fadeIn_0.3s_ease-out]">
        <h2 className="text-2xl font-bold mb-4">Choisir un agenda Google</h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement de vos agendas...</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Sélectionnez l'agenda où vous souhaitez créer vos rendez-vous
            </p>

            <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
              {calendars.map((calendar) => (
                <label
                  key={calendar.id}
                  className={`block p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    selectedId === calendar.id
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="calendar"
                    value={calendar.id}
                    checked={selectedId === calendar.id}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3">
                    {calendar.backgroundColor && (
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: calendar.backgroundColor }}
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {calendar.summary}
                        {calendar.primary && (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200 rounded">
                            Principal
                          </span>
                        )}
                      </div>
                      {calendar.description && (
                        <div className="text-sm text-gray-500 mt-1">
                          {calendar.description}
                        </div>
                      )}
                    </div>
                    {selectedId === calendar.id && (
                      <div className="text-indigo-600 dark:text-indigo-400 text-2xl">✓</div>
                    )}
                  </div>
                </label>
              ))}
            </div>

            {calendars.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Aucun agenda trouvé
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedId}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Confirmer
              </button>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}
