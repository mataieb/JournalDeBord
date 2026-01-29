# Plan d'implémentation : Authentification Google

Actuellement, ton application a un utilisateur "par défaut". Pour avoir des journaux personnels (multi-utilisateurs) sécurisés par Google, voici le plan :

## 1. Google Cloud Console (Ce que tu dois faire)
Il faudra aller sur [console.cloud.google.com](https://console.cloud.google.com/), créer un projet et obtenir deux codes secrets :
- **Client ID**
- **Client Secret**

Il faudra configurer l'URL de redirection autorisée :
- Dev : `http://localhost:3001/auth/google/callback`
- Prod : `https://journaldebord-production.up.railway.app/auth/google/callback`

## 2. Backend (Ce que je vais faire)
- **Base de données** : Ajouter un champ `googleId` dans la table `User`.
- **Passport.js** : Installer et configurer la librairie qui gère la connexion Google.
- **Sessions** : Configurer `express-session` pour que l'utilisateur reste connecté (cookie).
- **Routes Auth** : Créer les routes `/auth/google` et `/auth/logout`.
- **Middleware** : Protéger les routes API (`/api/log`) pour qu'elles utilisent l'ID de l'utilisateur connecté au lieu d'un ID par défaut.

## 3. Frontend (Ce que je vais faire)
- **Page Login** : Créer une page simple avec un bouton "Se connecter avec Google".
- **Protection** : Si on n'est pas connecté, rediriger vers la page Login.
- **Profil** : Afficher le nom/avatar de l'utilisateur connecté.

## Est-ce que ça te va ?
C'est le standard de l'industrie pour les projets persos : sécurisé, pas de mot de passe à gérer, et simple.

Si tu valides, je peux commencer par préparer le code Backend !
