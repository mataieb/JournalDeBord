# Configurer l'Authentification Google

Pour que le bouton "Connexion avec Google" fonctionne, tu dois créer un projet Google et obtenir tes codes secrets.

## 1. Google Cloud Console
1. Vas sur [console.cloud.google.com](https://console.cloud.google.com/).
2. Crée un **Nouveau Projet** (ex: "HealthTracker").
3. Dans le menu de gauche, va sur **APIs & Services** > **Credentials** (Identifiants).
4. Clique sur **+ CREATE CREDENTIALS** > **OAuth client ID**.
5. Si demandé, configure l'"écran de consentement" (Consent Screen) :
   - User Type : **External**.
   - App Name : "HealthTracker".
   - User Support Email : ton email.
   - Developer Contact Email : ton email.
   - Sauvegarde et continue (tu peux passer les étapes "Scopes" et "Test Users").
6. Reviens sur **Credentials** > **OAuth client ID**.
   - Application type : **Web application**.
   - Name : "HealthTracker Web".
   - **Authorized redirect URIs** (TRÈS IMPORTANT) :
     - Ajoute : `http://localhost:3001/auth/google/callback`
     - Ajoute : `https://journaldebord-production.up.railway.app/auth/google/callback` (remplace par ta vraie URL Railway)
7. Clique sur **CREATE**.

## 2. Copier les Clés
Google va te donner deux infos :
- **Client ID**
- **Client Secret**

## 3. Configurer l'Application

### En Local (sur ton PC)
Crée un fichier `.env` dans le dossier `server/` et ajoutes-y :
```env
GOOGLE_CLIENT_ID=colle-ton-client-id-ici
GOOGLE_CLIENT_SECRET=colle-ton-client-secret-ici
CLIENT_URL=http://localhost:5173
SESSION_SECRET=un-mot-de-passe-secret-aleatoire
```

### En Production (sur Railway)
- Va dans ton projet > Settings > **Variables**.
- Ajoute les mêmes variables :
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `CLIENT_URL` = `https://journaldebord-production.up.railway.app` (ton URL front)
  - `SESSION_SECRET` = (génère un truc compliqué)

C'est tout ! Redémarre ton serveur local (`npm run dev` dans server) pour que ça marche.
