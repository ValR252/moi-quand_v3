# Configuration Zoom pour Moi-Quand

Ce guide explique comment configurer l'intégration Zoom pour permettre aux thérapeutes de proposer des consultations en ligne.

## Prérequis

- Un compte Zoom **Pro** (ou supérieur) - L'API Zoom nécessite un compte payant
- Accès au [Zoom App Marketplace](https://marketplace.zoom.us/)

## Étape 1 : Créer une App Zoom

1. Connectez-vous à [Zoom App Marketplace](https://marketplace.zoom.us/) avec votre compte Zoom Pro
2. Cliquez sur **Develop** → **Build App** (en haut à droite)
3. Sélectionnez **OAuth** comme type d'application
4. Cliquez sur **Create**

## Étape 2 : Configurer l'App

### Informations de base

- **App Name** : `Moi-Quand` (ou le nom de votre choix)
- **Company Name** : Votre nom d'entreprise
- **Developer Contact** : Votre email
- **Description** : "Intégration Zoom pour consultations en ligne"

### OAuth Settings

Dans la section **OAuth** :

1. **OAuth Redirect URL** :
   ```
   https://moi-quand.com/api/zoom/callback
   ```
   
   Pour le développement local :
   ```
   http://localhost:3000/api/zoom/callback
   ```

2. **Scopes** (autorisations nécessaires) :
   - `user:read` - Lire les informations utilisateur
   - `meeting:write` - Créer des réunions

3. Cliquez sur **Continue** puis **Add**

## Étape 3 : Récupérer les Credentials

Dans la section **App Credentials** :

1. Copiez le **Client ID**
2. Cliquez sur **Client Secret** pour le révéler et copiez-le

## Étape 4 : Configurer l'environnement

Ajoutez ces variables dans votre fichier `.env.local` :

```bash
# Zoom OAuth
ZOOM_CLIENT_ID=votre_client_id_ici
ZOOM_CLIENT_SECRET=votre_client_secret_ici
ZOOM_REDIRECT_URI=https://moi-quand.com/api/zoom/callback
```

Pour le développement local :
```bash
ZOOM_REDIRECT_URI=http://localhost:3000/api/zoom/callback
```

## Étape 5 : Publier l'App (Optionnel)

Pour que l'app soit utilisable par d'autres thérapeutes :

1. Allez dans **Activation** → **Activation Request**
2. Remplissez les informations requises
3. Soumettez pour validation Zoom (peut prendre quelques jours)

**Note** : Pour un usage interne/privé, vous pouvez utiliser l'app en mode "development" sans la publier.

## Étape 6 : Tester l'intégration

1. Redémarrez votre serveur Next.js
2. Connectez-vous au dashboard thérapeute
3. Allez dans **Profil** → **Vidéo / Zoom**
4. Cliquez sur **Connecter avec Zoom**
5. Autorisez l'application
6. Vérifiez que le statut passe à "Zoom connecté"

## Utilisation

### Pour les thérapeutes

1. **Connecter Zoom** : Dans Profil → Vidéo / Zoom, cliquez sur "Connecter avec Zoom"
2. **Créer une séance en ligne** : Dans Séances, créez/modifiez une séance et activez "Consultation en ligne"
3. **Réserver** : Quand un patient réserve une séance en ligne, un lien Zoom est automatiquement créé et envoyé par email

### Pour les patients

- Reçoivent automatiquement le lien Zoom dans l'email de confirmation
- Peuvent rejoindre la réunion en un clic
- Le mot de passe est inclus dans l'email si activé

## Dépannage

### "Zoom OAuth not configured"
- Vérifiez que les variables d'environnement sont bien définies
- Redémarrez le serveur après modification du `.env.local`

### "Zoom not connected" lors de la création d'une réunion
- Le thérapeute doit d'abord connecter son compte Zoom
- Vérifiez que le compte Zoom est bien un compte Pro

### Erreur de token expiré
- Les tokens sont automatiquement rafraîchis
- Si problème persistant, déconnectez et reconnectez Zoom

### La réunion n'est pas créée
- Vérifiez les logs serveur
- Assurez-vous que le compte Zoom a les permissions nécessaires
- Vérifiez que l'app Zoom a les scopes `meeting:write`

## Sécurité

- Les tokens Zoom sont stockés chiffrés en base de données
- Les tokens d'accès expirent après 1 heure et sont automatiquement rafraîchis
- Les patients ne voient que le lien de participation (join_url), pas le lien hôte (start_url)
- Les réunions ont un mot de passe aléatoire généré automatiquement

## Architecture

```
Patient réserve → API crée booking → Si is_online: créer Zoom meeting
                                    → Sauvegarder zoom_meeting_id, zoom_join_url
                                    → Envoyer email avec lien Zoom
```

## Limites

- Nécessite un compte Zoom Pro (payant)
- Les réunions créées via API ont les mêmes limites que votre plan Zoom
- Durée maximale selon votre plan Zoom

## Ressources

- [Documentation Zoom API](https://marketplace.zoom.us/docs/api-reference/introduction)
- [OAuth Zoom](https://marketplace.zoom.us/docs/guides/build/oauth-app/)
- [Créer une réunion](https://marketplace.zoom.us/docs/api-reference/zoom-api/meetings/meetingcreate)

## Support

Pour toute question sur l'intégration Zoom, consultez :
- La documentation Zoom Developer
- Le support Zoom pour les problèmes de compte
