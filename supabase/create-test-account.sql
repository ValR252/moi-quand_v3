-- Créer un compte thérapeute de test pour v.renfer@gmail.com
-- Mot de passe: Test1234!

-- IMPORTANT: Ce script utilise un UUID fixe pour le compte de test
-- Cela permet de créer facilement le profil sans avoir à gérer l'auth
-- Vous devrez créer l'utilisateur manuellement dans Supabase Auth avec cet UUID

-- UUID fixe pour le compte de test
-- VOUS DEVEZ d'abord créer cet utilisateur dans Supabase Auth UI:
-- 1. Allez dans Authentication → Users → Add User
-- 2. Email: v.renfer@gmail.com
-- 3. Password: Test1234!
-- 4. Auto Confirm User: OUI
-- 5. Notez l'UUID généré
-- 6. Remplacez '00000000-0000-0000-0000-000000000001' ci-dessous par cet UUID

-- OU utilisez cette approche alternative:
-- Créer directement le profil avec un UUID personnalisé
-- et l'utilisateur pourra s'inscrire normalement

-- Pour obtenir l'ID de l'utilisateur existant:
DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Récupérer l'ID de l'utilisateur v.renfer@gmail.com
  SELECT id INTO user_id FROM auth.users WHERE email = 'v.renfer@gmail.com';

  -- Créer le profil thérapeute s'il n'existe pas
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
    user_id,
    'v.renfer@gmail.com',
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
    bio = EXCLUDED.bio;

  RAISE NOTICE 'Compte créé avec succès pour v.renfer@gmail.com (ID: %)', user_id;
END $$;

-- 3. Créer quelques sessions de test pour ce thérapeute
DO $$
DECLARE
  user_id uuid;
BEGIN
  SELECT id INTO user_id FROM auth.users WHERE email = 'v.renfer@gmail.com';

  -- Séance 1: Consultation standard
  INSERT INTO sessions (therapist_id, label, duration, price, enabled)
  VALUES (user_id, 'Consultation Standard', 60, 120, true)
  ON CONFLICT DO NOTHING;

  -- Séance 2: Séance longue
  INSERT INTO sessions (therapist_id, label, duration, price, enabled)
  VALUES (user_id, 'Séance Approfondie', 90, 160, true)
  ON CONFLICT DO NOTHING;

  -- Séance 3: Première consultation
  INSERT INTO sessions (therapist_id, label, duration, price, enabled)
  VALUES (user_id, 'Première Consultation', 45, 100, true)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Sessions créées avec succès';
END $$;

-- 4. Créer un horaire de disponibilité simple
DO $$
DECLARE
  user_id uuid;
BEGIN
  SELECT id INTO user_id FROM auth.users WHERE email = 'v.renfer@gmail.com';

  -- Lundi à Vendredi: 9h-17h
  INSERT INTO schedule (therapist_id, day_of_week, start_time, end_time, enabled)
  VALUES
    (user_id, 1, '09:00', '17:00', true), -- Lundi
    (user_id, 2, '09:00', '17:00', true), -- Mardi
    (user_id, 3, '09:00', '17:00', true), -- Mercredi
    (user_id, 4, '09:00', '17:00', true), -- Jeudi
    (user_id, 5, '09:00', '17:00', true)  -- Vendredi
  ON CONFLICT (therapist_id, day_of_week) DO NOTHING;

  RAISE NOTICE 'Horaires créés avec succès';
END $$;

-- Confirmation finale
SELECT
  '✅ Compte de test créé avec succès!' as status,
  'Email: v.renfer@gmail.com' as email,
  'Mot de passe: Test1234!' as password,
  'Vous pouvez maintenant vous connecter sur http://localhost:3000/login' as next_step;
