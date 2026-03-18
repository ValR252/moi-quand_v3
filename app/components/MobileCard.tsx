/**
 * MobileCard Component (UI Designer)
 * Cards avec états tactiles optimisés pour mobile
 * - active:scale-95 pour feedback tactile
 * - Ombres et bordures modernes
 * - Support dark mode
 * - Glassmorphism optionnel
 */

import { ReactNode, HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface MobileCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  interactive?: boolean
  variant?: 'default' | 'glass' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  href?: string
  onClick?: () => void
}

const MobileCard = forwardRef<HTMLDivElement & HTMLAnchorElement, MobileCardProps>(
  ({ 
    children, 
    interactive = false, 
    variant = 'default',
    padding = 'md',
    href,
    onClick,
    className,
    ...props 
  }, ref) => {
    const baseStyles = cn(
      // Base styles
      'rounded-2xl transition-all duration-200',
      
      // Padding
      padding === 'sm' && 'p-4',
      padding === 'md' && 'p-5',
      padding === 'lg' && 'p-6',
      
      // Variant styles
      variant === 'default' && [
        'bg-white dark:bg-gray-800',
        'border border-gray-100 dark:border-gray-700',
        'shadow-sm dark:shadow-none',
      ],
      variant === 'elevated' && [
        'bg-white dark:bg-gray-800',
        'border border-gray-100 dark:border-gray-700',
        'shadow-md shadow-gray-200/50 dark:shadow-gray-900/50',
      ],
      variant === 'glass' && [
        'bg-white/80 dark:bg-gray-800/60',
        'backdrop-blur-xl',
        'border border-white/20 dark:border-gray-700/50',
        'shadow-lg shadow-gray-200/30 dark:shadow-black/30',
      ],
      
      // Interactive states
      interactive && [
        'cursor-pointer',
        'active:scale-[0.98]',
        'hover:shadow-md dark:hover:shadow-gray-900/50',
        'hover:border-gray-200 dark:hover:border-gray-600',
        'transition-transform',
      ],
      
      // Custom classes
      className
    )

    if (href) {
      return (
        <a 
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href} 
          className={cn(baseStyles, 'block')} 
          {...props}
        >
          {children}
        </a>
      )
    }

    return (
      <div 
        ref={ref as React.Ref<HTMLDivElement>}
        onClick={onClick}
        className={baseStyles} 
        {...props}
      >
        {children}
      </div>
    )
  }
)

MobileCard.displayName = 'MobileCard'

export default MobileCard

// Sub-components pour la structure

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn('mb-3 pb-3 border-b border-gray-100 dark:border-gray-700', className)}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: ReactNode
  className?: string
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3 className={cn('text-lg font-semibold text-gray-900 dark:text-gray-100', className)}>
      {children}
    </h3>
  )
}

interface CardDescriptionProps {
  children: ReactNode
  className?: string
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return (
    <p className={cn('text-sm text-gray-500 dark:text-gray-400 mt-1', className)}>
      {children}
    </p>
  )
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={cn('', className)}>
      {children}
    </div>
  )
}

interface CardFooterProps {
  children: ReactNode
  className?: string
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn('mt-4 pt-4 border-t border-gray-100 dark:border-gray-700', className)}>
      {children}
    </div>
  )
}

// Settings card spécifique pour le Settings Hub
interface SettingsCardProps {
  href: string
  icon: ReactNode
  title: string
  description: string
  badge?: string | number
}

export function SettingsCard({ href, icon, title, description, badge }: SettingsCardProps) {
  return (
    <a 
      href={href}
      className="
        group flex items-start gap-4 p-4 
        bg-white dark:bg-gray-800 
        border border-gray-200 dark:border-gray-700 
        rounded-2xl shadow-sm
        hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600
        active:scale-[0.98]
        transition-all duration-200
      "
    >
      {/* Icon container */}
      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/50 transition-colors">
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          {badge && (
            <span className="flex-shrink-0 px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded-full">
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
          {description}
        </p>
      </div>

      {/* Arrow */}
      <svg 
        className="flex-shrink-0 w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  )
}
