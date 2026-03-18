# 📱 Audit Design & UX - Dashboard Mobile
## Projet : Moi-Quand (RDV pour thérapeutes)

---

## 1. 🔍 Analyse de l'existant

### 1.1 Structure actuelle du Dashboard

```
app/dashboard/
├── page.tsx              # Rendez-vous (liste avec filtres)
├── sessions/page.tsx     # Types de séances (CRUD)
├── profile/page.tsx      # Profil thérapeute + PayPal + Calendar
├── availability/page.tsx # Disponibilités + congés
├── messages/page.tsx     # Templates emails
├── form/page.tsx         # Formulaire de réservation
└── cancellation/page.tsx # Politique d'annulation
```

### 1.2 Navigation actuelle

**Composant :** `components/dashboard/DashboardLayout.tsx`

**Pattern actuel :**
- **Desktop** : Sidebar fixe à gauche (64px de large), navigation verticale avec icônes + texte
- **Mobile** : Hamburger menu (☰) qui ouvre un drawer latéral pleine hauteur

**Problèmes identifiés sur mobile :**

| Problème | Impact UX | Sévérité |
|----------|-----------|----------|
| Hamburger menu | Pattern dépassé, moins intuitif que la bottom nav | 🔴 Haute |
| Drawer latéral | Nécessite 2 taps pour changer de page | 🔴 Haute |
| Sidebar cache le contenu | Overlay opaque à 50% gêne la lecture | 🟡 Moyenne |
| Trop d'items dans le menu | 8 items = surcharge cognitive | 🟡 Moyenne |
| Icônes emoji | Manque de cohérence visuelle | 🟢 Faible |
| Pas de feedback tactile | Aucun état "active" visible sur mobile | 🔴 Haute |

### 1.3 Layout actuel mobile

```
┌─────────────────────────────┐
│ ☰    Rendez-vous    🔔 🌙 │  ← Header avec hamburger
├─────────────────────────────┤
│                             │
│  [Contenu principal]        │  ← Zone utilisable
│                             │
│                             │
│                             │
│                             │
│                             │
│                             │
│                             │
└─────────────────────────────┘

Drawer ouvert (actuellement) :
┌─────────────────────────────┐
│ ████ Drawer latéral ████ │  ← 70% de l'écran couvert
│ ████  ☰ fermer      ████ │
│ ████  📅 RDV        ████ │
│ ████  ⏱️ Séances    ████ │
│ ████  👤 Profil     ████ │
│ ████  ...           ████ │
│ ████                ████ │
│ ████                ████ │
└─────────────────────────────┘
```

### 1.4 Composants existants analysés

**Points positifs :**
- ✅ Design system Tailwind avec dark mode
- ✅ Cards avec bordures et ombres cohérentes
- ✅ Modal system existant
- ✅ Badges de statut clairs
- ✅ Toggle switches
- ✅ Responsive grid (1 col mobile, 2-4 cols desktop)

**Points à améliorer :**
- ❌ Formulaires peu optimisés pour mobile (inputs trop petits)
- ❌ Modales sans animation de slide-up sur mobile
- ❌ Manque de retour haptique/visuel sur les taps
- ❌ Pas de pull-to-refresh
- ❌ Scroll horizontal sur les filtres (friction)

---

## 2. 💡 Propositions d'amélioration

### 2.1 Navigation mobile : Bottom Tab Bar (PRIORITAIRE)

**Pourquoi la bottom tab bar est supérieure au hamburger :**

| Critère | Hamburger | Bottom Tab | Gagnant |
|---------|-----------|------------|---------|
| Accessibilité | 2 taps | 1 tap | Bottom |
| Découvrabilité | Items cachés | Tout visible | Bottom |
| Ergonomie (pouce) | En haut | Zone naturelle | Bottom |
| Pattern natif | Anti-pattern | Standard iOS/Android | Bottom |
| Contexte | Perte de contexte | Vue constante | Bottom |

**Navigation proposée (5 items principaux) :**

