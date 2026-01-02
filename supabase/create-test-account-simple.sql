-- Script simplifié pour créer un profil thérapeute de test
-- v.renfer@gmail.com / Test1234!

-- ÉTAPE 1: Créer l'utilisateur via l'interface Supabase (OBLIGATOIRE)
-- 1. Allez dans Supabase Dashboard → Authentication → Users
-- 2. Cliquez sur "Add User" (bouton vert)
-- 3. Remplissez:
--    - Email: v.renfer@gmail.com
--    - Password: Test1234!
--    - Cochez "Auto Confirm User"
-- 4. Cliquez sur "Create User"
-- 5. COPIEZ L'UUID généré (il ressemble à: 12345678-1234-1234-1234-123456789012)

-- ÉTAPE 2: Une fois l'utilisateur créé, exécutez ce script
-- Remplacez 'VOTRE_USER_ID_ICI' par l'UUID copié ci-dessus

-- Variables à personnaliser
DO $$
DECLARE
  v_user_id uuid;
  v_email text := 'v.renfer@gmail.com';
BEGIN
  -- Récupérer l'ID de l'utilisateur depuis auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;

  -- Vérifier que l'utilisateur existe
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur % non trouvé dans auth.users. Créez d''abord l''utilisateur via Authentication → Users → Add User', v_email;
  END IF;

  RAISE NOTICE 'Utilisateur trouvé avec ID: %', v_user_id;

  -- Créer ou mettre à jour le profil thérapeute
  INSERT INTO therapists (
    id,
    email,
    name,
    title,
    photo_url,
    bio,
    iban,
    created_at
  )
  VALUES (
    v_user_id,
    v_email,
    'Valentin Renfer',
    'Thérapeute Test',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    'Compte de test pour l''intégration Google Calendar. Spécialiste en thérapie moderne.',
    'CH93 0076 2011 6238 5295 7',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    title = EXCLUDED.title,
    photo_url = EXCLUDED.photo_url,
    bio = EXCLUDED.bio,
    email = EXCLUDED.email;

  RAISE NOTICE '✅ Profil thérapeute créé/mis à jour';

  -- Supprimer les anciennes sessions pour recommencer à zéro
  DELETE FROM sessions WHERE therapist_id = v_user_id;

  -- Créer les sessions de test
  INSERT INTO sessions (therapist_id, label, duration, price, enabled)
  VALUES
    (v_user_id, 'Consultation Standard', 60, 120, true),
    (v_user_id, 'Séance Approfondie', 90, 160, true),
    (v_user_id, 'Première Consultation', 45, 100, true);

  RAISE NOTICE '✅ Sessions créées (3 sessions)';

  -- Supprimer les anciens horaires pour recommencer à zéro
  DELETE FROM schedule WHERE therapist_id = v_user_id;

  -- Créer les horaires (Lundi à Vendredi: 9h-17h)
  INSERT INTO schedule (therapist_id, day_of_week, start_time, end_time, enabled)
  VALUES
    (v_user_id, 1, '09:00', '17:00', true), -- Lundi
    (v_user_id, 2, '09:00', '17:00', true), -- Mardi
    (v_user_id, 3, '09:00', '17:00', true), -- Mercredi
    (v_user_id, 4, '09:00', '17:00', true), -- Jeudi
    (v_user_id, 5, '09:00', '17:00', true); -- Vendredi

  RAISE NOTICE '✅ Horaires créés (Lun-Ven 9h-17h)';

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ COMPTE DE TEST CRÉÉ AVEC SUCCÈS !';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE 'Email: %', v_email;
  RAISE NOTICE 'Mot de passe: Test1234!';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE '';
  RAISE NOTICE 'Vous pouvez maintenant:';
  RAISE NOTICE '1. Aller sur http://localhost:3000/login';
  RAISE NOTICE '2. Vous connecter avec ces identifiants';
  RAISE NOTICE '3. Connecter Google Calendar dans le dashboard';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;
