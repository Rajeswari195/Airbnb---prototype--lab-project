#!/bin/bash
echo "=================================================="
echo "✈️  AGENT SERVICE PILOT RUN"
echo "=================================================="

# 1. Connectivity Check
echo "1. Checking Connectivity to Agent Service (localhost:8500)..."
if curl -s http://localhost:8500/health | grep -q "ok"; then
  echo "✅ Agent Service is UP and Reachable."
else
  echo "❌ Agent Service is DOWN or Unreachable."
  exit 1
fi

# 2. CORS Check
echo -e "\n2. Verifying CORS Configuration..."
CORS_RESP=$(curl -I -s -X OPTIONS http://localhost:8500/plan \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST")

if echo "$CORS_RESP" | grep -q "access-control-allow-origin: http://localhost:3000"; then
  echo "✅ CORS Headers are CORRECT (Allowed Origin: http://localhost:3000)."
else
  echo "❌ CORS Headers are MISSING or INCORRECT."
  echo "Response Headers:"
  echo "$CORS_RESP"
  exit 1
fi

# 3. Functional Test (Generate Plan)
echo -e "\n3. Generating a Sample Trip Plan (San Diego, 2 days)..."
echo "   Sending POST request..."

RESPONSE=$(curl -s -X POST http://localhost:8500/plan \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d '{
    "booking": {
      "location": "San Diego",
      "startDate": "2025-12-24",
      "endDate": "2025-12-26",
      "party": { "adults": 2, "kids": 0, "type": "couple" },
      "budgetTier": "moderate"
    },
    "preferences": { "interests": ["beaches", "tacos"], "dietary": [] },
    "includeWeather": true
  }')

# Check if response contains "itinerary"
if echo "$RESPONSE" | grep -q "itinerary"; then
  echo "✅ Plan Generated SUCCESSFULLY!"
  echo "   Preview of Response:"
  echo "$RESPONSE" | head -c 500
  echo "..."
else
  echo "❌ Plan Generation FAILED."
  echo "Response:"
  echo "$RESPONSE"
  exit 1
fi

echo -e "\n=================================================="
echo "🎉 PILOT RUN COMPLETE: ALL SYSTEMS GO"
echo "=================================================="
