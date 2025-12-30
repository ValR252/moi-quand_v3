# 🧘 Moi-Quand LEAN (v2b)

> Version ultra-simplifiée pour 10 thérapeutes maximum
> **0€/mois pour toujours !**

---

## 🎯 Philosophie

Cette version suit les principes **Lean Startup** :
- ✅ **Minimum Viable Product** (MVP)
- ✅ **0€ de coûts** (services gratuits uniquement)
- ✅ **10 utilisateurs max** (limite volontaire)
- ✅ **Fonctionnalités essentielles** (pas de superflu)
- ✅ **Simple à maintenir** (15 fichiers vs 50)

---

## 💰 Coûts

### Services utilisés (TOUS GRATUITS)

| Service | Plan | Limite gratuite | Usage estimé (10 users) |
|---------|------|-----------------|--------------------------|
| **Vercel** | Hobby (Free) | 100GB/mois | ~5GB/mois ✅ |
| **Supabase** | Free | 500MB DB | ~10MB ✅ |
| **Resend** | Free | 3000 emails/mois | ~300/mois ✅ |

**Total : 0€/mois**

Tant que vous restez sous 10 thérapeutes, c'est gratuit pour toujours ! 🎉

---

## ✨ Fonctionnalités

### ✅ Inclus

- Authentification (email + password)
- Profil thérapeute (photo, nom, titre, bio)
- Gestion des séances (label, durée, prix)
- Disponibilités (horaires simples par jour)
- Congés
- Page de réservation client
- Dashboard avec liste des RDV
- Paiement par virement bancaire
- Emails automatiques (confirmation)
- Dark mode
- Responsive mobile

### ❌ Non inclus (vs v2 complète)

- Stripe / PayPal (trop complexe pour 10 users)
- Google Calendar sync (nice-to-have)
- Landing page SEO
- Analytics avancées
- Tests automatisés
- Multi-langues

---

## 🚀 Installation rapide

### 1. Cloner et installer

```bash
cd moi-quand-v2b
npm install
```

### 2. Configurer Supabase

1. Créez un compte sur [supabase.com](https://supabase.com)
2. Créez un projet
3. Exécutez le SQL dans `supabase/schema.sql`
4. Copiez les clés API

### 3. Configurer Resend

1. Créez un compte sur [resend.com](https://resend.com)
2. Créez une clé API
3. Copiez la clé

### 4. Variables d'environnement

Créez `.env.local` :

```bash
cp .env.example .env.local
# Remplissez les valeurs
```

### 5. Lancer

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

---

## 📦 Déploiement (Vercel)

1. Push sur GitHub
2. Connectez à [vercel.com](https://vercel.com)
3. Importez le repo
4. Ajoutez les variables d'environnement
5. Déployez !

**Voir le guide complet** : [GUIDE-DEPLOIEMENT-LEAN.md](./GUIDE-DEPLOIEMENT-LEAN.md)

---

## 📊 Comparaison v2 vs v2b

| Aspect | v2 (Complète) | v2b (Lean) |
|--------|---------------|------------|
| Utilisateurs max | Illimité | 10 |
| Coût/mois | 0-65€ | 0€ |
| Fichiers | ~50 | ~15 |
| Setup | 2-3h | 30min |
| Paiements | Stripe+PayPal+Virement | Virement uniquement |
| Calendar | Google sync | Non |
| Tests | E2E automatisés | Manuels |
| Complexité | ⭐⭐⭐⭐⭐ | ⭐⭐ |

---

## 📁 Structure (simplifiée)

```
moi-quand-v2b/
├── app/                    # Next.js App Router
│   ├── dashboard/          # Dashboard thérapeute
│   ├── book/               # Page de réservation
│   ├── layout.tsx
│   └── page.tsx
├── components/             # Composants simples
│   ├── Button.tsx
│   ├── Card.tsx
│   └── Input.tsx
├── lib/                    # Utilitaires
│   ├── supabase.ts         # Client Supabase
│   └── utils.ts
├── supabase/
│   └── schema.sql          # Schéma DB simplifié
├── .env.example
├── package.json
└── README.md
```

**Total : 15 fichiers** (vs 50 pour v2)

---

## 🎓 Quand migrer vers v2 complète ?

Migrez quand vous atteignez :
- ✅ 10 thérapeutes (limite)
- ✅ Besoin de paiements Stripe
- ✅ Besoin de Google Calendar sync
- ✅ Besoin de scaler (100+ users)

**Migration v2b → v2** : 1-2 jours (même structure Supabase)

---

## 🤝 Support

- **Documentation complète** : [GUIDE-DEPLOIEMENT-LEAN.md](./GUIDE-DEPLOIEMENT-LEAN.md)
- Supabase Docs : [supabase.com/docs](https://supabase.com/docs)
- Resend Docs : [resend.com/docs](https://resend.com/docs)
- Vercel Docs : [vercel.com/docs](https://vercel.com/docs)

---

## 📝 Licence

Propriétaire - Usage limité à 10 thérapeutes

---

**Made with ❤️ for small teams**

*Version Lean - Décembre 2024*
