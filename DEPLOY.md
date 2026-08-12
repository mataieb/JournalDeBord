# 🚀 Guide de déploiement — Railway → Vercel + Neon

Le code est prêt pour Vercel (voir `vercel.json`, `api/index.js`, `server/routes/upload.js`).
Ce qui suit sont les étapes **manuelles** à faire toi-même dans les dashboards (comptes,
tokens, variables d'env) — je n'y ai pas accès.

Ne coupe **rien** sur Railway avant l'étape 7 (bascule finale) : tant que l'ancien
déploiement tourne, tu peux toujours revenir en arrière.

## 1. Créer la base Neon

1. Crée un compte sur [neon.tech](https://neon.tech), un nouveau projet Postgres.
2. Dans le dashboard Neon, récupère deux connection strings :
   - **Pooled connection** (via PgBouncer) → ce sera `DATABASE_URL`
   - **Direct connection** → ce sera `DIRECT_URL`
3. Applique le schéma sur la nouvelle base :
   ```bash
   cd server
   DATABASE_URL="<pooled>" DIRECT_URL="<direct>" npx prisma migrate deploy
   ```

## 2. Migrer les données de prod (Railway → Neon)

Le script `server/scripts/sync_prod.js` existe déjà pour ça (il télécharge tout via
`/api/admin/export` puis réimporte). Pointe simplement `DATABASE_URL` vers Neon avant
de le lancer :
```bash
cd server
DATABASE_URL="<pooled-neon>" SYNC_SECRET="<ta valeur actuelle>" npm run sync-prod
```
Vérifie ensuite les données dans Neon (via leur SQL editor ou `npx prisma studio`).

## 3. Créer le projet Vercel

1. [vercel.com](https://vercel.com) → New Project → importe le repo Git.
2. Vercel devrait auto-détecter `vercel.json` (build client + serverless function `api/index.js`).
   Rien à changer côté "Framework Preset" (laisse "Other").

## 4. Créer le Blob store et migrer les photos

1. Dans le projet Vercel → **Storage** → **Create Database** → **Blob**. Lie-le au projet
   (ça injecte automatiquement `BLOB_READ_WRITE_TOKEN` dans les env vars Vercel).
2. Récupère ce token pour l'utiliser en local (Storage > Blob > `.env.local` tab, ou
   `vercel env pull`).
3. **Tant que Railway tourne encore**, migre les photos existantes vers Blob :
   ```bash
   cd server
   DATABASE_URL="<pooled-neon>" BLOB_READ_WRITE_TOKEN="<token>" npm run migrate-uploads-to-blob
   ```
   Ce script (`server/scripts/migrate_uploads_to_blob.js`) télécharge chaque photo depuis
   l'ancien Railway (`journaldebord-production.up.railway.app`), la ré-uploade sur Blob, et
   met à jour `Recipe.urlPhoto` en base.

## 5. Configurer les variables d'environnement sur Vercel

Project Settings → Environment Variables (voir `server/.env.example` pour la liste complète) :

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | pooled connection Neon |
| `DIRECT_URL` | direct connection Neon |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | tes identifiants OAuth |
| `GOOGLE_CALLBACK_URL` | `/auth/google/callback` (relatif, marche tel quel) |
| `SESSION_SECRET` | une valeur secrète (peut différer de celle de Railway) |
| `SYNC_SECRET` | ta valeur actuelle si tu veux garder `sync-prod` utilisable |
| `GEMINI_API_KEY` | ta clé actuelle |
| `BLOB_READ_WRITE_TOKEN` | auto-rempli si le Blob store est lié (étape 4) |

Pas besoin de `CLIENT_URL` en prod : client et API sont servis sur le même domaine Vercel.
Pas besoin de `STORAGE_ROOT` / `RAILWAY_VOLUME_MOUNT_PATH` : supprimés, remplacés par Blob.

⚠️ Le `buildCommand` dans `vercel.json` lance `prisma migrate deploy` **à chaque
déploiement**, y compris les Preview Deployments (une par PR/branche). Si tu veux éviter
que des previews touchent la base de prod Neon, crée un [branch Neon](https://neon.tech/docs/introduction/branching)
dédié aux previews et configure des env vars différentes par environnement dans Vercel
(Production vs Preview).

## 6. Mettre à jour Google Cloud Console

Dans [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → ton
OAuth Client ID :
- **Authorized JavaScript origins** : ajoute `https://<ton-projet>.vercel.app` (et ton
  domaine custom si tu en configures un plus tard)
- **Authorized redirect URIs** : ajoute `https://<ton-projet>.vercel.app/auth/google/callback`

## 7. Bascule finale

1. Déploie sur Vercel, teste à fond sur l'URL `*.vercel.app` (login Google, upload photo,
   création de recette, journal) — voir checklist ci-dessous.
2. Si tout est bon, tu peux éteindre le service Railway (l'app, pas forcément la base si tu
   veux garder un filet de sécurité quelques jours avant de la supprimer aussi).

## Checklist de test avant bascule

- [ ] Login Google fonctionne (redirect + session persistée après refresh)
- [ ] Upload d'une photo de recette → l'image s'affiche bien (URL `*.public.blob.vercel-storage.com`)
- [ ] Anciennes recettes : les photos migrées à l'étape 4 s'affichent toujours
- [ ] Création / édition de journal du jour fonctionne
- [ ] `/api/admin/export` toujours protégé par `SYNC_SECRET`
