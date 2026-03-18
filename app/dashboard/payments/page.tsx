/**
 * Payments Page - Redirects to Profile
 * Payment settings are managed in the Profile page
 */

import { redirect } from 'next/navigation'

export default function PaymentsPage() {
  redirect('/dashboard/profile')
}