```
┌─────────────────────────────────┐
│                                 │
│      [Contenu principal]      │
│                                 │
│                                 │
├─────────────────────────────────┤
│  📅    ⏱️    🔔    ⚙️    👤   │
│  RDV  Séances Notif  Param  Prof│
└─────────────────────────────────┘
         ↑ Zone de pouce optimale
```

**Regroupement des pages :**
- **Accueil/RDV** : `/dashboard` - Liste des rendez-vous
- **Séances** : `/dashboard/sessions` - Types de consultations
- **Notifications** : `/dashboard` (badge) + centre de notifications
- **Paramètres** : Regroupe `availability`, `form`, `cancellation`, `messages`
- **Profil** : `/dashboard/profile` - Profil + PayPal + Calendar

### 2.2 Inspirations SaaS modernes

**Références analysées :**

1. **Notion Mobile**
   - Bottom nav avec 4 items + FAB
   - Swipe gestures entre sections
   - Pull-to-refresh subtil

2. **Linear**
   - Minimalisme extrême
   - Contraste élevé dark mode
   - Micro-interactions fluides

3. **Cal.com**
   - Navigation par iconographie claire
   - Cards avec badges colorés
   - Actions rapides en slide

4. **Stripe Dashboard**
   - Stats cards avec graphs miniatures
   - Navigation contextuelle
   - Couleurs sémantiques cohérentes

5. **iOS Health / Android Fit**
   - Bottom tab bar + top header rétractable
   - Données en cards scrollables
   - Pull-to-refresh natif

### 2.3 Propositions concrètes

#### A. Bottom Navigation Bar (Mobile uniquement)

**Comportement :**
- Masquée sur scroll vers le bas (réapparaît sur scroll vers le haut)
- Légère ombre pour création de profondeur
- Indicateur d'état actif (pastille ou barre)
- Taille tactiles 44px minimum (iOS HIG)

**Spécifications Tailwind :**

```tsx
// BottomNavigation.tsx
<nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-area-pb">
  <div className="flex items-center justify-around h-16">
    {navItems.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        className={`
          flex flex-col items-center justify-center flex-1 h-full
          transition-colors duration-200
          ${isActive 
            ? 'text-indigo-600 dark:text-indigo-400' 
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
          }
        `}
      >
        <item.icon className="w-6 h-6" />
        <span className="text-xs mt-1 font-medium">{item.label}</span>
        {item.hasBadge && (
          <span className="absolute top-2 right-1/4 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </Link>
    ))}
  </div>
</nav>
```

**Safe area pour iPhone X+ :**
```css
.safe-area-pb {
  padding-bottom: env(safe-area-inset-bottom);
}
```

#### B. Header mobile révisé

**Actuel :** Logo + titre + actions
**Proposé :** Titre contextuel seul, actions secondaires dans overflow menu

```
┌─────────────────────────────┐
│ ←  Rendez-vous        ⋮   │
├─────────────────────────────┤
│                             │
```

**Spécifications :**
- Titre centré ou aligné gauche
- Flèche retour contextuelle (si nested navigation)
- Menu overflow (⋮) pour actions secondaires
- Largeur max du titre : 60% pour évancer le troncage

#### C. Cards améliorées pour mobile

**Problème actuel :** Cards trop denses sur mobile

**Solution :** Cards avec swipe actions (comme Gmail/iOS Mail)

```
┌─────────────────────────────┐
│ ◀️  Supprimer │  ✏️ Modifier │  ← Swipe left
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 👤 Jean Dupont          │ │
│ │ 🟡 En attente           │ │
│ │ 📅 15 Mars  •  14:30    │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**Spécifications Tailwind :**

```tsx
// BookingCard.tsx avec swipe
<div className="relative overflow-hidden">
  {/* Actions cachées (révélées au swipe) */}
  <div className="absolute inset-0 flex">
    <button className="flex-1 bg-red-500 flex items-center justify-start pl-4">
      <TrashIcon className="text-white" />
    </button>
    <button className="flex-1 bg-indigo-500 flex items-center justify-end pr-4">
      <EditIcon className="text-white" />
    </button>
  </div>
  
  {/* Card visible */}
  <div 
    className="relative bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm"
    style={{ transform: `translateX(${swipeOffset}px)` }}
  >
    {/* Contenu */}
  </div>
