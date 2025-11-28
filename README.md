# Airbnb Distributed System Prototype (Lab 2)

This repository contains the source code for a distributed Airbnb prototype, migrated from a monolithic architecture to a microservices-based system.

## Key Features (Lab 2)
- **Microservices Architecture**: Separate services for Traveler, Owner, Property, Booking, and Agent.
- **Containerization**: All services are Dockerized and orchestrated using Kubernetes.
- **Distributed Data**: Migrated from MySQL to **MongoDB** as the sole active database.
- **Message-Driven**: Uses **Kafka** for asynchronous communication (Bookings, Analytics).
- **Frontend State Management**: Implemented **Redux Toolkit** for managing Auth, Properties, and Bookings state.
- **Agentic AI**: AI Concierge service using Gemini and Tavily for personalized travel planning.
- **Performance Testing**: JMeter test plans for load testing.
- **CI/CD**: GitHub Actions workflow for automated testing.

## Architecture Overview

### Services
- **Traveler Service** (`:8000`): Handles user auth, property search, booking requests, and analytics.
- **Owner Service** (`:8001`): Handles owner auth, property management, and booking acceptance.
- **Property Service** (`:8002`): Manages property data (legacy/shared).
- **Booking Service** (`:8003`): Processes booking requests asynchronously via Kafka.
- **Agent Service** (`:8500`): AI travel assistant.
- **Frontend** (`:3000`): React application with Redux.

### Infrastructure
- **MongoDB**: Primary database.
- **Kafka & Zookeeper**: Event streaming platform.
- **Kubernetes**: Orchestration (Manifests in `infra/k8s/`).

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

### Running Tests
- **Backend/Frontend**: `npm test` in respective directories.
- **Performance**: `jmeter -n -t infra/perf/test_plan.jmx`

## Documentation
- [Database Migration](docs/DB_MIGRATION.md)
- [Analytics Service](docs/ANALYTICS.md)
- [Performance Testing](docs/PERFORMANCE.md)

## License
MIT
