/**
 * Settings Hub Page (UI Designer)
 * Page centrale de navigation vers les sous-pages de paramètres
 * - Regroupe les liens vers availability, form, cancellation, messages
 * - Cards cliquables avec icônes
 * - Responsive mobile/desktop
 */

'use client'

import { 
  Calendar, 
  FileText, 
  XCircle, 
  MessageSquare, 
  CreditCard, 
  Bell,
  User,
  ChevronRight
} from 'lucide-react'
import MobileCard, { CardHeader, CardTitle, CardDescription } from '@/app/components/MobileCard'

// Configuration des paramètres
const settingsItems = [
  {
    href: '/dashboard/availability',
    icon: Calendar,
    title: 'Disponibilités',
    description: 'Gérez vos créneaux horaires et jours de congé',
    color: 'blue',
  },
  {
    href: '/dashboard/form',
    icon: FileText,
    title: 'Formulaire de réservation',
    description: 'Personnalisez les questions du formulaire',
    color: 'green',
  },
  {
    href: '/dashboard/cancellation',
    icon: XCircle,
    title: 'Politique d\'annulation',
    description: 'Configurez les règles d\'annulation et de remboursement',
    color: 'orange',
  },
  {
    href: '/dashboard/messages',
    icon: MessageSquare,
    title: 'Messages automatiques',
    description: 'Modifiez les emails de confirmation et rappels',
    color: 'purple',
  },
  {
    href: '/dashboard/payments',
    icon: CreditCard,
    title: 'Paiements',
    description: 'Paramètres PayPal et tarifs des séances',
    color: 'pink',
  },
  {
    href: '/dashboard/profile',
    icon: User,
    title: 'Profil professionnel',
    description: 'Modifiez vos informations et photo de profil',
    color: 'indigo',
  },
]

// Mapping des couleurs
const colorMap: Record<string, { bg: string; icon: string }> = {
  blue: { 
    bg: 'bg-blue-50 dark:bg-blue-900/20', 
    icon: 'text-blue-600 dark:text-blue-400' 
  },
  green: { 
    bg: 'bg-green-50 dark:bg-green-900/20', 
    icon: 'text-green-600 dark:text-green-400' 
  },
  orange: { 
    bg: 'bg-orange-50 dark:bg-orange-900/20', 
    icon: 'text-orange-600 dark:text-orange-400' 
  },
  purple: { 
    bg: 'bg-purple-50 dark:bg-purple-900/20', 
    icon: 'text-purple-600 dark:text-purple-400' 
  },
  pink: { 
    bg: 'bg-pink-50 dark:bg-pink-900/20', 
    icon: 'text-pink-600 dark:text-pink-400' 
  },
  indigo: { 
    bg: 'bg-brand-50 dark:bg-brand-900/20', 
    icon: 'text-brand-600 dark:text-brand-400' 
  },
}

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
          Paramètres
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Configurez votre pratique et personnalisez l\'expérience de vos patients
        </p>
      </div>

      {/* Quick Actions - Mobile only */}
      <div className="lg:hidden">
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          <a 
            href="/dashboard/availability"
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full font-medium text-sm whitespace-nowrap active:scale-95 transition-transform"
          >
            <Calendar className="w-4 h-4" />
            Disponibilités
          </a>
          <a 
            href="/dashboard/form"
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full font-medium text-sm whitespace-nowrap active:scale-95 transition-transform"
          >
            <FileText className="w-4 h-4" />
            Formulaire
          </a>
          <a 
            href="/dashboard/cancellation"
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-full font-medium text-sm whitespace-nowrap active:scale-95 transition-transform"
          >
            <XCircle className="w-4 h-4" />
            Annulation
          </a>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {settingsItems.map((item) => {
          const Icon = item.icon
          const colors = colorMap[item.color]

          return (
            <a
              key={item.href}
              href={item.href}
              className="
                group flex items-start gap-4 p-5 
                bg-white dark:bg-gray-800 
                border border-gray-200 dark:border-gray-700 
                rounded-2xl shadow-sm
                hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600
                active:scale-[0.98]
                transition-all duration-200
              "
            >
              {/* Icon container */}
              <div className={`
                flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl 
                ${colors.bg} ${colors.icon}
                group-hover:scale-110
                transition-transform duration-200
              `}>
                <Icon className="w-6 h-6" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {item.description}
                </p>
              </div>

              {/* Arrow */}
              <ChevronRight 
                className="flex-shrink-0 w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 group-hover:translate-x-1 transition-all" 
              />
            </a>
          )
        })}
      </div>

      {/* Help Section */}
      <MobileCard variant="glass" className="mt-8">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Besoin d\'aide ?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Si vous avez des questions sur les paramètres, n\'hésitez pas à consulter la documentation ou à nous contacter.
            </p>
          </div>
        </div>
      </MobileCard>
    </div>
  )
}
