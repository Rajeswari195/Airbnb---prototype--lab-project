#!/usr/bin/env bash
set -e

# Explicitly add common paths for Docker/Kubectl
export PATH=$PATH:/usr/local/bin:/opt/homebrew/bin

USERNAME=$1

if [ -z "$USERNAME" ]; then
  echo "Error: You must provide your Docker Hub username."
  echo "Usage: ./deploy.sh <docker-hub-username>"
  exit 1
fi

echo "🚀 Starting Deployment for User: $USERNAME"

# 1. Update Kubernetes Manifests with Username
echo "📝 Updating K8s manifests..."
# Use a temporary file for sed compatibility on both Mac and Linux if needed, 
# but assuming Mac (zsh) based on user context, sed -i '' works.
sed -i '' "s|<your-username>|$USERNAME|g" infra/k8s/*.yaml

# 2. Build and Push Images
echo "🐳 Building and Pushing Images..."

# Function to build and push
build_and_push() {
  SERVICE=$1
  PATH=$2
  IMAGE="$USERNAME/$SERVICE:lab2"
  
  echo "   - Building $SERVICE..."
  /usr/local/bin/docker build -t $IMAGE $PATH
  
  echo "   - Pushing $SERVICE..."
  /usr/local/bin/docker push $IMAGE
}

build_and_push "traveler-service" "./backend/traveler"
build_and_push "owner-service" "./backend/owner"
build_and_push "property-service" "./backend/property"
build_and_push "booking-service" "./backend/booking"
build_and_push "agent-service" "./agent"
build_and_push "frontend-service" "./frontend"

# 3. Apply Infrastructure
echo "🏗️  Deploying Infrastructure..."
kubectl apply -f infra/k8s/zookeeper.yaml
kubectl apply -f infra/k8s/kafka.yaml
kubectl apply -f infra/k8s/mongo.yaml

# Wait a bit for infra to initialize (optional, but good practice)
echo "   Waiting 10s for infrastructure..."
sleep 10

# 4. Apply Services
echo "🚀 Deploying Services..."
kubectl apply -f infra/k8s/traveler.yaml
kubectl apply -f infra/k8s/owner.yaml
kubectl apply -f infra/k8s/property.yaml
kubectl apply -f infra/k8s/booking.yaml
kubectl apply -f infra/k8s/agent.yaml
kubectl apply -f infra/k8s/frontend.yaml

# 5. Force Restart (to ensure they pick up new images if tags didn't change)
echo "🔄 Restarting pods to ensure fresh pull..."
kubectl delete pod -l app=traveler
kubectl delete pod -l app=owner
kubectl delete pod -l app=property
kubectl delete pod -l app=booking
kubectl delete pod -l app=agent
kubectl delete pod -l app=frontend

echo "✅ Deployment Complete! Check status with: kubectl get pods"
