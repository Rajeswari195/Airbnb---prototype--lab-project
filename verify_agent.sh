#!/bin/bash
set -e

AGENT_API="http://localhost:8500"

echo ">>> 1. Checking Agent Health..."
HEALTH=$(curl -s "$AGENT_API/health")
echo "Health Response: $HEALTH"

if echo "$HEALTH" | grep -q "ok"; then
  echo "✅ Agent service is healthy."
else
  echo "❌ Agent service is NOT healthy."
  exit 1
fi

echo ">>> 2. Generating Trip Plan (Mock Request)..."
# Using a mock request similar to what the frontend sends
PLAN_REQ='{
  "booking": {
    "location": "Paris, France",
    "startDate": "2025-06-01",
    "endDate": "2025-06-03",
    "party": {
      "adults": 2,
      "kids": 0,
      "type": "couple"
    },
    "budgetTier": "moderate"
  },
  "preferences": {
    "interests": ["museums", "cafes"],
    "dietary": ["vegetarian"],
    "mobility": "none",
    "notes": "First time visiting"
  },
  "freeText": "We love art and history",
  "includeWeather": true
}'

PLAN_RES=$(curl -s -X POST "$AGENT_API/plan" \
  -H "Content-Type: application/json" \
  -d "$PLAN_REQ")

# Check if response contains "itinerary"
if echo "$PLAN_RES" | grep -q "itinerary"; then
  echo "✅ Agent returned a plan with itinerary."
  # Optional: Print a snippet
  echo "Snippet: $(echo $PLAN_RES | cut -c 1-200)..."
else
  echo "❌ Agent failed to return a valid plan."
  echo "Response: $PLAN_RES"
  exit 1
fi

echo "🎉 Agent Service Verified!"
