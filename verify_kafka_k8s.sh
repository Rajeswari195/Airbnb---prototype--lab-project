#!/bin/bash
set -e

echo "🔍 Verifying Kafka on Kubernetes..."

# 1. Check Pod Status
echo "---------------------------------------------------"
echo "1. Checking Pod Status..."
kubectl get pods -l app=kafka
kubectl get pods -l app=zookeeper

# 2. Check Backend Connection Logs
echo "---------------------------------------------------"
echo "2. Checking Backend Connection Logs..."
echo "Checking Booking Service logs for Kafka connection..."
# Get the booking pod name
BOOKING_POD=$(kubectl get pod -l app=booking -o jsonpath="{.items[0].metadata.name}")
if [ -z "$BOOKING_POD" ]; then
    echo "❌ Booking pod not found!"
else
    # Look for connection success message (adjust grep if needed)
    if kubectl logs $BOOKING_POD | grep -i "Kafka"; then
        echo "✅ Booking Service seems to be talking to Kafka."
    else
        echo "⚠️ No 'Kafka' related logs found in Booking Service. It might be silent or not connected."
    fi
fi

# 3. List Topics
echo "---------------------------------------------------"
echo "3. Listing Kafka Topics..."
# We execute the kafka-topics command INSIDE the kafka pod
KAFKA_POD=$(kubectl get pod -l app=kafka -o jsonpath="{.items[0].metadata.name}")
if [ -z "$KAFKA_POD" ]; then
    echo "❌ Kafka pod not found!"
    exit 1
fi

kubectl exec $KAFKA_POD -- kafka-topics --bootstrap-server localhost:9092 --list

# 4. Consumer Check Instructions
echo "---------------------------------------------------"
echo "4. Real-time Event Monitoring"
echo "To watch events in real-time, run this command in a separate terminal:"
echo ""
echo "kubectl exec -it $KAFKA_POD -- kafka-console-consumer --bootstrap-server localhost:9092 --topic booking-events --from-beginning"
echo ""
echo "Then, create a booking in the UI and watch the event appear!"
