/**
 * Dashboard Layout Component
 * Frontend Architect: Responsive dashboard layout avec sidebar desktop + bottom nav mobile
 *
 * Usage:
 *   <DashboardLayout>
 *     <YourDashboardPageContent />
 *   </DashboardLayout>
 *
 * Phase 1+2: Design Review - Navigation mobile + Améliorations UX
 */

'use client'

import { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'
import BottomNav from '@/app/components/BottomNav'
import MobileHeader from '@/app/components/MobileHeader'
import { usePageTitle } from '@/app/components/MobileHeader'

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
  { href: '/dashboard/cancellation', label: 'Annulation', icon: '🔄' },
  { href: '/dashboard/form', label: 'Formulaire', icon: '📝' },
  { href: '/dashboard/payments', label: 'Paiements', icon: '💳' },
  { href: '/dashboard/messages', label: 'Messages', icon: '✉️' },
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [newBookingsCount, setNewBookingsCount] = useState(0)
  const pathname = usePathname()
  const router = useRouter()
  const pageTitle = usePageTitle(pathname)

  // Fetch unread bookings count
  useEffect(() => {
    async function fetchNewBookingsCount() {
      try {
        const response = await fetch('/api/bookings/unread-count')
        if (response.ok) {
          const data = await response.json()
          setNewBookingsCount(data.count || 0)
        }
      } catch (error) {
        console.error('Error fetching bookings count:', error)
      }
    }

    fetchNewBookingsCount()

    // Refresh count every 30 seconds
    const interval = setInterval(fetchNewBookingsCount, 30000)
    return () => clearInterval(interval)
  }, [])

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop only (hidden on mobile via CSS) */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64
          bg-white dark:bg-gray-800
          border-r border-gray-200 dark:border-gray-700
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
          <Link
            href="/dashboard"
            className="text-xl font-bold text-brand-600 dark:text-brand-400"
          >
            moi-quand
          </Link>

          {/* Close button (mobile) */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Fermer le menu"
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
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl
                  font-medium transition-all duration-200
                  ${
                    isActive
                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400'
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
              flex items-center gap-3 px-4 py-3 rounded-xl
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
        {/* Mobile Header - with menu button for mobile */}
        <MobileHeader 
          title={pageTitle}
          onMenuClick={() => setSidebarOpen(true)}
          rightAction={
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notification bell - Navigate to bookings */}
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative transition-all hover:scale-105 active:scale-95"
                aria-label={`Notifications${newBookingsCount > 0 ? ` - ${newBookingsCount} nouveaux rendez-vous` : ''}`}
              >
                <svg className="w-6 h-6 text-gray-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>

                {/* Notification badge with count */}
                {newBookingsCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    {newBookingsCount > 99 ? '99+' : newBookingsCount}
                  </span>
                )}
              </button>
            </div>
          }
        />

        {/* Desktop Header - hidden on mobile */}
        <header className="hidden lg:block h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            {/* Page title */}
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {navItems.find((item) => item.href === pathname)?.label || 'Dashboard'}
            </h1>

            {/* Right section (notifications, profile, etc.) */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notification bell */}
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative transition-all hover:scale-105 active:scale-95"
                aria-label={`Notifications${newBookingsCount > 0 ? ` - ${newBookingsCount} nouveaux rendez-vous` : ''}`}
              >
                <svg className="w-6 h-6 text-gray-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>

                {/* Notification badge with count */}
                {newBookingsCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    {newBookingsCount > 99 ? '99+' : newBookingsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Page content with safe area padding for mobile bottom nav */}
        <main className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Bottom Navigation - Mobile only */}
      <BottomNav />
    </div>
  )
}
