#!/bin/bash
echo "🛑 Stopping Airbnb Distributed System..."

# 1. Kill Local Processes
echo "🔪 Killing local port-forwards and frontend..."
pkill -f "kubectl port-forward" || true
pkill -f "npm start" || true
pkill -f "react-scripts" || true

# 2. Delete Kubernetes Resources
echo "🗑️  Deleting Kubernetes resources..."
kubectl delete deployment --all
kubectl delete service --all

echo "✅ System stopped successfully."
