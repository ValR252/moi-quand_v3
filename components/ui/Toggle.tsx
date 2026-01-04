/**
 * Toggle Component
 * Frontend Developer: Interactive toggle switch with smooth animations
 *
 * Usage:
 *   <Toggle checked={enabled} onChange={setEnabled} label="Réservations activées" />
 */

'use client'

import { useState } from 'react'

interface ToggleProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeStyles = {
  sm: {
    switch: 'w-9 h-5',
    circle: 'w-4 h-4',
    translate: 'translate-x-4',
  },
  md: {
    switch: 'w-11 h-6',
    circle: 'w-5 h-5',
    translate: 'translate-x-5',
  },
  lg: {
    switch: 'w-14 h-7',
    circle: 'w-6 h-6',
    translate: 'translate-x-7',
  },
}

export default function Toggle({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className = '',
}: ToggleProps) {
  const [isChecked, setIsChecked] = useState(checked)

  // Use controlled or uncontrolled mode
  const currentChecked = onChange !== undefined ? checked : isChecked

  const handleToggle = () => {
    if (disabled) return

    const newValue = !currentChecked
    if (onChange) {
      onChange(newValue)
    } else {
      setIsChecked(newValue)
    }
  }

  const styles = sizeStyles[size]

  return (
    <div className={`flex items-start ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={currentChecked}
        disabled={disabled}
        onClick={handleToggle}
        className={`
          relative inline-flex flex-shrink-0
          ${styles.switch}
          border-2 border-transparent rounded-full
          cursor-pointer transition-colors ease-in-out duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
          disabled:cursor-not-allowed disabled:opacity-50
          ${
            currentChecked
              ? 'bg-indigo-600 dark:bg-indigo-500'
              : 'bg-gray-200 dark:bg-gray-700'
          }
        `}
      >
        <span
          aria-hidden="true"
          className={`
            ${styles.circle}
            pointer-events-none inline-block rounded-full
            bg-white shadow-lg transform ring-0 transition ease-in-out duration-200
            ${currentChecked ? styles.translate : 'translate-x-0'}
          `}
        />
      </button>

      {(label || description) && (
        <div className="ml-3 flex-1">
          {label && (
            <label
              onClick={handleToggle}
              className={`
                text-sm font-medium text-gray-900 dark:text-gray-100
                ${disabled ? 'opacity-50' : 'cursor-pointer'}
              `}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
