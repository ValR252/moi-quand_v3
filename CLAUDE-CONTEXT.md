# 🤖 Contexte de Session Claude - Projet Moi-Quand

**Dernière mise à jour** : 2026-01-01
**Projet** : moi-quand-v2b (Plateforme de réservation pour thérapeutes)

---

## 🎯 Objectif du Projet

Créer une plateforme de réservation en ligne pour thérapeutes permettant :
- Aux thérapeutes : Gérer leurs disponibilités et rendez-vous
- Aux patients : Prendre rendez-vous en ligne
- Synchronisation avec Google Calendar

**Site en production** : https://moi-quand.com (déployé sur Vercel)

---

## 👤 Style de Collaboration avec Val

### Approche Pédagogique Préférée
- ✅ **Expliquer** plutôt que juste coder
- ✅ **Comprendre les concepts** et l'architecture
- ✅ **Apprendre l'écosystème** web (Next.js, APIs, OAuth2, etc.)
- ✅ **Guides pas-à-pas** avec analogies et explications
- ❌ Ne pas juste écrire du code sans expliquer
- ❌ Ne pas supposer que Val connaît les concepts avancés

### Citation de Val
> "J'aimerais pas apprendre à écrire du code, mais vraiment à comprendre les différentes parties, à quoi sert chaque fichier, chaque outil"

### Workflow
1. **Utiliser tous les skills disponibles** (teacher, backend-engineer, frontend-developer, etc.)
2. **Créer des leçons** dans `.claude/projects/learning/lessons/`
3. **Documenter** chaque étape et chaque décision
4. **Tester** et valider que tout fonctionne
5. **Expliquer** les problèmes et les solutions

---

## 📊 État Actuel du Projet

### ✅ Ce qui fonctionne (Déployé sur Vercel)

1. **Infrastructure Next.js 15**
   - App Router configuré
   - Routing dynamique avec params asynchrones (use() hook)
   - Build Vercel réussi

2. **Mode Démo Complet**
   - Supabase client optionnel (valeurs de fallback)
   - Données mock dans `lib/mock-data.ts`
   - Dashboard thérapeute fonctionnel
   - Page de réservation fonctionnelle
   - Fonctionne sans base de données configurée

3. **Pages Opérationnelles**
   - `/` - Page d'accueil
   - `/dashboard` - Dashboard thérapeute (avec données de démo)
   - `/book/[id]` - Page de réservation (ex: `/book/demo`)
   - `/login` - Page de connexion

4. **Supabase Integration**
   - Client configuré avec fallback
   - Types TypeScript pour Therapist, Booking, Session, etc.
   - Auth système en place

5. **Design**
   - Tailwind CSS
   - Dark mode support
   - Animations fluides
   - Responsive design

### 🏗️ Architecture Technique

```
moi-quand-v2b/
├── app/
│   ├── page.tsx                 # Homepage
│   ├── dashboard/page.tsx       # Dashboard thérapeute
│   ├── book/[id]/page.tsx       # Page réservation (async params)
│   └── login/page.tsx           # Login page
├── lib/
│   ├── supabase.ts             # Client Supabase (avec fallback)
│   └── mock-data.ts            # Données de démo
├── .claude/
│   ├── projects/
│   │   └── learning/
│   │       └── lessons/        # Leçons créées
│   │           ├── 00-environment-setup/
│   │           ├── 01-nextjs-basics/
│   │           ├── 02-react-fundamentals/
│   │           ├── 03-tailwind-styling/
│   │           ├── 04-nextjs15-params-async/
│   │           └── 05-google-calendar-integration/ ← EN COURS
│   └── skills/                 # 13 skills disponibles
└── .mcp.json                   # Configuration MCP (à vérifier)
```

---

## 🚀 Ce qu'on est en train de faire (Session Actuelle)

### Objectif : Intégration Google Calendar via MCP

**Étape actuelle** : Installation du MCP Server Google Calendar

#### Actions Complétées
1. ✅ Recherché les MCP servers Google disponibles
2. ✅ Créé leçon complète dans `05-google-calendar-integration/`
   - `README.md` - Vue d'ensemble
   - `LESSON.md` - Concepts OAuth2, architecture manuelle
   - `GUIDE-INSTALLATION-MCP.md` - Guide pas-à-pas installation
   - `QUICK-START.md` - Référence rapide
3. ✅ Identifié le MCP recommandé : `@cocal/google-calendar-mcp`

#### Prochaine Étape (IMMÉDIATE)
- ⏳ **Vérifier que le MCP est détecté** après redémarrage
- Val a exécuté `/mcp` et obtenu : "No MCP servers configured"
- Il faut installer le MCP server :

```bash
# 1. Installer le MCP server globalement
npm install -g @cocal/google-calendar-mcp

# 2. Vérifier l'installation
which google-calendar-mcp

# 3. Créer .mcp.json à la racine du projet
# (Voir GUIDE-INSTALLATION-MCP.md pour les détails)

# 4. Redémarrer Claude Code pour détecter le MCP
```

