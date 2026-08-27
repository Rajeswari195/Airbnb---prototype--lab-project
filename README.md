# Airbnb Distributed System Prototype (Lab 2)

A distributed Airbnb prototype, migrated from a monolithic architecture to a microservices-based system, with an AI travel concierge running as its own service in the cluster.

## Key Features

- **Microservices Architecture**: Separate services for Traveler, Owner, Property, Booking, and Agent.
- **Agentic AI**: An AI Concierge that plans trips from booking details and traveler preferences, using web search tools and a language model with structured output. See [AI Concierge Agent](#ai-concierge-agent) below.
- **Containerization**: All services are Dockerized and orchestrated using Kubernetes.
- **Distributed Data**: Migrated from MySQL to MongoDB as the sole active database.
- **Message-Driven**: Uses Kafka for asynchronous communication (Bookings, Analytics).
- **Frontend State Management**: Redux Toolkit for Auth, Properties, and Bookings state.
- **Performance Testing**: JMeter test plans for load testing.
- **CI/CD**: GitHub Actions workflow for automated testing.

## Architecture Overview

### Services

- **Traveler Service** (`:8000`): User auth, property search, booking requests, and analytics.
- **Owner Service** (`:8001`): Owner auth, property management, and booking acceptance.
- **Property Service** (`:8002`): Property data (legacy/shared).
- **Booking Service** (`:8003`): Processes booking requests asynchronously via Kafka.
- **Agent Service** (`:8500`): AI travel concierge.
- **Frontend** (`:3000`): React application with Redux.

### Infrastructure

- **MongoDB**: Primary database.
- **Kafka & Zookeeper**: Event streaming platform.
- **Kubernetes**: Orchestration (manifests in `infra/k8s/`).

## AI Concierge Agent

The Agent Service turns a booking and a set of traveler preferences into a structured trip plan. Given dates, location, party composition, budget tier, dietary needs, and mobility constraints, it returns a day-by-day itinerary with activities, restaurants, and a packing list.

### How it works

1. Runs several targeted searches through Tavily — points of interest, restaurants matching dietary needs, local events in the date range, and optionally weather and packing guidance.
2. Assembles the results into a single context block.
3. Passes that to Gemini under a strict JSON schema, so the response comes back as typed objects rather than prose the frontend has to parse.

### Design notes

- Every response field is defined as a Pydantic model, so malformed output fails at the boundary instead of downstream.
- Search failures return a clean `502` rather than a partial plan.
- Activities carry accessibility flags (`wheelchairFriendly`, `childFriendly`) and a time-of-day slot, so the frontend can filter without re-querying.

### Endpoints

| Method | Path      | Returns                          |
| ------ | --------- | -------------------------------- |
| `POST` | `/plan`   | Full itinerary, activities, restaurants, packing list |
| `GET`  | `/health` | Service status                   |

### Example

**Request**

```json
{
  "booking": {
    "location": "Kyoto, Japan",
    "startDate": "2026-04-10",
    "endDate": "2026-04-13",
    "party": { "adults": 2, "kids": 1, "type": "family" },
    "budgetTier": "moderate"
  },
  "preferences": {
    "interests": ["temples", "food markets"],
    "dietary": ["vegetarian"],
    "mobility": "stroller friendly"
  },
  "includeWeather": true
}
```

**Response** (abbreviated)

```json
{
  "source": "gemini+tavily",
  "itinerary": [
    { "date": "2026-04-10", "morning": "...", "afternoon": "...", "evening": "..." }
  ],
  "activities": [
    {
      "title": "Fushimi Inari Shrine",
      "priceTier": "budget",
      "tags": ["temple", "outdoor"],
      "wheelchairFriendly": false,
      "childFriendly": true,
      "when": "morning"
    }
  ],
  "restaurants": [
    { "name": "...", "dietTags": ["vegetarian"], "priceTier": "moderate" }
  ],
  "packingList": ["light rain jacket", "comfortable walking shoes"]
}
```

Built with FastAPI, Gemini, and Tavily.

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Kubernetes (Minikube or Docker Desktop)
- Node.js 18+
- Python 3.11+

### Local Development (Docker Compose)

```bash
docker-compose up --build
```

### Kubernetes Deployment

```bash
# Apply secrets (create .env first)
kubectl create secret generic app-secrets --from-env-file=.env

# Apply infrastructure
kubectl apply -f infra/k8s/zookeeper.yaml
kubectl apply -f infra/k8s/kafka.yaml
kubectl apply -f infra/k8s/mongo.yaml

# Apply services
kubectl apply -f infra/k8s/
```

### Environment Variables

The Agent Service needs a `.env` file in `agent/`:

```
GEMINI_API_KEY=your_key
TAVILY_API_KEY=your_key
GEMINI_MODEL_NAME=gemini-2.5-pro
AGENT_PORT=8500
```

## Running Tests

- **Backend/Frontend**: `npm test` in the respective directories.
- **Performance**: `jmeter -n -t infra/perf/test_plan.jmx`

## Documentation

- [Database Migration](docs/DB_MIGRATION.md)
- [Analytics Service](docs/ANALYTICS.md)
- [Performance Testing](docs/PERFORMANCE.md)

## License

MIT

