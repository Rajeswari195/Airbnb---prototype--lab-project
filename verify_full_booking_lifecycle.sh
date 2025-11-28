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
  rm -f host_cookies.txt traveler_cookies.txt
}

# Run cleanup
cleanup

# --- HOST SETUP ---
echo ">>> 1. Creating Host (Monica)..."
HOST_EMAIL="monica@friends.com"
HOST_PASS="cleaning"
curl -s -X POST "$TRAVELER_API/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Monica Geller\",\"email\":\"$HOST_EMAIL\",\"password\":\"$HOST_PASS\"}" > /dev/null

echo ">>> 2. Host Logging in..."
curl -s -c host_cookies.txt -X POST "$TRAVELER_API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$HOST_EMAIL\",\"password\":\"$HOST_PASS\"}" > /dev/null

echo ">>> 3. Enabling Host Mode..."
curl -s -b host_cookies.txt -X POST "$OWNER_API/host/enable" > /dev/null

echo ">>> 4. Creating Property..."
PROP_RES=$(curl -s -b host_cookies.txt -X POST "$OWNER_API/properties" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Monica Apartment",
    "type": "Apartment",
    "price": 250,
    "city": "New York",
    "bedrooms": 2,
    "bathrooms": 1,
    "capacity": 3
  }')
PROP_ID=$(echo $PROP_RES | jq -r '.id')
echo "Property created: $PROP_ID"

# --- TRAVELER SETUP ---
echo ">>> 5. Creating Traveler (Chandler)..."
TRAVELER_EMAIL="chandler@friends.com"
TRAVELER_PASS="jokes"
curl -s -X POST "$TRAVELER_API/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Chandler Bing\",\"email\":\"$TRAVELER_EMAIL\",\"password\":\"$TRAVELER_PASS\"}" > /dev/null

echo ">>> 6. Traveler Logging in..."
curl -s -c traveler_cookies.txt -X POST "$TRAVELER_API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TRAVELER_EMAIL\",\"password\":\"$TRAVELER_PASS\"}" > /dev/null

# --- BOOKING FLOW ---
echo ">>> 7. Traveler Creating Booking..."
START_DATE=$(date -v+5d +%Y-%m-%d)
END_DATE=$(date -v+7d +%Y-%m-%d)

BOOKING_RES=$(curl -s -b traveler_cookies.txt -X POST "$BOOKING_API/bookings" \
  -H "Content-Type: application/json" \
  -d "{
    \"propertyId\": \"$PROP_ID\",
    \"startDate\": \"$START_DATE\",
    \"endDate\": \"$END_DATE\",
    \"guests\": 2
  }")
BOOKING_ID=$(echo $BOOKING_RES | jq -r '.id')
echo "Booking created: $BOOKING_ID"

echo ">>> 8. Verifying 'Pending' Status for Traveler..."
MY_BOOKINGS=$(curl -s -b traveler_cookies.txt -X GET "$BOOKING_API/bookings")
if echo "$MY_BOOKINGS" | grep -q "Pending"; then
  echo "✅ Traveler sees Pending booking."
else
  echo "❌ Traveler does NOT see Pending booking."
  exit 1
fi

echo ">>> 9. Host Accepting Booking..."
# Wait for sync
sleep 2
ACCEPT_RES=$(curl -s -b host_cookies.txt -X POST "$OWNER_API/bookings/$BOOKING_ID/accept")
if echo "$ACCEPT_RES" | grep -q "Accepted"; then
  echo "✅ Host accepted booking."
else
  echo "❌ Host failed to accept booking."
  exit 1
fi

echo ">>> 10. Verifying 'Accepted' Status for Traveler..."
# Wait for sync (if any async process involved, though DB update should be immediate)
sleep 2
MY_BOOKINGS_FINAL=$(curl -s -b traveler_cookies.txt -X GET "$BOOKING_API/bookings")
if echo "$MY_BOOKINGS_FINAL" | grep -q "Accepted"; then
  echo "✅ Traveler sees Accepted booking."
else
  echo "❌ Traveler does NOT see Accepted booking."
  exit 1
fi

echo "🎉 Full Booking Lifecycle Verified!"
