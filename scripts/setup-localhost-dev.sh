#!/bin/bash

# Complete localhost development setup
# This script sets up a local PostgreSQL database with test data

set -e

echo "🚀 Complete-Pet LMS - Localhost Development Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo ""
    echo "Please install Docker Desktop:"
    echo "  macOS: https://docs.docker.com/desktop/install/mac-install/"
    echo "  Windows: https://docs.docker.com/desktop/install/windows-install/"
    echo "  Linux: https://docs.docker.com/desktop/install/linux-install/"
    echo ""
    exit 1
fi

echo "✅ Docker is installed"

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running"
    echo ""
    echo "Please start Docker Desktop and try again"
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Use docker compose (newer) or docker-compose (older)
if docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Stop any existing dev database
echo "🧹 Cleaning up any existing dev database..."
$DOCKER_COMPOSE -f docker-compose.dev.yml down -v &> /dev/null || true

# Start the dev database
echo "📦 Starting PostgreSQL development database..."
$DOCKER_COMPOSE -f docker-compose.dev.yml up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
for i in {1..30}; do
    if docker exec complete-pet-lms-dev-db pg_isready -U devuser &> /dev/null; then
        echo "✅ Database is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Database failed to start"
        $DOCKER_COMPOSE -f docker-compose.dev.yml logs
        exit 1
    fi
    sleep 1
done

# Set environment variables for local development
export DATABASE_URL="postgresql://devuser:devpass123@localhost:5432/complete_pet_lms_dev"
export NODE_ENV="development"
export PORT="4000"
export JWT_SECRET="local-development-secret-key-min-32-chars-long-for-testing"
export PASSWORD_SALT_ROUNDS="12"

echo ""
echo "🔧 Setting up backend environment..."

# Create backend .env file
cat > backend/.env << EOF
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://devuser:devpass123@localhost:5432/complete_pet_lms_dev
JWT_SECRET=local-development-secret-key-min-32-chars-long-for-testing
PASSWORD_SALT_ROUNDS=12
EOF

echo "✅ Backend .env file created"

# Run migrations
echo ""
echo "📋 Running database migrations..."
cd backend
node scripts/migrate.js

# Seed development data
echo ""
echo "🌱 Seeding development data..."
node scripts/seed-dev-data.js

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Localhost development environment is ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔑 TEST CREDENTIALS (password for all: 12345)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "GLOBAL_ADMIN   | jeancarmona@complete-pet.com      | FL"
echo "ADMIN          | admin@complete-pet.com            | FL"
echo "MANAGER        | manager@complete-pet.com          | FL"
echo "SUPERVISOR     | supervisor@complete-pet.com       | FL"
echo "EMPLOYEE       | employee@complete-pet.com         | FL"
echo "ADMIN (VT)     | alice@complete-pet.com            | VT"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Sample data created:"
echo "  • 2 locations (FL, VT)"
echo "  • 6 test users with different roles"
echo "  • 5 training courses with quiz questions"
echo ""
echo "🚀 TO START THE SERVERS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Start Backend (Terminal 1):"
echo "   cd backend && npm run dev"
echo ""
echo "2. Start Frontend (Terminal 2):"
echo "   cd frontend && npm run dev"
echo ""
echo "3. Open Browser:"
echo "   http://localhost:5173"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🛠️  USEFUL COMMANDS:"
echo ""
echo "  View database logs:"
echo "    docker logs complete-pet-lms-dev-db"
echo ""
echo "  Connect to database:"
echo "    docker exec -it complete-pet-lms-dev-db psql -U devuser -d complete_pet_lms_dev"
echo ""
echo "  Stop database:"
echo "    docker-compose -f docker-compose.dev.yml down"
echo ""
echo "  Reset everything (delete all data):"
echo "    docker-compose -f docker-compose.dev.yml down -v"
echo "    ./scripts/setup-localhost-dev.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Setup complete! Start the servers and begin testing."
echo ""

