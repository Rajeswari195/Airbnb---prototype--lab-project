#!/bin/bash
echo ">>> Testing Agent Connectivity & CORS..."

# 1. Test Basic Health (Direct)
echo "1. Checking Health Endpoint..."
curl -v http://localhost:8500/health

# 2. Test CORS Preflight (OPTIONS)
echo -e "\n\n2. Testing CORS Preflight (OPTIONS)..."
curl -v -X OPTIONS http://localhost:8500/plan \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"

# 3. Test Actual Request (POST) with Origin
echo -e "\n\n3. Testing POST with Origin..."
curl -v -X POST http://localhost:8500/plan \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d '{
    "booking": {
      "location": "San Diego",
      "startDate": "2025-12-24",
      "endDate": "2025-12-31",
      "party": { "adults": 1, "kids": 0, "type": "couple" },
      "budgetTier": "moderate"
    },
    "preferences": { "interests": [], "dietary": [] },
    "includeWeather": false
  }'
