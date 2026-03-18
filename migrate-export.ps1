# ============================================================
# KAME MIGRATION EXPORT SCRIPT
# Run this on the OLD laptop (PowerShell / Windows Terminal)
# Creates kame-migration-bundle on Desktop with everything
# not in git that's needed to reconstruct KAME on a new machine.
# ============================================================

$ErrorActionPreference = "Stop"

# --- Config ---
$kameRoot = "$HOME\OneDrive - The Boston Consulting Group, Inc\Desktop\Claude\KAME"
$bundle   = "$HOME\Desktop\kame-migration-bundle"
$globalClaudeProject = "$HOME\.claude\projects\C--Users-Ho-Jolene-OneDrive---The-Boston-Consulting-Group--Inc-Desktop-Claude-KAME"
$localClaudeProject  = "$kameRoot\.claude\projects\C--Users-Ho-Jolene-OneDrive---The-Boston-Consulting-Group--Inc-Desktop-Claude-KAME"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  KAME MIGRATION EXPORT" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# --- Step 1: Commit untracked docs ---
Write-Host "[1/10] Committing untracked docs to git..." -ForegroundColor Yellow
Set-Location $kameRoot
git add "docs/Kame_Marketing_Strategy.docx" "docs/security-prompt.md" 2>$null
$hasChanges = git diff --cached --name-only
if ($hasChanges) {
    git commit -m "docs: add marketing strategy and security prompt for migration"
    git push origin master
    Write-Host "  -> Committed and pushed 2 docs" -ForegroundColor Green
} else {
    Write-Host "  -> Already committed (no changes)" -ForegroundColor Gray
}

# --- Step 2: Create bundle folder structure ---
Write-Host "[2/10] Creating bundle folder..." -ForegroundColor Yellow
if (Test-Path $bundle) { Remove-Item -Recurse -Force $bundle }
New-Item -ItemType Directory -Force -Path "$bundle\env-files"       | Out-Null
New-Item -ItemType Directory -Force -Path "$bundle\claude-memory"   | Out-Null
New-Item -ItemType Directory -Force -Path "$bundle\claude-config"   | Out-Null
New-Item -ItemType Directory -Force -Path "$bundle\claude-sessions" | Out-Null
New-Item -ItemType Directory -Force -Path "$bundle\claude-plans"    | Out-Null
Write-Host "  -> Created $bundle" -ForegroundColor Green

# --- Step 3: Copy .env files ---
Write-Host "[3/10] Copying .env files..." -ForegroundColor Yellow
Copy-Item "$kameRoot\apps\server\.env" "$bundle\env-files\server.env"
Copy-Item "$kameRoot\apps\mobile\.env" "$bundle\env-files\mobile.env"
Write-Host "  -> server.env ($(( Get-Item "$bundle\env-files\server.env" ).Length) bytes)" -ForegroundColor Green
Write-Host "  -> mobile.env ($(( Get-Item "$bundle\env-files\mobile.env" ).Length) bytes)" -ForegroundColor Green

# --- Step 4: Copy Claude memory files (merged from both locations) ---
Write-Host "[4/10] Copying Claude memory files..." -ForegroundColor Yellow

# From global location
if (Test-Path "$globalClaudeProject\memory") {
    $globalFiles = Get-ChildItem "$globalClaudeProject\memory\*.md" -ErrorAction SilentlyContinue
    foreach ($f in $globalFiles) {
        Copy-Item $f.FullName "$bundle\claude-memory\$($f.Name)"
        Write-Host "  -> [global] $($f.Name)" -ForegroundColor Green
    }
}

# From project-local location (overwrite duplicates, add unique files)
if (Test-Path "$localClaudeProject\memory") {
    $localFiles = Get-ChildItem "$localClaudeProject\memory\*.md" -ErrorAction SilentlyContinue
    foreach ($f in $localFiles) {
        if (-not (Test-Path "$bundle\claude-memory\$($f.Name)")) {
            Copy-Item $f.FullName "$bundle\claude-memory\$($f.Name)"
            Write-Host "  -> [local-unique] $($f.Name)" -ForegroundColor Magenta
        }
    }
}

# Write merged MEMORY.md index
@"
# Memory Index

- [beta_testing_setup.md](beta_testing_setup.md) — Steps to set up beta testing on a fresh Windows laptop
- [feedback_windows_terminal.md](feedback_windows_terminal.md) — Always provide Windows commands one-per-line, never use &&
- [project_base_image_generation.md](project_base_image_generation.md) — 133/141 base images done, 8 remaining (FASHN rate limited)
- [feedback_env_files.md](feedback_env_files.md) — Always commit public env files and clear Metro cache after env changes
"@ | Out-File -Encoding UTF8 "$bundle\claude-memory\MEMORY.md"
Write-Host "  -> Wrote merged MEMORY.md index (4 entries)" -ForegroundColor Green

