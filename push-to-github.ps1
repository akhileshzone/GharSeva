# Push Ghar Seva to akhileshzone/GharSeva
# Run this in your own PowerShell window (interactive login required):
#   cd "$env:USERPROFILE\OneDrive\Desktop\Manam"
#   powershell -ExecutionPolicy Bypass -File .\push-to-github.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "=== Ghar Seva → github.com/akhileshzone/GharSeva ===" -ForegroundColor Cyan
Write-Host ""

# Ensure remote
git remote remove origin 2>$null
git remote add origin https://github.com/akhileshzone/GharSeva.git

Write-Host "Step 1: Sign in to GitHub as akhileshzone (browser or device code)..." -ForegroundColor Yellow
Write-Host "         If a browser opens, choose the akhileshzone account." -ForegroundColor Yellow
Write-Host ""

# Prefer browser login for akhileshzone
git credential-manager github login --username akhileshzone --browser --force

Write-Host ""
Write-Host "Step 2: Pushing main branch..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "Success! Repo: https://github.com/akhileshzone/GharSeva" -ForegroundColor Green
} else {
  Write-Host ""
  Write-Host "Push failed. Common fixes:" -ForegroundColor Red
  Write-Host "  1. Credential Manager → remove git:https://github.com entries"
  Write-Host "  2. Re-run this script and log in as akhileshzone (not ruthvik747)"
  Write-Host "  3. Or use a Personal Access Token:"
  Write-Host "       git push https://akhileshzone:YOUR_PAT@github.com/akhileshzone/GharSeva.git main"
  exit 1
}
