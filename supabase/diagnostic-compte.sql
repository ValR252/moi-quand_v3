-- Script de diagnostic pour vérifier le compte v.renfer@gmail.com
-- Exécutez ce script pour identifier le problème

DO $$
DECLARE
  v_email text := 'v.renfer@gmail.com';
  v_auth_user_id uuid;
  v_therapist_exists boolean;
  v_therapist_id uuid;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '🔍 DIAGNOSTIC DU COMPTE: %', v_email;
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- 1. Vérifier si l'utilisateur existe dans auth.users
  SELECT id INTO v_auth_user_id FROM auth.users WHERE email = v_email;

  IF v_auth_user_id IS NULL THEN
    RAISE NOTICE '❌ PROBLÈME 1: Utilisateur NON TROUVÉ dans auth.users';
    RAISE NOTICE '   → Vous devez créer l''utilisateur via Authentication → Users';
    RAISE NOTICE '   → Email: %', v_email;
    RAISE NOTICE '   → Password: Test1234!';
    RAISE NOTICE '   → Auto Confirm: OUI';
  ELSE
    RAISE NOTICE '✅ Utilisateur trouvé dans auth.users';
    RAISE NOTICE '   → User ID: %', v_auth_user_id;
    RAISE NOTICE '   → Email: %', v_email;
  END IF;

  RAISE NOTICE '';

  -- 2. Vérifier si le profil thérapeute existe
  IF v_auth_user_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM therapists WHERE id = v_auth_user_id) INTO v_therapist_exists;

    IF NOT v_therapist_exists THEN
      RAISE NOTICE '❌ PROBLÈME 2: Profil thérapeute NON TROUVÉ dans la table therapists';
      RAISE NOTICE '   → L''utilisateur existe mais pas son profil';
      RAISE NOTICE '   → Exécutez: create-test-account-simple.sql';
    ELSE
      SELECT id INTO v_therapist_id FROM therapists WHERE id = v_auth_user_id;
      RAISE NOTICE '✅ Profil thérapeute trouvé';
      RAISE NOTICE '   → Therapist ID: %', v_therapist_id;

      -- Afficher les détails du thérapeute
      DECLARE
        v_name text;
        v_title text;
      BEGIN
        SELECT name, title INTO v_name, v_title FROM therapists WHERE id = v_therapist_id;
        RAISE NOTICE '   → Nom: %', v_name;
        RAISE NOTICE '   → Titre: %', v_title;
      END;
    END IF;
  END IF;

  RAISE NOTICE '';

  -- 3. Vérifier les sessions
  IF v_auth_user_id IS NOT NULL AND v_therapist_exists THEN
    DECLARE
      v_session_count int;
    BEGIN
      SELECT COUNT(*) INTO v_session_count FROM sessions WHERE therapist_id = v_auth_user_id;

      IF v_session_count = 0 THEN
        RAISE NOTICE '⚠️  ATTENTION: Aucune session créée';
        RAISE NOTICE '   → Le thérapeute n''a pas de sessions disponibles';
      ELSE
        RAISE NOTICE '✅ Sessions: % session(s) trouvée(s)', v_session_count;
      END IF;
    END;
  END IF;

  RAISE NOTICE '';

  -- 4. Vérifier les colonnes Google Calendar
  DECLARE
    v_has_google_columns boolean;
  BEGIN
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'therapists'
      AND column_name = 'google_access_token'
    ) INTO v_has_google_columns;

    IF NOT v_has_google_columns THEN
      RAISE NOTICE '❌ PROBLÈME 3: Colonnes Google Calendar MANQUANTES';
      RAISE NOTICE '   → Exécutez: migration-google-calendar.sql';
    ELSE
      RAISE NOTICE '✅ Colonnes Google Calendar présentes';
    END IF;
  END;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '📋 RÉSUMÉ';
  RAISE NOTICE '═══════════════════════════════════════════════════════';

  IF v_auth_user_id IS NULL THEN
    RAISE NOTICE '🔴 STATUT: ÉCHEC - Utilisateur manquant';
    RAISE NOTICE '';
    RAISE NOTICE '🛠️  ACTION REQUISE:';
    RAISE NOTICE '1. Allez dans Supabase → Authentication → Users';
    RAISE NOTICE '2. Cliquez sur "Add User"';
    RAISE NOTICE '3. Email: %', v_email;
    RAISE NOTICE '4. Password: Test1234!';
    RAISE NOTICE '5. Cochez "Auto Confirm User"';
    RAISE NOTICE '6. Réexécutez create-test-account-simple.sql';
  ELSIF NOT v_therapist_exists THEN
    RAISE NOTICE '🟠 STATUT: INCOMPLET - Profil manquant';
    RAISE NOTICE '';
    RAISE NOTICE '🛠️  ACTION REQUISE:';
    RAISE NOTICE '1. Exécutez: create-test-account-simple.sql';
    RAISE NOTICE '   (Le script créera automatiquement le profil)';
  ELSE
    RAISE NOTICE '🟢 STATUT: OK - Compte complet';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Vous pouvez vous connecter avec:';
    RAISE NOTICE '   → Email: %', v_email;
    RAISE NOTICE '   → Password: Test1234!';
    RAISE NOTICE '   → URL: http://localhost:3000/login';
  END IF;

  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- Afficher aussi les données brutes pour debug
SELECT
  '=== AUTH.USERS ===' as section,
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'v.renfer@gmail.com'

UNION ALL

SELECT
  '=== THERAPISTS ===' as section,
  id::text,
  email,
  name,
  created_at::text
FROM therapists
WHERE email = 'v.renfer@gmail.com'

UNION ALL

SELECT
  '=== FIN ===' as section,
  NULL, NULL, NULL, NULL;
