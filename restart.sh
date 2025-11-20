#!/bin/bash

# Kurve Server Restart Script
# Kills processes, cleans up, and starts fresh

echo "🛑 Stopping any running servers..."

# Kill processes on ports 3010 (client) and 2568 (server)
lsof -ti:3010 | xargs kill -9 2>/dev/null
lsof -ti:2568 | xargs kill -9 2>/dev/null

# Wait for ports to be released
sleep 2

echo "🧹 Cleaning up build files..."

# Remove build artifacts
rm -rf dist/ 2>/dev/null

echo "🔨 Rebuilding project..."

# Rebuild the project
npm run build 2>/dev/null || echo "⚠️  No build script found, skipping..."

echo "🚀 Starting servers..."

# Start the application
npm start
