#!/bin/bash
set -e

echo "🔑 Creating Kubernetes Secrets..."

# 1. Try to read from .env file first
if [ -f .env ]; then
    echo "📄 Found .env file, reading keys..."
    export $(grep -v '^#' .env | xargs)
fi

# 2. Check if keys are set, otherwise ask user
if [ -z "$GEMINI_API_KEY" ]; then
    echo "⚠️  GEMINI_API_KEY not found in .env"
    read -p "Enter GEMINI_API_KEY: " GEMINI_API_KEY
fi

if [ -z "$TAVILY_API_KEY" ]; then
    echo "⚠️  TAVILY_API_KEY not found in .env"
    read -p "Enter TAVILY_API_KEY: " TAVILY_API_KEY
fi

# 3. Create the Secret in Kubernetes
# We use --dry-run=client -o yaml | kubectl apply -f - so it's idempotent (can run multiple times)
kubectl create secret generic app-secrets \
    --from-literal=GEMINI_API_KEY="$GEMINI_API_KEY" \
    --from-literal=TAVILY_API_KEY="$TAVILY_API_KEY" \
    --dry-run=client -o yaml | kubectl apply -f -

echo "✅ Secrets 'app-secrets' created successfully!"
echo "🔄 Restarting Agent to pick up secrets..."
kubectl rollout restart deployment agent-deployment
