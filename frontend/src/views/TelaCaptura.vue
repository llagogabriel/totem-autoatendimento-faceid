<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-4">
    <h1 class="text-3xl font-black mb-6 uppercase tracking-widest text-blue-400 font-sans text-center">
      Validação Biométrica
    </h1>
    
    <div class="relative w-full max-w-2xl aspect-video bg-black rounded-3xl overflow-hidden border-4 border-blue-600 shadow-2xl shadow-blue-500/20">
      <video 
        v-show="!processamento.completo && !processamento.erro && cameraSupported"
        ref="videoRef" 
        autoplay 
        muted 
        playsinline 
        class="w-full h-full object-cover transform -scale-x-100"
      ></video>
      <canvas 
        v-show="!processamento.completo && !processamento.erro && cameraSupported"
        ref="canvasRef" 
        class="absolute inset-0 w-full h-full transform -scale-x-100"
      ></canvas>

      <!-- Guia de alinhamento central -->
      <div v-if="!processamento.completo && !processamento.erro && cameraSupported" class="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div class="relative border-2 border-blue-400 rounded-3xl w-2/5 h-4/5 opacity-80">
          <div class="absolute inset-x-0 top-3 text-center text-sm text-blue-200 font-semibold">Alinhe corpo e rosto aqui</div>
        </div>
      </div>

      <div v-if="!cameraSupported.value && !processamento.completo && !processamento.erro" class="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center">
        <p class="mb-4 text-lg font-semibold text-blue-200">Seu dispositivo não permitiu acesso direto à câmera.</p>
        <p class="mb-6 text-sm text-gray-300">Use uma foto capturada pela câmera do celular para fazer a validação.</p>
        <input
          ref="fallbackFileRef"
          type="file"
          accept="image/*"
          capture="environment"
          @change="onFallbackFileChange"
          class="mb-4 w-full rounded-lg border border-blue-500 bg-slate-900 px-3 py-3 text-white"
        />
        <div v-if="fallbackPreview" class="mb-4 w-full">
          <img :src="fallbackPreview" alt="Preview da foto" class="mx-auto max-h-64 w-auto rounded-2xl border border-blue-500 object-contain" />
        </div>
        <button
          @click="processFallbackImage"
          :disabled="!fallbackPreview || processamento.processando || processamento.comparando"
          class="bg-blue-600 disabled:bg-gray-500 text-white px-6 py-3 rounded-xl font-bold"
        >
          {{ processamento.processando ? 'Processando...' : 'Comparar Foto' }}
        </button>
      </div>

      <!-- Estado: Carregando IA -->
      <div v-if="processamento.inicializando" class="absolute inset-0 flex items-center justify-center bg-black/90">
        <div class="text-center">
          <div class="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-xl font-bold animate-pulse text-blue-400">INICIALIZANDO IA...</p>
        </div>
      </div>

      <!-- Estado: Processando -->
      <div v-if="processamento.processando && !processamento.completo" class="absolute inset-0 flex items-center justify-center bg-blue-600/20 backdrop-blur-sm">
        <div class="bg-blue-600 px-8 py-4 rounded-2xl font-black text-2xl animate-bounce shadow-2xl">
          IDENTIFICADO!
        </div>
      </div>

      <!-- Estado: Capturado (sucesso visual) -->
      <div v-if="processamento.capturado" class="absolute inset-0 flex items-center justify-center bg-black/70">
        <div class="text-center bg-white/5 px-8 py-6 rounded-2xl">
          <p class="text-2xl font-bold text-green-300">{{ processamento.capturadoMensagem }}</p>
        </div>
      </div>

      <!-- Estado: Comparando -->
      <div v-if="processamento.comparando" class="absolute inset-0 flex items-center justify-center bg-black/90">
        <div class="text-center">
          <div class="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-xl font-bold animate-pulse text-green-400">ANALISANDO ROSTO...</p>
          <p class="text-sm text-gray-400 mt-2">{{ processamento.mensagem }}</p>
        </div>
      </div>

      <!-- Estado: Resultado (Sucesso) -->
      <div v-if="processamento.completo && !processamento.erro" class="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-green-900/80 to-green-950/80">
        <div class="text-center">
          <div class="text-6xl mb-4 animate-bounce">✅</div>
          <p class="text-3xl font-black text-green-400 mb-2">ACESSO LIBERADO!</p>
          <p class="text-lg text-gray-200 mb-4">Similaridade: {{ processamento.resultado.similaridade.toFixed(2) }}%</p>
          <p class="text-sm text-gray-400">Redirecionando...</p>
        </div>
      </div>

      <!-- Estado: Resultado (Erro/Rejeitado) -->
      <div v-if="processamento.erro" class="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-red-900/80 to-red-950/80">
        <div class="text-center">
          <div class="text-6xl mb-4">❌</div>
          <p class="text-3xl font-black text-red-400 mb-2">{{ processamento.erroTitulo }}</p>
          <p class="text-lg text-gray-200 mb-6">{{ processamento.erroMensagem }}</p>
          <button 
            @click="reiniciar"
            class="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    </div>

    <div class="mt-10 text-center">
      <p class="text-lg font-medium text-gray-400">
        {{ obterMensagem() }}
      </p>
    </div>

    <button 
      v-if="!processamento.processando && !processamento.completo"
      @click="$router.push('/')" 
      class="mt-8 text-gray-500 hover:text-white font-bold transition-all uppercase text-xs tracking-widest"
    >
      Cancelar Operação
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as faceapi from 'face-api.js'
import { useRouter } from 'vue-router'
import * as api from '../services/api.js'

