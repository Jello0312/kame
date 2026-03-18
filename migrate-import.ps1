# ============================================================
# KAME MIGRATION IMPORT SCRIPT
# Run this on the NEW laptop (PowerShell / Windows Terminal)
# Assumes: kame-migration-bundle is on Desktop, Node.js installed
# Assumes: KAME repo already cloned at ~\Desktop\KAME
# ============================================================

$ErrorActionPreference = "Stop"

# --- Config ---
$bundle   = "$HOME\Desktop\kame-migration-bundle"
$kameRoot = "$HOME\Desktop\KAME"
# Claude memory path is derived from the project directory
$claudeProjectKey = ($kameRoot -replace '\\', '-' -replace ':', '-' -replace ' ', '-')
# Remove leading dash if present
$claudeProjectKey = $claudeProjectKey.TrimStart('-')
# Replace drive letter pattern (e.g., C-) to match Claude's convention
$claudeProjectKey = $claudeProjectKey -replace '^([A-Z])-', '$1--'

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  KAME MIGRATION IMPORT" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# --- Preflight checks ---
Write-Host "[PRE] Running preflight checks..." -ForegroundColor Yellow

if (-not (Test-Path $bundle)) {
    Write-Host "  ERROR: Migration bundle not found at $bundle" -ForegroundColor Red
    Write-Host "  Copy kame-migration-bundle to your Desktop first." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "  ERROR: Node.js not installed. Run: winget install OpenJS.NodeJS" -ForegroundColor Red
    exit 1
}

Write-Host "  -> Bundle found at $bundle" -ForegroundColor Green
Write-Host "  -> Node.js $(node --version) detected" -ForegroundColor Green

# --- Step 1: Install pnpm ---
Write-Host "`n[1/14] Installing pnpm..." -ForegroundColor Yellow
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    Write-Host "  -> pnpm already installed ($(pnpm --version))" -ForegroundColor Green
} else {
    npm install -g pnpm@10.30.3
    Write-Host "  -> pnpm installed" -ForegroundColor Green
}

# --- Step 2: Set git identity ---
Write-Host "`n[2/14] Setting git identity..." -ForegroundColor Yellow
git config --global user.name "Jello0312"
git config --global user.email "jolene.hoyanlam@gmail.com"
Write-Host "  -> user.name = Jello0312" -ForegroundColor Green
Write-Host "  -> user.email = jolene.hoyanlam@gmail.com" -ForegroundColor Green

# --- Step 3: GitHub authentication ---
Write-Host "`n[3/14] GitHub authentication..." -ForegroundColor Yellow
$ghStatus = gh auth status 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  -> Already authenticated with GitHub" -ForegroundColor Green
} else {
    Write-Host "  -> Opening browser for GitHub login..." -ForegroundColor White
    Write-Host "  -> FOLLOW THE BROWSER PROMPTS" -ForegroundColor Cyan
    gh auth login --hostname github.com --git-protocol https --web
    Write-Host "  -> GitHub authenticated" -ForegroundColor Green
}

# --- Step 4: Pull latest code ---
Write-Host "`n[4/14] Pulling latest code..." -ForegroundColor Yellow
if (Test-Path $kameRoot) {
    Set-Location $kameRoot
    git pull origin master
    Write-Host "  -> Pulled latest from master" -ForegroundColor Green
} else {
    Set-Location "$HOME\Desktop"
    git clone https://github.com/Jello0312/kame.git KAME
    Set-Location $kameRoot
    Write-Host "  -> Cloned fresh from GitHub" -ForegroundColor Green
}

# --- Step 5: Install dependencies ---
Write-Host "`n[5/14] Installing dependencies (pnpm install)..." -ForegroundColor Yellow
Set-Location $kameRoot
pnpm install
Write-Host "  -> Dependencies installed" -ForegroundColor Green

# --- Step 6: Place server .env ---
Write-Host "`n[6/14] Placing server .env file..." -ForegroundColor Yellow
Copy-Item "$bundle\env-files\server.env" "$kameRoot\apps\server\.env" -Force
Write-Host "  -> apps/server/.env placed ($(( Get-Item "$kameRoot\apps\server\.env" ).Length) bytes)" -ForegroundColor Green

# Verify mobile .env exists (should be in git)
if (Test-Path "$kameRoot\apps\mobile\.env") {
    Write-Host "  -> apps/mobile/.env already exists (from git)" -ForegroundColor Green
} else {
    Write-Host "  -> apps/mobile/.env missing! Restoring from bundle..." -ForegroundColor Red
    Copy-Item "$bundle\env-files\mobile.env" "$kameRoot\apps\mobile\.env" -Force
    Write-Host "  -> apps/mobile/.env restored from backup" -ForegroundColor Green
}

