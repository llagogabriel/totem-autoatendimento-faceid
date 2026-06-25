# Script para instalar ffmpeg via Chocolatey

Write-Host "🔧 Verificando se ffmpeg está instalado..." -ForegroundColor Cyan

# Verifica se ffmpeg está no PATH
$ffmpegPath = Get-Command ffmpeg -ErrorAction SilentlyContinue

if ($ffmpegPath) {
    Write-Host "✅ ffmpeg já está instalado em: $($ffmpegPath.Source)" -ForegroundColor Green
    exit 0
}

Write-Host "❌ ffmpeg não encontrado. Tentando instalar..." -ForegroundColor Yellow

# Verifica se chocolatey está instalado
$chocoPath = Get-Command choco -ErrorAction SilentlyContinue

if (-not $chocoPath) {
    Write-Host "⚙️  Instalando Chocolatey..." -ForegroundColor Cyan
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
}

# Instala ffmpeg via chocolatey
Write-Host "📦 Instalando ffmpeg via Chocolatey..." -ForegroundColor Cyan
choco install ffmpeg -y

# Verifica novamente
$ffmpegPath = Get-Command ffmpeg -ErrorAction SilentlyContinue

if ($ffmpegPath) {
    Write-Host "✅ ffmpeg instalado com sucesso em: $($ffmpegPath.Source)" -ForegroundColor Green
    ffmpeg -version | Select-Object -First 1
} else {
    Write-Host "❌ Falha na instalação do ffmpeg. Por favor, instale manualmente." -ForegroundColor Red
    Write-Host "Visite: https://ffmpeg.org/download.html" -ForegroundColor Yellow
    exit 1
}
