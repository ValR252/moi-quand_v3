# 📧 Guide Configuration Email Custom avec Resend

> Comment configurer votre email **hello@moi-quand.com** avec Resend pour envoyer des emails automatiques

---

## 🎯 Objectif

Configurer Resend pour envoyer des emails depuis **hello@moi-quand.com** au lieu de l'email de test par défaut.

**Avantages** :
- ✅ Emails professionnels avec votre domaine
- ✅ Meilleure délivrabilité (moins de spam)
- ✅ Image de marque cohérente
- ✅ Gratuit jusqu'à 3000 emails/mois

---

## 📋 Prérequis

- ✅ Un compte Resend créé (https://resend.com)
- ✅ Le domaine **moi-quand.com** chez Infomaniak
- ✅ Accès au Manager Infomaniak pour configurer les DNS

---

## 🚀 Étape 1 : Ajouter votre domaine sur Resend

### 1.1 Connexion à Resend

1. Connectez-vous sur https://resend.com
2. Allez dans **Domains** dans le menu de gauche
3. Cliquez sur **Add Domain**

### 1.2 Ajouter moi-quand.com

1. Dans le champ "Domain", entrez : `moi-quand.com`
2. Cliquez sur **Add**

Resend va maintenant vous donner des enregistrements DNS à configurer.

---

## 🔧 Étape 2 : Configurer les DNS chez Infomaniak

### 2.1 Récupérer les enregistrements DNS de Resend

Sur Resend, vous verrez **3 enregistrements à ajouter** :

#### Enregistrement 1 : SPF (TXT)
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
```

#### Enregistrement 2 : DKIM (TXT)
```
Type: TXT
Name: resend._domainkey
Value: [une longue clé fournie par Resend]
```

#### Enregistrement 3 : DMARC (TXT) - Optionnel mais recommandé
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@moi-quand.com
```

### 2.2 Ajouter les enregistrements sur Infomaniak

1. Connectez-vous sur https://manager.infomaniak.com
2. Allez dans **Domaines** → Sélectionnez **moi-quand.com**
3. Cliquez sur **Zone DNS**
4. Cliquez sur **Ajouter un enregistrement**

#### Ajouter l'enregistrement SPF

1. **Type** : TXT
2. **Nom** : Laissez vide (ou entrez `@`)
3. **Valeur** : `v=spf1 include:_spf.resend.com ~all`
4. **TTL** : 3600 (ou laissez par défaut)
5. Cliquez sur **Valider**

#### Ajouter l'enregistrement DKIM

1. **Type** : TXT
2. **Nom** : `resend._domainkey`
3. **Valeur** : Copiez la longue clé fournie par Resend (commence généralement par `v=DKIM1;...`)
4. **TTL** : 3600
5. Cliquez sur **Valider**

#### Ajouter l'enregistrement DMARC (optionnel)

1. **Type** : TXT
2. **Nom** : `_dmarc`
3. **Valeur** : `v=DMARC1; p=none; rua=mailto:hello@moi-quand.com`
4. **TTL** : 3600
5. Cliquez sur **Valider**

### 2.3 Attendre la propagation DNS

⏱️ **Temps d'attente** : 15 minutes à 48 heures (généralement 1-2 heures chez Infomaniak)

Vous pouvez vérifier la propagation avec :
- https://dnschecker.org (recherchez `moi-quand.com` avec type TXT)
- Ou via terminal : `dig TXT moi-quand.com`

---

## ✅ Étape 3 : Vérifier le domaine sur Resend

### 3.1 Vérification automatique

1. Retournez sur Resend → **Domains**
2. Cliquez sur **moi-quand.com**
3. Cliquez sur **Verify Domain**

Si les DNS sont bien propagés, Resend affichera :
- ✅ SPF Record: Verified
- ✅ DKIM Record: Verified
- ✅ DMARC Record: Verified (optionnel)

### 3.2 Si la vérification échoue

**Attendez 1-2 heures** puis réessayez.

Vérifiez que les enregistrements DNS sont corrects :
```bash
# Vérifier SPF
dig TXT moi-quand.com

# Vérifier DKIM
dig TXT resend._domainkey.moi-quand.com
```

---

## 📤 Étape 4 : Créer une API Key Resend

### 4.1 Créer la clé

1. Sur Resend, allez dans **API Keys**
2. Cliquez sur **Create API Key**
3. Nom : `Moi-Quand Production`
4. Permission : **Full Access** ou **Sending Access**
5. Cliquez sur **Create**

### 4.2 Copier la clé

⚠️ **IMPORTANT** : Copiez la clé immédiatement, elle ne sera plus affichée !

Format : `re_xxxxxxxxxxxxxxxxxxxxxxxx`

### 4.3 Mettre à jour votre `.env`

Modifiez `/Users/val/Downloads/Building_websites/.claude/projects/moi-quand-v2b/.env` :

```bash
# Resend (GRATUIT jusqu'à 3000 emails/mois)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=hello@moi-quand.com
```

**Important** : Changez aussi dans `.env.production` si vous l'avez créé !

---

## 🧪 Étape 5 : Tester l'envoi d'email

### Option A : Test direct via Resend Dashboard

1. Sur Resend, allez dans **Emails** → **Send Test Email**
2. Remplissez :
   - **From** : `hello@moi-quand.com`
   - **To** : votre email personnel
   - **Subject** : `Test depuis Moi-Quand`
   - **Body** : Un message de test
3. Cliquez sur **Send**
4. Vérifiez votre boîte mail (et spam)

### Option B : Test depuis votre application (Recommandé)

Créez un fichier de test : `test-email.js`

```javascript
const { Resend } = require('resend')

const resend = new Resend('re_xxxxxxxxxxxxxxxxxxxxxxxx') // Votre clé

async function testEmail() {
  try {
    const { data, error } = await resend.emails.send({
      from: 'hello@moi-quand.com',
      to: ['votre.email@example.com'], // Votre email de test
      subject: 'Test depuis Moi-Quand v2b',
      html: `
        <h1>Bienvenue sur Moi-Quand !</h1>
        <p>Ceci est un email de test depuis votre application.</p>
        <p>Si vous recevez cet email, la configuration est correcte ! ✅</p>
      `,
    })

    if (error) {
      console.error('❌ Erreur:', error)
      return
    }

    console.log('✅ Email envoyé avec succès !', data)
  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

testEmail()
```

Exécutez :
```bash
node test-email.js
```

---

## 📨 Étape 6 : Créer les templates d'email

### 6.1 Email de confirmation de réservation

Créez le fichier `/Users/val/Downloads/Building_websites/.claude/projects/moi-quand-v2b/lib/email-templates.ts` :

```typescript
export function getBookingConfirmationEmail(booking: {
  therapistName: string
  clientName: string
  date: string
  time: string
  sessionLabel: string
  price: number
  iban: string
}) {
  return {
    subject: `Confirmation de votre rendez-vous - ${booking.therapistName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🧘 Réservation confirmée !</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${booking.clientName}</strong>,</p>

            <p>Votre rendez-vous avec <strong>${booking.therapistName}</strong> est confirmé !</p>

            <div class="info-box">
              <h3>📅 Détails de votre rendez-vous</h3>
              <p><strong>Séance :</strong> ${booking.sessionLabel}</p>
              <p><strong>Date :</strong> ${booking.date}</p>
              <p><strong>Heure :</strong> ${booking.time}</p>
              <p><strong>Montant :</strong> ${booking.price}€</p>
            </div>

            <div class="info-box">
              <h3>💳 Instructions de paiement</h3>
              <p>Merci d'effectuer un virement bancaire de <strong>${booking.price}€</strong> vers le compte suivant :</p>
              <p><strong>IBAN :</strong> ${booking.iban}</p>
              <p><strong>Référence :</strong> ${booking.clientName} - ${booking.date}</p>
              <p><small>Le rendez-vous sera confirmé définitivement à réception du paiement.</small></p>
            </div>

            <p>Si vous avez des questions, n'hésitez pas à répondre à cet email.</p>

            <p>À bientôt,<br><strong>${booking.therapistName}</strong></p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé depuis Moi-Quand.com</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }
}
```

### 6.2 Utiliser le template dans votre code

Dans votre page de booking (`app/book/[id]/page.tsx`), ajoutez l'envoi d'email après la création de la réservation.

**Note** : Comme vous utilisez un export statique, vous devrez créer une API séparée (voir GUIDE-INFOMANIAK-DEPLOIEMENT.md, Étape 6).

---

## 🔒 Étape 7 : Sécurité et bonnes pratiques

### 7.1 Ne jamais exposer votre clé API

❌ **MAL** :
```javascript
const resend = new Resend('re_123456789') // En dur dans le code
```

✅ **BIEN** :
```javascript
const resend = new Resend(process.env.RESEND_API_KEY) // Depuis .env
```

### 7.2 Limites du plan gratuit

- **3000 emails/mois** gratuits
- Au-delà : 0.10$ / 1000 emails

Pour 10 thérapeutes :
- ~30 réservations/mois/thérapeute = 300 emails/mois
- **Largement dans le plan gratuit !** ✅

### 7.3 Monitoring

Sur Resend Dashboard :
- Consultez **Logs** pour voir tous les emails envoyés
- Vérifiez le taux de délivrabilité
- Surveillez les bounces (emails rejetés)

---

## ❓ Dépannage

### Problème : Emails arrivent en spam

**Solutions** :
1. ✅ Vérifiez que SPF, DKIM et DMARC sont configurés
2. ✅ Évitez les mots "spam" dans le sujet (GRATUIT, URGENT, etc.)
3. ✅ Incluez toujours un lien de désabonnement
4. ✅ Commencez par envoyer peu d'emails (réchauffer l'IP)

### Problème : "Domain not verified"

**Solution** :
- Attendez 1-2 heures pour la propagation DNS
- Vérifiez les enregistrements DNS avec `dig TXT moi-quand.com`
- Contactez le support Infomaniak si les DNS ne se propagent pas après 48h

### Problème : "Invalid API key"

**Solution** :
- Vérifiez que la clé commence bien par `re_`
- Recréez une nouvelle clé API sur Resend
- Vérifiez que la clé est dans le bon fichier `.env`

### Problème : Emails ne partent pas

**Solution** :
- Vérifiez les logs Resend Dashboard
- Testez avec l'outil de test Resend
- Vérifiez que `RESEND_FROM_EMAIL=hello@moi-quand.com` est correct

---

## 📊 Récapitulatif

| Étape | Statut | Temps estimé |
|-------|--------|--------------|
| 1. Ajouter domaine sur Resend | ☑️ | 2 min |
| 2. Configurer DNS Infomaniak | ☑️ | 5 min |
| 3. Attendre propagation | ⏱️ | 1-2h |
| 4. Vérifier domaine Resend | ☑️ | 1 min |
| 5. Créer API Key | ☑️ | 2 min |
| 6. Tester email | ☑️ | 5 min |
| 7. Créer templates | ☑️ | 15 min |
| **TOTAL** | | **~30-120 min** |

---

## ✅ Checklist finale

Avant de passer en production :

- [ ] Domaine **moi-quand.com** vérifié sur Resend
- [ ] Enregistrements DNS (SPF, DKIM) configurés
- [ ] API Key créée et sauvegardée dans `.env`
- [ ] Email de test envoyé et reçu
- [ ] Template de confirmation créé
- [ ] `RESEND_FROM_EMAIL=hello@moi-quand.com` configuré

---

## 🎉 Félicitations !

Vous pouvez maintenant envoyer des emails depuis **hello@moi-quand.com** !

### Prochaines étapes

1. ✅ Intégrez l'envoi d'email dans votre application
2. ✅ Testez une réservation complète (client → booking → email)
3. ✅ Créez d'autres templates (rappel RDV, annulation, etc.)
4. ✅ Configurez des rappels automatiques (optionnel)

### Ressources utiles

- **Resend Documentation** : https://resend.com/docs
- **Resend Templates** : https://resend.com/docs/send-with-react
- **DNS Checker** : https://dnschecker.org

---

*Guide créé avec ❤️ pour les débutants*
*Version 1.0 - Décembre 2024*
