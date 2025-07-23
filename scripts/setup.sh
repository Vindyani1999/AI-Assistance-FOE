#!/bin/bash

# Setup script for AgentGraph system

echo "🚀 Setting up AgentGraph system..."

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.9+ first."
    exit 1
fi

# Check if Node.js is installed (optional for frontend)
if command -v node &> /dev/null; then
    echo "✅ Node.js found"
    NODE_AVAILABLE=true
else
    echo "⚠️  Node.js not found. Frontend setup will be skipped."
    NODE_AVAILABLE=false
fi

# Setup backend
echo "📦 Setting up backend..."
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Install Python dependencies
pip install -r requirements.txt

cd ..

# Setup frontend if Node.js is available
if [ "$NODE_AVAILABLE" = true ]; then
    echo "🎨 Setting up frontend..."
    cd frontend
    npm install
    cd ..
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file and add your API keys!"
fi

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file and add your API keys"
echo "2. Run: cd backend && python scripts/prepare_vector_db.py"
echo "3. Start FastAPI backend: cd backend && python main.py"
echo "4. Start React frontend: cd frontend && npm start"
echo ""
echo "🌐 FastAPI will be available at: http://localhost:8000"
echo "🌐 React frontend will be available at: http://localhost:3000"
