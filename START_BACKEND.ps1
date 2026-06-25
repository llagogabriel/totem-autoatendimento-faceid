# Script para iniciar Backend e Frontend

Write-Host "================================" -ForegroundColor Cyan
Write-Host "🚀 Iniciando Totem Backend" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan

# Navegar para backend
$backendPath = "c:\Users\1442084\Documents\projetoVC\totem-autoatendimento-faceid\backend"
Set-Location $backendPath

# Tentar porta 3000 primeiro, se não funcionar use 3001
$env:PORT = 3000

Write-Host "📍 Iniciando Backend em: $backendPath" -ForegroundColor Cyan
Write-Host "🔧 Testando ffmpeg..." -ForegroundColor Yellow
try {
    $ffVersion = & ffmpeg -version 2>&1 | Select-Object -First 1
    Write-Host "✅ FFmpeg OK: $ffVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ FFmpeg não encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host "`n🚀 Iniciando servidor Backend..." -ForegroundColor Yellow
Write-Host "Este terminal ficará ocupado enquanto o backend estiver rodando" -ForegroundColor Cyan
Write-Host "Acesse http://localhost:3000/api/saude para verificar status`n" -ForegroundColor Cyan

node server.js
