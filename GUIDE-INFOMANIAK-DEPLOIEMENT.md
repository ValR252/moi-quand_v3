# 🚀 Guide de Déploiement Infomaniak - Moi-Quand v2b

> Guide complet pour déployer votre application Next.js sur Infomaniak avec le domaine moi-quand.com

---

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir :

- ✅ Un compte Infomaniak
- ✅ Le domaine **moi-quand.com** acheté chez Infomaniak
- ✅ Votre projet **moi-quand-v2b** prêt localement
- ✅ Supabase configuré (base de données)
- ✅ Resend configuré (emails)

---

## 🎯 Choix de l'hébergement Infomaniak

Infomaniak propose plusieurs options pour héberger une application Next.js :

### Option 1 : Hébergement Web (Recommandé pour débutants) ⭐

**Avantages** :
- Simple à configurer
- Interface graphique intuitive
- Support technique réactif
- Hébergement en Suisse (RGPD-friendly)

**Limitations** :
- Pas de Node.js natif sur tous les plans
- Nécessite un export statique de Next.js

**Prix** : À partir de 5.75€/mois (Web Hosting)

### Option 2 : Jelastic Cloud (Pour applications Node.js complexes)

**Avantages** :
- Node.js natif supporté
- Scalabilité automatique
- Contrôle total

**Prix** : À partir de ~20€/mois

---

## 🔧 Solution Recommandée : Export Statique Next.js

Pour votre application **moi-quand-v2b**, nous allons utiliser un **export statique** de Next.js, compatible avec l'hébergement web classique d'Infomaniak.

### Étape 1 : Préparer l'application pour l'export statique

#### 1.1 Modifier `next.config.js`

Ouvrez le fichier `/Users/val/Downloads/Building_websites/.claude/projects/moi-quand-v2b/next.config.js` et ajoutez :

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // Nécessaire pour l'export statique
  },
  // Désactiver les features serveur-only
  distDir: 'out',
}

module.exports = nextConfig
```

#### 1.2 Vérifier les pages

Toutes vos pages utilisent `'use client'`, ce qui est parfait pour l'export statique ! ✅

Les fichiers suivants sont déjà configurés :
- `app/page.tsx` ✅
- `app/dashboard/page.tsx` ✅
- `app/book/[id]/page.tsx` ✅
- `app/login/page.tsx` ✅

---

## 📦 Étape 2 : Build et Export

### 2.1 Installer les dépendances

```bash
cd /Users/val/Downloads/Building_websites/.claude/projects/moi-quand-v2b
npm install
```

### 2.2 Créer le build de production

```bash
npm run build
```

Cette commande va créer un dossier `out/` avec tous les fichiers statiques.

### 2.3 Vérifier le dossier `out/`

Vous devriez avoir une structure comme :

```
out/
├── index.html
├── _next/
├── dashboard.html
├── login.html
├── book/
└── ...
```

---

## 🌐 Étape 3 : Configuration du domaine sur Infomaniak

### 3.1 Accéder à votre Manager Infomaniak

1. Connectez-vous sur https://manager.infomaniak.com
2. Allez dans **Hébergement Web**
3. Sélectionnez votre hébergement

### 3.2 Configurer le domaine moi-quand.com

1. Dans le menu, cliquez sur **Sites et domaines**
2. Cliquez sur **Ajouter un domaine**
3. Sélectionnez **moi-quand.com**
4. Choisissez le dossier racine : `/web` (ou créez un nouveau dossier)

---

## 📤 Étape 4 : Upload des fichiers

### Option A : Via FTP (Recommandé pour débutants)

#### 4.1 Récupérer les accès FTP

1. Dans le Manager Infomaniak, allez dans **FTP**
2. Notez les informations :
   - **Hôte** : `ftp.votrehebergement.infomaniak.com`
   - **Utilisateur** : votre nom d'utilisateur
   - **Mot de passe** : (créez-en un si nécessaire)

#### 4.2 Installer un client FTP

Téléchargez **FileZilla** (gratuit) : https://filezilla-project.org

#### 4.3 Se connecter et uploader

1. Ouvrez FileZilla
2. Connectez-vous avec vos identifiants FTP
3. Sur votre ordinateur (côté gauche), naviguez vers :
   `/Users/val/Downloads/Building_websites/.claude/projects/moi-quand-v2b/out/`
4. Sur le serveur (côté droit), naviguez vers `/web/` (ou le dossier de moi-quand.com)
5. **Sélectionnez TOUT le contenu du dossier `out/`** (pas le dossier lui-même !)
6. Faites glisser vers le serveur
7. Attendez la fin de l'upload (peut prendre 5-10 minutes)

### Option B : Via SFTP/SSH (Avancé)

```bash
# Compresser le dossier out
cd /Users/val/Downloads/Building_websites/.claude/projects/moi-quand-v2b
tar -czf moi-quand.tar.gz out/