# --- Step 5: Copy Claude config files ---
Write-Host "[5/10] Copying Claude config files..." -ForegroundColor Yellow

# Project-level configs
if (Test-Path "$kameRoot\.claude\launch.json") {
    Copy-Item "$kameRoot\.claude\launch.json" "$bundle\claude-config\project-launch.json"
    Write-Host "  -> project-launch.json" -ForegroundColor Green
}
if (Test-Path "$kameRoot\.claude\settings.local.json") {
    Copy-Item "$kameRoot\.claude\settings.local.json" "$bundle\claude-config\project-settings-local.json"
    Write-Host "  -> project-settings-local.json" -ForegroundColor Green
}

# Global configs
if (Test-Path "$HOME\.claude\settings.json") {
    Copy-Item "$HOME\.claude\settings.json" "$bundle\claude-config\global-settings.json"
    Write-Host "  -> global-settings.json" -ForegroundColor Green
}
if (Test-Path "$HOME\.claude\settings.local.json") {
    Copy-Item "$HOME\.claude\settings.local.json" "$bundle\claude-config\global-settings-local.json"
    Write-Host "  -> global-settings-local.json" -ForegroundColor Green
}

# --- Step 6: Copy Claude session transcripts ---
Write-Host "[6/10] Copying Claude session transcripts (~133MB)..." -ForegroundColor Yellow
Write-Host "  -> This may take a minute..." -ForegroundColor Gray

# Copy all .jsonl files preserving directory structure
$sessionSource = $globalClaudeProject
if (Test-Path $sessionSource) {
    # Copy main session .jsonl files
    Get-ChildItem "$sessionSource\*.jsonl" -ErrorAction SilentlyContinue | ForEach-Object {
        Copy-Item $_.FullName "$bundle\claude-sessions\$($_.Name)"
    }

    # Copy subagent directories with their .jsonl files
    Get-ChildItem "$sessionSource" -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^[0-9a-f]{8}-' } | ForEach-Object {
        $destDir = "$bundle\claude-sessions\$($_.Name)"
        Copy-Item $_.FullName $destDir -Recurse -Force
    }

    $jsonlCount = (Get-ChildItem "$bundle\claude-sessions" -Recurse -Filter "*.jsonl" | Measure-Object).Count
    $jsonlSize  = (Get-ChildItem "$bundle\claude-sessions" -Recurse -Filter "*.jsonl" | Measure-Object -Property Length -Sum).Sum
    $jsonlSizeMB = [math]::Round($jsonlSize / 1MB, 1)
    Write-Host "  -> $jsonlCount .jsonl files ($jsonlSizeMB MB)" -ForegroundColor Green
} else {
    Write-Host "  -> No session directory found (skipped)" -ForegroundColor Red
}

# --- Step 7: Copy Claude plan files ---
Write-Host "[7/10] Copying Claude plan files..." -ForegroundColor Yellow
$plansSource = "$HOME\.claude\plans"
if (Test-Path $plansSource) {
    $planFiles = Get-ChildItem "$plansSource\*.md" -ErrorAction SilentlyContinue
    foreach ($f in $planFiles) {
        Copy-Item $f.FullName "$bundle\claude-plans\$($f.Name)"
    }
    Write-Host "  -> $($planFiles.Count) plan files" -ForegroundColor Green
} else {
    Write-Host "  -> No plans directory found (skipped)" -ForegroundColor Red
}

# --- Step 8: Generate migration manifest ---
Write-Host "[8/10] Generating MIGRATION_MANIFEST.txt..." -ForegroundColor Yellow

$totalSize = (Get-ChildItem $bundle -Recurse | Measure-Object -Property Length -Sum).Sum
$totalSizeMB = [math]::Round($totalSize / 1MB, 1)

@"
================================================================
KAME MIGRATION BUNDLE
================================================================
Created:    $(Get-Date -Format 'yyyy-MM-dd HH:mm')
Source:     $kameRoot
Git remote: https://github.com/Jello0312/kame.git
Branch:     master
Bundle size: $totalSizeMB MB

================================================================
FILES IN THIS BUNDLE
================================================================

env-files/
  server.env    -- CRITICAL: all backend secrets (DB, FASHN, R2, JWT)
  mobile.env    -- backup (already tracked in git)

claude-memory/  -- 5 files: Claude persistent memories
  MEMORY.md                        -- merged index (4 entries)
  beta_testing_setup.md            -- beta setup steps for Windows
  feedback_windows_terminal.md     -- no && in PowerShell
  project_base_image_generation.md -- 133/141 base images status
  feedback_env_files.md            -- env file commit rule

