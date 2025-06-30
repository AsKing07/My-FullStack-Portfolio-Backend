# 🐳 Docker Deployment

Ce projet peut être déployé avec Docker pour une configuration simplifiée et portable.

**⚠️ Important :** Ce backend utilise un build Next.js externe (dossier `build/` fourni). 
Le Docker ne fait pas de `next build`, il utilise le build existant.

## 🚀 Démarrage rapide

### Option 1: Script automatique (Recommandé)

**Windows:**

```bash
./deploy.bat
```

**Linux/macOS:**

```bash
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Commandes manuelles

1. **Copier les variables d'environnement:**

```bash
cp .env.docker.example .env
# Modifier .env avec vos vraies variables
```

1. **Construire et démarrer:**

```bash
docker-compose up --build -d
```

1. **Exécuter les migrations:**

```bash
docker-compose exec portfolio-backend npx prisma migrate deploy
```

## 📋 Configuration

### Variables d'environnement obligatoires

Modifiez le fichier `.env` avec :

- `DATABASE_URL` : URL de votre base de données PostgreSQL
- `JWT_SECRET` : Clé secrète pour les tokens JWT (minimum 32 caractères)
- `GMAIL_USER` : Email Gmail pour l'envoi d'emails
- `GMAIL_PASS` : Mot de passe d'application Gmail

### Exemple avec base locale

```env
DATABASE_URL="postgresql://portfolio_user:portfolio_password@postgres:5432/portfolio?schema=public"
```

### Exemple avec base externe (Render, Supabase...)

```env
DATABASE_URL="postgresql://user:password@hostname:5432/database"
```

## 🌐 Accès aux services

- **Application principale:** <http://localhost:3001>
- **Health check:** <http://localhost:3001/health>
- **Adminer (DB admin):** <http://localhost:8080>

## 📊 Commandes utiles

```bash
# Voir les logs
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f portfolio-backend

# Arrêter les services
docker-compose down

# Reconstruire l'image
docker-compose build --no-cache

# Redémarrer un service
docker-compose restart portfolio-backend

# Entrer dans le conteneur
docker-compose exec portfolio-backend sh
```

## 🗄️ Gestion de la base de données

### Migrations

```bash
# Appliquer les migrations
docker-compose exec portfolio-backend npx prisma migrate deploy

# Réinitialiser la base (ATTENTION: efface toutes les données)
docker-compose exec portfolio-backend npx prisma migrate reset --force
```

### Backup et restore

```bash
# Backup
docker-compose exec postgres pg_dump -U portfolio_user portfolio > backup.sql

# Restore
docker-compose exec -T postgres psql -U portfolio_user portfolio < backup.sql
```

## 📦 Déploiement en production

### Variables d'environnement production
```env
NODE_ENV=production
DATABASE_URL="votre_url_production"
DOMAIN="https://votre-domaine.com"
```

### Avec base externe (sans PostgreSQL local)
```yaml
# Dans docker-compose.yml, commentez la section postgres
version: '3.8'
services:
  portfolio-backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=${DATABASE_URL}
    # Supprimez depends_on: postgres
```

## 🔧 Troubleshooting

### Port déjà utilisé
```bash
# Changer le port dans docker-compose.yml
ports:
  - "3002:3001"  # Au lieu de 3001:3001
```

### Problème de permissions
```bash
# Linux/macOS - Donner les permissions au dossier uploads
sudo chown -R 1001:1001 uploads/
```

### Rebuild complet
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 🏗️ Structure Docker

- **Multi-stage build** pour optimiser la taille
- **Image Alpine** pour la légèreté
- **Utilisateur non-root** pour la sécurité
- **Volumes persistants** pour les uploads et la base de données
