/**
 * TimezoneSelector Component
 * Reusable timezone selector with auto-detection
 */

'use client'

import { useState } from 'react'
import { TIMEZONE_LIST, getTimezoneLabel, getTimezoneFlag } from '@/lib/timezone-helper'

interface TimezoneSelectorProps {
  value: string
  onChange: (timezone: string) => void
  label?: string
  showFlag?: boolean
  className?: string
}

export default function TimezoneSelector({
  value,
  onChange,
  label = 'Fuseau horaire',
  showFlag = true,
  className = ''
}: TimezoneSelectorProps) {
  const selectedTimezone = TIMEZONE_LIST.find(tz => tz.value === value)

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      >
        {TIMEZONE_LIST.map((tz) => (
          <option key={tz.value} value={tz.value}>
            {showFlag ? `${tz.flag} ` : ''}{tz.label}
          </option>
        ))}
      </select>
      {selectedTimezone && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {showFlag && selectedTimezone.flag} {getTimezoneLabel(value)}
        </p>
      )}
    </div>
  )
}

/**
 * Compact timezone selector with modal
 * Used for subtle inline timezone selection
 */
interface CompactTimezoneSelectorProps {
  value: string
  onChange: (timezone: string) => void
  onDetectedChange?: (detected: boolean) => void
}

export function CompactTimezoneSelector({
  value,
  onChange,
  onDetectedChange
}: CompactTimezoneSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const flag = getTimezoneFlag(value)
  const label = getTimezoneLabel(value)

  const handleChange = (newTimezone: string) => {
    onChange(newTimezone)
    setIsOpen(false)
    if (onDetectedChange) {
      onDetectedChange(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        type="button"
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 group"
      >
        <span className="flex items-center gap-1.5">
          <span className="text-base group-hover:scale-110 transition-transform duration-200">🌍</span>
          <span>Horaires en heure de <span className="font-medium">{label.split(' ')[0]}</span></span>
        </span>
        <span className="text-indigo-600 dark:text-indigo-400 underline decoration-dashed underline-offset-2 group-hover:decoration-solid">
          Modifier
        </span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto animate-[scaleIn_0.3s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Choisir votre fuseau horaire
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Les horaires disponibles seront affichés dans votre fuseau horaire.
            </p>

            <div className="space-y-2">
              {TIMEZONE_LIST.map((tz) => (
                <button
                  key={tz.value}
                  type="button"
                  onClick={() => handleChange(tz.value)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-95 ${
                    tz.value === value
                      ? 'bg-indigo-50 dark:bg-indigo-950 border-2 border-indigo-500 shadow-md'
                      : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{tz.flag}</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {tz.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-md hover:shadow-lg"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  )
}