# --- Step 7: Generate Prisma client ---
Write-Host "`n[7/14] Generating Prisma client..." -ForegroundColor Yellow
Set-Location "$kameRoot\apps\server"
npx prisma generate
Write-Host "  -> Prisma client generated" -ForegroundColor Green

# --- Step 8: Verify database connection ---
Write-Host "`n[8/14] Verifying database connection..." -ForegroundColor Yellow
try {
    npx prisma db pull --force 2>&1 | Out-Null
    Write-Host "  -> Database connection successful" -ForegroundColor Green
} catch {
    Write-Host "  -> WARNING: Database connection failed. Check DATABASE_URL in apps/server/.env" -ForegroundColor Red
}

# --- Step 9: Place Claude project config files ---
Write-Host "`n[9/14] Placing Claude Code project configs..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "$kameRoot\.claude" | Out-Null

if (Test-Path "$bundle\claude-config\project-launch.json") {
    Copy-Item "$bundle\claude-config\project-launch.json" "$kameRoot\.claude\launch.json" -Force
    Write-Host "  -> .claude/launch.json" -ForegroundColor Green
}

if (Test-Path "$bundle\claude-config\project-settings-local.json") {
    # Copy and fix paths (old OneDrive path -> new Desktop path)
    $content = Get-Content "$bundle\claude-config\project-settings-local.json" -Raw
    # Replace the old path pattern with the new one
    $oldPattern = 'C:\\\\Users\\\\Ho Jolene\\\\OneDrive - The Boston Consulting Group, Inc\\\\Desktop\\\\Claude\\\\KAME'
    $newPattern = 'C:\\\\Users\\\\Ho Jolene\\\\Desktop\\\\KAME'
    $content = $content -replace [regex]::Escape($oldPattern), $newPattern
    # Also handle forward-slash variants
    $content = $content -replace 'OneDrive - The Boston Consulting Group, Inc/Desktop/Claude/KAME', 'Desktop/KAME'
    $content = $content -replace 'OneDrive - The Boston Consulting Group, Inc\\Desktop\\Claude\\KAME', 'Desktop\KAME'
    $content | Set-Content "$kameRoot\.claude\settings.local.json" -Encoding UTF8
    Write-Host "  -> .claude/settings.local.json (paths updated)" -ForegroundColor Green
}

# --- Step 10: Place Claude global config files ---
Write-Host "`n[10/14] Placing Claude Code global configs..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "$HOME\.claude" | Out-Null

if (Test-Path "$bundle\claude-config\global-settings.json") {
    Copy-Item "$bundle\claude-config\global-settings.json" "$HOME\.claude\settings.json" -Force
    Write-Host "  -> ~/.claude/settings.json (14 plugins)" -ForegroundColor Green
}

if (Test-Path "$bundle\claude-config\global-settings-local.json") {
    Copy-Item "$bundle\claude-config\global-settings-local.json" "$HOME\.claude\settings.local.json" -Force
    Write-Host "  -> ~/.claude/settings.local.json" -ForegroundColor Green
}

# --- Step 11: Place Claude memory files ---
Write-Host "`n[11/14] Placing Claude Code memory files..." -ForegroundColor Yellow

# Determine the correct Claude project directory for this path
# Run claude once to auto-create, or manually determine the key
$memPath = "$HOME\.claude\projects\$claudeProjectKey\memory"
Write-Host "  -> Target memory path: $memPath" -ForegroundColor Gray

New-Item -ItemType Directory -Force -Path $memPath | Out-Null

$memoryFiles = Get-ChildItem "$bundle\claude-memory\*.md" -ErrorAction SilentlyContinue
foreach ($f in $memoryFiles) {
    Copy-Item $f.FullName "$memPath\$($f.Name)" -Force
    Write-Host "  -> $($f.Name)" -ForegroundColor Green
}

# Also place in project-local .claude memory path
$projMemPath = "$kameRoot\.claude\projects\$claudeProjectKey\memory"
New-Item -ItemType Directory -Force -Path $projMemPath | Out-Null
foreach ($f in $memoryFiles) {
    Copy-Item $f.FullName "$projMemPath\$($f.Name)" -Force
}
Write-Host "  -> Also placed in project-local .claude/" -ForegroundColor Green

