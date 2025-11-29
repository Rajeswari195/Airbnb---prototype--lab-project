#!/bin/bash
set -e

echo "🚀 Deploying to K3s (Local Import Method)..."

# 1. Build Docker Images
echo "🔨 Building Docker images..."
docker compose build

# 2. Tag Images for K8s
echo "🏷️  Tagging images..."
# Note: Docker Compose usually names images as <project_name>-<service_name>
# We assume the project name is the directory name "airbnb-prototype-lab2" (normalized)
# But to be safe, we'll explicitly tag them.

docker tag airbnb-prototype-lab2-frontend:latest docker.io/rajeswari1929/frontend-service:lab2
docker tag airbnb-prototype-lab2-traveler:latest docker.io/rajeswari1929/traveler-service:lab2
docker tag airbnb-prototype-lab2-owner:latest docker.io/rajeswari1929/owner-service:lab2
docker tag airbnb-prototype-lab2-property:latest docker.io/rajeswari1929/property-service:lab2
docker tag airbnb-prototype-lab2-booking:latest docker.io/rajeswari1929/booking-service:lab2
docker tag airbnb-prototype-lab2-agent:latest docker.io/rajeswari1929/agent-service:lab2

# 3. Import into K3s
# K3s uses containerd, so we need to export from Docker and import to K3s
echo "📦 Importing images into K3s (this may take a moment)..."

function import_image() {
    IMAGE=$1
    echo "   -> Importing $IMAGE..."
    docker save "$IMAGE" | sudo k3s ctr images import - > /dev/null
}

import_image "docker.io/rajeswari1929/frontend-service:lab2"
import_image "docker.io/rajeswari1929/traveler-service:lab2"
import_image "docker.io/rajeswari1929/owner-service:lab2"
import_image "docker.io/rajeswari1929/property-service:lab2"
import_image "docker.io/rajeswari1929/booking-service:lab2"
import_image "docker.io/rajeswari1929/agent-service:lab2"

# 4. Restart Deployments
echo "🔄 Restarting K8s deployments..."
kubectl rollout restart deployment frontend-deployment
kubectl rollout restart deployment traveler-deployment
kubectl rollout restart deployment owner-deployment
kubectl rollout restart deployment property-deployment
kubectl rollout restart deployment booking-deployment
kubectl rollout restart deployment agent-deployment

echo "✅ Deployment Updated!"
echo "Check status with: kubectl get pods"
