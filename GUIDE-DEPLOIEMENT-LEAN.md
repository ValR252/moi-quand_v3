# 🚀 Guide de Déploiement LEAN - Moi-Quand v2b

> Version ultra-simplifiée pour 10 thérapeutes maximum
> **Coût : 0€/mois pour toujours !**

---

## 🎯 Philosophie

Cette version est conçue pour :
- ✅ **10 thérapeutes maximum**
- ✅ **0€/mois de coûts**
- ✅ **Fonctionnalités essentielles uniquement**
- ✅ **Simple à maintenir**

---

## 📋 Ce qui est inclus

### ✅ Fonctionnalités (v2b)

- Authentification (email + mot de passe)
- Profil thérapeute (photo, nom, bio)
- Gestion des séances (durée, prix)
- Disponibilités (horaires par jour)
- Congés
- Page de réservation client
- Dashboard avec liste des RDV
- **Paiement : Virement bancaire uniquement** (pas de Stripe)
- Emails automatiques (Resend gratuit)
- Dark mode

### ❌ Fonctionnalités retirées (vs v2 complète)

- ~~Stripe Connect / Billing~~ → Trop complexe pour 10 utilisateurs
- ~~Google Calendar sync~~ → Feature nice-to-have
- ~~PayPal~~ → Virement suffit
- ~~Landing page marketing~~ → Pas besoin de marketing pour 10 users
- ~~Blog SEO~~ → Inutile
- ~~Analytics avancées~~ → Supabase Dashboard suffit
- ~~Tests E2E automatisés~~ → Tests manuels suffisent

---

## 💰 Coûts estimés

| Service | Gratuit jusqu'à | Avec 10 thérapeutes |
|---------|-----------------|---------------------|
| **Vercel** | 100GB/mois | 0€ (largement en-dessous) |
| **Supabase** | 500MB DB | 0€ (10 users = ~5MB) |
| **Resend** | 3000 emails/mois | 0€ (10 users × 30 emails = 300/mois) |

**Total : 0€/mois pour toujours** 🎉

---

## 🚀 Installation (30 minutes)

### Étape 1 : Supabase (10 min)

