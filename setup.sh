#!/bin/bash

# Fuse Financial Verification Agent - Setup Script
# This script sets up the project for easy execution

set -e  # Exit on any error

echo "Fuse Financial Verification Agent - Setup Script"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Step 1: Check prerequisites
print_step "Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    # Try to load nvm if available
    if [ -f "$HOME/.nvm/nvm.sh" ]; then
        print_warning "Node.js not found in PATH. Trying to load nvm..."
        source "$HOME/.nvm/nvm.sh"
        if ! command -v node &> /dev/null; then
            print_error "Node.js is not installed. Please install Node.js (v18+) first."
            print_error "You can install it using: nvm install 20"
            exit 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js (v18+) first."
        exit 1
    fi
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_warning "Node.js version 18+ is recommended. Current version: $(node -v)"
    print_warning "Continuing with current version..."
else
    print_status "Node.js version: $(node -v) - OK"
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "npm version: $(npm -v) - OK"

# Step 2: Install dependencies
print_step "Installing dependencies..."
npm install
print_status "Dependencies installed successfully - OK"

# Step 3: Setup environment
print_step "Setting up environment configuration..."

if [ ! -f ".env" ]; then
    if [ -f "example.env" ]; then
        cp example.env .env
        print_status "Created .env file from example.env - OK"
    else
        print_error "example.env file not found. Please create .env file manually."
        exit 1
    fi
else
    print_warning ".env file already exists. Skipping creation."
fi

# Step 4: Check OpenAI API key
print_step "Checking OpenAI API key configuration..."

if ! grep -q "OPENAI_API_KEY=" .env || grep -q "OPENAI_API_KEY=''" .env; then
    print_warning "OpenAI API key not configured in .env file."
    echo "Please edit .env file and add your OpenAI API key:"
    echo "OPENAI_API_KEY=your_api_key_here"
    echo ""
    read -p "Press Enter to continue after configuring your API key..."
fi

# Step 5: Create necessary directories
print_step "Creating necessary directories..."
mkdir -p logs
mkdir -p data
mkdir -p dashboard
mkdir -p analysis
print_status "Directories created successfully - OK"

# Step 6: Generate initial mock data
print_step "Generating initial mock data for testing..."
node scripts/generate-mock-data.js --count 10 --type mixed
print_status "Mock data generated successfully - OK"

# Step 7: Run initial tests
print_step "Running initial tests to verify setup..."
npm test
print_status "Tests passed successfully - OK"

echo ""
echo "Setup completed successfully!"
echo "============================="
echo ""
echo "Next steps:"
echo "1. Configure your OpenAI API key in .env file"
echo "2. Run the interactive simulator: npm start"
echo "3. Run the advanced simulator: npm run simulator:generated"
echo "4. View the dashboard: open dashboard/index.html"
echo "5. Run evaluations: npm run evaluate"
echo ""
echo "Available commands:"
echo "  npm start                    - Run basic simulator"
echo "  npm run simulator:generated  - Run advanced simulator with mock data"
echo "  npm test                     - Run test suite"
echo "  npm run evaluate             - Run evaluation framework"
echo "  npm run dashboard            - Generate dashboard"
echo "  npm run analyze              - Analyze conversations"
echo "  npm run monitoring           - Start monitoring dashboard"
echo "  npm run evaluation           - Run comprehensive evaluation"
echo ""
echo "Mock Data Generation:"
echo "  npm run generate:mock        - Generate mock data"
echo "  npm run generate:successful  - Generate successful scenarios"
echo "  npm run generate:failure     - Generate identity failure scenarios"
echo "  npm run generate:mixed       - Generate mixed scenarios with LLM"
echo ""
echo "For more information, see README.md"
echo ""
