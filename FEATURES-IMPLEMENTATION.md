# Features Implementation Summary

## ✅ Feature 1: Limite de réservation (Booking Limit)

### Description
Le thérapeute peut paramétrer combien de mois à l'avance les clients peuvent prendre RDV.

### Implémentation

#### Base de données
- **Colonne ajoutée**: `booking_limit_months` (INT, DEFAULT 2) dans la table `therapists`
- **Migration**: `supabase/migration-features.sql`

#### API
- **Route existante**: `GET /api/booking-limit/check`
  - Vérifie si une date est dans la limite autorisée
  - Retourne: `isValid`, `isWithinLimit`, `isInPast`, `bookingLimitMonths`, `maxDate`

#### UI - Dashboard (Profil)
- **Fichier**: `app/dashboard/profile/page.tsx`
- **Section ajoutée**: "Limite de réservation"
- **Composant**: Slider de 1 à 12 mois avec affichage en temps réel

#### UI - Page de réservation (Client)
- **Fichier**: `app/book/[id]/page.tsx`
- **Affichage**: Message informatif avec la date limite
- **Filtrage**: Les dates au-delà de la limite ne sont pas affichées
- **Validation**: Vérification côté client avant soumission

---

## ✅ Feature 2: Paiement PayPal

### Description
Intégration complète de PayPal comme moyen de paiement alternatif au virement bancaire.

### Implémentation

#### Base de données
- **Colonnes ajoutées** dans `therapists`:
  - `paypal_enabled` (BOOLEAN, DEFAULT false)
  - `paypal_client_id` (VARCHAR)
  - `paypal_client_secret` (VARCHAR)
  - `paypal_webhook_id` (VARCHAR)
  - `paypal_environment` (VARCHAR, CHECK 'sandbox'|'production')

- **Colonnes ajoutées** dans `bookings`:
  - `paypal_order_id` (VARCHAR)
  - `paypal_capture_id` (VARCHAR)
  - `paypal_refund_id` (VARCHAR)
  - `payment_method` (VARCHAR, DEFAULT 'bank_transfer')
  - `refund_status` (VARCHAR)
  - `refund_amount` (DECIMAL)
  - `refund_date` (TIMESTAMP)

#### API Routes

1. **POST /api/paypal/create-order**
   - Crée une commande PayPal pour une réservation
   - Retourne: `orderId`, `approvalUrl`

2. **POST /api/paypal/capture-order**
   - Capture le paiement après approbation client
   - Met à jour le statut de la réservation

3. **POST /api/paypal/webhook**
   - Reçoit les notifications webhook de PayPal
   - Gère: COMPLETED, DENIED, PENDING, REFUNDED, CANCELLED

4. **POST /api/paypal/refund** (Protégé)
   - Effectue un remboursement PayPal
   - Accessible uniquement par le thérapeute propriétaire

5. **GET /api/bookings/by-paypal-order**
   - Trouve une réservation par son PayPal order ID
   - Utilisé pour la page de succès

#### UI - Dashboard (Profil)
- **Section ajoutée**: "Paiement PayPal"
- **Toggle**: Activer/désactiver PayPal
- **Configuration**:
  - Sélection environnement (Sandbox/Production)
  - Client ID (texte visible)
  - Client Secret (masqué, toggle visibility)
  - Webhook ID (optionnel)
- **Instructions**: Guide étape par étape pour obtenir les credentials

#### UI - Page de réservation (Client)
- **Affichage conditionnel**: Si PayPal activé par le thérapeute
- **Sélection méthode**: Virement bancaire vs PayPal
- **Design**: Cartes cliquables avec icônes
- **Flux**:
  1. Client choisit PayPal
  2. Réservation créée avec `payment_method: 'paypal'`
  3. Redirection vers PayPal pour paiement
  4. Retour sur `/payment/success` ou `/payment/cancel`

#### Pages de paiement
- **/payment/success**: Capture le paiement et confirme
- **/payment/cancel**: Affiche message d'annulation

---

## 📁 Fichiers modifiés/créés

### Nouveaux fichiers
```
supabase/migration-features.sql
app/payment/success/page.tsx
app/payment/success/PaymentSuccessContent.tsx
app/payment/cancel/page.tsx
app/api/bookings/by-paypal-order/route.ts
```

### Fichiers modifiés
```
app/dashboard/profile/page.tsx          # + Booking limit + PayPal config
app/book/[id]/page.tsx                   # + Date limit + Payment selection
app/api/bookings/create/route.ts         # + payment_method field
```

### Fichiers existants (déjà présents)
```
app/api/booking-limit/check/route.ts    # Déjà implémenté
app/api/paypal/create-order/route.ts     # Déjà implémenté
app/api/paypal/capture-order/route.ts    # Déjà implémenté
app/api/paypal/webhook/route.ts          # Déjà implémenté
app/api/paypal/refund/route.ts           # Déjà implémenté
```

---

## 🚀 Déploiement

### 1. Appliquer la migration SQL
```bash
# Dans Supabase SQL Editor, exécuter:
supabase/migration-features.sql
```

### 2. Variables d'environnement (optionnel)
Aucune nouvelle variable requise - les credentials PayPal sont stockés par thérapeute.

### 3. Build
```bash
npm run build
```

### 4. Déploiement Vercel
```bash
vercel --prod
```

---

## 🧪 Tests

### Feature 1: Limite de réservation
1. Aller dans Dashboard > Profil
2. Modifier le slider "Limite de réservation"
3. Sauvegarder
4. Aller sur la page de réservation publique
5. Vérifier que les dates au-delà de la limite ne sont pas affichées

### Feature 2: PayPal (Sandbox)
1. Aller dans Dashboard > Profil
2. Activer PayPal et configurer avec credentials Sandbox
3. Aller sur la page de réservation publique
4. Choisir une séance, date, heure
5. Sélectionner "PayPal" comme méthode de paiement
6. Compléter le paiement avec un compte Sandbox
7. Vérifier que la réservation est confirmée

---

## 📝 Notes

- **Valeurs par défaut**: 
  - Limite de réservation: 2 mois
  - PayPal: désactivé
  - Environnement PayPal: sandbox

- **Sécurité**:
  - Les credentials PayPal sont stockés en clair (à améliorer avec encryption)
  - Les webhooks PayPal sont reçus mais la vérification de signature est simplifiée

- **Compatibilité**:
  - Les réservations existantes conservent `payment_method: 'bank_transfer'`
  - Les thérapeutes existants ont `booking_limit_months: 2`
