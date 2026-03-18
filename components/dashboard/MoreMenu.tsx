/**
 * More Menu Component (Bottom Sheet)
 * Contains secondary navigation items grouped by category
 */

'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface MoreMenuProps {
  isOpen: boolean
  onClose: () => void
}

interface MenuItem {
  href: string
  label: string
  description: string
  icon: string
}

interface MenuGroup {
  title?: string
  items: MenuItem[]
}

const menuGroups: MenuGroup[] = [
  {
    items: [
      { href: '/dashboard/profile', label: 'Profil public', description: 'Modifier ma page', icon: '👤' },
      { href: '/dashboard/availability', label: 'Disponibilités', description: 'Horaires & congés', icon: '🗓️' },
      { href: '/dashboard/payments', label: 'Paiements', description: 'Virements & config', icon: '💳' },
    ],
  },
  {
    items: [
      { href: '/dashboard/settings', label: 'Paramètres', description: 'Préférences & sécurité', icon: '⚙️' },
      { href: '/dashboard/form', label: 'Formulaire réservation', description: 'Questions clients', icon: '📝' },
      { href: '/dashboard/cancellation', label: 'Politique d\'annulation', description: 'Conditions & frais', icon: '🔄' },
      { href: '/dashboard/messages', label: 'Centre de messages', description: 'Historique & notifications', icon: '✉️' },
    ],
  },
]

export default function MoreMenu({ isOpen, onClose }: MoreMenuProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 lg:hidden"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl lg:hidden max-h-[80vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mon compte</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Menu Groups */}
        <div className="py-2">
          {menuGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {groupIndex > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white">{item.label}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{item.description}</div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* Separator before logout */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 w-full text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <span className="text-2xl">🚪</span>
            <div className="flex-1">
              <div className="font-medium text-red-600 dark:text-red-400">Déconnexion</div>
            </div>
          </button>
        </div>

        {/* Safe area padding for iPhone X+ */}
        <div className="h-safe-area-inset-bottom" />
      </div>
    </>
  )
}
