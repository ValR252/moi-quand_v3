/**
 * Script de debug pour comprendre pourquoi aucun créneau n'est disponible
 * Usage: node scripts/debug-availability.js
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
const testDate = '2026-01-12' // Lundi dans 9 jours

async function debugAvailability() {
  console.log('\n🔍 DEBUG DISPONIBILITÉ')
  console.log('─'.repeat(80))
  console.log(`Thérapeute: ${therapistId}`)
  console.log(`Date de test: ${testDate}`)
  console.log('─'.repeat(80))

  // 1. Check if date is a holiday
  console.log('\n1️⃣  Vérification des jours fériés')
  const { data: holidays } = await supabase
    .from('holidays')
    .select('*')
    .eq('therapist_id', therapistId)
    .eq('date', testDate)

  if (holidays && holidays.length > 0) {
    console.log('❌ C\'est un jour férié !')
    console.log('   Raison:', holidays[0])
    return
  } else {
    console.log('✅ Pas de jour férié')
  }

  // 2. Get schedule for day of week
  console.log('\n2️⃣  Vérification des horaires configurés')
  const dayOfWeek = new Date(testDate + 'T00:00:00').getDay() // 0=Dimanche
  console.log(`   Jour de la semaine: ${dayOfWeek} (${['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][dayOfWeek]})`)

  const { data: schedules, error: schedError } = await supabase
    .from('schedules')
    .select('*')
    .eq('therapist_id', therapistId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_available', true)

  if (schedError) {
    console.log('❌ Erreur lors de la récupération des horaires:', schedError.message)
    return
  }

  if (!schedules || schedules.length === 0) {
    console.log('❌ PROBLÈME TROUVÉ: Aucun horaire configuré pour ce jour')
    console.log('   Le thérapeute est fermé ce jour-là')

    // Afficher tous les horaires configurés
    console.log('\n📋 Horaires configurés pour tous les jours:')
    const { data: allSchedules } = await supabase
      .from('schedules')
      .select('*')
      .eq('therapist_id', therapistId)
      .order('day_of_week')

    if (allSchedules && allSchedules.length > 0) {
      const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
      allSchedules.forEach(s => {
        console.log(`   ${days[s.day_of_week]}: ${s.start_time} - ${s.end_time} (${s.is_available ? 'Disponible' : 'Fermé'})`)
      })
    }
    return
  }

  console.log(`✅ ${schedules.length} plage(s) horaire(s) trouvée(s):`)
  schedules.forEach(s => {
    console.log(`   ${s.start_time} - ${s.end_time}`)
  })

  // 3. Generate slots
  console.log('\n3️⃣  Génération des créneaux potentiels')
  let totalSlots = 0
  schedules.forEach(sched => {
    const [startH, startM] = sched.start_time.split(':').map(Number)
    const [endH, endM] = sched.end_time.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM
    const slotsCount = Math.floor((endMinutes - startMinutes) / 30)
    totalSlots += slotsCount
    console.log(`   ${sched.start_time}-${sched.end_time}: ${slotsCount} créneaux de 30min`)
  })
  console.log(`✅ Total: ${totalSlots} créneaux potentiels`)

  // 4. Check bookings
  console.log('\n4️⃣  Vérification des réservations existantes')
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('therapist_id', therapistId)
    .eq('date', testDate)

  if (bookings && bookings.length > 0) {
    console.log(`⚠️  ${bookings.length} réservation(s) existante(s):`)
    bookings.forEach(b => {
      console.log(`   ${b.time} - ${b.duration}min (${b.client_name})`)
    })
  } else {
    console.log('✅ Aucune réservation')
  }

  // 5. Check Google Calendar connection
  console.log('\n5️⃣  Vérification Google Calendar')
  const { data: therapist } = await supabase
    .from('therapists')
    .select('google_refresh_token, google_calendar_id')
    .eq('id', therapistId)
    .single()

  if (therapist?.google_refresh_token) {
    console.log('✅ Google Calendar connecté')
    console.log(`   Calendar ID: ${therapist.google_calendar_id || 'Non défini'}`)
  } else {
    console.log('⚠️  Google Calendar non connecté')
    console.log('   Les événements Google Calendar ne bloqueront pas les créneaux')
  }

  // 6. Check notice hours
  console.log('\n6️⃣  Vérification du délai de prévenance')
  const { data: therapistData } = await supabase
    .from('therapists')
    .select('notice_hours')
    .eq('id', therapistId)
    .single()

  const noticeHours = therapistData?.notice_hours || 48
  console.log(`   Délai configuré: ${noticeHours}h`)

  const now = new Date()
  const earliestAllowed = new Date(now.getTime() + noticeHours * 60 * 60 * 1000)
  console.log(`   Maintenant: ${now.toISOString()}`)
  console.log(`   Plus tôt possible: ${earliestAllowed.toISOString()}`)
  console.log(`   Date testée: ${testDate}T09:00:00`)

  const testDateTime = new Date(`${testDate}T09:00:00`)
  if (testDateTime < earliestAllowed) {
    console.log(`❌ PROBLÈME: La date testée est trop proche (< ${noticeHours}h)`)
  } else {
    console.log(`✅ La date testée est assez loin dans le futur`)
  }

  // Summary
  console.log('\n' + '─'.repeat(80))
  console.log('📊 RÉSUMÉ')
  console.log('─'.repeat(80))
  console.log(`Horaires configurés: ${schedules?.length > 0 ? '✅' : '❌'}`)
  console.log(`Créneaux générés: ${totalSlots > 0 ? `✅ ${totalSlots}` : '❌ 0'}`)
  console.log(`Réservations bloquantes: ${bookings?.length || 0}`)
  console.log(`Google Calendar: ${therapist?.google_refresh_token ? '✅ Connecté' : '⚠️  Non connecté'}`)
  console.log(`Délai de prévenance OK: ${testDateTime >= earliestAllowed ? '✅' : '❌'}`)
}

debugAvailability().catch(console.error)
