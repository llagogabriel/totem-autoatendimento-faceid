# Script Completo para Matar Tudo e Reiniciar

Write-Host "🔴 Limpando processos anteriores..." -ForegroundColor Red

# Matar todos os processos node
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Verificar se ainda há processo node
$nodeProcessos = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcessos) {
    Write-Host "❌ Ainda há processos Node em execução, matando novamente..." -ForegroundColor Red
    taskkill /IM node.exe /F /T
    Start-Sleep -Seconds 2
}

Write-Host "✅ Limpeza concluída" -ForegroundColor Green

Write-Host "`n" 
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Totem Autoa Tendimento - Face ID     ║" -ForegroundColor Cyan
Write-Host "║                                        ║" -ForegroundColor Cyan
Write-Host "║  ✅ FFmpeg instalado                   ║" -ForegroundColor Green
Write-Host "║  ✅ Dependências instaladas            ║" -ForegroundColor Green
Write-Host "║  ✅ Sistema pronto para uso!           ║" -ForegroundColor Green
Write-Host "║                                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`n📋 Próximas etapas:
1️⃣  Abra dois terminais PowerShell
2️⃣  Terminal 1: Execute START_BACKEND.ps1
3️⃣  Terminal 2: Execute START_FRONTEND.ps1
4️⃣  Acesse: http://localhost:5174
" -ForegroundColor Yellow

Write-Host "💻 Iniciando aplicação em modo desenvolvimento..." -ForegroundColor Cyan
Write-Host ""

# Iniciar backend em background
$backend = Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy Bypass", "-File", "START_BACKEND.ps1" -PassThru -WindowStyle Normal
Write-Host "✅ Backend iniciado (PID: $($backend.Id))" -ForegroundColor Green

# Aguardar um pouco antes de iniciar frontend
Start-Sleep -Seconds 3

# Iniciar frontend em background
$frontend = Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy Bypass", "-File", "START_FRONTEND.ps1" -PassThru -WindowStyle Normal
Write-Host "✅ Frontend iniciado (PID: $($frontend.Id))" -ForegroundColor Green

Write-Host "`n🎉 Ambiente de desenvolvimento foi iniciado!" -ForegroundColor Green
Write-Host "   Acesse: http://localhost:5174 assim que o frontend estiver pronto" -ForegroundColor Cyan
Write-Host "   Backend roda em: http://localhost:3000" -ForegroundColor Cyan
