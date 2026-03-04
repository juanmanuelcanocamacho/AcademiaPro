#!/bin/bash

# Stop execution if any command fails
set -e

echo "🚀 Iniciando despliegue en Arsys..."

# 1. Pull the latest changes
echo "⬇️  Descargando últimos cambios de GitHub..."
git pull origin main

# 2. Build and restart containers using the production configuration
# Note: The Dockerfile already runs 'npx prisma migrate deploy' on startup!
echo "🐳 Reconstruyendo y reiniciando contenedores Docker..."
docker compose up -d --build

# 3. Initialize or update the database schema
echo "🗄️ Actualizando esquemas de la base de datos PostgreSQL..."
docker compose exec app npx --yes prisma db push --accept-data-loss

# 4. Clean up old unused images to save disk space on Arsys
echo "🧹 Limpiando imágenes antiguas sin usar..."
docker image prune -f

echo "✅ ¡Despliegue completado con éxito! Tu aplicación está corriendo en el puerto 3001."
