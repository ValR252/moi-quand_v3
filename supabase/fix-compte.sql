-- Script de FIX rapide pour le compte v.renfer@gmail.com
-- Ce script force la création/correction du profil thérapeute

DO $$
DECLARE
  v_email text := 'v.renfer@gmail.com';
  v_user_id uuid;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '🔧 FIX DU COMPTE: %', v_email;
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- 1. Récupérer ou créer l'ID utilisateur
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '❌ ERREUR: L''utilisateur % n''existe pas dans auth.users. Créez-le d''abord via Authentication → Users', v_email;
  END IF;

  RAISE NOTICE '✅ Utilisateur trouvé: %', v_user_id;

  -- 2. Supprimer l'ancien profil s'il existe (pour repartir à zéro)
  DELETE FROM bookings WHERE therapist_id = v_user_id;
  DELETE FROM sessions WHERE therapist_id = v_user_id;
  DELETE FROM schedule WHERE therapist_id = v_user_id;
  DELETE FROM holidays WHERE therapist_id = v_user_id;
  DELETE FROM therapists WHERE id = v_user_id;

  RAISE NOTICE '🗑️  Anciennes données supprimées';

  -- 3. Créer le profil thérapeute
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
  );

  RAISE NOTICE '✅ Profil thérapeute créé';

  -- 4. Créer les sessions
  INSERT INTO sessions (therapist_id, label, duration, price, enabled)
  VALUES
    (v_user_id, 'Consultation Standard', 60, 120, true),
    (v_user_id, 'Séance Approfondie', 90, 160, true),
    (v_user_id, 'Première Consultation', 45, 100, true);

  RAISE NOTICE '✅ 3 sessions créées';

  -- 5. Créer les horaires
  INSERT INTO schedule (therapist_id, day_of_week, start_time, end_time, enabled)
  VALUES
    (v_user_id, 1, '09:00', '17:00', true),
    (v_user_id, 2, '09:00', '17:00', true),
    (v_user_id, 3, '09:00', '17:00', true),
    (v_user_id, 4, '09:00', '17:00', true),
    (v_user_id, 5, '09:00', '17:00', true);

  RAISE NOTICE '✅ Horaires créés (Lun-Ven 9h-17h)';

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '🎉 COMPTE CORRIGÉ AVEC SUCCÈS !';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Email: %', v_email;
  RAISE NOTICE 'Password: Test1234!';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 PROCHAINES ÉTAPES:';
  RAISE NOTICE '1. Déconnectez-vous du dashboard (si connecté)';
  RAISE NOTICE '2. Allez sur: http://localhost:3000/login';
  RAISE NOTICE '3. Connectez-vous avec les identifiants ci-dessus';
  RAISE NOTICE '4. Vous ne devriez PLUS voir "Mode Démo"';
  RAISE NOTICE '5. La section "Google Calendar" devrait être visible';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;