# Upload via SFTP
sftp utilisateur@ftp.votrehebergement.infomaniak.com
put moi-quand.tar.gz
exit

# Décompresser sur le serveur (via SSH)
ssh utilisateur@votrehebergement.infomaniak.com
cd web
tar -xzf ../moi-quand.tar.gz --strip-components=1
```

---

## ⚙️ Étape 5 : Configuration des variables d'environnement

**IMPORTANT** : Les variables d'environnement ne fonctionnent pas directement avec un export statique !

### Solution : Utiliser les variables au moment du build

#### 5.1 Créer un fichier `.env.production`

Créez le fichier `/Users/val/Downloads/Building_websites/.claude/projects/moi-quand-v2b/.env.production` :

```bash
# Supabase (GRATUIT jusqu'à 500MB)
NEXT_PUBLIC_SUPABASE_URL=https://wwvuemwddmnbrwgzwndv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3dnVlbXdkZG1uYnJ3Z3p3bmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5ODQyMDYsImV4cCI6MjA4MjU2MDIwNn0.S2LgMcg5hUK2aZut8YmsiLDlaGaM4CIDy4eWI1SX2-w

# App
NEXT_PUBLIC_APP_URL=https://moi-quand.com
```

**⚠️ Note importante** :
- Les variables `NEXT_PUBLIC_*` sont intégrées dans le build
- Les variables sans `NEXT_PUBLIC_` ne fonctionnent PAS dans un export statique
- Pour Resend (emails), vous devrez créer une API Route séparée (voir ci-dessous)

#### 5.2 Rebuild avec les bonnes variables

```bash
npm run build
```

Puis **re-uploadez** le contenu du dossier `out/` sur Infomaniak.

---

## 📧 Étape 6 : Emails avec Resend (API Route)

Pour envoyer des emails, vous devez créer une **API serverless** séparée.

### Option A : Utiliser Vercel Edge Functions (Gratuit)

1. Créez un compte sur https://vercel.com (gratuit)
2. Créez un nouveau projet juste pour l'API :

```
moi-quand-api/
├── api/
│   └── send-email.js
└── vercel.json
```

**`api/send-email.js`** :

```javascript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { to, subject, html } = req.body

  try {
    await resend.emails.send({
      from: 'hello@moi-quand.com',
      to,
      subject,
      html,
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
```

**`vercel.json`** :

```json
{
  "functions": {
    "api/*.js": {
      "memory": 128,
      "maxDuration": 10
    }
  }
}
```

3. Déployez sur Vercel :

```bash
cd moi-quand-api
vercel deploy --prod
```

4. Configurez la variable d'environnement `RESEND_API_KEY` dans Vercel

5. Vous obtiendrez une URL comme : `https://moi-quand-api.vercel.app/api/send-email`

6. Utilisez cette URL dans votre app pour envoyer des emails

### Option B : Utiliser Supabase Edge Functions (Gratuit)

Documentation : https://supabase.com/docs/guides/functions

---

## 🔒 Étape 7 : Configuration HTTPS et Sécurité

### 7.1 Activer HTTPS (gratuit chez Infomaniak)

1. Dans le Manager Infomaniak, allez dans **Sites et domaines**
2. Cliquez sur **moi-quand.com**
3. Activez **SSL/TLS gratuit** (Let's Encrypt)
4. Attendez quelques minutes que le certificat soit généré

### 7.2 Redirection HTTP → HTTPS

Créez un fichier `.htaccess` dans le dossier `/web/` :

```apache
# Redirection HTTP vers HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Redirection www vers non-www (optionnel)
RewriteCond %{HTTP_HOST} ^www\.moi-quand\.com [NC]
RewriteRule ^(.*)$ https://moi-quand.com/$1 [L,R=301]
```

Uploadez ce fichier via FTP.

---

## ✅ Étape 8 : Vérification finale

### 8.1 Tester votre site

1. Ouvrez https://moi-quand.com dans votre navigateur
2. Vérifiez que la page d'accueil s'affiche
3. Testez la connexion (`/login`)
4. Testez le dashboard (`/dashboard`)
5. Testez une page de booking (`/book/ID`)

### 8.2 Checklist de vérification

- [ ] ✅ Le site est accessible sur https://moi-quand.com
- [ ] ✅ Le certificat SSL est valide (cadenas vert)
- [ ] ✅ La page d'accueil s'affiche correctement
- [ ] ✅ Les animations fonctionnent
- [ ] ✅ Supabase se connecte (test de login)
- [ ] ✅ Les réservations fonctionnent
- [ ] ✅ Les emails sont envoyés (si API configurée)

---

## 🐛 Dépannage

### Problème : Page blanche après upload

**Solution** :
- Vérifiez que vous avez uploadé le CONTENU du dossier `out/`, pas le dossier lui-même
- Vérifiez qu'il y a un fichier `index.html` à la racine

### Problème : "404 Not Found" sur les routes dynamiques

**Solution** :
Ajoutez un fichier `.htaccess` pour gérer les routes Next.js :

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
```

### Problème : Supabase ne se connecte pas

**Solution** :
- Vérifiez que les variables `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont correctes dans `.env.production`
- Recréez le build : `npm run build`
- Re-uploadez les fichiers

### Problème : Les images ne s'affichent pas

**Solution** :
- Vérifiez que `images: { unoptimized: true }` est dans `next.config.js`
- Utilisez des chemins absolus pour les images : `/images/photo.jpg`

---

## 🔄 Mises à jour futures

### Workflow de déploiement

Chaque fois que vous modifiez votre code :

1. Modifiez le code localement
2. Testez en local : `npm run dev`
3. Créez un nouveau build : `npm run build`
4. Uploadez le contenu du dossier `out/` via FTP

### Automatisation (optionnel)

Pour automatiser, vous pouvez créer un script de déploiement :

**`deploy.sh`** :

```bash
#!/bin/bash

echo "🔨 Building..."
npm run build

echo "📦 Compressing..."
cd out
tar -czf ../deploy.tar.gz .
cd ..

echo "📤 Uploading..."
scp deploy.tar.gz user@ftp.infomaniak.com:/web/

echo "✅ Déployé !"
```

Rendez-le exécutable : `chmod +x deploy.sh`

Utilisez-le : `./deploy.sh`

---

## 💰 Récapitulatif des coûts

| Service | Coût mensuel |
|---------|--------------|
| **Infomaniak Web Hosting** | 5.75€ |
| **Domaine moi-quand.com** | ~1€ (payé annuellement) |
| **Supabase** | 0€ (gratuit jusqu'à 500MB) |
| **Resend** | 0€ (gratuit jusqu'à 3000 emails/mois) |
| **Vercel (API optionnelle)** | 0€ (plan gratuit suffit) |
| **TOTAL** | **~6.75€/mois** |

---

## 🎉 Félicitations !

Votre application **Moi-Quand v2b** est maintenant en ligne sur https://moi-quand.com !

### Prochaines étapes recommandées

1. ✅ Configurez votre email custom avec Resend (voir GUIDE-RESEND-EMAIL.md)
2. ✅ Créez votre premier compte thérapeute
3. ✅ Configurez vos séances et disponibilités
4. ✅ Testez une réservation
5. ✅ Partagez votre lien de réservation

### Support

- **Infomaniak Support** : https://www.infomaniak.com/fr/support
- **Supabase Docs** : https://supabase.com/docs
- **Next.js Docs** : https://nextjs.org/docs

---

*Guide créé avec ❤️ pour les débutants*
*Version 1.0 - Décembre 2024*