</div>
```

#### D. Pull-to-Refresh

**Comportement :**
- Pull vers le bas sur la liste
- Spinner avec animation de rebond
- Mise à jour automatique des données

**Spécifications :**

```tsx
// Avec une librairie comme react-pull-to-refresh ou native
<div className="overflow-y-auto overscroll-y-contain">
  {/* overscroll-behavior: contain permet le PTR */}
</div>
```

#### E. Bottom Sheets pour les modales

**Actuel :** Modales centrées
**Proposé :** Bottom sheets sur mobile (pattern natif)

```
┌─────────────────────────────┐
│                             │
│      [Contenu obscurci]     │
│                             │
├─────────────────────────────┤
│ ▬▬▬  (poignée de drag)     │
│  Détails du rendez-vous     │
│                             │
│  [Contenu de la modale]     │
│                             │
│  [Boutons d'action]         │
│                             │
└─────────────────────────────┘
```

**Spécifications :**

```tsx
// BottomSheet.tsx
<div 
  className="fixed inset-0 z-50 bg-black/50"
  onClick={onClose}
>
  <div 
    className={`
      absolute bottom-0 left-0 right-0 
      bg-white dark:bg-gray-800 
      rounded-t-2xl
      transform transition-transform
      ${isOpen ? 'translate-y-0' : 'translate-y-full'}
    `}
  >
    {/* Poignée */}
    <div className="flex justify-center pt-3 pb-1">
      <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
    </div>
    {/* Contenu */}
    <div className="p-4 pb-8">
      {children}
    </div>
  </div>
</div>
```

---

## 3. 📐 Wireframes / Spécifications

### 3.1 Dashboard (Home) - Mobile

```
┌─────────────────────────────┐
│     Mes Rendez-vous         │  ← Titre simple
├─────────────────────────────┤
│ ┌─────────┬─────────┐      │
│ │  🔴 12  │  🟡  3  │      │  ← Stats cards compact
│ │ À venir │ En att. │      │
│ └─────────┴─────────┘      │
├─────────────────────────────┤
│ [À venir] [Passés] [Tous]  │  ← Filtres scrollables horiz.
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 👤 Jean Dupont      🟡  │ │
│ │ Consultation initiale   │ │
│ │ 📅 Aujourd'hui  • 14:30 │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 👤 Marie Martin     🟢  │ │
│ │ Suivi hebdomadaire      │ │
│ │ 📅 Demain  •  09:00     │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 👤 Pierre Bernard   🔴  │ │
│ │ Séance d'hypnose       │ │
│ │ 📅 20 Mars  •  16:00    │ │
│ └─────────────────────────┘ │
│                             │
│         ━━━━━               │  ← Scroll indicator
│                             │
├─────────────────────────────┤
│ 📅  ⏱️  🔔  ⚙️  👤          │  ← Bottom nav
│ RDV Séance Notif Param Prof │
└─────────────────────────────┘
```

### 3.2 Navigation principale (5 items)

```
┌─────────────────────────────────────────────────┐
│   📅      ⏱️      🔔      ⚙️      👤          │
│  RDV    Séances   Notif   Param   Profil       │
│                   🔴                            │  ← Badge de notification
└─────────────────────────────────────────────────┘

Icônes proposées (Lucide React) :
- 📅 Calendar / CalendarDays
- ⏱️ Clock / Timer
- 🔔 Bell / BellDot (avec badge)
- ⚙️ Settings2 / SlidersHorizontal
- 👤 User / UserCircle
```

### 3.3 Profil / Paramètres (regroupés)

**Nouvelle architecture :**

```
Paramètres (⚙️)
├── Disponibilités  ← (anciennement /availability)
├── Formulaire      ← (anciennement /form)
├── Messages auto   ← (anciennement /messages)
├── Annulation      ← (anciennement /cancellation)
└── Aide & Support  ← (nouveau)

Profil (👤)
├── Informations perso
├── Paiement (PayPal)
├── Google Calendar
├── Sécurité
└── Déconnexion
```

---

## 4. 🎨 Spécifications CSS/Tailwind

### 4.1 Design Tokens

```css
/* tailwind.config.ts additions */
{
  theme: {
    extend: {
      colors: {
        // Primary - Indigo (existant)
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        // Semantic colors
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'bounce-subtle': 'bounceSubtle 0.5s ease-in-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
    },
  },
}
```

### 4.2 Composants clés

#### BottomNav.tsx

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  CalendarDays, 
  Clock, 
  Bell, 
  SlidersHorizontal, 
  User 
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'RDV', icon: CalendarDays },
  { href: '/dashboard/sessions', label: 'Séances', icon: Clock },
  { href: '/dashboard/notifications', label: 'Notif', icon: Bell, badge: true },
  { href: '/dashboard/settings', label: 'Param', icon: SlidersHorizontal },
  { href: '/dashboard/profile', label: 'Profil', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex flex-col items-center justify-center flex-1 h-full
                transition-all duration-200 min-w-[64px]
                ${isActive 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }
              `}
            >
              <div className={`
                relative p-1.5 rounded-xl transition-all
                ${isActive ? 'bg-indigo-50 dark:bg-indigo-950/50' : ''}
              `}>
                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                
                {/* Badge de notification */}
                {item.badge && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
                )}
              </div>
              
              <span className={`
                text-[11px] mt-0.5 font-medium
                ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}
              `}>
                {item.label}
              </span>
              
              {/* Indicateur actif (barre) */}
              {isActive && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

#### MobileCard.tsx

```tsx
interface MobileCardProps {
  title: string
  subtitle?: string
  badge?: React.ReactNode
  icon?: React.ReactNode
  onClick?: () => void
  rightAction?: React.ReactNode
}

export function MobileCard({ title, subtitle, badge, icon, onClick, rightAction }: MobileCardProps) {
  return (
    <div 
      onClick={onClick}
      className="
        bg-white dark:bg-gray-800 
        rounded-xl border border-gray-200 dark:border-gray-700 
        p-4 
        active:scale-[0.98] active:bg-gray-50 dark:active:bg-gray-700/50
        transition-all duration-150
        shadow-sm
      "
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {icon && (
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {title}
              </h3>
              {badge}
            </div>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {rightAction && (
          <div className="flex-shrink-0 ml-2">
            {rightAction}
          </div>
        )}
      </div>
    </div>
  )
}
```

#### MobileHeader.tsx

```tsx
import { ChevronLeft, MoreVertical } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MobileHeaderProps {
  title: string
  showBack?: boolean
  rightAction?: React.ReactNode
}

export function MobileHeader({ title, showBack, rightAction }: MobileHeaderProps) {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3 flex-1">
          {showBack && (
            <button 
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-gray-100" />
            </button>
          )}
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
            {title}
          </h1>
        </div>
        
        <div className="flex items-center gap-1">
          {rightAction || (
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-all">
              <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
```

### 4.3 Responsive Layout Strategy

```tsx
// DashboardLayout.tsx - Simplifié pour mobile

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop: Sidebar traditionnelle */}
      <div className="hidden lg:block">
        <DesktopSidebar />
      </div>
      
      {/* Mobile: Header + Bottom Nav */}
      <div className="lg:hidden">
        <MobileHeader />
        <main className="pb-20">{/* pb-20 pour laisser place à la bottom nav */}
          {children}
        </main>
        <BottomNav />
      </div>
      
      {/* Desktop: Contenu sans padding bottom */}
      <div className="hidden lg:block lg:pl-64">
        <DesktopHeader />
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
```

---

## 5. ♿ Améliorations d'accessibilité

### 5.1 Points d'attention

| Élément | Problème actuel | Solution |
|---------|-----------------|----------|
| Contraste | Texte gris clair sur fond blanc | Utiliser `text-gray-700` minimum |
| Touch targets | Boutons trop petits | Min 44×44px pour tous les éléments interactifs |
| Focus states | Pas visible | Ajouter `focus:ring-2 focus:ring-indigo-500` |
| Aria labels | Manquants sur les icônes | Ajouter `aria-label` sur tous les boutons icones |
| Réduction de mouvement | Animations non désactivables | Utiliser `@media (prefers-reduced-motion: reduce)` |

### 5.2 Aria labels exemples

```tsx
// BottomNav avec accessibilité
<nav aria-label="Navigation principale">
  <Link 
    href="/dashboard"
    aria-current={isActive ? 'page' : undefined}
    aria-label="Rendez-vous"
  >
    <CalendarDays aria-hidden="true" />
    <span className="sr-only">Rendez-vous</span>
  </Link>
</nav>

// Badge de notification
<span 
  className="..."
  aria-label="3 nouvelles notifications"
>
  <Bell aria-hidden="true" />
  <span className="absolute ..." aria-hidden="true" />
</span>
```

---

## 6. 📱 Implémentation recommandée

### 6.1 Phase 1 : Navigation (Priorité haute)
- [ ] Créer le composant `BottomNav.tsx`
- [ ] Intégrer dans `DashboardLayout.tsx` avec condition mobile/desktop
- [ ] Tester les safe areas sur iOS
- [ ] Ajouter les animations de transition

### 6.2 Phase 2 : Layout Mobile (Priorité haute)
- [ ] Créer `MobileHeader.tsx`
- [ ] Mettre à jour les pages avec le nouveau layout
- [ ] Ajouter le padding-bottom dans `<main>` pour la bottom nav

### 6.3 Phase 3 : Composants Mobile (Priorité moyenne)
- [ ] Créer `MobileCard.tsx` avec swipe actions
- [ ] Implémenter les bottom sheets
- [ ] Ajouter pull-to-refresh sur les listes

### 6.4 Phase 4 : Regroupement des pages (Priorité moyenne)
- [ ] Créer `/dashboard/settings` avec menu de regroupement
- [ ] Migrer `availability`, `form`, `cancellation`, `messages` sous Settings
- [ ] Mettre à jour les liens dans la navigation

### 6.5 Phase 5 : Polish (Priorité basse)
- [ ] Micro-animations sur les interactions
- [ ] Haptic feedback sur mobile (si disponible via API)
- [ ] Skeleton loaders pour les états de chargement

---

## 7. 🎯 Résumé des changements majeurs

### Avant / Après mobile

| Aspect | Actuel | Proposé |
|--------|--------|---------|
| Navigation | Hamburger menu (2 taps) | Bottom tab bar (1 tap) |
| Nombre d'items visibles | 0 (cachés) | 5 (toujours visibles) |
| Accessibilité pouce | Difficile (en haut) | Naturelle (en bas) |
| Feedback visuel | Limité | Animations + états actifs |
| Structure | 8 pages plates | 5 pages regroupées |
| Modales | Centrées | Bottom sheets |
| Cards | Statiques | Swipe actions |

### Impact utilisateur estimé

- **Réduction du temps de navigation** : ~40% moins de taps pour changer de section
- **Amélioration de la découvrabilité** : 100% des fonctionnalités visibles vs 0%
- **Conformité aux standards natifs** : iOS HIG + Material Design
- **Meilleure satisfaction mobile** : Pattern reconnu par les utilisateurs

---

## 8. 📚 Références

- [iOS Human Interface Guidelines - Tab Bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- [Material Design - Bottom Navigation](https://m3.material.io/components/navigation-bar/overview)
- [Nielsen Norman Group - Hamburger Menus](https://www.nngroup.com/articles/hamburger-menus/)
- [Luke Wroblewski - Obvious Always Wins](https://www.lukew.com/ff/entry.asp?1945)

---

**Document créé par :** Pixel (Senior UX/UI Designer)  
**Date :** 18 Mars 2025  
**Projet :** Moi-Quand - Dashboard Mobile  
**Statut :** ✅ Prêt pour implémentation
