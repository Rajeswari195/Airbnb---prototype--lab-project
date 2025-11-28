#!/bin/bash
set -e

echo "🚀 Starting Airbnb Distributed System..."

# 1. Apply Kubernetes Manifests
echo "📦 Applying Kubernetes manifests..."
kubectl apply -f infra/k8s/

# 2. Wait for Deployments
echo "⏳ Waiting for services to be ready..."
# Wait for infrastructure first
kubectl wait --for=condition=available --timeout=300s deployment/mongo-deployment
kubectl wait --for=condition=available --timeout=300s deployment/kafka-deployment
kubectl wait --for=condition=available --timeout=300s deployment/zookeeper-deployment

# Wait for application services
kubectl wait --for=condition=available --timeout=300s deployment/traveler-deployment
kubectl wait --for=condition=available --timeout=300s deployment/owner-deployment
kubectl wait --for=condition=available --timeout=300s deployment/property-deployment
kubectl wait --for=condition=available --timeout=300s deployment/booking-deployment
kubectl wait --for=condition=available --timeout=300s deployment/agent-deployment
kubectl wait --for=condition=available --timeout=300s deployment/frontend-deployment

# 3. Start Port Forwards
echo "🔌 Establishing port-forwards..."
# Kill existing port-forwards to avoid conflicts
pkill -f "kubectl port-forward" || true
sleep 2

# Start new forwards in background
kubectl port-forward svc/traveler-service 8000:8000 > /dev/null 2>&1 &
kubectl port-forward svc/owner-service 8001:8001 > /dev/null 2>&1 &
kubectl port-forward svc/property-service 8002:8002 > /dev/null 2>&1 &
kubectl port-forward svc/booking-service 8003:8003 > /dev/null 2>&1 &
kubectl port-forward svc/agent-service 8500:8500 > /dev/null 2>&1 &
# Also forward Mongo for Compass access
kubectl port-forward svc/mongo-service 27018:27017 > /dev/null 2>&1 &

echo "🎉 System is UP and RUNNING!"
echo "------------------------------------------------"
echo "Frontend:      http://localhost:3000 (Run 'npm start' in frontend/ folder)"
echo "Traveler API:  http://localhost:8000"
echo "Owner API:     http://localhost:8001"
echo "Property API:  http://localhost:8002"
echo "Booking API:   http://localhost:8003"
echo "Agent API:     http://localhost:8500"
echo "MongoDB:       mongodb://localhost:27018 (For Compass)"
echo "------------------------------------------------"
echo "⚠️  Note: Port-forwards are running in the background."
echo "    To stop them, run: pkill -f 'kubectl port-forward'"
