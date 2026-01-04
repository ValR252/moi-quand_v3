/**
 * Script pour tester l'API d'availability
 * Usage: node scripts/test-availability.js
 */

const fs = require('fs')
const path = require('path')

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) {
    process.env[key.trim()] = value.trim()
  }
})

const therapistId = 'da067f75-f9c1-45e4-bece-d1d7f5c51e59'

async function testAvailability() {
  console.log('\n🧪 Test de l\'API d\'availability\n')
  console.log('─'.repeat(80))

  // Test avec la date d'aujourd'hui
  const today = new Date().toISOString().split('T')[0]

  console.log(`\n📅 Test pour la date: ${today}`)
  console.log(`👤 Therapist ID: ${therapistId}`)
  console.log(`⏱️  Durée de session: 60 minutes\n`)

  try {
    const url = `http://localhost:3000/api/availability/${therapistId}?date=${today}&duration=60`
    console.log(`🌐 URL: ${url}\n`)

    const response = await fetch(url)

    if (!response.ok) {
      console.error(`❌ Erreur HTTP: ${response.status} ${response.statusText}`)
      const text = await response.text()
      console.error('Réponse:', text)
      return
    }

    const data = await response.json()

    console.log('✅ Réponse de l\'API:')
    console.log('─'.repeat(80))
    console.log(JSON.stringify(data, null, 2))
    console.log('─'.repeat(80))
    console.log(`\n📊 Résumé: ${data.count} créneaux disponibles`)

    if (data.availableSlots && data.availableSlots.length > 0) {
      console.log('\n⏰ Créneaux disponibles:')
      data.availableSlots.forEach((slot, index) => {
        console.log(`   ${index + 1}. ${slot}`)
      })
    } else {
      console.log('\n⚠️  Aucun créneau disponible pour cette date')
      console.log('💡 Raisons possibles:')
      console.log('   - Pas d\'horaires configurés pour ce jour de la semaine')
      console.log('   - Tous les créneaux sont occupés (réservations ou Google Calendar)')
      console.log('   - C\'est un jour férié')
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    console.log('\n💡 Assure-toi que le serveur dev tourne avec: npm run dev')
  }
}

testAvailability()
