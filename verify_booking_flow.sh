#!/bin/bash
set -e

# Base URLs
TRAVELER_API="http://localhost:8000/api"
OWNER_API="http://localhost:8001/api"
BOOKING_API="http://localhost:8003/api"

# Cleanup function
cleanup() {
  echo "🧹 Cleaning up database..."
  kubectl exec -it deployment/mongo-deployment -- mongosh airbnb --eval "db.dropDatabase()" > /dev/null
  rm -f traveler_cookies.txt
}

# Run cleanup
cleanup

echo ">>> 1. Creating Traveler..."
TRAVELER_EMAIL="traveler_$(date +%s)@test.com"
TRAVELER_PASS="password123"
curl -s -X POST "$TRAVELER_API/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Traveler Test\",\"email\":\"$TRAVELER_EMAIL\",\"password\":\"$TRAVELER_PASS\"}" > /dev/null
echo "Traveler created: $TRAVELER_EMAIL"

echo ">>> 2. Logging in as Traveler..."
# Save cookies to traveler_cookies.txt
curl -s -c traveler_cookies.txt -X POST "$TRAVELER_API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TRAVELER_EMAIL\",\"password\":\"$TRAVELER_PASS\"}" > login_response.json
TRAVELER_ID=$(cat login_response.json | jq -r '.id')
echo "Traveler ID: $TRAVELER_ID"

echo ">>> 3. Becoming Host..."
# Use traveler cookies to enable host
curl -s -b traveler_cookies.txt -X POST "$OWNER_API/host/enable" > /dev/null
echo "Host enabled."

echo ">>> 4. Creating Property..."
# Create property as host
PROP_RES=$(curl -s -b traveler_cookies.txt -X POST "$OWNER_API/properties" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Property",
    "type": "Apartment",
    "price": 100,
    "city": "Test City",
    "bedrooms": 1,
    "bathrooms": 1,
    "capacity": 2
  }')
echo "Property Response: $PROP_RES"
PROP_ID=$(echo $PROP_RES | jq -r '.id')
echo "Property created: $PROP_ID"

echo ">>> 5. Creating Booking..."
# Create booking as traveler (same user, but that's allowed)
START_DATE=$(date -v+1d +%Y-%m-%d)
END_DATE=$(date -v+3d +%Y-%m-%d)

BOOKING_RES=$(curl -s -b traveler_cookies.txt -X POST "$BOOKING_API/bookings" \
  -H "Content-Type: application/json" \
  -d "{
    \"propertyId\": \"$PROP_ID\",
    \"startDate\": \"$START_DATE\",
    \"endDate\": \"$END_DATE\",
    \"guests\": 1
  }")
echo "Booking Response: $BOOKING_RES"
BOOKING_ID=$(echo $BOOKING_RES | jq -r '.id')
echo "Booking created: $BOOKING_ID"

echo ">>> 6. Verifying Host Dashboard..."
# Wait for Kafka consumer to process event
sleep 5
DASHBOARD_RES=$(curl -s -b traveler_cookies.txt -X GET "$OWNER_API/dashboard")
echo "Dashboard Response: $DASHBOARD_RES"

if echo "$DASHBOARD_RES" | grep -q "$BOOKING_ID"; then
  echo "✅ SUCCESS: Booking found in Host Dashboard!"
else
  echo "❌ FAILURE: Booking NOT found in Host Dashboard."
  exit 1
fi

echo ">>> 6. Verifying Host Dashboard..."
# Check dashboard for the new booking
sleep 2 # Wait for Kafka sync
DASHBOARD=$(curl -s -b traveler_cookies.txt "$OWNER_API/dashboard")
REQUEST_COUNT=$(echo $DASHBOARD | jq '.recentRequests | length')

echo "Dashboard Response: $DASHBOARD"

if [ "$REQUEST_COUNT" -gt 0 ]; then
  echo "✅ SUCCESS: Booking found in Host Dashboard!"
else
  echo "❌ FAILURE: Booking NOT found in Host Dashboard."
  exit 1
fi
