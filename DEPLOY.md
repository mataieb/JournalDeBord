# 🚀 Guide de Déploiement Simplifié (1 Seul Volume)

Si le plan Hobby de Railway ne te permet qu'un seul volume, pas de problème ! On peut tout mettre au même endroit.

## La Stratégie "Dossier Unique" `/data`

Nous allons utiliser **un seul Volume** monté sur `/data`.
Dans ce dossier `/data`, nous stockerons à la fois :
1.  Le fichier de base de données (`prod.db`).
2.  Le dossier des photos (`uploads/`).

### Configuration sur Railway

1.  **Project Settings** (Paramètres du projet)
    *   Va dans l'onglet **Volumes**.
    *   Ajoute (ou modifie) un volume pour qu'il soit monté sur : `/data`

2.  **Variables d'Environnement** (Variables)
    *   Ajoute ou modifie ces variables :
        *   `DATABASE_URL` = `file:/data/prod.db`
        *   `STORAGE_ROOT` = `/data`

### C'est tout !

Le code a été adapté pour être assez intelligent :
*   Il va chercher la DB là où `DATABASE_URL` lui dit (donc `/data/prod.db`).
*   Il va stocker les photos dans `STORAGE_ROOT/uploads` (donc `/data/uploads`).

Ainsi, tout est regroupé dans ton unique volume persistant. 🎉
