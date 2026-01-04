/**
 * Script pour récupérer l'ID du thérapeute
 * Usage: node scripts/get-therapist-id.js
 */

const { createClient } = require('@supabase/supabase-js')
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function getTherapistId() {
  try {
    const { data, error } = await supabase
      .from('therapists')
      .select('id, name, email, google_refresh_token, google_calendar_id')
      .limit(10)

    if (error) {
      console.error('❌ Erreur:', error.message)
      return
    }

    if (!data || data.length === 0) {
      console.log('⚠️  Aucun thérapeute trouvé dans la base de données')
      return
    }

    console.log('\n📋 Thérapeutes trouvés:')
    console.log('─'.repeat(80))

    data.forEach((therapist, index) => {
      console.log(`\n${index + 1}. ${therapist.name || 'Sans nom'}`)
      console.log(`   ID: ${therapist.id}`)
      console.log(`   Email: ${therapist.email || 'Non défini'}`)
      console.log(`   Google Calendar: ${therapist.google_refresh_token ? '✅ Connecté' : '❌ Non connecté'}`)
      if (therapist.google_calendar_id) {
        console.log(`   Calendar ID: ${therapist.google_calendar_id}`)
      }
      console.log(`   URL de réservation: https://moi-quand.com/book/${therapist.id}`)
    })

    console.log('\n' + '─'.repeat(80))
    console.log('\n💡 Utilise l\'URL de réservation ci-dessus pour tester!')

  } catch (error) {
    console.error('❌ Erreur inattendue:', error)
  }
}

getTherapistId()
