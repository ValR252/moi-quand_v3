/**
 * Script pour créer la table schedules
 * Usage: node scripts/create-schedules-table.js
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

const therapistId = 'da067f75-f9c1-45e4-bece-d1d7f5c51e59'

async function createSchedulesTable() {
  console.log('\n🔧 Création de la table schedules...\n')
  console.log('─'.repeat(80))

  try {
    // Load the SQL file
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260103_create_schedules_table.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')

    console.log('📄 SQL chargé depuis:', sqlPath)
    console.log('\n⚠️  ATTENTION: Cette opération va exécuter du SQL directement')
    console.log('   Si la table existe déjà, certaines opérations échoueront (c\'est normal)\n')

    // Execute via RPC (if available) or manual inserts
    // Since we can't execute raw SQL directly, let's just create the schedules manually

    console.log('🔨 Création des horaires par défaut (Lundi-Vendredi 9h-17h)...\n')

    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']

    for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) {
      const { data, error } = await supabase
        .from('schedules')
        .insert({
          therapist_id: therapistId,
          day_of_week: dayOfWeek,
          start_time: '09:00',
          end_time: '17:00',
          is_available: true
        })
        .select()

      if (error) {
        // Check if it's a "table doesn't exist" error
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.error('❌ La table "schedules" n\'existe pas encore')
          console.error('   Tu dois la créer manuellement dans Supabase SQL Editor')
          console.error('\n📋 Copie ce SQL dans le SQL Editor de Supabase:\n')
          console.log('─'.repeat(80))
          console.log(sql)
          console.log('─'.repeat(80))
          return
        } else if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
          console.log(`✅ ${days[dayOfWeek - 1]}: Horaire déjà existant (ignoré)`)
        } else {
          console.error(`❌ ${days[dayOfWeek - 1]}: Erreur - ${error.message}`)
        }
      } else {
        console.log(`✅ ${days[dayOfWeek - 1]}: Horaire créé avec succès`)
      }
    }

    console.log('\n' + '─'.repeat(80))
    console.log('✅ Terminé ! Vérifie les horaires avec: node scripts/check-therapist-data.js')

  } catch (error) {
    console.error('❌ Erreur inattendue:', error.message)
  }
}

createSchedulesTable()
