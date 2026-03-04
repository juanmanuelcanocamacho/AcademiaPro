#!/bin/bash

# Stop execution if any command fails
set -e

echo "🚀 Starting deployment..."

# Pull the latest changes
echo "⬇️  Pulling latest changes from git..."
git pull

# Build and restart containers using the production configuration
echo "🐳 Rebuilding and restarting containers..."
docker compose up -d --build

# Run database migrations
echo "🗄️  Running database migrations..."
# We use the specific migrate service instead of exec-ing into app
# This avoids npx installing an incompatible Prisma version
docker compose run --rm migrate

echo "✅ Deployment completed successfully!"
