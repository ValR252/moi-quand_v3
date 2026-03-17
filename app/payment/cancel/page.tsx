'use client'

/**
 * Page d'annulation de paiement PayPal
 * Le client a annulé le paiement sur PayPal
 */

import Link from 'next/link'

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-animated flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-8 text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-2xl font-bold mb-4">Paiement annulé</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Vous avez annulé le paiement PayPal. Votre réservation n'a pas été confirmée.
        </p>

        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 mb-6 border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Vous pouvez réessayer le paiement ou choisir une autre méthode de paiement (virement bancaire).
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all"
          >
            Retour à l'accueil
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-block px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
          >
            Réessayer le paiement
          </button>
        </div>
      </div>
    </div>
  )
}
