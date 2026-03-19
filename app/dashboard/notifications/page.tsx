/**
 * Notifications Page
 * Affiche les notifications de réservations et paiements
 */

"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Booking } from "@/lib/supabase";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Bell,
  CheckCircle,
  Calendar,
  CreditCard,
  User,
  Trash2,
} from "lucide-react";

interface Notification {
  id: string;
  type: "booking" | "payment" | "cancellation";
  title: string;
  message: string;
  date: string;
  read: boolean;
  viewed_at?: string | null;
  booking?: Booking;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    loadNotifications();
    markAllAsRead();
  }, []);

  async function loadNotifications() {
    try {
      // Charger les réservations pour créer des notifications
      const res = await fetch("/api/bookings");
      const data = await res.json();
      const bookings: Booking[] = data.bookings || [];

      // Créer des notifications à partir des réservations
      const notifs: Notification[] = bookings
        .filter((b: Booking) => b.status === "pending" || !b.viewed_at)
        .map((booking: Booking) => ({
          id: booking.id,
          type: (booking.status === "pending" ? "booking" : "payment") as "booking" | "payment",
          title:
            booking.status === "pending"
              ? "Nouvelle réservation"
              : "Paiement reçu",
          message: `${booking.first_name} ${booking.last_name} - ${booking.session_id ? "Consultation" : "Réservation"}`,
          date: booking.created_at,
          read: !!booking.viewed_at,
          viewed_at: booking.viewed_at,
          booking,
        }))
        .sort(
          (a: Notification, b: Notification) =>
            new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

      setNotifications(notifs);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  async function markAllAsRead() {
    try {
      await fetch("/api/bookings/mark-read", { method: "POST" });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  }

  async function dismissNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.viewed_at)
      : notifications;

  const unreadCount = notifications.filter((n) => !n.viewed_at).length;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Notifications
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {unreadCount > 0
                ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
                : "Aucune nouvelle notification"}
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === "unread"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              Non lues
            </button>
          </div>
        </div>

        {/* Notifications list */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <Bell className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Pas de notifications
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              {filter === "unread"
                ? "Vous avez lu toutes vos notifications. Génial !"
                : "Les notifications apparaîtront ici quand vous aurez de nouvelles réservations ou paiements."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`
                  group flex items-start gap-4 p-4
                  bg-white dark:bg-gray-800
                  border border-gray-200 dark:border-gray-700
                  rounded-xl
                  hover:shadow-md transition-all duration-200
                  ${!notification.viewed_at ? "ring-1 ring-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-900/10" : ""}
                `}
              >
                {/* Icon */}
                <div
                  className={`
                  flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                  ${notification.type === "booking" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : ""}
                  ${notification.type === "payment" ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" : ""}
                  ${notification.type === "cancellation" ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" : ""}
                `}
                >
                  {notification.type === "booking" && (
                    <Calendar className="w-5 h-5" />
                  )}
                  {notification.type === "payment" && (
                    <CreditCard className="w-5 h-5" />
                  )}
                  {notification.type === "cancellation" && (
                    <Trash2 className="w-5 h-5" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {notification.title}
                        {!notification.viewed_at && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300">
                            Nouveau
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                        {notification.message}
                      </p>

                      {notification.booking && (
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {notification.booking.first_name}{" "}
                            {notification.booking.last_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(
                              parseISO(notification.booking.date),
                              "dd MMM yyyy",
                              { locale: fr },
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {format(parseISO(notification.date), "dd MMM", {
                          locale: fr,
                        })}
                      </span>
                      <button
                        onClick={() => dismissNotification(notification.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Masquer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info section */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-300">
                À propos des notifications
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                Les notifications apparaissent automatiquement quand vous
                recevez une nouvelle réservation ou un paiement. Elles sont
                marquées comme lues après consultation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
