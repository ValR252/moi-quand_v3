/**
 * Dashboard Layout Component
 * Frontend Architect: Responsive dashboard layout with sidebar navigation
 *
 * Usage:
 *   <DashboardLayout>
 *     <YourDashboardPageContent />
 *   </DashboardLayout>
 */

'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface DashboardLayoutProps {
  children: ReactNode
}

interface NavItem {
  href: string
  label: string
  icon: string
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Rendez-vous', icon: '📅' },
  { href: '/dashboard/sessions', label: 'Séances', icon: '⏱️' },
  { href: '/dashboard/profile', label: 'Profil', icon: '👤' },
  { href: '/dashboard/availability', label: 'Disponibilités', icon: '🗓️' },
  { href: '/dashboard/form', label: 'Formulaire', icon: '📝' },
  { href: '/dashboard/payments', label: 'Paiements', icon: '💳' },
  { href: '/dashboard/messages', label: 'Messages', icon: '✉️' },
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64
          bg-white dark:bg-gray-800
          border-r border-gray-200 dark:border-gray-700
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
          <Link
            href="/dashboard"
            className="text-xl font-bold text-indigo-600 dark:text-indigo-400"
          >
            moi-quand
          </Link>

          {/* Close button (mobile) */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  font-medium transition-colors
                  ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }
                `}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/api/auth/logout"
            className="
              flex items-center gap-3 px-4 py-3 rounded-lg
              text-gray-700 dark:text-gray-300
              hover:bg-gray-100 dark:hover:bg-gray-700
              transition-colors
            "
          >
            <span className="text-xl">🚪</span>
            <span className="font-medium">Déconnexion</span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Page title */}
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {navItems.find((item) => item.href === pathname)?.label || 'Dashboard'}
            </h1>

            {/* Right section (notifications, profile, etc.) */}
            <div className="flex items-center gap-4">
              {/* Notification bell placeholder */}
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {/* Notification badge */}
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
