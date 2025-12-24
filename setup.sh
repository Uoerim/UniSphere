#!/bin/bash
# UniSphere Setup Script for Linux/macOS

echo "========================================"
echo "   UniSphere University Management     "
echo "          Setup Script                 "
echo "========================================"
echo ""

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Check Docker
echo "Checking Docker..."
check_docker
echo "✓ Docker is running"
echo ""

# Install server dependencies
echo "Installing server dependencies..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install server dependencies"
    exit 1
fi
echo "✓ Server dependencies installed"
echo ""

# Install client dependencies
echo "Installing client dependencies..."
cd ../client
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install client dependencies"
    exit 1
fi
echo "✓ Client dependencies installed"
echo ""

# Go back to root
cd ..

# Start MySQL with Docker Compose
echo "Starting MySQL database..."
docker-compose up -d mysql
if [ $? -ne 0 ]; then
    echo "❌ Failed to start MySQL"
    exit 1
fi

# Wait for MySQL to be ready
echo "Waiting for MySQL to be ready..."
sleep 10

echo "✓ MySQL is ready"
echo ""

# Setup Prisma
echo "Setting up Prisma (generating client and pushing schema)..."
cd server
npx prisma generate
npx prisma db push
echo "✓ Prisma setup complete"
echo ""

# Create admin user
echo "Creating admin user..."
npm run create-admin
echo ""

cd ..

echo "========================================"
echo "   Setup Complete! 🎉                  "
echo "========================================"
echo ""
echo "To start the application, run:"
echo ""
echo "  Option 1 - Using Docker Compose (Recommended):"
echo "    docker-compose up"
echo ""
echo "  Option 2 - Manual start (3 separate terminals):"
echo "    Terminal 1 (Database):  docker-compose up mysql"
echo "    Terminal 2 (Server):    cd server && npm run dev"
echo "    Terminal 3 (Client):    cd client && npm run dev"
echo "    Terminal 4 (Prisma UI): cd server && npx prisma studio"
echo ""
echo "Application URLs:"
echo "  Frontend:      http://localhost:5173"
echo "  Backend API:   http://localhost:4000"
echo "  Prisma Studio: http://localhost:5555"
echo ""
echo "Default Admin Credentials:"
echo "  Email:    admin@admin.com"
echo "  Password: Admin123!"
echo ""
