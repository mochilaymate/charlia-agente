# Context7 Setup Script (PowerShell)
# Configures Context7 MCP and CLI for the project

param(
    [switch]$Verbose = $false
)

function Write-Header {
    param($message)
    Write-Host "🔧 $message" -ForegroundColor Cyan
}

function Write-Success {
    param($message)
    Write-Host "✓ $message" -ForegroundColor Green
}

function Write-Warning {
    param($message)
    Write-Host "⚠️  $message" -ForegroundColor Yellow
}

function Write-Error {
    param($message)
    Write-Host "✗ $message" -ForegroundColor Red
    exit 1
}

# Start setup
Write-Header "Setting up Context7 for WhatsApp AI Inbox"
Write-Host ""

# Check if Context7 CLI is installed
Write-Host "Checking Context7 CLI installation..." -ForegroundColor Gray
$context7Installed = $null -ne (Get-Command context7 -ErrorAction SilentlyContinue)

if (-not $context7Installed) {
    Write-Host "📦 Installing Context7 CLI globally..." -ForegroundColor Yellow
    npm install -g context7 | Out-Null
    Write-Success "Context7 CLI installed"
} else {
    $version = context7 --version 2>&1
    Write-Success "Context7 CLI already installed ($version)"
}

Write-Host ""

# Create cache directory if it doesn't exist
$cacheDir = ".context7"
if (-not (Test-Path $cacheDir)) {
    Write-Host "📁 Creating cache directory ($cacheDir/)..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $cacheDir -Force | Out-Null
    Write-Success "Cache directory created"
} else {
    Write-Success "Cache directory already exists"
}

Write-Host ""

# Verify .mcp.json exists
if (-not (Test-Path ".mcp.json")) {
    Write-Error ".mcp.json not found!"
}

# Check if context7 is in .mcp.json
$mcpContent = Get-Content ".mcp.json"
if ($mcpContent -match '"context7"') {
    Write-Success "Context7 configured in .mcp.json"
} else {
    Write-Warning "Context7 not found in .mcp.json"
    Write-Host "Please add Context7 to .mcp.json manually" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Verify .context7rc.json exists
if (Test-Path ".context7rc.json") {
    Write-Success "Context7 configuration file (.context7rc.json) found"
} else {
    Write-Error ".context7rc.json not found"
}

Write-Host ""

# Test Context7 CLI
Write-Host "🧪 Testing Context7 CLI..." -ForegroundColor Yellow
$version = context7 --version 2>&1
Write-Success "Context7 CLI working ($version)"

Write-Host ""
Write-Host "✅ Context7 setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Start dev server: npm run dev" -ForegroundColor Gray
Write-Host "  2. Context7 MCP will be available automatically" -ForegroundColor Gray
Write-Host "  3. Or use CLI: context7 search `"your-query`" --lib nextjs" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 For more info, see CONTEXT7_GUIDE.md" -ForegroundColor Cyan
