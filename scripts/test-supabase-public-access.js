/**
 * Script pour tester l'accès public aux données Supabase
 * Usage: node scripts/test-supabase-public-access.js
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

// Create client with ANON key (like the frontend)
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const therapistId = 'da067f75-f9c1-45e4-bece-d1d7f5c51e59'

async function testPublicAccess() {
  console.log('\n🔓 Test d\'accès PUBLIC aux données Supabase')
  console.log('   (Utilisation de la clé ANON comme le site web)\n')
  console.log('─'.repeat(80))

  try {
    // 1. Test therapist access
    console.log('\n1️⃣  Test accès au thérapeute')
    console.log('─'.repeat(80))
    const { data: therapist, error: therapistError } = await supabaseAnon
      .from('therapists')
      .select('*')
      .eq('id', therapistId)
      .single()

    if (therapistError) {
      console.error('❌ ERREUR:', therapistError.message)
      console.error('   Code:', therapistError.code)
      console.error('   Details:', therapistError.details)
      console.error('\n💡 Problème potentiel: Les policies RLS bloquent la lecture publique')
    } else if (!therapist) {
      console.error('❌ Thérapeute non trouvé (mais pas d\'erreur)')
    } else {
      console.log('✅ Thérapeute accessible publiquement')
      console.log(`   Nom: ${therapist.name}`)
    }

    // 2. Test sessions access
    console.log('\n2️⃣  Test accès aux séances')
    console.log('─'.repeat(80))
    const { data: sessions, error: sessionsError } = await supabaseAnon
      .from('sessions')
      .select('*')
      .eq('therapist_id', therapistId)
      .eq('enabled', true)

    if (sessionsError) {
      console.error('❌ ERREUR:', sessionsError.message)
      console.error('   Code:', sessionsError.code)
    } else {
      console.log(`✅ ${sessions?.length || 0} séance(s) accessibles publiquement`)
    }

    // 3. Test schedules access
    console.log('\n3️⃣  Test accès aux horaires')
    console.log('─'.repeat(80))
    const { data: schedules, error: schedulesError } = await supabaseAnon
      .from('schedules')
      .select('*')
      .eq('therapist_id', therapistId)

    if (schedulesError) {
      console.error('❌ ERREUR:', schedulesError.message)
      console.error('   Code:', schedulesError.code)
    } else {
      console.log(`✅ ${schedules?.length || 0} horaire(s) accessibles publiquement`)
    }

    // Summary
    console.log('\n' + '─'.repeat(80))
    console.log('\n📊 DIAGNOSTIC')
    console.log('─'.repeat(80))

    if (therapistError) {
      console.log('\n❌ PROBLÈME IDENTIFIÉ: Le thérapeute n\'est pas accessible publiquement')
      console.log('   C\'est pour ça que la page affiche le mode démo !')
      console.log('\n🔧 SOLUTION: Ajouter une policy RLS pour permettre la lecture publique')
      console.log('\n   SQL à exécuter dans Supabase SQL Editor:')
      console.log('   ```sql')
      console.log('   CREATE POLICY "Therapists are viewable by everyone"')
      console.log('     ON public.therapists FOR SELECT')
      console.log('     USING (true);')
      console.log('   ```')
    } else {
      console.log('\n✅ Accès public fonctionnel')
      console.log('   Le problème vient d\'ailleurs...')
    }

  } catch (error) {
    console.error('❌ Erreur inattendue:', error)
  }
}

testPublicAccess()
