#!/bin/bash

set -e  # Exit on error

echo "🚀 Starting production deployment..."

# Build and start services in detached mode
sudo docker compose --env-file ./.env up --build -d

echo "✅ Production deployment started successfully!"

# Prune unused images, containers, and other resources
echo "🧹 Cleaning up unused Docker images and resources..."

sudo docker system prune -af  # Remove unused images, containers, and networks

echo "🧹 Cleanup completed!"
