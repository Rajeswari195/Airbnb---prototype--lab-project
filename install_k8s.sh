#!/bin/bash
set -e

echo "🚀 Starting Kubernetes (K3s) Installation..."

# 1. Stop Docker Compose to free up ports (80, 8000, 8001, etc.)
echo "🛑 Stopping Docker Compose containers..."
docker compose down
echo "✅ Docker Compose stopped."

# 2. Install K3s (Lightweight Kubernetes)
# We disable traefik because we want to use our own LoadBalancer logic or simple port binding
# But actually, K3s's built-in ServiceLB (Klipper) is exactly what we want to bind to host ports.
# So we KEEP default settings.
if ! command -v k3s &> /dev/null; then
    echo "📦 Installing K3s..."
    curl -sfL https://get.k3s.io | sh -
else
    echo "✅ K3s is already installed."
fi

# 3. Configure kubectl permission for the current user
echo "🔑 Configuring kubectl permissions..."
sudo chmod 644 /etc/rancher/k3s/k3s.yaml
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config
export KUBECONFIG=~/.kube/config

# 4. Wait for K3s to be ready
echo "⏳ Waiting for K3s to be ready..."
sleep 10
kubectl get nodes

# 5. Apply Manifests
echo "📄 Applying Kubernetes Manifests..."
kubectl apply -f infra/k8s/

# 6. Install K9s (Terminal UI)
if ! command -v k9s &> /dev/null; then
    echo "🐶 Installing K9s (Kubernetes UI)..."
    curl -sS https://webinstall.dev/k9s | bash
    export PATH="/root/.local/bin:$PATH"
else
    echo "✅ K9s is already installed."
fi

echo "🎉 Kubernetes Deployment Complete!"
echo "You can now use 'kubectl get pods' to check status."
echo "Or run 'k9s' for an interactive dashboard!"
echo ""
echo "⚠️  NOTE: If you want to go back to Docker Compose, run:"
echo "   sudo /usr/local/bin/k3s-uninstall.sh"
echo "   docker compose up -d"
