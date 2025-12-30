-- 🚀 Moi-Quand LEAN - Schéma SQL Simplifié
-- Pour 10 thérapeutes maximum - 0€/mois
-- Backend Engineer + DevOps Engineer

-- Table thérapeutes (SIMPLIFIÉE)
CREATE TABLE IF NOT EXISTS therapists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  title VARCHAR DEFAULT 'Thérapeute',
  photo_url TEXT,
  bio TEXT,
  iban VARCHAR, -- Pour virements
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions proposées (SIMPLIFIÉE)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE NOT NULL,
  label VARCHAR NOT NULL DEFAULT 'Séance',
  duration INT NOT NULL DEFAULT 60, -- minutes
  price DECIMAL NOT NULL DEFAULT 100,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Horaires (ULTRA-SIMPLIFIÉ : 1 plage par jour)
CREATE TABLE IF NOT EXISTS schedule (
  therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE,
  day_of_week INT CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME,
  end_time TIME,
  enabled BOOLEAN DEFAULT true,
  PRIMARY KEY (therapist_id, day_of_week)
);

-- Congés
CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  label VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Réservations (SIMPLIFIÉE : champs plats)
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES sessions(id),

  -- Client info (plat, pas de JSONB)
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  phone VARCHAR,

  -- RDV
  date DATE NOT NULL,
  time TIME NOT NULL,

  -- Paiement (virement uniquement)
  payment_status VARCHAR DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),

  created_at TIMESTAMP DEFAULT NOW()
);

-- Row Level Security (SÉCURITÉ)
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policies : Les thérapeutes voient SEULEMENT leurs données
CREATE POLICY "Therapists can view own data" ON therapists
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Therapists can update own data" ON therapists
  FOR UPDATE USING (auth.uid() = id);

-- Sessions
CREATE POLICY "Therapists can manage own sessions" ON sessions
  FOR ALL USING (therapist_id = auth.uid());

-- Schedule
CREATE POLICY "Therapists can manage own schedule" ON schedule
  FOR ALL USING (therapist_id = auth.uid());

-- Holidays
CREATE POLICY "Therapists can manage own holidays" ON holidays
  FOR ALL USING (therapist_id = auth.uid());

-- Bookings : Thérapeutes voient leurs RDV, clients peuvent créer
CREATE POLICY "Therapists can view own bookings" ON bookings
  FOR SELECT USING (therapist_id = auth.uid());

CREATE POLICY "Therapists can update own bookings" ON bookings
  FOR UPDATE USING (therapist_id = auth.uid());

CREATE POLICY "Anyone can create bookings" ON bookings
  FOR INSERT WITH CHECK (true);

-- Fonction helper : Obtenir le thérapeute par email
CREATE OR REPLACE FUNCTION get_therapist_by_email(therapist_email TEXT)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  title VARCHAR,
  photo_url TEXT,
  bio TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.name, t.title, t.photo_url, t.bio
  FROM therapists t
  WHERE t.email = therapist_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_bookings_therapist ON bookings(therapist_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_sessions_therapist ON sessions(therapist_id);

-- Vue pour stats thérapeute (optionnel)
CREATE OR REPLACE VIEW therapist_stats AS
SELECT
  t.id,
  t.name,
  COUNT(b.id) as total_bookings,
  COUNT(b.id) FILTER (WHERE b.payment_status = 'paid') as paid_bookings,
  SUM(s.price) FILTER (WHERE b.payment_status = 'paid') as total_revenue
FROM therapists t
LEFT JOIN bookings b ON t.id = b.therapist_id
LEFT JOIN sessions s ON b.session_id = s.id
GROUP BY t.id, t.name;

-- Données de démo (optionnel)
INSERT INTO therapists (id, email, name, title, photo_url, bio, iban)
VALUES
  (gen_random_uuid(), 'demo@therapie.ch', 'Dr. Marcel Dupont', 'Psychothérapeute',
   'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop',
   'Spécialiste en thérapie cognitivo-comportementale. 15 ans d''expérience.',
   'CH56 0483 5012 3456 7800 9')
ON CONFLICT (email) DO NOTHING;

-- Succès !
SELECT 'Schema created successfully! 🎉' as status;
