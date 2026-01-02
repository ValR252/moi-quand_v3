'use client'

/**
 * Page de connexion thérapeute
 * Frontend Developer: Authentification avec animations
 */

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      window.location.href = '/dashboard'
    } else {
      // Inscription
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (authData.user) {
        // Créer le profil thérapeute
        const { error: profileError } = await supabase.from('therapists').insert({
          id: authData.user.id,
          email: authData.user.email!,
          name: email.split('@')[0], // Nom par défaut à partir de l'email
        })

        if (profileError) {
          setError('Erreur lors de la création du profil')
          setLoading(false)
          return
        }

        window.location.href = '/dashboard'
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-animated flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-8 animate-[fadeIn_0.5s_ease-out]">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🧘 Moi-Quand</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {mode === 'login' ? 'Connexion thérapeute' : 'Créer un compte thérapeute'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm animate-[shake_0.3s_ease-in-out]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="••••••••"
              minLength={6}
            />
            {mode === 'signup' && (
              <p className="text-xs text-gray-500 mt-2">Minimum 6 caractères</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                Chargement...
              </span>
            ) : mode === 'login' ? (
              'Se connecter'
            ) : (
              'Créer mon compte'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setError('')
            }}
            className="text-sm text-indigo-600 hover:text-indigo-700 transition"
          >
            {mode === 'login' ? (
              <>
                Pas encore de compte ? <span className="font-medium">Créer un compte</span>
              </>
            ) : (
              <>
                Déjà un compte ? <span className="font-medium">Se connecter</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <a
            href="/"
            className="block text-center text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition"
          >
            ← Retour à l'accueil
          </a>
        </div>

        <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-950 rounded-xl">
          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
            <strong>Version lean</strong> - Maximum 10 thérapeutes<br />
            Totalement gratuit (0€/mois)
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
      `}</style>
    </div>
  )
}
