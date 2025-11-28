#!/bin/bash
set -e

echo "=================================================="
echo "☁️  Setting up EC2 Instance for Airbnb App"
echo "=================================================="

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
fi

echo "Detected OS: $OS"

if [[ "$OS" == *"Amazon Linux"* ]]; then
    echo "🔹 Installing Docker on Amazon Linux..."
    sudo yum update -y
    sudo yum install -y docker
    sudo service docker start
    sudo usermod -a -G docker ec2-user
    echo "   Docker installed."
    
    echo "🔹 Installing Docker Compose..."
    sudo curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "   Docker Compose installed."

elif [[ "$OS" == *"Ubuntu"* ]]; then
    echo "🔹 Installing Docker on Ubuntu..."
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    
    echo \
      "deb [arch=\"$(dpkg --print-architecture)\" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      \"$(. /etc/os-release && echo "$VERSION_CODENAME")\" stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
      
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    sudo usermod -aG docker ubuntu
    echo "   Docker installed."

else
    echo "⚠️  Unsupported OS: $OS. Please install Docker manually."
    exit 1
fi

echo "=================================================="
echo "✅ Setup Complete!"
echo "⚠️  IMPORTANT: You must LOG OUT and LOG BACK IN for group changes to take effect."
echo "=================================================="