const router = useRouter()
const videoRef = ref(null)
const canvasRef = ref(null)
const fallbackPreview = ref(null)
const cameraSupported = ref(true)

const processamento = ref({
  inicializando: true,
  processando: false,
  comparando: false,
  capturado: false,
  capturadoMensagem: '',
  completo: false,
  erro: false,
  erroTitulo: '',
  erroMensagem: '',
  mensagem: '',
  resultado: { aprovado: false, similaridade: 0 }
})

const ALINHAMENTO_MIN_MS = 3000
const ALINHAMENTO_TOLERANCE_X = 0.30
const ALINHAMENTO_TOLERANCE_Y = 0.10
let stream = null
let intervalId = null
let fotoCapturaBase64 = null
let alinhamentoTempo = 0
let ultimoTempo = null
let faceAligned = false
let fallbackFile = null

const obterMensagem = () => {
  if (!cameraSupported.value) return 'Seu dispositivo não permite acesso direto à câmera. Use a foto abaixo.'
  if (processamento.value.inicializando) return 'Inicializando câmera e modelo de IA...'
  if (processamento.value.processando) return 'Rosto detectado! Capturando...'
  if (processamento.value.comparando) return 'Comparando características faciais...'
  if (faceAligned && alinhamentoTempo < ALINHAMENTO_MIN_MS) {
    const remaining = Math.max(0, ALINHAMENTO_MIN_MS - alinhamentoTempo)
    return `Mantenha seu rosto alinhado à área vertical por mais ${Math.ceil(remaining / 1000)}s`
  }
  return 'Alinhe seu corpo e rosto à área vertical central para iniciar a captura'
}

onMounted(async () => {
  try {
    const cpf = sessionStorage.getItem('cpf_atual')
    if (!cpf) {
      router.push('/')
      return
    }

    const MODEL_URL = '/models'
    
    // Carregar modelos de IA do face-api.js
    console.log('📦 Carregando modelos...')
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    
    // Solicitar acesso à câmera
    console.log('📷 Acessando câmera...')
    stream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: 1280, height: 720, facingMode: 'user' } 
    })
    
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      videoRef.value.onloadedmetadata = () => {
        processamento.value.inicializando = false
        iniciarDeteccao()
      }
    }
  } catch (err) {
    console.warn('⚠️ Não foi possível iniciar a câmera diretamente:', err)
    cameraSupported.value = false
    processamento.value.inicializando = false
  }
})

