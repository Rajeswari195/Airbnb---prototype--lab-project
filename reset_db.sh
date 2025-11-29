#!/bin/bash
echo "🧨 NUKING Database (Clearing all users, listings, bookings)..."

# 1. Scale down to 0 (Kill the pod)
echo "🔻 Stopping MongoDB..."
kubectl scale deployment mongo-deployment --replicas=0

# 2. Wait for it to be gone
echo "⏳ Waiting for shutdown..."
kubectl wait --for=delete pod -l app=mongo --timeout=60s 2>/dev/null || true

# 3. Scale back up to 1 (Start fresh pod)
echo "🔺 Starting fresh MongoDB..."
kubectl scale deployment mongo-deployment --replicas=1

# 4. Wait for it to be ready
echo "⏳ Waiting for startup..."
kubectl wait --for=condition=ready pod -l app=mongo --timeout=60s

echo "✅ Database Reset Complete! All data has been wiped."
