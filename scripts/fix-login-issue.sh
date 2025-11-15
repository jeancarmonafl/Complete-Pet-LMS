#!/bin/bash

# Complete LMS Login Issue Fix Script
# This script will restore your development environment to working order

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Complete-Pet LMS - Login Issue Recovery                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

cd "$(dirname "$0")/.."

# Step 1: Create backend .env file
echo "📝 Step 1/6: Creating backend/.env file..."
cat > backend/.env << 'EOF'
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://devuser:devpass123@localhost:5432/complete_pet_lms_dev
JWT_SECRET=local-development-secret-key-min-32-chars-long-for-testing
PASSWORD_SALT_ROUNDS=12
EOF
echo "   ✅ Backend .env created"

# Step 2: Create frontend .env file
echo ""
echo "📝 Step 2/6: Creating frontend/.env file..."
cat > frontend/.env << 'EOF'
VITE_API_URL=http://localhost:4000/api
EOF
echo "   ✅ Frontend .env created"

# Step 3: Check Docker
echo ""
echo "🐳 Step 3/6: Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "   ❌ Docker is not installed"
    echo ""
    echo "Please install Docker Desktop and run this script again:"
    echo "  macOS: https://docs.docker.com/desktop/install/mac-install/"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "   ❌ Docker is not running"
    echo ""
    echo "Please start Docker Desktop and run this script again"
    exit 1
fi
echo "   ✅ Docker is ready"

# Step 4: Start database container
echo ""
echo "📦 Step 4/6: Starting database container..."
if docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

$DOCKER_COMPOSE -f docker-compose.dev.yml up -d

echo "   ⏳ Waiting for database to be ready..."
for i in {1..30}; do
    if docker exec complete-pet-lms-dev-db pg_isready -U devuser &> /dev/null; then
        echo "   ✅ Database is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "   ❌ Database failed to start"
        $DOCKER_COMPOSE -f docker-compose.dev.yml logs
        exit 1
    fi
    sleep 1
done

# Step 5: Run migrations
echo ""
echo "📋 Step 5/6: Running database migrations..."
cd backend

if [ ! -d "node_modules" ]; then
    echo "   📦 Installing backend dependencies first..."
    npm install
fi

node scripts/migrate.js

# Step 6: Seed development data
echo ""
echo "🌱 Step 6/6: Seeding development data..."
node scripts/seed-dev-data.js

cd ..

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  ✅ RECOVERY COMPLETE!                                         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "🎉 Your development environment is now ready!"
echo ""
echo "🔑 TEST CREDENTIALS (password for all: 12345)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "GLOBAL_ADMIN   | jeancarmona@complete-pet.com      | Location: FL"
echo "ADMIN          | admin@complete-pet.com            | Location: FL"
echo "MANAGER        | manager@complete-pet.com          | Location: FL"
echo "SUPERVISOR     | supervisor@complete-pet.com       | Location: FL"
echo "EMPLOYEE       | employee@complete-pet.com         | Location: FL"
echo "ADMIN (VT)     | alice@complete-pet.com            | Location: VT"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 TO START THE SERVERS:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend && npm run dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend && npm run dev"
echo ""
echo "Then open: http://localhost:5173"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 TIP: To run diagnostics anytime, use:"
echo "   node scripts/diagnose-and-fix.js"
echo ""