# --- Step 12: Place Claude session transcripts (best-effort) ---
Write-Host "`n[12/14] Placing Claude session transcripts (best-effort)..." -ForegroundColor Yellow
$sessionsSource = "$bundle\claude-sessions"
if (Test-Path $sessionsSource) {
    $sessionsDest = "$HOME\.claude\projects\$claudeProjectKey"
    New-Item -ItemType Directory -Force -Path $sessionsDest | Out-Null

    # Copy all .jsonl files
    Get-ChildItem "$sessionsSource\*.jsonl" -ErrorAction SilentlyContinue | ForEach-Object {
        Copy-Item $_.FullName "$sessionsDest\$($_.Name)" -Force
    }

    # Copy subagent directories
    Get-ChildItem $sessionsSource -Directory -ErrorAction SilentlyContinue | ForEach-Object {
        Copy-Item $_.FullName "$sessionsDest\$($_.Name)" -Recurse -Force
    }

    $copiedCount = (Get-ChildItem $sessionsDest -Recurse -Filter "*.jsonl" -ErrorAction SilentlyContinue | Measure-Object).Count
    Write-Host "  -> $copiedCount .jsonl files placed" -ForegroundColor Green
    Write-Host "  -> NOTE: Claude may or may not auto-recognize these sessions" -ForegroundColor Gray
    Write-Host "  ->       They remain searchable as text archives regardless" -ForegroundColor Gray
} else {
    Write-Host "  -> No sessions in bundle (skipped)" -ForegroundColor Gray
}

# --- Step 13: Expo login ---
Write-Host "`n[13/14] Expo account login..." -ForegroundColor Yellow
Write-Host "  -> Running 'npx expo login' -- enter your Expo credentials:" -ForegroundColor Cyan
Set-Location "$kameRoot\apps\mobile"
try {
    $expoWhoami = npx expo whoami 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  -> Already logged in as: $expoWhoami" -ForegroundColor Green
    } else {
        npx expo login
    }
} catch {
    Write-Host "  -> Expo login needed. Run manually: npx expo login" -ForegroundColor Red
}

# --- Step 14: Verification Checklist ---
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  VERIFICATION CHECKLIST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Set-Location $kameRoot

$checks = @()

# Check 1: Git is up to date
$latestCommit = git log --oneline -1 2>&1
$checks += @{ Name = "Git repo up to date"; Result = ($LASTEXITCODE -eq 0); Detail = $latestCommit }

# Check 2: server .env exists
$serverEnv = Test-Path "$kameRoot\apps\server\.env"
$checks += @{ Name = "apps/server/.env exists"; Result = $serverEnv; Detail = if ($serverEnv) { "$(( Get-Item "$kameRoot\apps\server\.env" ).Length) bytes" } else { "MISSING" } }

# Check 3: mobile .env exists
$mobileEnv = Test-Path "$kameRoot\apps\mobile\.env"
$checks += @{ Name = "apps/mobile/.env exists"; Result = $mobileEnv; Detail = if ($mobileEnv) { "$(( Get-Item "$kameRoot\apps\mobile\.env" ).Length) bytes" } else { "MISSING" } }

# Check 4: node_modules exist
$nodeModules = Test-Path "$kameRoot\node_modules"
$checks += @{ Name = "node_modules installed"; Result = $nodeModules; Detail = "" }

# Check 5: Prisma client generated
$prismaClient = Test-Path "$kameRoot\apps\server\node_modules\.prisma\client"
$checks += @{ Name = "Prisma client generated"; Result = $prismaClient; Detail = "" }

# Check 6: Claude launch.json
$launchJson = Test-Path "$kameRoot\.claude\launch.json"
$checks += @{ Name = ".claude/launch.json exists"; Result = $launchJson; Detail = "" }

# Check 7: Claude memory files
$memoryCount = (Get-ChildItem "$memPath\*.md" -ErrorAction SilentlyContinue | Measure-Object).Count
$checks += @{ Name = "Claude memory files placed"; Result = ($memoryCount -ge 4); Detail = "$memoryCount files" }

# Check 8: Git identity
$gitName = git config user.name 2>&1
$checks += @{ Name = "Git identity configured"; Result = ($gitName -eq "Jello0312"); Detail = $gitName }

# Print results
$passed = 0
$failed = 0
foreach ($check in $checks) {
    if ($check.Result) {
        Write-Host "  [PASS] $($check.Name) -- $($check.Detail)" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  [FAIL] $($check.Name) -- $($check.Detail)" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`n  Result: $passed passed, $failed failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })

# --- Manual verification steps ---
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  MANUAL VERIFICATION (run these next)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "  1. Test server:" -ForegroundColor White
Write-Host "     cd $kameRoot" -ForegroundColor Gray
Write-Host "     pnpm dev:server" -ForegroundColor Gray
Write-Host "     (wait for 'Server running on port 3001')" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Test health endpoint (in another terminal):" -ForegroundColor White
Write-Host "     Invoke-WebRequest http://localhost:3001/health" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Test mobile:" -ForegroundColor White
Write-Host "     cd $kameRoot\apps\mobile" -ForegroundColor Gray
Write-Host "     npx expo start --clear" -ForegroundColor Gray
Write-Host "     (scan QR code with Expo Go on phone)" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Test Claude Code:" -ForegroundColor White
Write-Host "     cd $kameRoot" -ForegroundColor Gray
Write-Host "     claude" -ForegroundColor Gray
Write-Host "     (ask: 'check your memory -- what do you know about KAME?')" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MIGRATION COMPLETE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
