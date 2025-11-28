#!/bin/bash
set -e

echo "=================================================="
echo "🛠️  Airbnb Prototype Dependency Setup"
echo "=================================================="

# --- Function to check command existence ---
check_cmd() {
    if ! command -v "$1" &> /dev/null; then
        echo "❌ Error: '$1' is not installed."
        return 1
    fi
    return 0
}

# --- 1. Check System Tools ---
echo "🔍 Checking System Tools..."
check_cmd docker || { echo "Please install Docker Desktop."; exit 1; }
check_cmd kubectl || { echo "Please install kubectl."; exit 1; }
echo "✅ Docker and kubectl found."

# --- 2. Node.js Setup (v20 LTS recommended) ---
echo -e "\n🟢 Checking Node.js..."

# Try to load NVM if available
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    echo "   Loading nvm..."
    \. "$NVM_DIR/nvm.sh"
    echo "   Installing/Using Node v20 (LTS)..."
    nvm install 20
    nvm use 20
else
    echo "   ⚠️  nvm not found. Checking system node version..."
    if check_cmd node; then
        NODE_VER=$(node -v)
        echo "   Current Node version: $NODE_VER"
        # Simple check for v18+ (major version)
        MAJOR_VER=$(echo $NODE_VER | cut -d. -f1 | tr -d 'v')
        if [ "$MAJOR_VER" -lt 18 ]; then
            echo "   ❌ Error: Node.js v18 or higher is required (React 19/Express 5)."
            echo "   Please install Node v20 or use nvm."
            exit 1
        fi
    else
        echo "   ❌ Error: Node.js not found."
        exit 1
    fi
fi
echo "✅ Node.js ready."

# --- 3. Python Setup (v3.11 required for Agent) ---
echo -e "\n🐍 Checking Python..."

# Try to load pyenv if available
if command -v pyenv &> /dev/null; then
    echo "   pyenv found. Installing/Using Python 3.11.9..."
    pyenv install 3.11.9 -s
    pyenv local 3.11.9
    eval "$(pyenv init -)"
else
    echo "   ⚠️  pyenv not found. Checking system python3..."
    if check_cmd python3; then
        PY_VER=$(python3 --version)
        echo "   Current Python version: $PY_VER"
        if [[ "$PY_VER" != *"3.11"* ]]; then
            echo "   ⚠️  Warning: Agent is tested on Python 3.11. You are using $PY_VER."
            echo "   If you encounter issues, please install Python 3.11."
        fi
    else
        echo "   ❌ Error: python3 not found."
        exit 1
    fi
fi
echo "✅ Python ready."

# --- 4. Install Project Dependencies ---
echo -e "\n📦 Installing Project Dependencies..."

install_npm() {
    DIR=$1
    if [ -d "$DIR" ]; then
        echo "   🔹 Installing dependencies for $DIR..."
        (cd "$DIR" && npm install --silent)
        echo "      Done."
    else
        echo "   ⚠️  Directory $DIR not found, skipping."
    fi
}

# Backend Services
install_npm "backend/traveler"
install_npm "backend/owner"
install_npm "backend/property"
install_npm "backend/booking"

# Frontend
install_npm "frontend"

# Agent (Python)
if [ -d "agent" ]; then
    echo "   🔹 Installing Python dependencies for agent..."
    # Create venv if not exists (optional but good practice)
    if [ ! -d "agent/venv" ]; then
        echo "      Creating virtualenv..."
        python3 -m venv agent/venv
    fi
    source agent/venv/bin/activate
    pip install -r agent/requirements.txt --quiet
    deactivate
    echo "      Done."
fi

echo -e "\n=================================================="
echo "🎉 Dependency Setup Complete!"
echo "=================================================="
echo "You can now run:"
echo "  ./start_system.sh"
