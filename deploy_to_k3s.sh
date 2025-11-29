#!/bin/bash
set -e

# Force a consistent project name so we know what the images are called
export COMPOSE_PROJECT_NAME=airbnb-lab2
# Force AMD64 build since host is x86_64
export DOCKER_DEFAULT_PLATFORM=linux/amd64

echo "🚀 Deploying to K3s (Local Import Method)..."

# 1. Build Docker Images
echo "🔨 Building Docker images (AMD64)..."
docker compose build

# 2. Tag Images for K8s
echo "🏷️  Tagging images..."
docker tag airbnb-lab2-frontend:latest docker.io/rajeswari1929/frontend-service:lab2
docker tag airbnb-lab2-traveler:latest docker.io/rajeswari1929/traveler-service:lab2
docker tag airbnb-lab2-owner:latest docker.io/rajeswari1929/owner-service:lab2
docker tag airbnb-lab2-property:latest docker.io/rajeswari1929/property-service:lab2
docker tag airbnb-lab2-booking:latest docker.io/rajeswari1929/booking-service:lab2
docker tag airbnb-lab2-agent:latest docker.io/rajeswari1929/agent-service:lab2

# 3. Import into K3s
# K3s uses containerd, so we need to export from Docker and import to K3s
echo "📦 Importing images into K3s (this may take a moment)..."

function import_image() {
    IMAGE=$1
    echo "   -> Cleaning old image $IMAGE..."
    sudo k3s ctr -n k8s.io images remove "$IMAGE" > /dev/null 2>&1 || true
    
    echo "   -> Importing $IMAGE..."
    docker save "$IMAGE" | sudo k3s ctr -n k8s.io images import - > /dev/null
}

import_image "docker.io/rajeswari1929/frontend-service:lab2"
import_image "docker.io/rajeswari1929/traveler-service:lab2"
import_image "docker.io/rajeswari1929/owner-service:lab2"
import_image "docker.io/rajeswari1929/property-service:lab2"
import_image "docker.io/rajeswari1929/booking-service:lab2"
import_image "docker.io/rajeswari1929/agent-service:lab2"

# 3b. VERIFY Images exist
echo "🔍 Verifying images in K3s..."
if sudo k3s ctr -n k8s.io images list | grep -q "rajeswari1929"; then
    echo "✅ Images found in K3s registry!"
    sudo k3s ctr -n k8s.io images list | grep "rajeswari1929"
else
    echo "❌ CRITICAL ERROR: Images NOT found in K3s registry after import."
    exit 1
fi

# 4. Apply Manifests (Ensure latest config is used)
echo "📄 Applying Kubernetes Manifests..."
kubectl apply -f infra/k8s/

# 5. Restart Deployments
echo "🔄 Restarting K8s deployments..."
kubectl rollout restart deployment frontend-deployment
kubectl rollout restart deployment traveler-deployment
kubectl rollout restart deployment owner-deployment
kubectl rollout restart deployment property-deployment
kubectl rollout restart deployment booking-deployment
kubectl rollout restart deployment agent-deployment

echo "✅ Deployment Updated!"
echo "Check status with: kubectl get pods"
