/**
 * Bottom Navigation Component
 * Mobile-optimized navigation with 4 main items + More menu
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface BottomNavProps {
  newBookingsCount: number
  onMoreClick: () => void
}

interface NavItem {
  href: string
  label: string
  icon: string
}

const mainNavItems: NavItem[] = [
  { href: '/dashboard', label: 'RDV', icon: '📅' },
  { href: '/dashboard/sessions', label: 'Séances', icon: '⏱️' },
]

export default function BottomNav({ newBookingsCount, onMoreClick }: BottomNavProps) {
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 lg:hidden pb-safe">
      <div className="flex items-center justify-around h-16">
        {/* RDV */}
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isActive('/dashboard')
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <span className="text-xl mb-0.5">📅</span>
          <span className="text-xs font-medium">RDV</span>
        </Link>

        {/* Séances */}
        <Link
          href="/dashboard/sessions"
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isActive('/dashboard/sessions')
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <span className="text-xl mb-0.5">⏱️</span>
          <span className="text-xs font-medium">Séances</span>
        </Link>

        {/* Notifications */}
        <Link
          href="/dashboard/notifications"
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
            isActive('/dashboard/notifications')
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <div className="relative">
            <span className="text-xl mb-0.5">🔔</span>
            {newBookingsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                {newBookingsCount > 99 ? '99+' : newBookingsCount}
              </span>
            )}
          </div>
          <span className="text-xs font-medium">Notif</span>
        </Link>

        {/* Plus */}
        <button
          onClick={onMoreClick}
          className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          <span className="text-xl mb-0.5">👤</span>
          <span className="text-xs font-medium">Plus</span>
        </button>
      </div>
    </nav>
  )
}