---

## 📚 Leçons Créées

### Leçon 0 : Configuration Environnement
- Installation Node.js, VS Code, Git
- Premier projet Next.js

### Leçon 1 : Bases Next.js
- Structure de projet
- File-based routing
- Server vs Client components

### Leçon 2 : React Fundamentals
- useState, useEffect
- Props et composition
- Event handling

### Leçon 3 : Tailwind CSS
- Classes utilitaires
- Responsive design
- Dark mode

### Leçon 4 : Next.js 15 Async Params ⭐
- Breaking change Next.js 15
- use() hook pour unwrapper les Promises
- Migration de `params: { id }` vers `params: Promise<{ id }>`

### Leçon 5 : Google Calendar Integration (EN COURS)
- Model Context Protocol (MCP)
- OAuth2 flow
- Google Calendar API
- Installation MCP server

---

## 🛠️ Skills Disponibles (13)

Utilisés fréquemment :
- `teacher` - Créer leçons et expliquer
- `backend-engineer` - Architecture API, Supabase
- `frontend-developer` - Implémentation UI
- `devops-engineer` - Déploiement Vercel
- `technical-project-manager` - Planification

Autres :
- `code-reviewer`, `frontend-architect`, `growth-strategist`, `motion-designer`, `qa-engineer`, `skill-manager`, `ui-designer`, `ux-strategist`

---

## 🔧 Problèmes Résolus

### 1. Next.js 15 Async Params
**Erreur** : Type error sur params lors du build Vercel
**Solution** : Changé `params: { id: string }` en `params: Promise<{ id: string }>` + use() hook
**Fichier** : `app/book/[id]/page.tsx`

### 2. Supabase Client Crash
**Erreur** : "supabaseUrl is required" au build
**Solution** : Ajouté valeurs de fallback dans `lib/supabase.ts`
**Résultat** : Build Vercel réussit sans env vars

### 3. Vercel Root Directory
**Erreur** : "No Next.js version detected"
**Solution** : Configuré Root Directory : `.claude/projects/moi-quand-v2b`

---

## 📝 Données de Démo

**Thérapeute de démo** : Dr. Sophie Martin
- ID : `demo`
- URL : https://moi-quand.com/book/demo
- Dashboard : https://moi-quand.com/dashboard

**Réservations de démo** :
- 3 RDV à venir
- 2 RDV passés
- Tous les détails dans `lib/mock-data.ts`

---

## 🎯 Prochaines Étapes du Projet

### Court Terme (En Cours)
1. ⏳ **Installer MCP Google Calendar** (maintenant)
2. ⏳ **Tester l'intégration MCP** (lister calendriers, créer événement)
3. ⏳ **Synchroniser réservations → Google Calendar**

### Moyen Terme
4. Notifications par email (SendGrid/Resend)
5. Système de paiement (Stripe)
6. Gestion des disponibilités du thérapeute
7. Vérification des créneaux libres avant réservation

### Long Terme
8. Multi-thérapeutes
9. Récurrence des rendez-vous
10. Analytics pour thérapeutes
11. Rappels automatiques

---

## 💡 Notes Importantes

### Sécurité
- `.mcp.json` contient des secrets → TOUJOURS dans `.gitignore`
- `.env.local` jamais commité
- Credentials Supabase et Google dans env vars Vercel

### Git
- Repo : GitHub (lié à Vercel pour auto-deploy)
- Branch : `main`
- Push manuel par Val (Claude ne peut pas push)

### Vercel
- Auto-deploy sur push à main
- Environment variables configurées
- Domain : moi-quand.com

---

## 🤔 Si tu ne sais pas quoi faire après redémarrage

1. **Lis ce fichier** (`CLAUDE-CONTEXT.md`) en entier
2. **Vérifie** que Val a bien exécuté les commandes d'installation MCP
3. **Teste** avec `/mcp` pour voir si le server est détecté
4. **Si MCP détecté** : Teste "Liste mes calendriers Google"
5. **Si MCP non détecté** : Guide Val pour l'installation (voir `GUIDE-INSTALLATION-MCP.md`)

---

## 📞 Comment Interagir avec Val

- **Toujours expliquer** avant de coder
- **Utiliser les skills** quand pertinent
- **Créer des leçons** pour les nouveaux concepts
- **Demander confirmation** avant actions importantes
- **Être patient et pédagogue**

Val est **très enthousiaste** et veut **vraiment comprendre** ! 🎓

---

**Dernière action** : Val va redémarrer Claude pour vérifier si MCP est détecté.

**Première chose à faire au redémarrage** :
```
Demande à Val : "As-tu pu installer le MCP Google Calendar ? Exécute /mcp pour voir s'il est détecté."
```

---

**Bonne continuation ! 🚀**
