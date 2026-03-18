/**
 * Settings Page - Redirects to Profile
 * All settings are managed in the Profile page
 */

import { redirect } from 'next/navigation'

export default function SettingsPage() {
  redirect('/dashboard/profile')
}
