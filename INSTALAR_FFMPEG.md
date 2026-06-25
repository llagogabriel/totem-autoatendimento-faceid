# Instalação do FFmpeg

O sistema utiliza FFmpeg para capturar frames da câmera RTSP do laboratório. Siga as instruções abaixo para instalar.

## ✅ Opção 1: Instalação automática via PowerShell (RECOMENDADO)

1. Abra PowerShell como Administrador
2. Navegue até a pasta do backend:
   ```powershell
   cd c:\Users\1442084\Documents\projetoVC\totem-autoatendimento-faceid\backend
   ```

3. Execute o script de instalação:
   ```powershell
   powershell -ExecutionPolicy Bypass -File install-ffmpeg.ps1
   ```

4. Aguarde a conclusão da instalação

## ✅ Opção 2: Instalação manual via Chocolatey

1. Abra PowerShell como Administrador
2. Se não tiver Chocolatey instalado:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force
   [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
   iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   ```

3. Instale ffmpeg:
   ```powershell
   choco install ffmpeg -y
   ```

4. Reinicie o PowerShell e verifique:
   ```powershell
   ffmpeg -version
   ```

## ✅ Opção 3: Instalação manual via download direto

1. Acesse https://ffmpeg.org/download.html
2. Download a versão Full build para Windows
3. Descompacte em `C:\ffmpeg`
4. Adicione `C:\ffmpeg\bin` ao PATH do Windows:
   - Sistema > Variáveis de Ambiente > Variáveis do Sistema > PATH > Editar
   - Clique em Novo e adicione `C:\ffmpeg\bin`
   - Reinicie o computador

5. Verifique a instalação:
   ```powershell
   ffmpeg -version
   ```

## ✅ Verificar instalação

Se a instalação foi bem-sucedida, o seguinte comando deve funcionar:
```powershell
ffmpeg -version
```

Você também pode verificar no próprio aplicativo:
- Inicie o backend e frontend
- Acesse http://localhost:5174
- Vá para cadastro de pessoa e clique em "Usar webcam"
- Se a câmera RTSP for acessível, a imagem aparecerá

## 🔧 Se ainda tiver problemas

1. Verifique se a câmera RTSP está acessível:
   ```powershell
   ffmpeg -rtsp_transport tcp -i "rtsp://10.132.5.101:554/user=admin&password=&channel=1&stream=0.sdp" -frames:v 1 -f image2 test.jpg
   ```

2. Verifique se o ffmpeg está no PATH:
   ```powershell
   where ffmpeg
   ```

3. Restart o sistema operacional

## 📋 Variáveis de Ambiente

Certifique-se de que o arquivo `.env` do backend contém:
```
CAMERA_RTSP_URL=rtsp://10.132.5.101:554/user=admin&password=&channel=1&stream=0.sdp
```
