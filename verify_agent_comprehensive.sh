#!/bin/bash
set -e

AGENT_API="http://localhost:8500"

echo ">>> Testing Agent with various options..."

# Function to test a scenario
test_scenario() {
  NAME="$1"
  JSON="$2"
  echo "---------------------------------------------------"
  echo "Testing Scenario: $NAME"
  
  RES=$(curl -s -X POST "$AGENT_API/plan" \
    -H "Content-Type: application/json" \
    -d "$JSON")

  if echo "$RES" | grep -q "itinerary"; then
    echo "✅ Success."
  else
    echo "❌ Failed."
    echo "Response: $RES"
    exit 1
  fi
}

# Scenario 1: Family, Budget, Kids
test_scenario "Family Budget with Kids" '{
  "booking": {
    "location": "Orlando, FL",
    "startDate": "2025-08-01",
    "endDate": "2025-08-05",
    "party": { "adults": 2, "kids": 2, "type": "family" },
    "budgetTier": "budget"
  },
  "preferences": {
    "interests": ["theme parks"],
    "dietary": [],
    "mobility": "stroller-friendly"
  },
  "includeWeather": true
}'

# Scenario 2: Luxury Couple, Dietary Restrictions
test_scenario "Luxury Couple Vegan" '{
  "booking": {
    "location": "Kyoto, Japan",
    "startDate": "2025-11-10",
    "endDate": "2025-11-15",
    "party": { "adults": 2, "kids": 0, "type": "couple" },
    "budgetTier": "luxury"
  },
  "preferences": {
    "interests": ["temples", "nature"],
    "dietary": ["vegan", "gluten-free"],
    "mobility": "none"
  },
  "includeWeather": false
}'

# Scenario 3: Solo, Business/Work (Free text)
test_scenario "Solo Work Trip" '{
  "booking": {
    "location": "New York, NY",
    "startDate": "2025-09-10",
    "endDate": "2025-09-12",
    "party": { "adults": 1, "kids": 0, "type": "solo" },
    "budgetTier": "premium"
  },
  "preferences": {
    "interests": ["coffee", "coworking"],
    "dietary": [],
    "mobility": "none"
  },
  "freeText": "I need quiet places to work and good wifi",
  "includeWeather": true
}'

echo "---------------------------------------------------"
echo "🎉 All Agent Scenarios Verified!"