const iniciarDeteccao = () => {
  const video = videoRef.value
  const canvas = canvasRef.value
  const displaySize = { width: video.videoWidth, height: video.videoHeight }
  faceapi.matchDimensions(canvas, displaySize)

  intervalId = setInterval(async () => {
    if (processamento.value.processando || processamento.value.comparando) return

    try {
      const detection = await faceapi.detectSingleFace(
        video, 
        new faceapi.TinyFaceDetectorOptions()
      )
      
      const context = canvas.getContext('2d')
      context.clearRect(0, 0, canvas.width, canvas.height)
      
      if (detection) {
        const resizedDetection = faceapi.resizeResults(detection, displaySize)
        faceapi.draw.drawDetections(canvas, resizedDetection)

        const aligned = isFaceAligned(resizedDetection, displaySize)
        updateAlignmentTime(aligned)

        if (aligned && alinhamentoTempo >= ALINHAMENTO_MIN_MS) {
          await capturarEComparar()
        }
      } else {
        resetAlignment()
      }
    } catch (err) {
      console.error('Erro na detecção:', err)
      resetAlignment()
    }
  }, 100)
}

const capturarEComparar = async () => {
  if (processamento.value.processando || processamento.value.comparando) return

  processamento.value.processando = true
  
  try {
    // Parar detecção
    clearInterval(intervalId)
    if (stream) stream.getTracks().forEach(t => t.stop())

    const video = videoRef.value
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor()

    if (!detection || !detection.descriptor) {
      throw new Error('Não foi possível extrair o rosto. Tente novamente com melhor iluminação.')
    }

    const descriptorCaptura = Array.from(detection.descriptor)

    // Capturar a foto do vídeo em base64 para registro ou fallback
    const captureCanvas = document.createElement('canvas')
    captureCanvas.width = video.videoWidth
    captureCanvas.height = video.videoHeight
    const captureCtx = captureCanvas.getContext('2d')
    captureCtx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height)
    fotoCapturaBase64 = captureCanvas.toDataURL('image/jpeg')

    // Garantir pelo menos 2 segundos de exibição da captura
    processamento.value.capturado = true
    processamento.value.capturadoMensagem = 'Capturado com sucesso'
    await new Promise(resolve => setTimeout(resolve, 2000))

    processamento.value.capturadoMensagem = 'Processando...'
    await new Promise(resolve => setTimeout(resolve, 2000))

    processamento.value.processando = false
    processamento.value.capturado = false
    processamento.value.comparando = true
    processamento.value.mensagem = 'Comparando características faciais...'

    // Comparar com backend
    const cpf = sessionStorage.getItem('cpf_atual')
    const resultado = await api.compararRosto(cpf, fotoCapturaBase64, descriptorCaptura)

    processamento.value.resultado = resultado

    if (resultado.aprovado) {
      processamento.value.comparando = false

      // Autorizar acesso
      await api.autorizarPessoa(cpf)

      processamento.value.completo = true

      // Redirecionar após 3 segundos
      setTimeout(() => {
        sessionStorage.removeItem('cpf_atual')
        router.push('/')
      }, 3000)
    } else {
      // Similaridade insuficiente
      processamento.value.comparando = false
      processamento.value.erro = true
      processamento.value.erroTitulo = 'Falha na Autenticação'
      processamento.value.erroMensagem = `Similaridade insuficiente: ${resultado.similaridade.toFixed(2)}% (mínimo: ${resultado.threshold}%)`
    }
  } catch (err) {
    console.error('❌ Erro ao comparar:', err)
    processamento.value.processando = false
    processamento.value.comparando = false
    processamento.value.erro = true
    processamento.value.erroTitulo = 'Erro no Processamento'
    processamento.value.erroMensagem = err.message
  }
}

