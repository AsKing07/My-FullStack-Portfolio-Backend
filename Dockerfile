# Dockerfile multi-stage pour optimiser la taille de l'image
FROM node:18-alpine AS base

# Installer les dépendances système nécessaires
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Stage 1: Installation des dépendances de développement pour le build
FROM base AS deps
COPY package*.json ./
# Installer toutes les dépendances sans exécuter postinstall
RUN npm ci --ignore-scripts && npm cache clean --force

# Stage 2: Build de l'application
FROM base AS builder
WORKDIR /app

# Copier les dépendances
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY tsconfig.docker.json ./
COPY next.config.mjs ./
COPY prisma ./prisma/
COPY . .

# Variables d'environnement pour le build
ENV NODE_ENV=production

# Générer le client Prisma manuellement
RUN npx prisma generate

# Compiler TypeScript avec la config Docker
RUN npx tsc -p tsconfig.docker.json

# Vérifier que le build a été créé et lister la structure
RUN ls -la dist/ && find dist/ -type f -name "*.js" | head -10

# Stage 3: Installation des dépendances de production seulement
FROM base AS prod-deps
COPY package*.json ./
# Installer les dépendances de production sans postinstall
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# Stage 4: Image de production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Créer un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copier les fichiers nécessaires
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/build ./build
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.mjs ./

# Copier les dépendances de production
COPY --from=prod-deps /app/node_modules ./node_modules

# Générer le client Prisma en production
RUN npx prisma generate

# Créer le dossier uploads et donner les permissions
RUN mkdir -p uploads && chown -R nextjs:nodejs uploads
RUN chown -R nextjs:nodejs .

USER nextjs

# Exposer le port
EXPOSE 8000

# Variables d'environnement par défaut
ENV PORT=8000
ENV NODE_ENV=production

# Commande de démarrage
CMD ["node", "dist/server.js"]
