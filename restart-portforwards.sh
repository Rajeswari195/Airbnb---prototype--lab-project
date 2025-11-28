#!/bin/bash

echo "🔌 Stopping existing port-forwards..."
pkill -f "kubectl port-forward"

sleep 2

echo "🚀 Starting new port-forwards..."
kubectl port-forward svc/traveler-service 8000:8000 &
kubectl port-forward svc/owner-service 8001:8001 &
kubectl port-forward svc/property-service 8002:8002 &
kubectl port-forward svc/booking-service 8003:8003 &
kubectl port-forward svc/agent-service 8500:8500 &

echo "✅ Port-forwards started!"
echo ""
echo "Services available at:"
echo "  - Traveler:  http://localhost:8000"
echo "  - Owner:     http://localhost:8001"
echo "  - Property:  http://localhost:8002"
echo "  - Booking:   http://localhost:8003"
echo "  - Agent:     http://localhost:8500"
echo ""
echo "Frontend: http://localhost:3000 (run 'npm start' in frontend/ if not running)"
