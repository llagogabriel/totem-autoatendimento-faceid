<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-4">
    <h1 class="text-3xl font-black mb-6 uppercase tracking-widest text-blue-400 font-sans text-center">
      Validação Biométrica
    </h1>
    
    <div class="relative w-full max-w-2xl aspect-video bg-black rounded-3xl overflow-hidden border-4 border-blue-600 shadow-2xl shadow-blue-500/20">
      <video ref="videoRef" autoplay muted playsinline class="w-full h-full object-cover transform -scale-x-100"></video>
      <canvas ref="canvasRef" class="absolute inset-0 w-full h-full transform -scale-x-100"></canvas>

      <div v-if="tempoIdentificado > 0" class="absolute top-4 right-4 bg-blue-600 px-4 py-2 rounded-full text-xs font-black animate-pulse">
        ESCANEANDO...
      </div>

      <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-black/90">
        <div class="text-center">
          <div class="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-xl font-bold animate-pulse text-blue-400">INICIALIZANDO IA...</p>
        </div>
      </div>
    </div>

    <div class="mt-10 w-full max-w-2xl px-4">
      <div class="flex justify-between mb-2 text-sm font-bold uppercase tracking-tighter">
        <span :class="tempoIdentificado > 0 ? 'text-blue-400' : 'text-gray-500'">
          {{ tempoIdentificado > 0 ? 'Mantenha o olhar fixo' : 'Aguardando detecção...' }}
        </span>
        <span class="text-blue-400">{{ Math.round(progressoPerc) }}%</span>
      </div>
      
      <div class="w-full h-6 bg-gray-800 rounded-full overflow-hidden border border-gray-700 p-1">
        <div 
          class="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-200 ease-out"
          :style="{ width: progressoPerc + '%' }"
        ></div>
      </div>
    </div>

    <button @click="$router.push('/')" class="mt-8 text-gray-500 hover:text-white font-bold transition-all uppercase text-xs tracking-widest">
      Cancelar Operação
    </button>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as faceapi from 'face-api.js'
import { useRouter } from 'vue-router'

const router = useRouter()
const videoRef = ref(null)
const canvasRef = ref(null)
const loading = ref(true)

// Configurações de UX
const TEMPO_NECESSARIO = 5000 // 5 Segundos
const tempoIdentificado = ref(0)
const progressoPerc = ref(0)

let stream = null
let intervalId = null

onMounted(async () => {
  try {
    const MODEL_URL = '/models'
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
    
    stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } })
    
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      videoRef.value.onloadedmetadata = () => {
        loading.value = false
        iniciarDeteccao()
      }
    }
  } catch (err) {
    console.error(err)
  }
})

const iniciarDeteccao = () => {
  const video = videoRef.value
  const canvas = canvasRef.value
  const displaySize = { width: video.videoWidth, height: video.videoHeight }
  faceapi.matchDimensions(canvas, displaySize)

  intervalId = setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
    
    const context = canvas.getContext('2d')
    context.clearRect(0, 0, canvas.width, canvas.height)
    
    if (detections.length > 0) {
      // Sobe a barra a cada ciclo (200ms)
      tempoIdentificado.value += 200
      progressoPerc.value = Math.min((tempoIdentificado.value / TEMPO_NECESSARIO) * 100, 100)
      
      // Desenha o quadrado no rosto
      const resizedDetections = faceapi.resizeResults(detections, displaySize)
      faceapi.draw.drawDetections(canvas, resizedDetections)

      // Se completar os 5 segundos
      if (tempoIdentificado.value >= TEMPO_NECESSARIO) {
        clearInterval(intervalId)
        // Redirecionar para tela de sucesso (vamos criar depois)
        alert("✅ Identificação concluída com sucesso!")
        router.push('/')
      }
    } else {
      // Se desviar o rosto, a barra esvazia (penalidade por desatenção)
      tempoIdentificado.value = Math.max(tempoIdentificado.value - 400, 0)
      progressoPerc.value = (tempoIdentificado.value / TEMPO_NECESSARIO) * 100
    }
  }, 200)
}

onUnmounted(() => {
  if (stream) stream.getTracks().forEach(t => t.stop())
  if (intervalId) clearInterval(intervalId)
})
</script>