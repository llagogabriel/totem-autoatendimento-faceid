# Script para iniciar Frontend

Write-Host "================================" -ForegroundColor Cyan
Write-Host "🎨 Iniciando Totem Frontend" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan

# Navegar para frontend
$frontendPath = "c:\Users\1442084\Documents\projetoVC\totem-autoatendimento-faceid\frontend"
Set-Location $frontendPath

Write-Host "📍 Iniciando Frontend em: $frontendPath" -ForegroundColor Cyan
Write-Host "`n🚀 Iniciando servidor Vite..." -ForegroundColor Yellow
Write-Host "Aguarde a mensagem: 'Local: http://localhost:51xx'" -ForegroundColor Cyan
Write-Host "Este terminal ficará ocupado enquanto o frontend estiver rodando`n" -ForegroundColor Cyan

npm run dev