const isFaceAligned = (detection, displaySize) => {
  const centerX = detection.box.x + detection.box.width / 2
  const centerY = detection.box.y + detection.box.height / 2
  const targetMinX = displaySize.width * ALINHAMENTO_TOLERANCE_X
  const targetMaxX = displaySize.width * (1 - ALINHAMENTO_TOLERANCE_X)
  const targetMinY = displaySize.height * ALINHAMENTO_TOLERANCE_Y
  const targetMaxY = displaySize.height * (1 - ALINHAMENTO_TOLERANCE_Y)
  return centerX >= targetMinX && centerX <= targetMaxX && centerY >= targetMinY && centerY <= targetMaxY
}

const updateAlignmentTime = (aligned) => {
  const now = Date.now()
  if (aligned) {
    if (!faceAligned) {
      faceAligned = true
      ultimoTempo = now
      alinhamentoTempo = 0
      processamento.value.capturado = false
      processamento.value.capturadoMensagem = ''
    } else {
      const delta = now - (ultimoTempo || now)
      alinhamentoTempo += delta
      ultimoTempo = now
    }
  } else {
    resetAlignment()
  }
}

const extractFaceDescriptor = async (imageDataUrl) => {
  const image = new Image()
  image.src = imageDataUrl

  await new Promise((resolve, reject) => {
    image.onload = resolve
    image.onerror = reject
  })

  const detection = await faceapi
    .detectSingleFace(image, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor()

  if (!detection || !detection.descriptor) {
    throw new Error('Não foi possível extrair o rosto da imagem. Use outra foto mais nítida.')
  }

  return Array.from(detection.descriptor)
}

const onFallbackFileChange = (event) => {
  const file = event.target.files && event.target.files[0]
  if (!file) return
  fallbackFile = file
  const reader = new FileReader()
  reader.onload = () => {
    fallbackPreview.value = reader.result
  }
  reader.readAsDataURL(file)
}

const processFallbackImage = async () => {
  if (!fallbackPreview.value || processamento.value.processando || processamento.value.comparando) return

  processamento.value.processando = true
  processamento.value.capturado = true
  processamento.value.capturadoMensagem = 'Processando imagem...'

  try {
    const descriptorCaptura = await extractFaceDescriptor(fallbackPreview.value)
    const fotoCaptura = fallbackPreview.value

    await new Promise(resolve => setTimeout(resolve, 500))

    processamento.value.processando = false
    processamento.value.capturado = false
    processamento.value.comparando = true
    processamento.value.mensagem = 'Comparando características faciais...'

    const cpf = sessionStorage.getItem('cpf_atual')
    const resultado = await api.compararRosto(cpf, fotoCaptura, descriptorCaptura)

    processamento.value.resultado = resultado

    if (resultado.aprovado) {
      processamento.value.comparando = false
      await api.autorizarPessoa(cpf)
      processamento.value.completo = true

      setTimeout(() => {
        sessionStorage.removeItem('cpf_atual')
        router.push('/')
      }, 3000)
    } else {
      processamento.value.comparando = false
      processamento.value.erro = true
      processamento.value.erroTitulo = 'Falha na Autenticação'
      processamento.value.erroMensagem = `Similaridade insuficiente: ${resultado.similaridade.toFixed(2)}% (mínimo: ${resultado.threshold}%)`
    }
  } catch (err) {
    console.error('❌ Erro ao processar foto de fallback:', err)
    processamento.value.processando = false
    processamento.value.comparando = false
    processamento.value.erro = true
    processamento.value.erroTitulo = 'Erro no Processamento'
    processamento.value.erroMensagem = err.message
  }
}

const resetAlignment = () => {
  faceAligned = false
  alinhamentoTempo = 0
  ultimoTempo = null
}

const reiniciar = () => {
  processamento.value.erro = false
  processamento.value.completo = false
  processamento.value.inicializando = true
  processamento.value.processando = false
  processamento.value.comparando = false
  
  // Reiniciar
  onMounted()
}

onUnmounted(() => {
  if (stream) stream.getTracks().forEach(t => t.stop())
  if (intervalId) clearInterval(intervalId)
})
</script>