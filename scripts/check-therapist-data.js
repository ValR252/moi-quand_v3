/**
 * Script pour vérifier toutes les données du thérapeute
 * Usage: node scripts/check-therapist-data.js
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

async function checkTherapistData() {
  console.log('\n🔍 Vérification complète des données du thérapeute\n')
  console.log('─'.repeat(80))

  try {
    // 1. Check therapist
    console.log('\n1️⃣  THÉRAPEUTE')
    console.log('─'.repeat(80))
    const { data: therapist, error: therapistError } = await supabase
      .from('therapists')
      .select('*')
      .eq('id', therapistId)
      .single()

    if (therapistError) {
      console.error('❌ Erreur:', therapistError.message)
    } else if (!therapist) {
      console.error('❌ Thérapeute non trouvé')
    } else {
      console.log('✅ Thérapeute trouvé')
      console.log(`   Nom: ${therapist.name}`)
      console.log(`   Email: ${therapist.email}`)
      console.log(`   Google Calendar connecté: ${therapist.google_refresh_token ? 'OUI' : 'NON'}`)
      console.log(`   Google Calendar ID: ${therapist.google_calendar_id || 'Non défini'}`)
    }

    // 2. Check sessions
    console.log('\n2️⃣  SÉANCES')
    console.log('─'.repeat(80))
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('therapist_id', therapistId)
      .eq('enabled', true)

    if (sessionsError) {
      console.error('❌ Erreur:', sessionsError.message)
    } else if (!sessions || sessions.length === 0) {
      console.error('❌ Aucune séance active trouvée')
      console.log('\n💡 Raison du mode démo: Pas de séances configurées')
      console.log('   Solution: Ajoute des séances depuis le dashboard')
    } else {
      console.log(`✅ ${sessions.length} séance(s) trouvée(s)`)
      sessions.forEach((session, index) => {
        console.log(`\n   ${index + 1}. ${session.name}`)
        console.log(`      Durée: ${session.duration} min`)
        console.log(`      Prix: ${session.price} CHF`)
        console.log(`      Activée: ${session.enabled ? 'OUI' : 'NON'}`)
      })
    }

    // 3. Check schedules
    console.log('\n3️⃣  HORAIRES')
    console.log('─'.repeat(80))
    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .select('*')
      .eq('therapist_id', therapistId)

    if (schedulesError) {
      console.error('❌ Erreur:', schedulesError.message)
    } else if (!schedules || schedules.length === 0) {
      console.log('⚠️  Aucun horaire configuré')
      console.log('   Note: Sans horaires, aucun créneau ne sera disponible')
    } else {
      console.log(`✅ ${schedules.length} horaire(s) configuré(s)`)
      const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
      schedules.forEach(schedule => {
        if (schedule.is_available) {
          console.log(`   ${days[schedule.day_of_week]}: ${schedule.start_time} - ${schedule.end_time}`)
        }
      })
    }

    // 4. Check bookings
    console.log('\n4️⃣  RÉSERVATIONS')
    console.log('─'.repeat(80))
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('therapist_id', therapistId)
      .order('date', { ascending: false })
      .limit(5)

    if (bookingsError) {
      console.error('❌ Erreur:', bookingsError.message)
    } else {
      console.log(`📊 ${bookings?.length || 0} réservation(s) récente(s)`)
      if (bookings && bookings.length > 0) {
        bookings.forEach((booking, index) => {
          console.log(`   ${index + 1}. ${booking.date} à ${booking.time} - ${booking.client_name}`)
        })
      }
    }

    // Summary
    console.log('\n' + '─'.repeat(80))
    console.log('\n📊 RÉSUMÉ')
    console.log('─'.repeat(80))

    if (therapist && sessions && sessions.length > 0) {
      console.log('✅ Toutes les données nécessaires sont présentes')
      console.log('✅ La page de réservation devrait fonctionner en mode normal')
      console.log(`\n🔗 URL de test: https://moi-quand.com/book/${therapistId}`)

      if (!therapist.google_refresh_token) {
        console.log('\n⚠️  Google Calendar non connecté')
        console.log('   Les événements Google Calendar ne bloqueront pas les créneaux')
        console.log('   Va sur le dashboard pour connecter Google Calendar')
      }
    } else {
      console.log('❌ Données manquantes détectées')
      if (!therapist) {
        console.log('   - Thérapeute introuvable')
      }
      if (!sessions || sessions.length === 0) {
        console.log('   - Aucune séance active')
      }
    }

  } catch (error) {
    console.error('❌ Erreur inattendue:', error)
  }
}

checkTherapistData()
