#!/bin/bash
set -e

# Usage: ./verify_pilot_run.sh <PUBLIC_IP>

if [ -z "$1" ]; then
    echo "Usage: $0 <PUBLIC_IP>"
    echo "Example: $0 54.123.45.67"
    exit 1
fi

HOST=$1
TRAVELER_API="http://$HOST:8000/api"
OWNER_API="http://$HOST:8001/api"

echo "🚀 Starting Pilot Run on $HOST..."

# 1. Create a Traveler User
echo "👤 Creating Traveler..."
TRAVELER_EMAIL="pilot_traveler_$(date +%s)@test.com"
curl -s -X POST "$TRAVELER_API/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Pilot Traveler\",\"email\":\"$TRAVELER_EMAIL\",\"password\":\"password123\"}" > /dev/null
echo "✅ Traveler created: $TRAVELER_EMAIL"

# Login Traveler
echo "🔑 Logging in Traveler..."
curl -c traveler_cookies.txt -s -X POST "$TRAVELER_API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TRAVELER_EMAIL\",\"password\":\"password123\"}" > /dev/null

# 2. Create an Owner User
echo "👤 Creating Owner..."
OWNER_EMAIL="pilot_owner_$(date +%s)@test.com"
curl -s -X POST "$TRAVELER_API/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Pilot Owner\",\"email\":\"$OWNER_EMAIL\",\"password\":\"password123\"}" > /dev/null
echo "✅ Owner created: $OWNER_EMAIL"

# Login Owner (Traveler side)
echo "🔑 Logging in Owner..."
curl -c owner_cookies.txt -s -X POST "$TRAVELER_API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$OWNER_EMAIL\",\"password\":\"password123\"}" > /dev/null

# Get Session Token
TOKEN_RESP=$(curl -b owner_cookies.txt -s -X POST "$TRAVELER_API/auth/session-token")
TOKEN=$(echo $TOKEN_RESP | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get session token!"
    echo "Response: $TOKEN_RESP"
    exit 1
fi

# Exchange Token
echo "🔄 Exchanging Token for Owner Session..."
EXCHANGE_RESP=$(curl -c owner_api_cookies.txt -s -X POST "$OWNER_API/auth/exchange" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$TOKEN\"}")

if echo "$EXCHANGE_RESP" | grep -q "error"; then
    echo "❌ Token Exchange Failed!"
    echo "Response: $EXCHANGE_RESP"
    exit 1
fi

# Enable Host
echo "🏠 Enabling Host Mode..."
HOST_RESP=$(curl -b owner_api_cookies.txt -s -X POST "$OWNER_API/host/enable")
if echo "$HOST_RESP" | grep -q "error"; then
    echo "❌ Failed to enable host mode!"
    echo "Response: $HOST_RESP"
    exit 1
fi

# Create Property
echo "Build Property..."
PROP_RESP=$(curl -b owner_api_cookies.txt -s -X POST "$OWNER_API/properties" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pilot Property",
    "description": "Test Property",
    "price": 100,
    "city": "Pilot City",
    "type": "Apartment",
    "capacity": 4,
    "bedrooms": 2,
    "bathrooms": 1,
    "amenities": ["Wifi"]
  }')
PROP_ID=$(echo $PROP_RESP | grep -o '"id":[^,}]*' | cut -d':' -f2 | tr -d ' ')
echo "✅ Property Created: ID $PROP_ID"

# 3. Create Booking (Triggers Kafka Event)
echo "📅 Creating Booking..."
BOOK_RESP=$(curl -b traveler_cookies.txt -s -X POST "$TRAVELER_API/bookings" \
  -H "Content-Type: application/json" \
  -d "{\"propertyId\":\"$PROP_ID\",\"startDate\":\"2025-12-01\",\"endDate\":\"2025-12-05\",\"guests\":1}")
BOOK_ID=$(echo $BOOK_RESP | grep -o '"id":[^,}]*' | cut -d':' -f2 | tr -d ' ')
if [ -z "$BOOK_ID" ]; then
    echo "❌ Booking Creation Failed!"
    echo "Response: $BOOK_RESP"
    exit 1
fi
echo "✅ Booking Created: ID $BOOK_ID"
echo "👉 CHECK KAFKA LOGS NOW! (You should see a booking-events message)"

# 4. Accept Booking (Triggers Status Update)
echo "✅ Accepting Booking..."
curl -b owner_api_cookies.txt -s -X POST "$OWNER_API/bookings/$BOOK_ID/accept" > /dev/null
echo "✅ Booking Accepted."
echo "👉 CHECK KAFKA LOGS AGAIN! (You should see a status update)"

echo "🎉 Pilot Run Complete!"
rm traveler_cookies.txt owner_cookies.txt owner_api_cookies.txt
