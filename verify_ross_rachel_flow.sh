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
  rm -f ross_cookies.txt rachel_cookies.txt
}

# Run cleanup
cleanup

# --- ROSS (HOST) ---
echo ">>> 1. Creating User Ross (Host)..."
ROSS_EMAIL="ross@friends.com"
ROSS_PASS="dinosaur"
curl -s -X POST "$TRAVELER_API/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Ross Geller\",\"email\":\"$ROSS_EMAIL\",\"password\":\"$ROSS_PASS\"}" > /dev/null
echo "User Ross created."

echo ">>> 2. Logging in as Ross..."
curl -s -c ross_cookies.txt -X POST "$TRAVELER_API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ROSS_EMAIL\",\"password\":\"$ROSS_PASS\"}" > ross_login.json
ROSS_ID=$(cat ross_login.json | jq -r '.id')
echo "Ross ID: $ROSS_ID"

echo ">>> 3. Ross Becoming Host..."
curl -s -b ross_cookies.txt -X POST "$OWNER_API/host/enable" > /dev/null
echo "Ross enabled as Host."

echo ">>> 4. Ross Creating Property..."
PROP_RES=$(curl -s -b ross_cookies.txt -X POST "$OWNER_API/properties" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Ross Apartment",
    "type": "Apartment",
    "price": 200,
    "city": "New York",
    "bedrooms": 2,
    "bathrooms": 1,
    "capacity": 2
  }')
echo "Property Response: $PROP_RES"
PROP_ID=$(echo $PROP_RES | jq -r '.id')
echo "Property created: $PROP_ID"

# --- RACHEL (TRAVELER) ---
echo ">>> 5. Creating User Rachel (Traveler)..."
RACHEL_EMAIL="rachel@friends.com"
RACHEL_PASS="fashion"
curl -s -X POST "$TRAVELER_API/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Rachel Green\",\"email\":\"$RACHEL_EMAIL\",\"password\":\"$RACHEL_PASS\"}" > /dev/null
echo "User Rachel created."

echo ">>> 6. Logging in as Rachel..."
curl -s -c rachel_cookies.txt -X POST "$TRAVELER_API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$RACHEL_EMAIL\",\"password\":\"$RACHEL_PASS\"}" > rachel_login.json
RACHEL_ID=$(cat rachel_login.json | jq -r '.id')
echo "Rachel ID: $RACHEL_ID"

echo ">>> 7. Rachel Creating Booking..."
START_DATE=$(date -v+1d +%Y-%m-%d)
END_DATE=$(date -v+3d +%Y-%m-%d)

BOOKING_RES=$(curl -s -b rachel_cookies.txt -X POST "$BOOKING_API/bookings" \
  -H "Content-Type: application/json" \
  -d "{
    \"propertyId\": \"$PROP_ID\",
    \"startDate\": \"$START_DATE\",
    \"endDate\": \"$END_DATE\",
    \"guests\": 1
  }")
echo "Booking Response: $BOOKING_RES"
BOOKING_ID=$(echo $BOOKING_RES | jq -r '.id')

if [ "$BOOKING_ID" == "null" ] || [ -z "$BOOKING_ID" ]; then
  echo "❌ FAILURE: Booking creation failed."
  exit 1
fi
echo "Booking created: $BOOKING_ID"

# --- ROSS (VERIFY) ---
echo ">>> 8. Ross Verifying Host Dashboard..."
# Wait for sync
sleep 5
DASHBOARD_RES=$(curl -s -b ross_cookies.txt -X GET "$OWNER_API/dashboard")
echo "Dashboard Response: $DASHBOARD_RES"

if echo "$DASHBOARD_RES" | grep -q "$BOOKING_ID"; then
  echo "✅ SUCCESS: Booking found in Ross's Dashboard!"
else
  echo "❌ FAILURE: Booking NOT found in Ross's Dashboard."
  exit 1
fi

echo ">>> 9. Ross Accepting Booking..."
ACCEPT_RES=$(curl -s -b ross_cookies.txt -X POST "$OWNER_API/bookings/$BOOKING_ID/accept")
echo "Accept Response: $ACCEPT_RES"

if echo "$ACCEPT_RES" | grep -q "Accepted"; then
  echo "✅ SUCCESS: Booking Accepted!"
else
  echo "❌ FAILURE: Could not accept booking."
  exit 1
fi
