#!/bin/bash
echo "🕵️‍♂️ Debugging Image Architecture..."

echo "1. Host Architecture:"
uname -m

echo "----------------------------------------"
echo "2. Docker Image Architecture (frontend):"
docker inspect docker.io/rajeswari1929/frontend-service:lab2 --format '{{.Architecture}}' || echo "Image not found in Docker"

echo "----------------------------------------"
echo "3. K3s Image Architecture (frontend):"
sudo k3s ctr -n k8s.io images list | grep frontend | awk '{print $1, $5}' || echo "Image not found in K3s"

echo "----------------------------------------"
echo "4. Docker Info (Default Runtime):"
docker info | grep -i "Architecture"
