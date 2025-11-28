# Analytics Service

## Overview
The Analytics Service captures user interactions (clicks, views) and stores them for analysis. It uses a message-driven architecture with Kafka.

## Architecture
1.  **Producer**: The Frontend (via Traveler API) sends events to `POST /api/analytics`.
2.  **Traveler Service**: Publishes these events to the `analytics.clicks` Kafka topic.
3.  **Consumer**: The Traveler Service (or a dedicated Analytics Service) subscribes to `analytics.clicks` and saves events to the `analyticsevents` collection in MongoDB.

## Event Schema
```json
{
  "traceId": "string (UUID)",
  "userId": "string (MongoID or 'anonymous')",
  "eventType": "string (e.g., 'VIEW_PROPERTY', 'CLICK_BOOK')",
  "payload": { ... },
  "timestamp": "Date"
}
```

## Traceability
A `traceId` is generated for each request (or passed via headers) to track the flow of events across services. This ID is included in the analytics event.

## Verification
1.  Trigger an event in the UI (e.g., view a property).
2.  Check Traveler Service logs for "Sent analytics event".
3.  Check Kafka Consumer logs for "Received event".
4.  Verify the document exists in MongoDB `analyticsevents` collection.
