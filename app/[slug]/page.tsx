'use client'

/**
 * Page de réservation avec URL personnalisée
 * Route: moi-quand.com/prenom-nom
 * Redirige vers la page de réservation complète avec l'ID du thérapeute
 */

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SlugRedirectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function findTherapist() {
      try {
        const { data: therapist, error } = await supabase
          .from('therapists')
          .select('id')
          .eq('slug', slug)
          .single()

        if (error || !therapist) {
          console.error('Therapist not found with slug:', slug)
          setNotFound(true)
          return
        }

        // Redirect to the booking page with the therapist ID
        router.replace(`/book/${therapist.id}`)
      } catch (error) {
        console.error('Error finding therapist:', error)
        setNotFound(true)
      }
    }

    findTherapist()
  }, [slug, router])

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-animated flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold mb-4">Thérapeute non trouvé</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Aucun thérapeute ne correspond à l'URL <strong>{slug}</strong>
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-animated flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Redirection en cours...</p>
      </div>
    </div>
  )
}
