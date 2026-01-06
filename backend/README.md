# API AppliRecette

API REST pour l'application mobile de recettes culinaires développée avec Node.js, Express et MongoDB.

## Fonctionnalités

- Authentification utilisateur avec Firebase
- Gestion des recettes (CRUD)
- Système de commentaires et de notes
- Gestion des favoris
- Recherche avancée de recettes
- Tableau de bord administrateur
- Gestion des utilisateurs (pour les administrateurs)
- Modération des recettes et commentaires

## Prérequis

- Node.js (v14 ou supérieur)
- MongoDB (version 4.4 ou supérieure)
- Compte Firebase pour l'authentification
- Compte MongoDB Atlas (recommandé pour le déploiement)

## Installation

1. Cloner le dépôt :
   ```bash
   git clone [URL_DU_REPO]
   cd applirecette/backend
   ```

2. Installer les dépendances :
   ```bash
   npm install
   ```

3. Configurer les variables d'environnement :
   Créer un fichier `.env` à la racine du projet avec les variables suivantes :
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/applirecette
   FIREBASE_PROJECT_ID=votre-projet-id
   FIREBASE_CLIENT_EMAIL=votre-email-client-firebase
   FIREBASE_PRIVATE_KEY="votre-cle-privee-firebase"
   ```

4. Démarrer le serveur en mode développement :
   ```bash
   npm run dev
   ```

   Pour le mode production :
   ```bash
   npm start
   ```

## Structure du projet

```
backend/
├── config/               # Configuration de la base de données et Firebase
├── controllers/          # Contrôleurs pour gérer la logique métier
├── middlewares/          # Middlewares personnalisés
├── models/               # Modèles Mongoose
├── routes/               # Définition des routes
├── .env                  # Variables d'environnement
├── package.json          # Dépendances et scripts
└── server.js             # Point d'entrée de l'application
```

## API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription d'un nouvel utilisateur
- `POST /api/auth/login` - Connexion d'un utilisateur
- `GET /api/auth/me` - Récupérer le profil de l'utilisateur connecté

### Recettes
- `GET /api/recipes` - Récupérer toutes les recettes (avec filtres)
- `GET /api/recipes/:id` - Récupérer une recette par son ID
- `POST /api/recipes` - Créer une nouvelle recette (authentification requise)
- `PUT /api/recipes/:id` - Mettre à jour une recette (propriétaire ou admin)
- `DELETE /api/recipes/:id` - Supprimer une recette (propriétaire ou admin)

### Commentaires
- `GET /api/comments/recipe/:recipeId` - Récupérer les commentaires d'une recette
- `POST /api/comments/recipe/:recipeId` - Ajouter un commentaire (authentification requise)
- `PUT /api/comments/:commentId` - Mettre à jour un commentaire (propriétaire)
- `DELETE /api/comments/:commentId` - Supprimer un commentaire (propriétaire ou admin)

### Utilisateurs
- `GET /api/users/me` - Récupérer le profil de l'utilisateur connecté
- `PUT /api/users/me` - Mettre à jour le profil de l'utilisateur connecté
- `GET /api/users/me/recipes` - Récupérer les recettes de l'utilisateur connecté
- `GET /api/users/me/favorites` - Récupérer les recettes favorites de l'utilisateur

### Administration
- `GET /api/admin/recipes/pending` - Récupérer les recettes en attente de modération (admin)
- `PUT /api/admin/recipes/:id/review` - Modérer une recette (admin)
- `GET /api/admin/comments/pending` - Récupérer les commentaires en attente (admin)
- `PUT /api/admin/comments/:id/moderate` - Modérer un commentaire (admin)
- `GET /api/admin/users` - Récupérer tous les utilisateurs (admin)
- `PUT /api/admin/users/:userId/role` - Modifier le rôle d'un utilisateur (admin)
- `DELETE /api/admin/users/:userId` - Supprimer un utilisateur (admin)

## Variables d'environnement

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| PORT | Port sur lequel le serveur écoute | 5000 |
| NODE_ENV | Environnement d'exécution | development |
| MONGO_URI | URI de connexion à MongoDB | mongodb://localhost:27017/applirecette |
| FIREBASE_PROJECT_ID | ID du projet Firebase | - |
| FIREBASE_CLIENT_EMAIL | Email du client Firebase | - |
| FIREBASE_PRIVATE_KEY | Clé privée du compte de service Firebase | - |

## Déploiement

### Préparation pour la production

1. Mettre à jour les variables d'environnement pour la production
2. S'assurer que `NODE_ENV=production`
3. Configurer un serveur MongoDB (Atlas recommandé)
4. Configurer un reverse proxy (Nginx) avec HTTPS

### Déploiement avec PM2

1. Installer PM2 globalement :
   ```bash
   npm install -g pm2
   ```

2. Démarrer l'application en production :
   ```bash
   NODE_ENV=production pm2 start server.js --name "applirecette-api"
   ```

3. Configurer le démarrage automatique :
   ```bash
   pm2 startup
   pm2 save
   ```

## Sécurité

- Toutes les routes sont protégées par défaut (sauf les routes publiques)
- Validation des entrées utilisateur
- Gestion des erreurs centralisée
- Protection contre les attaques par injection
- Limitation du taux de requêtes (à implémenter avec express-rate-limit)
- Headers de sécurité HTTP (helmet)
- CORS configuré de manière sécurisée

## Tests

Pour exécuter les tests :

```bash
npm test
```

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.
