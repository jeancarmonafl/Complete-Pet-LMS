#!/bin/bash

# Start both backend and frontend servers for development

echo "🚀 Starting Complete-Pet LMS Development Servers..."
echo ""

# Check if database is running
if ! docker ps | grep -q complete-pet-lms-dev-db; then
    echo "⚠️  Database is not running!"
    echo ""
    echo "Please run the setup script first:"
    echo "  ./scripts/setup-localhost-dev.sh"
    echo ""
    exit 1
fi

echo "✅ Database is running"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM

# Start backend
echo "📦 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

if curl -s http://localhost:4000/health > /dev/null 2>&1; then
    echo "✅ Backend is running on http://localhost:4000"
else
    echo "❌ Backend failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start frontend
echo ""
echo "🌐 Starting frontend server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "⏳ Waiting for frontend to start..."
sleep 5

if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Frontend is running on http://localhost:5173"
else
    echo "❌ Frontend failed to start"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ALL SERVERS RUNNING!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Frontend:  http://localhost:5173"
echo "🔌 Backend:   http://localhost:4000"
echo "💾 Database:  localhost:5432"
echo ""
echo "🔑 Test Credentials (password: 12345):"
echo "  • jeancarmona@complete-pet.com (Global Admin - FL)"
echo "  • admin@complete-pet.com (Admin - FL)"
echo "  • manager@complete-pet.com (Manager - FL)"
echo ""
echo "Press Ctrl+C to stop all servers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Wait for user interrupt
wait

