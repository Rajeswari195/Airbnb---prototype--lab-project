# System Runbook: Build, Deploy, and Verify

This guide details how to run the Airbnb Distributed Prototype using Docker and Kubernetes.

**Docker Hub Username**: `rajeswari1929`

## 1. Prerequisites
- **Docker**: For building images.
- **Kubernetes Cluster**: Minikube, Docker Desktop, or Kind.
- **kubectl**: CLI tool.
- **Docker Hub Login**: Run `docker login` in your terminal.

## 2. Quick Start (Automated)
We have created a script to automate the build, push, and deploy process.

```bash
# Make executable (if not already)
chmod +x deploy.sh

# Run deployment
./deploy.sh rajeswari1929
```

This script will:
1.  Build all Docker images.
2.  Push them to `docker.io/rajeswari1929/...`.
3.  Apply all Kubernetes manifests.
4.  Restart pods to ensure fresh images are used.

> **IMPORTANT**: If you faced "Module not found: index.css" or "CrashLoopBackOff", running this script is the **required fix**. It rebuilds the images with the corrected code.

---

## 3. Manual Deployment Steps (Alternative)

If you prefer to run steps manually, follow these instructions.

### 3.1. Build and Push Images
```bash
# Backend Services
docker build -t rajeswari1929/traveler-service:lab2 ./backend/traveler
docker push rajeswari1929/traveler-service:lab2

docker build -t rajeswari1929/owner-service:lab2 ./backend/owner
docker push rajeswari1929/owner-service:lab2

docker build -t rajeswari1929/property-service:lab2 ./backend/property
docker push rajeswari1929/property-service:lab2

docker build -t rajeswari1929/booking-service:lab2 ./backend/booking
docker push rajeswari1929/booking-service:lab2

# Agent Service
docker build -t rajeswari1929/agent-service:lab2 ./agent
docker push rajeswari1929/agent-service:lab2

# Frontend
docker build -t rajeswari1929/frontend-service:lab2 ./frontend
docker push rajeswari1929/frontend-service:lab2
```

### 3.2. Deploy to Kubernetes

**1. Create Secrets**
```bash
kubectl create secret generic app-secrets --from-env-file=.env
```

**2. Deploy Infrastructure**
```bash
kubectl apply -f infra/k8s/zookeeper.yaml
kubectl apply -f infra/k8s/kafka.yaml
kubectl apply -f infra/k8s/mongo.yaml
```

**3. Deploy Services**
```bash
kubectl apply -f infra/k8s/traveler.yaml
kubectl apply -f infra/k8s/owner.yaml
kubectl apply -f infra/k8s/property.yaml
kubectl apply -f infra/k8s/booking.yaml
kubectl apply -f infra/k8s/agent.yaml
kubectl apply -f infra/k8s/frontend.yaml
```

## 4. Verification

### 4.1. Check Pod Status
Ensure all pods are `Running` (1/1).
```bash
kubectl get pods
```

### 4.2. Access the Application
Forward the frontend port to access it at [http://localhost:3000](http://localhost:3000).
```bash
kubectl port-forward svc/frontend-service 3000:3000
```

### 4.3. Verify Functionality
1.  **Login**: Try logging in as a traveler.
2.  **Search**: Search for properties.
3.  **Book**: Create a booking and check if it appears in the "My Bookings" list.
4.  **Agent**: Test the AI planning feature (if UI integration is complete) or check logs.

## 5. Troubleshooting
*   **ErrImagePull**: Ensure you ran `docker push` for all images.
*   **CrashLoopBackOff**: Check logs (`kubectl logs <pod-name>`) for missing env vars or DB connection issues.
