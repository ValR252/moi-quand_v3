/**
 * Modal Component
 * Frontend Developer: Full-featured modal with animations and accessibility
 *
 * Usage:
 *   <Modal
 *     isOpen={isOpen}
 *     onClose={() => setIsOpen(false)}
 *     title="Modifier la séance"
 *   >
 *     <p>Modal content here</p>
 *   </Modal>
 */

'use client'

import { ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
}

const sizeStyles = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4',
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
}: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeOnEscape, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const modalContent = (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Modal panel */}
        <div
          className={`
            relative w-full ${sizeStyles[size]}
            bg-white dark:bg-gray-900
            rounded-2xl shadow-2xl
            transform transition-all
            animate-slideUp
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              {title && (
                <h2
                  id="modal-title"
                  className="text-xl font-semibold text-gray-900 dark:text-gray-100"
                >
                  {title}
                </h2>
              )}

              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="
                    ml-auto -mr-2 p-2 rounded-lg
                    text-gray-400 hover:text-gray-600
                    dark:text-gray-500 dark:hover:text-gray-300
                    hover:bg-gray-100 dark:hover:bg-gray-800
                    transition-colors
                  "
                  aria-label="Fermer"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )

  // Render in portal to avoid z-index issues
  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null
}

// Convenience component for modal footer with actions
export function ModalFooter({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  )
}

// Convenience component for modal actions
interface ModalActionsProps {
  onCancel?: () => void
  onConfirm?: () => void
  cancelText?: string
  confirmText?: string
  confirmVariant?: 'primary' | 'danger'
  isLoading?: boolean
}

export function ModalActions({
  onCancel,
  onConfirm,
  cancelText = 'Annuler',
  confirmText = 'Confirmer',
  confirmVariant = 'primary',
  isLoading = false,
}: ModalActionsProps) {
  const confirmStyles =
    confirmVariant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
      : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'

  return (
    <ModalFooter>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="
            px-4 py-2 rounded-lg
            text-sm font-medium
            text-gray-700 dark:text-gray-300
            bg-white dark:bg-gray-800
            border border-gray-300 dark:border-gray-600
            hover:bg-gray-50 dark:hover:bg-gray-700
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          {cancelText}
        </button>
      )}

      {onConfirm && (
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`
            px-4 py-2 rounded-lg
            text-sm font-medium
            text-white
            ${confirmStyles}
            focus:outline-none focus:ring-2 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
            ${isLoading ? 'cursor-wait' : ''}
          `}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Chargement...
            </span>
          ) : (
            confirmText
          )}
        </button>
      )}
    </ModalFooter>
  )
}
