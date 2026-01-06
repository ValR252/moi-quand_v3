/**
 * Dashboard - Appointments Overview
 * Shows upcoming appointments with filters, stats, and quick actions
 */

'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Badge, { BookingStatusBadge, PaymentStatusBadge } from '@/components/ui/Badge'
import Modal, { ModalActions } from '@/components/ui/Modal'
import { Booking } from '@/lib/supabase'
import { format, parseISO, isFuture, isPast } from 'date-fns'
import { fr } from 'date-fns/locale'

type Filter = 'all' | 'upcoming' | 'past' | 'pending' | 'confirmed'

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('upcoming')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  useEffect(() => {
    loadBookings()
    markBookingsAsRead()
  }, [])

  async function markBookingsAsRead() {
    try {
      await fetch('/api/bookings/mark-read', { method: 'POST' })
    } catch (error) {
      console.error('Error marking bookings as read:', error)
    }
  }

  async function loadBookings() {
    try {
      const res = await fetch('/api/bookings')
      const data = await res.json()
      setBookings(data.bookings || [])
    } catch (error) {
      console.error('Error loading bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  function getFilteredBookings() {
    const now = new Date()

    return bookings.filter((booking) => {
      const bookingDate = parseISO(`${booking.date}T${booking.time}`)

      switch (filter) {
        case 'upcoming':
          return isFuture(bookingDate) && booking.status !== 'cancelled'
        case 'past':
          return isPast(bookingDate) || booking.status === 'completed'
        case 'pending':
          return booking.status === 'pending'
        case 'confirmed':
          return booking.status === 'confirmed'
        default:
          return true
      }
    })
  }

  function getStats() {
    const filtered = getFilteredBookings()
    const total = filtered.length
    const confirmed = filtered.filter((b) => b.status === 'confirmed').length
    const pending = filtered.filter((b) => b.status === 'pending').length
    const paid = filtered.filter((b) => b.payment_status === 'paid').length

    return { total, confirmed, pending, paid }
  }

  async function updateBooking(id: string, updates: Partial<Booking>) {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (res.ok) {
        await loadBookings()
      }
    } catch (error) {
      console.error('Error updating booking:', error)
    }
  }

  async function cancelBooking(id: string) {
    const reason = prompt('Raison de l\'annulation (optionnel) :')
    if (reason === null) return // User clicked Cancel

    try {
      const res = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: id,
          reason: reason || undefined
        }),
      })

      if (res.ok) {
        await loadBookings()
        setIsDetailModalOpen(false)
        alert('Rendez-vous annulé avec succès')
      } else {
        const error = await res.json()
        alert(`Erreur: ${error.error || 'Impossible d\'annuler le rendez-vous'}`)
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
      alert('Erreur lors de l\'annulation')
    }
  }

  const filteredBookings = getFilteredBookings()
  const stats = getStats()

  return (
    <DashboardLayout>
      <div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Confirmés</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.confirmed}</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">En attente</div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Payés</div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.paid}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['upcoming', 'past', 'pending', 'confirmed', 'all'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors
                ${
                  filter === f
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}
            >
              {f === 'upcoming' && 'À venir'}
              {f === 'past' && 'Passés'}
              {f === 'pending' && 'En attente'}
              {f === 'confirmed' && 'Confirmés'}
              {f === 'all' && 'Tous'}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">Aucun rendez-vous</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedBooking(booking)
                  setIsDetailModalOpen(true)
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {booking.client_name || `${booking.first_name} ${booking.last_name}`}
                      </h3>
                      <BookingStatusBadge status={booking.status || 'pending'} />
                      {booking.payment_status && (
                        <PaymentStatusBadge status={booking.payment_status} />
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        📅 {format(parseISO(booking.date), 'EEEE d MMMM yyyy', { locale: fr })}
                      </span>
                      <span className="flex items-center gap-1">
                        ⏰ {booking.time}
                      </span>
                      {(booking as any).sessions?.name && (
                        <span className="flex items-center gap-1">
                          💼 {(booking as any).sessions.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {booking.status === 'pending' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        updateBooking(booking.id, { status: 'confirmed' })
                      }}
                      className="ml-4 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Confirmer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedBooking && (
          <Modal
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            title="Détails du rendez-vous"
            size="lg"
          >
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Client</h3>
                <p className="text-gray-900 dark:text-gray-100">
                  {selectedBooking.client_name || `${selectedBooking.first_name} ${selectedBooking.last_name}`}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedBooking.email}</p>
                {selectedBooking.phone && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedBooking.phone}</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date & Heure</h3>
                <p className="text-gray-900 dark:text-gray-100">
                  {format(parseISO(selectedBooking.date), 'EEEE d MMMM yyyy', { locale: fr })} à {selectedBooking.time}
                </p>
              </div>

              <div className="flex gap-2">
                <BookingStatusBadge status={selectedBooking.status || 'pending'} />
                {selectedBooking.payment_status && (
                  <PaymentStatusBadge status={selectedBooking.payment_status} />
                )}
              </div>

              <div className="flex gap-2 pt-4">
                {selectedBooking.status === 'pending' && (
                  <button
                    onClick={() => {
                      updateBooking(selectedBooking.id, { status: 'confirmed' })
                      setIsDetailModalOpen(false)
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Confirmer
                  </button>
                )}

                {selectedBooking.payment_status === 'pending' && (
                  <button
                    onClick={() => {
                      updateBooking(selectedBooking.id, { payment_status: 'paid', payment_date: new Date().toISOString() })
                      setIsDetailModalOpen(false)
                    }}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Marquer payé
                  </button>
                )}

                <button
                  onClick={() => cancelBooking(selectedBooking.id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Annuler
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  )
}
