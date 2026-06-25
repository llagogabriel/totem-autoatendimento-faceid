# 🎬 Guia de Teste da Câmera RTSP

## ✅ Pré-requisitos

1. **FFmpeg instalado** - Siga as instruções em `INSTALAR_FFMPEG.md`
2. **Câmera RTSP acessível** - A câmera do laboratório deve estar ligada e conectada à rede
3. **Backend rodando** - Na porta 3000
4. **Frontend rodando** - Na porta 5174

## 🚀 Iniciar o Sistema

### Terminal 1 - Backend
```powershell
cd c:\Users\1442084\Documents\projetoVC\totem-autoatendimento-faceid\backend
node server.js
```

Expected output:
```
🔧 Inicializando backend...
✅ Conectado ao SQLite: ./database.db
✅ Tabelas inicializadas
🚀 Servidor rodando em http://localhost:3000
```

### Terminal 2 - Frontend
```powershell
cd c:\Users\1442084\Documents\projetoVC\totem-autoatendimento-faceid\frontend
npm run dev
```

Expected output:
```
VITE v8.0.2  ready in XXX ms
➜  Local:   http://localhost:5174/
```

## 📱 Testar Fluxo Completo

### 1️⃣ Cadastro de Nova Pessoa

1. Abra: http://localhost:5174
2. Clique em **"Cadastrar nova pessoa"**
3. Preencha:
   - **CPF**: 123.456.789-10
   - **Nome**: João Silva
4. Clique em **"Usar webcam"**
5. Você deve ver a imagem da câmera RTSP do laboratório
6. Clique em **"Capturar Foto"** para registrar
7. Clique em **"Cadastrar"** para salvar

### 2️⃣ Reconhecimento Facial

1. Na tela inicial, digite o CPF: **123.456.789-10**
2. Clique em **"Reconhecer Rosto"**
3. A câmera do laboratório será ativada
4. Alinhe seu rosto ao retângulo de guia
5. Após 3 segundos com o rosto alinhado, a foto será capturada automaticamente
6. O sistema comparará e exibirá o resultado

## 🔍 Troubleshooting

### ❌ "ffmpeg não encontrado"
- Instale ffmpeg seguindo `INSTALAR_FFMPEG.md`
- Reinicie o PowerShell após instalar
- Restart o backend

### ❌ Imagem da câmera preta/não carrega
- Verifique se a câmera RTSP está ligada
- Teste manualmente:
  ```powershell
  ffmpeg -rtsp_transport tcp -i "rtsp://10.132.5.101:554/user=admin&password=&channel=1&stream=0.sdp" -frames:v 1 test.jpg
  ```
- Verifique a URL da câmera em `.env`
- Veja logs do backend para mensagens de erro

### ❌ Erro "URL da câmera RTSP não informada"
- Verifique se `CAMERA_RTSP_URL` está configurada em `.env`
- Reinicie o backend

### ❌ Erro "Timeout ao capturar frame"
- A câmera está lenta demais ou desconectada
- Verifique conectividade com a câmera
- Tente aumentar timeout em `src/routes/api.js` (linha ~320)

## 📊 Logs Úteis

### Backend
```
📷 GET /api/camera/frame - url= rtsp://10.132.5.101:554/...
✅ Frame capturado com sucesso
```

### Frontend (Console do Navegador - F12)
```
📷 Acessando câmera RTSP do laboratório via polling...
📦 Carregando modelos da face-api.js...
✅ Detecção de rosto iniciada
```

## 💡 Tips

1. **Performance**: Se a detecção de rosto estiver lenta, reduz a frequência de polling (`700ms` em `TelaCaptura.vue`)
2. **Qualidade**: A qualidade do JPEG é controlada por `-q:v` em `api.js` (2 = melhor qualidade, 31 = pior)
3. **Debug**: Adicione logs no backend em `src/routes/api.js` para mais informações
