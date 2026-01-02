# 🔧 Résolution du Problème "Mode Démo"

## 🎯 Symptômes

- ✅ Vous pouvez vous connecter avec v.renfer@gmail.com
- ❌ Mais le dashboard affiche "🎭 Mode Démo"
- ❌ La section "Google Calendar" n'apparaît pas

## 🔍 Diagnostic Rapide

Le mode démo apparaît quand le système ne trouve pas votre **profil thérapeute** dans la base de données.

### Étape 1: Exécuter le diagnostic

1. Allez dans Supabase → **SQL Editor** → **New query**
2. Copiez-collez le fichier: `supabase/diagnostic-compte.sql`
3. Cliquez sur **Run**
4. Lisez attentivement les messages

Le script vous dira exactement quel est le problème:
- 🔴 Utilisateur manquant dans auth.users
- 🟠 Profil thérapeute manquant
- 🟢 Tout est OK (mais alors le problème est ailleurs)

---

## ✅ Solution Rapide (Recommandé)

### Option 1: Script de FIX automatique

**Le plus simple - corrige tout automatiquement:**

1. Supabase → **SQL Editor** → **New query**
2. Copiez-collez le fichier: `supabase/fix-compte.sql`
3. Cliquez sur **Run**
4. Attendez les messages de confirmation ✅
5. **DÉCONNECTEZ-VOUS** du dashboard
6. Reconnectez-vous: http://localhost:3000/login
7. Le mode démo devrait disparaître !

Ce script:
- ✅ Supprime toutes les anciennes données
- ✅ Recrée le profil thérapeute avec le bon ID
- ✅ Recrée les sessions et horaires
- ✅ Force la correspondance entre auth.users et therapists

---

## 🔧 Solution Manuelle (Si le script ne marche pas)

### Vérification 1: L'utilisateur existe-t-il ?

1. Supabase → **Authentication** → **Users**
2. Cherchez `v.renfer@gmail.com` dans la liste
3. **Si absent:**
   - Cliquez sur "Add User"
   - Email: v.renfer@gmail.com
   - Password: Test1234!
   - ☑️ Auto Confirm User
   - Create User
4. **Si présent:** Notez l'UUID (ex: abc123...)

### Vérification 2: Le profil thérapeute existe-t-il ?

1. Supabase → **Table Editor** → **therapists**
2. Cherchez la ligne avec email = `v.renfer@gmail.com`
3. **Si absent:** Le profil n'existe pas → Exécutez `fix-compte.sql`
4. **Si présent:** Vérifiez que la colonne `id` correspond à l'UUID de auth.users

### Vérification 3: Les IDs correspondent-ils ?

**C'est le problème le plus fréquent !**

L'ID dans `auth.users` doit être **EXACTEMENT** le même que l'ID dans `therapists`.

**Exemple de problème:**
```
auth.users → id: abc123...
therapists → id: def456...  ❌ PAS BON !
```

**Solution:**
Exécutez `fix-compte.sql` qui corrige automatiquement cette correspondance.

---

## 🧪 Test Final

Après avoir exécuté le fix:

1. **Fermez complètement** votre navigateur (pour vider le cache)
2. Rouvrez: http://localhost:3000/login
3. Connectez-vous:
   - Email: v.renfer@gmail.com
   - Password: Test1234!
4. Vérifiez:
   - ❌ Le bandeau "Mode Démo" ne doit PLUS apparaître
   - ✅ Vous voyez votre nom: "Valentin Renfer"
   - ✅ La section "📅 Synchronisation Google Calendar" est visible
   - ✅ Vous voyez "🔗 Votre page de réservation"

---

## 🐛 Toujours en Mode Démo ?

Si après le fix, vous êtes toujours en mode démo:

### Debug supplémentaire:

1. Ouvrez la console du navigateur (F12)
2. Allez dans l'onglet **Console**
3. Cherchez des erreurs rouges
4. Partagez-les pour investigation

### Vérifier les cookies:

1. F12 → **Application** → **Cookies**
2. Cherchez les cookies Supabase
3. Supprimez-les tous
4. Rafraîchissez la page
5. Reconnectez-vous

### Vérifier les variables d'environnement:

Dans `.env`, vérifiez:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://wwvuemwddmnbrwgzwndv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

Ces valeurs doivent correspondre à votre projet Supabase.

---

## 📊 Comprendre le Problème

### Pourquoi le mode démo ?

Le code du dashboard fait ceci:

```javascript
// 1. Récupérer l'utilisateur authentifié
const { data: { user } } = await supabase.auth.getUser()

// 2. Si pas d'utilisateur → Mode démo
if (!user) {
  loadDemoData()
  return
}

// 3. Charger le profil thérapeute avec cet ID
const { data: therapist } = await supabase
  .from('therapists')
  .select('*')
  .eq('id', user.id)  // ← ICI: cherche avec l'ID de l'utilisateur
  .single()

// 4. Si profil pas trouvé → Mode démo
if (!therapist) {
  loadDemoData()
  return
}
```

**Le problème survient quand:**
- L'utilisateur existe dans `auth.users` (vous pouvez vous connecter)
- MAIS son profil n'existe pas dans `therapists` (ou avec un ID différent)
- → Le système passe en mode démo par sécurité

**La solution:**
Créer le profil avec le **MÊME ID** que dans auth.users.

---

## 🎯 Checklist Complète

- [ ] Utilisateur créé dans Authentication → Users
- [ ] Email confirmé (Auto Confirm = OUI)
- [ ] Script `fix-compte.sql` exécuté avec succès
- [ ] Messages de confirmation ✅ visibles
- [ ] Déconnexion du dashboard
- [ ] Reconnexion avec v.renfer@gmail.com / Test1234!
- [ ] Bandeau "Mode Démo" disparu
- [ ] Section "Google Calendar" visible
- [ ] Nom "Valentin Renfer" affiché dans le header

---

## 🚀 Une Fois le Compte Corrigé

Vous pouvez passer à la configuration Google Calendar:

1. Exécutez: `migration-google-calendar.sql`
2. Configurez Google Cloud Console (URI de redirection)
3. Connectez Google Calendar dans le dashboard
4. Testez une réservation

Voir le guide complet: `GOOGLE-CALENDAR-SETUP.md`

---

**🎉 Bon diagnostic et bonne correction !**

Si le problème persiste après toutes ces étapes, il y a peut-être un souci avec la configuration Supabase ou le code de l'application. Dans ce cas, partagez:
- Les messages du script `diagnostic-compte.sql`
- Les erreurs dans la console du navigateur (F12)
- Les erreurs dans le terminal (npm run dev)
