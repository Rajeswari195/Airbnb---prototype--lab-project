#!/bin/bash
set -e

# Base URLs
TRAVELER_API="http://localhost:8000/api"
AGENT_API="http://localhost:8500"

# Cleanup function
cleanup() {
  echo "🧹 Cleaning up database..."
  kubectl exec -it deployment/mongo-deployment -- mongosh airbnb --eval "db.dropDatabase()" > /dev/null
  rm -f traveler_cookies.txt
}

# Run cleanup
cleanup

echo ">>> 1. Creating Traveler (Joey)..."
TRAVELER_EMAIL="joey@friends.com"
TRAVELER_PASS="howyoudoin"
curl -s -X POST "$TRAVELER_API/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Joey Tribbiani\",\"email\":\"$TRAVELER_EMAIL\",\"password\":\"$TRAVELER_PASS\"}" > /dev/null

echo ">>> 2. Logging in as Joey..."
curl -s -c traveler_cookies.txt -X POST "$TRAVELER_API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TRAVELER_EMAIL\",\"password\":\"$TRAVELER_PASS\"}" > /dev/null

echo ">>> 3. Simulating 'Accepted' Booking Data..."
# We can't easily create a full booking flow without a host, so we'll just test the Agent API directly
# with the EXACT payload the frontend would send for an accepted booking.

LOCATION="London, UK"
START_DATE="2025-07-10"
END_DATE="2025-07-15"

echo "   - Location: $LOCATION"
echo "   - Dates: $START_DATE to $END_DATE"

PLAN_REQ='{
  "booking": {
    "location": "'"$LOCATION"'",
    "startDate": "'"$START_DATE"'",
    "endDate": "'"$END_DATE"'",
    "party": {
      "adults": 1,
      "kids": 0,
      "type": "solo"
    },
    "budgetTier": "budget"
  },
  "preferences": {
    "interests": ["food", "acting"],
    "dietary": ["meat lover"],
    "mobility": "none",
    "notes": "Joey does not share food"
  },
  "freeText": "Where is the best sandwich?",
  "includeWeather": true
}'

echo ">>> 4. Requesting Trip Plan from Agent..."
PLAN_RES=$(curl -s -X POST "$AGENT_API/plan" \
  -H "Content-Type: application/json" \
  -d "$PLAN_REQ")

echo ">>> 5. Verifying Response Structure..."

# Check for Itinerary
if echo "$PLAN_RES" | grep -q "itinerary"; then
  echo "✅ Itinerary found."
else
  echo "❌ Itinerary MISSING."
  exit 1
fi

# Check for Activities
if echo "$PLAN_RES" | grep -q "activities"; then
  echo "✅ Activities found."
else
  echo "❌ Activities MISSING."
  exit 1
fi

# Check for Restaurants
if echo "$PLAN_RES" | grep -q "restaurants"; then
  echo "✅ Restaurants found."
else
  echo "❌ Restaurants MISSING."
  exit 1
fi

# Check for Packing List
if echo "$PLAN_RES" | grep -q "packingList"; then
  echo "✅ Packing List found."
else
  echo "❌ Packing List MISSING."
  exit 1
fi

echo ">>> 6. Sample Output Snippet:"
echo $PLAN_RES | cut -c 1-500

echo "🎉 Agent Requirements Verified!"
