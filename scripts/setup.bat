@echo off
REM Setup script for AgentGraph system on Windows

echo 🚀 Setting up AgentGraph system...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.9+ first.
    pause
    exit /b 1
)

REM Check if Node.js is installed (optional for frontend)
node --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Node.js not found. Frontend setup will be skipped.
    set NODE_AVAILABLE=false
) else (
    echo ✅ Node.js found
    set NODE_AVAILABLE=true
)

REM Setup backend
echo 📦 Setting up backend...
cd backend

REM Create virtual environment
python -m venv venv

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install Python dependencies
pip install -r requirements.txt

cd ..

REM Setup frontend if Node.js is available
if "%NODE_AVAILABLE%"=="true" (
    echo 🎨 Setting up frontend...
    cd frontend
    npm install
    cd ..
)

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file...
    copy .env.example .env
    echo ⚠️  Please edit .env file and add your API keys!
)

echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Edit .env file and add your API keys
echo 2. Run: cd backend ^&^& python scripts/prepare_vector_db.py
echo 3. Start FastAPI backend: cd backend ^&^& python main.py
echo 4. Start React frontend: cd frontend ^&^& npm start
echo.
echo 🌐 FastAPI will be available at: http://localhost:8000
echo 🌐 React frontend will be available at: http://localhost:3000

pause