1. Créez un compte sur [supabase.com](https://supabase.com)
2. Créez un projet : `moi-quand-lean`
3. Allez dans **SQL Editor** et exécutez :

```sql
-- Table thérapeutes (simplifiée)
CREATE TABLE therapists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  title VARCHAR,
  photo_url TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions (séances proposées)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE,
  label VARCHAR NOT NULL,
  duration INT NOT NULL,
  price DECIMAL NOT NULL,
  enabled BOOLEAN DEFAULT true
);

-- Horaires simplifiés (un seul type par jour)
CREATE TABLE schedule (
  therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE,
  day_of_week INT CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME,
  end_time TIME,
  PRIMARY KEY (therapist_id, day_of_week)
);

-- Congés
CREATE TABLE holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  label VARCHAR
);

-- Réservations (simplifiées)
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id),
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  phone VARCHAR,
  date DATE NOT NULL,
  time TIME NOT NULL,
  payment_status VARCHAR DEFAULT 'pending',
  iban VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Activer l'authentification
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Therapists can view own data" ON therapists
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Therapists can update own data" ON therapists
  FOR UPDATE USING (auth.uid() = id);

-- Idem pour les autres tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Therapists can manage own sessions" ON sessions
  FOR ALL USING (therapist_id = auth.uid());

ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Therapists can manage own schedule" ON schedule
  FOR ALL USING (therapist_id = auth.uid());

ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Therapists can manage own holidays" ON holidays
  FOR ALL USING (therapist_id = auth.uid());

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Therapists can view own bookings" ON bookings
  FOR SELECT USING (therapist_id = auth.uid());
CREATE POLICY "Anyone can create bookings" ON bookings
  FOR INSERT WITH CHECK (true);
```

4. Récupérez vos clés dans **Settings → API**

### Étape 2 : Resend (5 min)

1. Créez un compte sur [resend.com](https://resend.com)
2. Allez dans **API Keys** → **Create API Key**
3. Copiez la clé (commence par `re_...`)

**Note** : Pas besoin de domaine custom pour commencer ! Utilisez `onboarding@resend.dev` pour tester.

### Étape 3 : GitHub + Vercel (10 min)

1. Créez un repo GitHub : `moi-quand-lean`
2. Uploadez le dossier `moi-quand-v2b`
3. Allez sur [vercel.com](https://vercel.com)
4. Importez votre repo
5. Ajoutez les variables d'environnement (voir `.env.example`)
6. Déployez !

**Temps total : ~30 minutes**

---

## 🎯 Différences avec v2 complète

### Architecture simplifiée

**v2 (complète)** :
```
┌─────────────────────────────────────┐
│ Next.js 15 (App Router complexe)   │
├─────────────────────────────────────┤
│ Supabase (7 tables + RLS complexe) │
│ Stripe Connect + Billing            │
│ Resend + Templates HTML             │
│ Google Calendar API                 │
│ Analytics (PostHog)                 │
│ Monitoring (Sentry)                 │
└─────────────────────────────────────┘
```

**v2b (lean)** :
```
┌─────────────────────────────┐
│ Next.js 15 (minimal)        │
├─────────────────────────────┤
│ Supabase (5 tables simple)  │
│ Resend (emails basiques)    │
└─────────────────────────────┘
```

### Schéma de données simplifié

**v2 : 7 tables**
- therapists
- therapist_settings (JSONB complexe)
- schedule_types (types A, B, C...)
- weekly_schedule
- holidays
- session_types
- bookings (JSONB complexe)

**v2b : 5 tables**
- therapists (champs essentiels uniquement)
- sessions (pas de settings complexes)
- schedule (un seul horaire par jour)
- holidays
- bookings (champs plats, pas de JSONB)

### Code simplifié

**v2** : ~50 fichiers
**v2b** : ~15 fichiers

---

## 📊 Limitations acceptables (10 utilisateurs)

### ✅ Ce qui fonctionne parfaitement

- 10 thérapeutes
- ~100 réservations/mois par thérapeute = 1000/mois total
- ~300 emails/mois (10 × 30)
- Base de données ~10MB
- Trafic ~1000 visiteurs/mois

**Verdict** : Largement dans les limites gratuites ! ✅

### ⚠️ Si vous dépassez 10 thérapeutes

Passez à la v2 complète quand :
- Plus de 10 thérapeutes
- Besoin de Stripe (paiements carte)
- Besoin de Google Calendar sync
- Besoin de features avancées

**Migration v2b → v2** : Facile, même structure Supabase

---

## 🛠️ Maintenance

### Backups

- **Supabase** : Backups automatiques 7 jours (gratuit)
- **Code** : GitHub (historique complet)

### Mises à jour

```bash
git add .
git commit -m "Update: description"
git push
```

→ Vercel redéploie automatiquement en ~2 min !

### Monitoring

- **Vercel Dashboard** : Voir les erreurs, trafic
- **Supabase Dashboard** : Voir les données, users
- **Resend Logs** : Voir les emails envoyés

**Pas besoin de Sentry/Analytics** pour 10 utilisateurs !

---

## 🎓 Comparaison finale

| Aspect | v2 (Complète) | v2b (Lean) |
|--------|---------------|------------|
| **Utilisateurs max** | Illimité | 10 |
| **Coût/mois** | 0-65€ | 0€ |
| **Complexité** | Élevée | Faible |
| **Fichiers** | ~50 | ~15 |
| **Setup** | 2-3h | 30min |
| **Paiements** | Stripe + PayPal + Virement | Virement uniquement |
| **Emails** | Templates HTML avancés | Basiques |
| **Calendar sync** | Oui | Non |
| **SEO** | Complet | Basique |
| **Tests** | Automatisés (E2E) | Manuels |
| **Maintenance** | Pro | Simple |

---

## 🎯 Recommandations

### Pour qui ?

**v2b (Lean)** :
- ✅ Vous avez max 10 thérapeutes
- ✅ Vous voulez 0€/mois
- ✅ Vous débutez
- ✅ Vous voulez simple

**v2 (Complète)** :
- ✅ Vous voulez scaler (100+ thérapeutes)
- ✅ Vous avez un budget
- ✅ Vous voulez toutes les features
- ✅ Vous voulez des paiements carte

### Quand migrer de v2b → v2 ?

Migrez quand vous atteignez :
- 10 thérapeutes (limite)
- 100 réservations/jour
- Besoin de Stripe
- Besoin de Calendar sync

**Migration** : 1-2 jours (même structure Supabase)

---

## ✅ Checklist de déploiement

- [ ] Compte Supabase créé
- [ ] Tables SQL créées
- [ ] Compte Resend créé
- [ ] Repo GitHub créé
- [ ] Code uploadé sur GitHub
- [ ] Vercel connecté au repo
- [ ] Variables d'environnement configurées
- [ ] Premier déploiement réussi
- [ ] Test : Inscription d'un thérapeute
- [ ] Test : Création d'une réservation
- [ ] Test : Réception d'un email

---

## 🎉 C'est tout !

Votre version lean est maintenant en ligne pour **0€/mois** !

**Support** :
- Supabase Docs : [supabase.com/docs](https://supabase.com/docs)
- Resend Docs : [resend.com/docs](https://resend.com/docs)
- Vercel Docs : [vercel.com/docs](https://vercel.com/docs)

---

*Guide créé avec ❤️ pour les petites équipes*
*Version Lean - Décembre 2024*
