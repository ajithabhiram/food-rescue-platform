#!/bin/bash

# Food Rescue Platform - Quick Setup Script
# This script automates the initial setup process

set -e

echo "🌱 Food Rescue Platform - Quick Setup"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm $(npm --version) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp .env.local.example .env.local
    echo "✅ .env.local created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env.local with your Supabase credentials"
    echo "   1. Go to https://supabase.com"
    echo "   2. Create a new project"
    echo "   3. Get your API keys from Settings → API"
    echo "   4. Update .env.local with your keys"
    echo ""
else
    echo "✅ .env.local already exists"
    echo ""
fi

# Check if .env.local has been configured
if grep -q "your-project.supabase.co" .env.local 2>/dev/null; then
    echo "⚠️  WARNING: .env.local still has placeholder values"
    echo "   Please update it with your actual Supabase credentials"
    echo ""
fi

echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your Supabase credentials"
echo "2. Deploy database schema (see INSTALLATION.md)"
echo "3. Run: npm run dev"
echo "4. Open: http://localhost:3000"
echo ""
echo "📚 For detailed instructions, see INSTALLATION.md"
echo ""