claude-config/  -- 4 files: Claude Code configuration
  project-launch.json              -- dev server configs (3001 + 8081)
  project-settings-local.json      -- 221 permissions rules
  global-settings.json             -- 14 plugin configs
  global-settings-local.json       -- global permissions

claude-sessions/ -- ~163 .jsonl files: full conversation history
  (main sessions + subagent runs, plain JSON-lines format)

claude-plans/    -- ~16 .md files: architecture decision records
  (Redis removal, face-swap migration, security hardening, etc.)

================================================================
WHAT COMES FROM GIT (no bundle needed)
================================================================
- All 137+ source files (mobile app, server, shared types)
- CLAUDE.md, ROADMAP.md, BETA_LAUNCH_GUIDE.md
- tasks/todo.md (50KB sprint history)
- tasks/lessons.md (50KB debugging patterns)
- docs/BRAND_SYSTEM.md, docs/Architecture_Final_v3.md
- docs/Kame_Marketing_Strategy.docx (committed by export script)
- docs/security-prompt.md (committed by export script)
- apps/mobile/.env (tracked -- public Railway URL only)
- Prisma schema + 3 migrations + seed data
- railway.json, nixpacks.toml (deployment configs)
- All config files (tsconfig, eslint, prettier, tailwind)

================================================================
EXTERNAL SERVICE CREDENTIALS (in server.env)
================================================================
1. Supabase PostgreSQL  -- DATABASE_URL, DIRECT_URL
2. FASHN AI             -- FASHN_API_KEY
3. Cloudflare R2        -- R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL
4. JWT Authentication   -- JWT_SECRET (must match production tokens!)
5. Server Config        -- PORT, NODE_ENV

================================================================
ACCOUNTS TO RE-LOGIN ON NEW LAPTOP
================================================================
- GitHub:  gh auth login (username: Jello0312, email: jolene.hoyanlam@gmail.com)
- Expo:    npx expo login
- Railway: https://railway.app (web dashboard, no local auth needed)

================================================================
SERVICE DASHBOARD URLS (bookmark these)
================================================================
- GitHub:      https://github.com/Jello0312/kame
- Railway:     https://railway.app
- Supabase:    https://supabase.com/dashboard
- FASHN AI:    https://fashn.ai/settings
- Cloudflare:  https://dash.cloudflare.com
- Expo:        https://expo.dev

================================================================
IMPORT INSTRUCTIONS
================================================================
1. Copy kame-migration-bundle to new laptop Desktop
2. Open PowerShell
3. Run: Set-Location "$HOME\Desktop\kame-migration-bundle"
4. Run: .\migrate-import.ps1
5. Follow the prompts (GitHub login, Expo login)
6. Verification checklist runs automatically at the end
"@ | Out-File -Encoding UTF8 "$bundle\MIGRATION_MANIFEST.txt"
Write-Host "  -> MIGRATION_MANIFEST.txt" -ForegroundColor Green

# --- Step 9: Copy import script into bundle ---
Write-Host "[9/10] Copying import script into bundle..." -ForegroundColor Yellow
if (Test-Path "$kameRoot\migrate-import.ps1") {
    Copy-Item "$kameRoot\migrate-import.ps1" "$bundle\migrate-import.ps1"
    Write-Host "  -> migrate-import.ps1" -ForegroundColor Green
} else {
    Write-Host "  -> migrate-import.ps1 not found yet (create it, then re-run or copy manually)" -ForegroundColor Red
}

# --- Step 10: Summary ---
Write-Host "`n[10/10] EXPORT COMPLETE" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

$totalFiles = (Get-ChildItem $bundle -Recurse -File | Measure-Object).Count
$totalSize  = (Get-ChildItem $bundle -Recurse -File | Measure-Object -Property Length -Sum).Sum
$totalSizeMB = [math]::Round($totalSize / 1MB, 1)

Write-Host "  Bundle location: $bundle" -ForegroundColor White
Write-Host "  Total files:     $totalFiles" -ForegroundColor White
Write-Host "  Total size:      $totalSizeMB MB" -ForegroundColor White
Write-Host ""
Write-Host "  NEXT STEPS:" -ForegroundColor Cyan
Write-Host "  1. Copy 'kame-migration-bundle' to USB drive or cloud storage" -ForegroundColor White
Write-Host "  2. KEEP IT SECURE -- server.env contains production secrets" -ForegroundColor Red
Write-Host "  3. On the new laptop, place bundle on Desktop and run migrate-import.ps1" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Cyan
