# Portfolio Backend API

Une API REST robuste pour un portfolio développeur construite avec Node.js, Express, TypeScript et Prisma et une base de données MySql.

## 🚀 Fonctionnalités

### 🔐 Authentification & Autorisation
- Inscription/Connexion avec JWT
- Refresh tokens
- Middleware d'authentification
- Gestion des rôles utilisateur

### 📝 Gestion de contenu
- **Articles de blog** : Création, édition, publication, brouillons
- **Projets** : Portfolio de projets avec catégories, images, liens
- **Compétences** : Organisation par catégories avec niveaux
- **Expériences professionnelles** : Timeline de carrière
- **Formations/Education** : Parcours éducatif
- **Catégories** : Classification du contenu

### 💬 Communication
- **Messages de contact** : Formulaire public avec notifications email
- **Réponses automatiques** : Système de réponse par email via Nodemailer

### 🔗 Intégrations
- **GitHub API** : Statistiques, dépôts, profil, commits
- **Upload de fichiers** : Images et PDF avec gestion automatique

### 📊 Statistiques GitHub
- Profil utilisateur
- Dépôts avec métadonnées
- Statistiques de contribution
- Langages de programmation
- Commits de l'année en cours

## 🛠️ Technologies

- **Runtime** : Node.js
- **Framework** : Express.js
- **Langage** : TypeScript
- **Base de données** : MySQL/MariaDB
- **ORM** : Prisma
- **Authentification** : JWT (jsonwebtoken)
- **Upload** : Multer
- **Email** : Nodemailer
- **Validation** : Joi
- **Sécurité** : Helmet, CORS, Rate limiting

## 📦 Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd portfolio-backend
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration de l'environnement**
```bash
cp .env.example .env
```

4. **Variables d'environnement**
```env
# Base de données
DATABASE_URL="mysql://user:password@host:port/database"
SHADOW_DATABASE_URL="mysql://user:password@host:port/shadow_database"

# Serveur
PORT=8000
NODE_ENV=development
DOMAIN="http://localhost:8000"

# JWT
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_EXPIRES_IN="24h"

# Email (Hostinger/Gmail)
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT=587
SMTP_USER="contact@yourdomain.com"
SMTP_PASS="your-password"
CONTACT_EMAIL="contact@yourdomain.com"

# GitHub (optionnel)
GITHUB_TOKEN="your-github-token"
```

5. **Base de données**
```bash
# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate dev

# (Optionnel) Interface d'administration
npx prisma studio
```

6. **Démarrage**
```bash
# Développement
npm run dev

# Production
npm run build
npm start
```

## 🗂️ Structure du projet

```
src/
├── config/          # Configuration (Prisma, base de données)
├── controllers/     # Logique métier des routes
├── middleware/      # Middlewares (auth, validation, erreurs)
├── routes/         # Définition des routes API
├── services/       # Services externes (GitHub API)
├── utils/          # Utilitaires (upload de fichiers)
├── types/          # Types TypeScript
└── server.ts       # Point d'entrée principal

prisma/
├── schema.prisma   # Schéma de base de données
└── migrations/     # Migrations
```

## 🔌 API Endpoints

### Authentification
```
POST   /api/auth/register     # Inscription
POST   /api/auth/login        # Connexion
POST   /api/auth/refresh      # Refresh token
GET    /api/auth/user         # Profil public
PUT    /api/auth/user         # Mise à jour profil (privé)
PUT    /api/auth/password     # Changement de mot de passe (privé)
```

### Blog
```
GET    /api/blog              # Articles publiés
GET    /api/blog/admin        # Tous les articles (privé)
GET    /api/blog/:slug        # Article par slug
POST   /api/blog              # Créer un article (privé)
PUT    /api/blog/:id          # Modifier un article (privé)
DELETE /api/blog/:id          # Supprimer un article (privé)
```

### Projets
```
GET    /api/projects          # Projets publiés
GET    /api/projects/all      # Tous les projets (privé)
GET    /api/projects/:slug    # Projet par slug
POST   /api/projects          # Créer un projet (privé)
PUT    /api/projects/:id      # Modifier un projet (privé)
DELETE /api/projects/:id      # Supprimer un projet (privé)
POST   /api/projects/images   # Upload d'images (privé)
```

### Contact
```
POST   /api/contacts          # Envoyer un message (public)
GET    /api/contacts          # Liste des messages (privé)
GET    /api/contacts/:id      # Message par ID (privé)
PATCH  /api/contacts/:id/read # Marquer comme lu (privé)
POST   /api/contacts/:id/reply # Répondre par email (privé)
DELETE /api/contacts/:id      # Supprimer un message (privé)
```

### GitHub
```
GET    /api/github/profile/:username    # Profil GitHub
GET    /api/github/repos/:username      # Dépôts GitHub
GET    /api/github/stats/:username      # Statistiques GitHub
```

### Autres ressources
- **Compétences** : `/api/skills`
- **Expériences** : `/api/experiences`
- **Formations** : `/api/education`
- **Catégories** : `/api/categories`

## 🔒 Sécurité

- **Helmet** : Protection contre les vulnérabilités communes
- **CORS** : Configuration des origines autorisées
- **Rate Limiting** : Limitation du nombre de requêtes
- **Validation** : Validation des données avec Joi
- **Authentification JWT** : Tokens sécurisés
- **Hachage des mots de passe** : bcrypt

## 📁 Upload de fichiers

- **Images** : Stockage dans `/uploads/entity/`
- **PDF** : Gestion des CV et documents
- **Validation** : Type MIME et extension
- **Limite** : 10MB pour les images, 20MB pour les PDF

## 📧 Notifications Email

- **Nouveaux messages de contact** : Notification automatique
- **Réponses** : Système de réponse par email
- **Configuration** : Support Gmail et Hostinger

## 🧪 Développement

```bash
# Mode développement avec hot-reload
npm run dev

# Compilation TypeScript
npm run build

# Linter
npm run lint

# Prisma Studio (interface graphique)
npx prisma studio
```

## 🌐 Déploiement

1. **Variables d'environnement** : Configurer les variables pour la production
2. **Base de données** : Migrer la base de données
3. **Build** : Compiler le TypeScript
4. **Serveur** : Démarrer avec PM2 ou équivalent

```bash
npm run build
npm start
```

## 📋 Health Check

```bash
GET /health
```

Retourne le statut du serveur et de la base de données.

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit (`git commit -am 'Ajout nouvelle fonctionnalité'`)
4. Push (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.

## 🔗 Liens utiles

- [Documentation Prisma](https://www.prisma.io/docs/)
- [Express.js](https://expressjs.com/)
- [JWT.io](https://jwt.io/)
- [TypeScript](https://www.typescriptlang.org/)

---

**Développé avec ❤️ pour créer des portfolios exceptionnels par [Charbel SONON]**