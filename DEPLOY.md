# 🚀 Déploiement et Ajout de Photos

## 1. Photos
La fonctionnalité d'upload est maintenant intégrée !
- Dans le formulaire de recette, tu as un bouton **Upload**.
- Tu peux choisir une photo depuis ton ordinateur (ou ton téléhone une fois déployé).
- La photo est stockée localement dans le dossier `server/uploads`.

**⚠️ Important pour le déploiement :**
Comme les photos sont stockées dans un dossier physique (`uploads/`), sur des hébergeurs gratuits/cloud (comme Vercel ou Railway sans volume), ce dossier est vidé à chaque redémarrage.
**Solution recommandée** : Sur Railway, ajouter un "Volume" monté sur `/app/server/uploads` pour garder tes photos pour toujours.

## 2. Déploiement sur iPhone (via Internet)

Pour rendre l'app accessible sur ton iPhone, il faut l'héberger sur internet.
La solution la plus simple et robuste pour ton cas (Stack "Monolithique" avec SQLite + Fichiers) est **Railway**.

### Pourquoi Railway ?
- C'est un hébergeur qui prend ton code GitHub et le met en ligne.
- Il gère simplement Docker (que j'ai configuré pour toi).
- Il permet d'avoir un "Disque" (Volume) pour ta base de données SQLite et tes Photos, pour ne rien perdre.

### Marches à suivre :

1.  **GitHub**
    - Crée un dépôt sur GitHub (ex: `health-tracker`).
    - Push ton code dessus :
      ```bash
      git init
      git add .
      git commit -m "Initial commit"
      git remote add origin https://github.com/TON_USER/health-tracker.git
      git push -u origin main
      ```

2.  **Railway**
    - Crée un compte sur [railway.app](https://railway.app).
    - "New Project" -> "Deploy from GitHub repo" -> Choisis ton repo.
    - Railway va détecter le `Dockerfile` et commencer à construire.

3.  **Persistence (Base de données et Photos)**
    - Une fois le projet créé dans Railway, va dans les **Settings** du service.
    - Cherche la section **Volumes**.
    - Ajoute un volume :
        - Mount Path: `/app/server/uploads` (pour les photos)
    - (Optionnel) Ajoute un autre volume ou utilise le même pour la DB SQLite si elle est dans `server/prisma/dev.db`.
        - Mount Path: `/app/server/prisma` (si ton fichier db est là).

4.  **Accès**
    - Railway te donnera une URL (ex: `health-tracker-production.up.railway.app`).
    - Ouvre cette URL sur ton iPhone (Safari).
    - **Astuce iPhone** : Dans Safari, fais "Partager" -> "Sur l'écran d'accueil". Ça créera une icône comme une vraie app !

### Alternative simple (Test local)
Si tu veux juste tester chez toi sur ton WiFi :
1. Trouve l'adresse IP de ton PC (ex: `192.168.1.15`).
2. Lance l'app sur ton PC (`npm run dev`).
3. Sur l'iPhone, tape `http://192.168.1.15:5173`.
   *(Il faudra peut-être lancer vite avec `npm run dev -- --host` pour autoriser l'accès externe)*.
