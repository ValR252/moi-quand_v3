/**
 * Badge Component
 * UI Designer: Visual component for displaying status, labels, and categories
 *
 * Usage:
 *   <Badge variant="success">Payé</Badge>
 *   <Badge variant="warning">En attente</Badge>
 *   <Badge variant="danger">Annulé</Badge>
 */

import { ReactNode } from 'react'

type BadgeVariant =
  | 'default'
  | 'success'   // Green - for confirmed, paid, completed
  | 'warning'   // Amber - for pending, awaiting
  | 'danger'    // Red - for cancelled, error
  | 'info'      // Blue - for informational
  | 'neutral'   // Gray - for inactive, disabled

type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
  success: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  danger: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center justify-center
        font-medium rounded-full
        transition-colors
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}

// Predefined badges for common statuses
export function PaymentStatusBadge({ status }: { status: 'pending' | 'paid' | 'cancelled' }) {
  const variants = {
    pending: 'warning' as const,
    paid: 'success' as const,
    cancelled: 'neutral' as const,
  }

  const labels = {
    pending: 'En attente',
    paid: 'Payé',
    cancelled: 'Annulé',
  }

  return <Badge variant={variants[status]}>{labels[status]}</Badge>
}

export function BookingStatusBadge({ status }: { status: 'pending' | 'confirmed' | 'cancelled' | 'completed' }) {
  const variants = {
    pending: 'warning' as const,
    confirmed: 'info' as const,
    cancelled: 'danger' as const,
    completed: 'success' as const,
  }

  const labels = {
    pending: 'En attente',
    confirmed: 'Confirmé',
    cancelled: 'Annulé',
    completed: 'Terminé',
  }

  return <Badge variant={variants[status]}>{labels[status]}</Badge>
}
