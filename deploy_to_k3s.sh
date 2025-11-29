#!/bin/bash
set -e

# Force a consistent project name so we know what the images are called
export COMPOSE_PROJECT_NAME=airbnb-lab2
# Force AMD64 build since host is x86_64
export DOCKER_DEFAULT_PLATFORM=linux/amd64

# Generate a unique tag for this deployment
TAG="v$(date +%s)"
echo "🏷️  Deployment Tag: $TAG"

echo "🚀 Deploying to K3s (Local Import Method)..."

# 1. Build Docker Images
echo "🔨 Building Docker images (AMD64)..."
# We build with the 'latest' tag first using compose
docker compose build

# 2. Retag Images with Unique Tag
echo "🏷️  Retagging images with $TAG..."
docker tag airbnb-lab2-frontend:latest docker.io/rajeswari1929/frontend-service:$TAG
docker tag airbnb-lab2-traveler:latest docker.io/rajeswari1929/traveler-service:$TAG
docker tag airbnb-lab2-owner:latest docker.io/rajeswari1929/owner-service:$TAG
docker tag airbnb-lab2-property:latest docker.io/rajeswari1929/property-service:$TAG
docker tag airbnb-lab2-booking:latest docker.io/rajeswari1929/booking-service:$TAG
docker tag airbnb-lab2-agent:latest docker.io/rajeswari1929/agent-service:$TAG

# 3. Import into K3s
echo "📦 Importing images into K3s..."

function import_image() {
    IMAGE_NAME=$1
    FULL_IMAGE="$IMAGE_NAME:$TAG"
    echo "   -> Importing $FULL_IMAGE..."
    docker save "$FULL_IMAGE" | sudo k3s ctr -n k8s.io images import - > /dev/null
}

import_image "docker.io/rajeswari1929/frontend-service"
import_image "docker.io/rajeswari1929/traveler-service"
import_image "docker.io/rajeswari1929/owner-service"
import_image "docker.io/rajeswari1929/property-service"
import_image "docker.io/rajeswari1929/booking-service"
import_image "docker.io/rajeswari1929/agent-service"

# 4. Apply Manifests
echo "📄 Applying Kubernetes Manifests..."
kubectl apply -f infra/k8s/

# 5. Update Deployments with New Tag
echo "🔄 Updating Deployments to use tag $TAG..."
kubectl set image deployment/frontend-deployment frontend=docker.io/rajeswari1929/frontend-service:$TAG
kubectl set image deployment/traveler-deployment traveler=docker.io/rajeswari1929/traveler-service:$TAG
kubectl set image deployment/owner-deployment owner=docker.io/rajeswari1929/owner-service:$TAG
kubectl set image deployment/property-deployment property=docker.io/rajeswari1929/property-service:$TAG
kubectl set image deployment/booking-deployment booking=docker.io/rajeswari1929/booking-service:$TAG
kubectl set image deployment/agent-deployment agent=docker.io/rajeswari1929/agent-service:$TAG

# 6. Reset Database (As requested, ensure no stale data)
./reset_db.sh

echo "✅ Deployment Updated & DB Reset!"
echo "Check status with: kubectl get pods"
