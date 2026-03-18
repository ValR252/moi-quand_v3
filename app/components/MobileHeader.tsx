/**
 * Mobile Header Component (UI Designer)
 * Header sticky avec backdrop-blur pour mobile
 * - Titre de page + actions contextuelles
 * - Visible uniquement sur mobile
 */

'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Menu } from 'lucide-react'

interface MobileHeaderProps {
  title: string
  showBack?: boolean
  onBack?: () => void
  rightAction?: ReactNode
  onMenuClick?: () => void
}

export default function MobileHeader({ 
  title, 
  showBack = false, 
  onBack,
  rightAction,
  onMenuClick 
}: MobileHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  return (
    <header className="lg:hidden sticky top-0 z-40 w-full">
      {/* Backdrop blur container */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left section */}
          <div className="flex items-center gap-3 flex-1">
            {showBack ? (
              <button
                onClick={handleBack}
                className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-all"
                aria-label="Retour"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-200" strokeWidth={2} />
              </button>
            ) : onMenuClick ? (
              <button
                onClick={onMenuClick}
                className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-all lg:hidden"
                aria-label="Menu"
              >
                <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" strokeWidth={2} />
              </button>
            ) : null}

            {/* Title */}
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {title}
            </h1>
          </div>

          {/* Right section - actions contextuelles */}
          {rightAction && (
            <div className="flex items-center">
              {rightAction}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

/**
 * Hook utilitaire pour obtenir le titre de la page depuis le pathname
 * Usage: const title = usePageTitle(pathname)
 */
export function usePageTitle(pathname: string): string {
  const titles: Record<string, string> = {
    '/dashboard': 'Rendez-vous',
    '/dashboard/sessions': 'Séances',
    '/dashboard/profile': 'Profil',
    '/dashboard/availability': 'Disponibilités',
    '/dashboard/cancellation': 'Annulation',
    '/dashboard/form': 'Formulaire',
    '/dashboard/payments': 'Paiements',
    '/dashboard/messages': 'Messages',
    '/dashboard/settings': 'Paramètres',
    '/dashboard/notifications': 'Notifications',
  }

  // Gestion des routes dynamiques
  if (pathname.startsWith('/dashboard/availability/')) {
    return 'Modifier disponibilités'
  }
  if (pathname.startsWith('/dashboard/cancellation/')) {
    return 'Détails annulation'
  }
  if (pathname.startsWith('/dashboard/form/')) {
    return 'Éditer formulaire'
  }

  return titles[pathname] || 'Dashboard'
}
