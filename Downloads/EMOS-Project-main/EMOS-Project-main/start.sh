#!/bin/bash

# Kill any existing processes on our ports
kill $(lsof -t -i:8000) 2>/dev/null
kill $(lsof -t -i:3000) 2>/dev/null

# Create .env from example if missing
if [ ! -f backend/.env ]; then
  cp .env.example backend/.env
  echo "Created backend/.env from .env.example"
fi

# Create default user for Replit (id=1)
export FIREWORKS_API_KEY="${FIREWORKS_API_KEY:-}"
export FIREWORKS_MODEL="${FIREWORKS_MODEL:-accounts/fireworks/models/glm-5p1}"

# Install backend dependencies
echo "Installing Python dependencies..."
cd backend
pip install -r requirements.txt -q
cd ..

# Install frontend dependencies
echo "Installing Node.js dependencies..."
cd frontend
npm install --legacy-peer-deps
cd ..

# Start backend in background
echo "Starting backend on port 8000..."
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo "Waiting for backend..."
sleep 3

# Start frontend
echo "Starting frontend on port 3000..."
cd frontend
npm run dev -- -H 0.0.0.0 &
FRONTEND_PID=$!
cd ..

echo "============================================"
echo "  EMOS is running!"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"
echo "============================================"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
