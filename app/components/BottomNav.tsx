/**
 * Bottom Navigation Component (UI Designer)
 * Navigation mobile fixe en bas avec 5 items
 * - RDV | Séances | Notif | Param | Profil
 * - Icônes Lucide React avec badges et animations
 * - Safe area pour iPhone X+
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  Calendar, 
  Layers, 
  Bell, 
  Settings, 
  User 
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: typeof Calendar
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'RDV', icon: Calendar },
  { href: '/dashboard/sessions', label: 'Séances', icon: Layers },
  { href: '/dashboard/notifications', label: 'Notif', icon: Bell },
  { href: '/dashboard/settings', label: 'Param', icon: Settings },
  { href: '/dashboard/profile', label: 'Profil', icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()
  const [notificationCount, setNotificationCount] = useState(0)
  const [tappedItem, setTappedItem] = useState<string | null>(null)

  // Fetch notification count
  useEffect(() => {
    async function fetchNotificationCount() {
      try {
        const response = await fetch('/api/bookings/unread-count')
        if (response.ok) {
          const data = await response.json()
          setNotificationCount(data.count || 0)
        }
      } catch (error) {
        console.error('Error fetching notification count:', error)
      }
    }

    fetchNotificationCount()
    
    // Refresh count every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000)
    return () => clearInterval(interval)
  }, [])

  // Handle tap animation
  const handleTap = (href: string) => {
    setTappedItem(href)
    setTimeout(() => setTappedItem(null), 150)
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Safe area container avec gradient subtil */}
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const active = isActive(item.href)
            const isTapped = tappedItem === item.href
            const Icon = item.icon
            const showBadge = item.href === '/dashboard/notifications' && notificationCount > 0

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => handleTap(item.href)}
                className={`
                  relative flex flex-col items-center justify-center
                  min-w-[64px] h-full px-3 py-2
                  transition-all duration-150 ease-out
                  ${isTapped ? 'scale-90' : 'scale-100'}
                  ${active 
                    ? 'text-brand-600 dark:text-brand-400' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }
                `}
              >
                {/* Container icône */}
                <div className="relative">
                  <Icon 
                    className={`
                      w-6 h-6 transition-all duration-200
                      ${active ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}
                    `} 
                  />
                  
                  {/* Badge notifications */}
                  {showBadge && (
                    <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span className={`
                  text-[10px] font-medium mt-1 transition-colors
                  ${active ? 'text-brand-600 dark:text-brand-400' : ''}
                `}>
                  {item.label}
                </span>

                {/* Active indicator - petit point au-dessus */}
                {active && (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-500 rounded-full" />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
