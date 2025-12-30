/**
 * Page d'accueil simple
 * Growth Strategist : Pas besoin de landing page complexe pour 10 users
 */

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-animated flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-8 text-center">
        <h1 className="text-3xl font-bold mb-4">🧘 Moi-Quand</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Prise de rendez-vous pour thérapeutes
        </p>

        <div className="space-y-3">
          <a
            href="/dashboard"
            className="block w-full bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition"
          >
            Dashboard Thérapeute
          </a>

          <a
            href="/book/demo"
            className="block w-full border-2 border-indigo-600 text-indigo-600 px-6 py-3 rounded-xl font-medium hover:bg-indigo-50 dark:hover:bg-indigo-950 transition"
          >
            Voir une page de réservation
          </a>
        </div>

        <p className="text-sm text-gray-500 mt-8">
          Version lean - 0€/mois pour 10 thérapeutes
        </p>
      </div>
    </div>
  )
}
