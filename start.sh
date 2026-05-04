#!/bin/bash

# Amenires World Bank - Startup Script
# Keeps the server running and auto-restarts on failure

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        AMENIRES WORLD BANK - SERVER STARTUP                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "✓ .env file created"
    echo "Please edit .env with your configurations"
    echo ""
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✓ Dependencies installed"
    echo ""
fi

# Create database indexes
echo "🔧 Creating database indexes..."
node scripts/createIndexes.js
echo "✓ Indexes created"
echo ""

# Seed data if requested
if [ "$1" = "--seed" ]; then
    echo "🌱 Seeding database..."
    node scripts/seedData.js
    echo "✓ Data seeded"
    echo ""
fi

# Start MongoDB (if not running)
echo "🔍 Checking MongoDB..."
if ! pgrep -x mongod > /dev/null; then
    echo "Starting MongoDB..."
    mongod --dbpath ./data --port 27017 &
    echo "✓ MongoDB started"
else
    echo "✓ MongoDB is already running"
fi
echo ""

# Start the server with auto-restart
echo "🚀 Starting Amenires World Bank Server..."
echo "🌐 Server will be available at: http://localhost:3000"
echo "📱 Open in browser: http://localhost:3000"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Press Ctrl+C to stop the server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Function to restart server on failure
function start_server {
    while true; do
        echo "🔄 Starting server..."
        node server.js
        
        echo "❌ Server stopped with exit code: $?"
        echo "⏳ Waiting 5 seconds before restart..."
        sleep 5
        
        echo "🔄 Restarting server..."
    done
}

# Start the server loop
start_server
