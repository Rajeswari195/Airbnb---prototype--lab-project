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
  rm -f ross_cookies.txt rachael_cookies.txt
}

# Run cleanup
cleanup

# --- ROSS (HOST) ---
echo ">>> 1. Creating User Ross (Host)..."
ROSS_EMAIL="ross@menon.com"
ROSS_PASS="dinosaur"
curl -s -X POST "$TRAVELER_API/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Ross Geller\",\"email\":\"$ROSS_EMAIL\",\"password\":\"$ROSS_PASS\"}" > /dev/null

echo ">>> 2. Logging in as Ross..."
curl -s -c ross_cookies.txt -X POST "$TRAVELER_API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ROSS_EMAIL\",\"password\":\"$ROSS_PASS\"}" > /dev/null

echo ">>> 3. Ross Becoming Host..."
curl -s -b ross_cookies.txt -X POST "$OWNER_API/host/enable" > /dev/null

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
PROP_ID=$(echo $PROP_RES | jq -r '.id')
echo "Property created: $PROP_ID"

# --- RACHAEL (TRAVELER) ---
echo ">>> 5. Creating User Rachael (Traveler)..."
RACHAEL_EMAIL="rachael@menon.com"
RACHAEL_PASS="fashion"
curl -s -X POST "$TRAVELER_API/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Rachael Green\",\"email\":\"$RACHAEL_EMAIL\",\"password\":\"$RACHAEL_PASS\"}" > /dev/null

echo ">>> 6. Logging in as Rachael..."
curl -s -c rachael_cookies.txt -X POST "$TRAVELER_API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$RACHAEL_EMAIL\",\"password\":\"$RACHAEL_PASS\"}" > /dev/null

echo ">>> 7. Rachael Creating Booking..."
START_DATE=$(date -v+1d +%Y-%m-%d)
END_DATE=$(date -v+3d +%Y-%m-%d)

BOOKING_RES=$(curl -s -b rachael_cookies.txt -X POST "$BOOKING_API/bookings" \
  -H "Content-Type: application/json" \
  -d "{
    \"propertyId\": \"$PROP_ID\",
    \"startDate\": \"$START_DATE\",
    \"endDate\": \"$END_DATE\",
    \"guests\": 1
  }")
BOOKING_ID=$(echo $BOOKING_RES | jq -r '.id')
echo "Booking created: $BOOKING_ID"

echo ">>> 8. Verifying 'Pending' Status for Rachael..."
MY_BOOKINGS=$(curl -s -b rachael_cookies.txt -X GET "$BOOKING_API/bookings")
if echo "$MY_BOOKINGS" | grep -q "Pending"; then
  echo "✅ Rachael sees Pending booking."
else
  echo "❌ Rachael does NOT see Pending booking."
  exit 1
fi

echo ">>> 9. Ross Accepting Booking..."
# Wait for sync
sleep 2
ACCEPT_RES=$(curl -s -b ross_cookies.txt -X POST "$OWNER_API/bookings/$BOOKING_ID/accept")
if echo "$ACCEPT_RES" | grep -q "Accepted"; then
  echo "✅ Ross accepted booking."
else
  echo "❌ Ross failed to accept booking."
  exit 1
fi

echo ">>> 10. Verifying 'Accepted' Status for Rachael..."
sleep 2
MY_BOOKINGS_FINAL=$(curl -s -b rachael_cookies.txt -X GET "$BOOKING_API/bookings")
if echo "$MY_BOOKINGS_FINAL" | grep -q "Accepted"; then
  echo "✅ Rachael sees Accepted booking."
else
  echo "❌ Rachael does NOT see Accepted booking."
  exit 1
fi

echo ">>> 11. Rachael Creating Second Booking (to Cancel)..."
START_DATE_2=$(date -v+10d +%Y-%m-%d)
END_DATE_2=$(date -v+12d +%Y-%m-%d)

BOOKING_RES_2=$(curl -s -b rachael_cookies.txt -X POST "$BOOKING_API/bookings" \
  -H "Content-Type: application/json" \
  -d "{
    \"propertyId\": \"$PROP_ID\",
    \"startDate\": \"$START_DATE_2\",
    \"endDate\": \"$END_DATE_2\",
    \"guests\": 1
  }")
BOOKING_ID_2=$(echo $BOOKING_RES_2 | jq -r '.id')
echo "Booking 2 created: $BOOKING_ID_2"

echo ">>> 12. Ross Cancelling Booking 2..."
sleep 2
CANCEL_RES=$(curl -s -b ross_cookies.txt -X POST "$OWNER_API/bookings/$BOOKING_ID_2/cancel")
if echo "$CANCEL_RES" | grep -q "Cancelled"; then
  echo "✅ Ross cancelled booking."
else
  echo "❌ Ross failed to cancel booking."
  exit 1
fi

echo ">>> 13. Verifying 'Cancelled' Status for Rachael..."
sleep 2
MY_BOOKINGS_FINAL_2=$(curl -s -b rachael_cookies.txt -X GET "$BOOKING_API/bookings")
if echo "$MY_BOOKINGS_FINAL_2" | grep -q "Cancelled"; then
  echo "✅ Rachael sees Cancelled booking."
else
  echo "❌ Rachael does NOT see Cancelled booking."
  exit 1
fi

echo "🎉 Full Rachael Flow Verified!"
