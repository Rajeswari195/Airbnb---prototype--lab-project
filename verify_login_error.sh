#!/bin/bash
# Get the external IP of the traveler service
IP=$(kubectl get svc traveler-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || kubectl get svc traveler-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

if [ -z "$IP" ]; then
    echo "Could not find External IP for traveler-service. Using localhost:8000 via port-forward..."
    # Fallback to port-forward if LoadBalancer IP isn't ready or accessible
    kubectl port-forward svc/traveler-service 8000:8000 > /dev/null 2>&1 &
    PID=$!
    sleep 2
    IP="localhost"
fi

echo "🧪 Testing Login API at http://$IP:8000/api/auth/login"
echo "   (Attempting login with non-existent user: 'fakeuser@example.com')"

RESPONSE=$(curl -s -X POST http://$IP:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "fakeuser@example.com", "password": "password123"}')

echo "----------------------------------------"
echo "Response:"
echo "$RESPONSE"
echo "----------------------------------------"

if [[ "$RESPONSE" == *"User not found"* ]]; then
    echo "✅ SUCCESS: Backend returned 'User not found'"
else
    echo "❌ FAILURE: Backend returned something else (likely 'Invalid credentials')"
fi

# Cleanup port-forward if used
if [ "$IP" == "localhost" ]; then
    kill $PID
fi
