/**
 * Données de démonstration pour fonctionner sans Supabase
 * Backend Engineer: Fallback data pour Vercel
 */

import { addDays, format } from 'date-fns'

export const MOCK_THERAPIST = {
  id: 'demo',
  name: 'Dr. Sophie Martin',
  title: 'Psychologue clinicienne',
  email: 'sophie.martin@demo.com',
  photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
  bio: 'Psychologue spécialisée en thérapie cognitive et comportementale avec plus de 10 ans d\'expérience. Je propose un accompagnement personnalisé dans un cadre bienveillant et professionnel.'
}

export const MOCK_SESSIONS = [
  {
    id: 'session-1',
    therapist_id: 'demo',
    label: 'Consultation individuelle',
    duration: 60,
    price: 80,
    enabled: true
  },
  {
    id: 'session-2',
    therapist_id: 'demo',
    label: 'Séance de suivi',
    duration: 45,
    price: 60,
    enabled: true
  },
  {
    id: 'session-3',
    therapist_id: 'demo',
    label: 'Première consultation',
    duration: 90,
    price: 100,
    enabled: true
  }
]

// Générer quelques réservations de démo
const today = new Date()
export const MOCK_BOOKINGS = [
  {
    id: 'booking-1',
    therapist_id: 'demo',
    session_id: 'session-1',
    first_name: 'Jean',
    last_name: 'Dupont',
    email: 'jean.dupont@example.com',
    phone: '06 12 34 56 78',
    date: format(addDays(today, 2), 'yyyy-MM-dd'),
    time: '14:00',
    payment_status: 'paid' as const,
    payment_method: 'bank_transfer'
  },
  {
    id: 'booking-2',
    therapist_id: 'demo',
    session_id: 'session-2',
    first_name: 'Marie',
    last_name: 'Lambert',
    email: 'marie.lambert@example.com',
    phone: '06 98 76 54 32',
    date: format(addDays(today, 5), 'yyyy-MM-dd'),
    time: '10:30',
    payment_status: 'pending' as const,
    payment_method: 'bank_transfer'
  },
  {
    id: 'booking-3',
    therapist_id: 'demo',
    session_id: 'session-1',
    first_name: 'Pierre',
    last_name: 'Dubois',
    email: 'pierre.dubois@example.com',
    phone: '06 45 67 89 01',
    date: format(addDays(today, 7), 'yyyy-MM-dd'),
    time: '16:00',
    payment_status: 'paid' as const,
    payment_method: 'bank_transfer'
  },
  {
    id: 'booking-4',
    therapist_id: 'demo',
    session_id: 'session-3',
    first_name: 'Claire',
    last_name: 'Moreau',
    email: 'claire.moreau@example.com',
    phone: '06 23 45 67 89',
    date: format(addDays(today, -3), 'yyyy-MM-dd'),
    time: '11:00',
    payment_status: 'paid' as const,
    payment_method: 'bank_transfer'
  },
  {
    id: 'booking-5',
    therapist_id: 'demo',
    session_id: 'session-2',
    first_name: 'Thomas',
    last_name: 'Bernard',
    email: 'thomas.bernard@example.com',
    phone: '',
    date: format(addDays(today, -7), 'yyyy-MM-dd'),
    time: '15:30',
    payment_status: 'paid' as const,
    payment_method: 'bank_transfer'
  }
]
