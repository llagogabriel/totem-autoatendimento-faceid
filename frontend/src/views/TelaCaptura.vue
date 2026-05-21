<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-4">
    <h1 class="text-3xl font-black mb-6 uppercase tracking-widest text-blue-400 font-sans text-center">
      Validação Biométrica
    </h1>
    
    <div class="relative w-full max-w-2xl aspect-video bg-black rounded-3xl overflow-hidden border-4 border-blue-600 shadow-2xl shadow-blue-500/20">
      <video 
        v-show="!processamento.completo && !processamento.erro"
        ref="videoRef" 
        autoplay 
        muted 
        playsinline 
        class="w-full h-full object-cover transform -scale-x-100"
      ></video>
      <canvas 
        v-show="!processamento.completo && !processamento.erro"
        ref="canvasRef" 
        class="absolute inset-0 w-full h-full transform -scale-x-100"
      ></canvas>

      <!-- Guia de alinhamento central -->
      <div v-if="!processamento.completo && !processamento.erro" class="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div class="relative border-2 border-blue-400 rounded-3xl w-2/5 h-4/5 opacity-80">
          <div class="absolute inset-x-0 top-3 text-center text-sm text-blue-200 font-semibold">Alinhe corpo e rosto aqui</div>
        </div>
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

const obterMensagem = () => {
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
    console.error('❌ Erro ao inicializar:', err)
    processamento.value.inicializando = false
    processamento.value.erro = true
    processamento.value.erroTitulo = 'Erro ao Inicializar'
    processamento.value.erroMensagem = err.message
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