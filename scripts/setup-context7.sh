#!/bin/bash

# Context7 Setup Script
# Configures Context7 MCP and CLI for the project

set -e

echo "🔧 Setting up Context7..."
echo ""

# Check if Context7 CLI is installed
if ! command -v context7 &> /dev/null; then
    echo "📦 Installing Context7 CLI globally..."
    npm install -g context7
    echo "✓ Context7 CLI installed"
else
    echo "✓ Context7 CLI already installed ($(context7 --version))"
fi

echo ""

# Create cache directory if it doesn't exist
if [ ! -d ".context7" ]; then
    echo "📁 Creating cache directory (.context7/)..."
    mkdir -p .context7
    echo "✓ Cache directory created"
else
    echo "✓ Cache directory already exists"
fi

echo ""

# Verify .mcp.json exists and has context7
if [ ! -f ".mcp.json" ]; then
    echo "⚠️  .mcp.json not found!"
    exit 1
fi

if grep -q '"context7"' .mcp.json; then
    echo "✓ Context7 configured in .mcp.json"
else
    echo "⚠️  Context7 not found in .mcp.json"
    echo "Please add Context7 to .mcp.json manually"
    exit 1
fi

echo ""

# Verify .context7rc.json exists
if [ -f ".context7rc.json" ]; then
    echo "✓ Context7 configuration file (.context7rc.json) found"
else
    echo "⚠️  .context7rc.json not found"
    exit 1
fi

echo ""

# Test Context7 CLI
echo "🧪 Testing Context7 CLI..."
context7 --version
echo "✓ Context7 CLI working"

echo ""
echo "✅ Context7 setup complete!"
echo ""
echo "Next steps:"
echo "  1. Start dev server: npm run dev"
echo "  2. Context7 MCP will be available automatically"
echo "  3. Or use CLI: context7 search \"your-query\" --lib nextjs"
echo ""
echo "📚 For more info, see CONTEXT7_GUIDE.md"
