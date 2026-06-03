<template>
  <div class="p-6">
    <h1 class="text-2xl font-semibold mb-4">Visualizador Biométrico</h1>

    <div v-if="log" class="grid grid-cols-2 gap-4">
      <div class="relative bg-white p-2 rounded shadow">
        <h3 class="text-sm font-medium mb-2">Foto Cadastro</h3>
        <img :src="log.foto_cadastro" alt="cadastro" class="w-full h-auto" />
        <canvas ref="canvasLeft" class="absolute inset-0 pointer-events-none"></canvas>
      </div>
      <div class="relative bg-white p-2 rounded shadow">
        <h3 class="text-sm font-medium mb-2">Foto Captura</h3>
        <img :src="log.foto_captura" alt="captura" class="w-full h-auto" />
        <canvas ref="canvasRight" class="absolute inset-0 pointer-events-none"></canvas>
      </div>
    </div>

    <div v-if="log" class="mt-4 bg-gray-100 p-4 rounded font-mono text-sm">
      <div>Distância (euclidiana): <strong>{{ distancia }}</strong></div>
      <div>Threshold: <strong>{{ (log.threshold || '-') }}</strong></div>
      <div>Similaridade (%): <strong>{{ (log.similaridade || '-') }}</strong></div>
      <div class="mt-2">Fórmula: $$Distância = \sqrt{\sum_{i=1}^{128} (V_{cadastro}[i] - V_{captura}[i])^2}$$</div>
    </div>

    <div v-if="perPoint.length" class="mt-4 bg-white p-4 rounded shadow">
      <h3 class="font-medium mb-2">Contribuição por Marco Facial (top 10)</h3>
      <table class="w-full text-sm">
        <thead>
          <tr>
            <th class="text-left px-2">#</th>
            <th class="text-left px-2">Distância (px)</th>
            <th class="text-left px-2">Contribuição (%)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in perPoint.slice(0,10)" :key="p.index">
            <td class="px-2">{{ p.index }}</td>
            <td class="px-2">{{ p.dx.toFixed(2) }}</td>
            <td class="px-2">{{ p.pct }}%</td>
          </tr>
        </tbody>
      </table>

      <details class="mt-3">
        <summary class="cursor-pointer">Ver lista completa (68 pontos)</summary>
        <div class="mt-2 overflow-auto max-h-64">
          <table class="w-full text-sm">
            <thead>
              <tr>
                <th class="text-left px-2">#</th>
                <th class="text-left px-2">Distância (px)</th>
                <th class="text-left px-2">Contribuição (%)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in perPoint" :key="p.index">
                <td class="px-2">{{ p.index }}</td>
                <td class="px-2">{{ p.dx.toFixed(2) }}</td>
                <td class="px-2">{{ p.pct }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </div>

    <div v-if="!log">Carregando...</div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import * as faceapi from 'face-api.js'
import { buscarLogPorId } from '../services/api'

export default {
  name: 'VisualizadorBiometrico',
  setup() {
    const route = useRoute()
    const id = route.params.id
    const log = ref(null)
    const distancia = ref('-')
    const perPoint = ref([])
    const canvasLeft = ref(null)
    const canvasRight = ref(null)

    async function loadModels() {
      const base = '/models'
      await faceapi.nets.tinyFaceDetector.loadFromUri(base)
      await faceapi.nets.faceLandmark68Net.loadFromUri(base)
      await faceapi.nets.faceRecognitionNet.loadFromUri(base)
    }

    function createImage(src) {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
      })
    }

    function euclid(a, b) {
      const dx = a.x - b.x
      const dy = a.y - b.y
      return Math.sqrt(dx * dx + dy * dy)
    }

    async function detectAndDraw(imgSrc, canvasRef) {
      const img = await createImage(imgSrc)
      const canvas = canvasRef.value
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor()
      if (!detection) return null

      // ajustar escala do canvas
      faceapi.matchDimensions(canvas, { width: img.width, height: img.height })
      const resized = faceapi.resizeResults(detection, { width: img.width, height: img.height })
      faceapi.draw.drawFaceLandmarks(canvas, resized.landmarks)

      return resized
    }

    async function carregar() {
      await loadModels()
      const data = await buscarLogPorId(id)
      log.value = data

      // calcular distância entre descritores, se existirem
      try {
        const dCad = log.value.descriptor_cadastro ? JSON.parse(log.value.descriptor_cadastro) : null
        const dCap = log.value.descriptor_captura ? JSON.parse(log.value.descriptor_captura) : null
        if (dCad && dCap && Array.isArray(dCad) && Array.isArray(dCap)) {
          let sum = 0
          for (let i = 0; i < Math.min(dCad.length, dCap.length); i++) {
            const diff = dCad[i] - dCap[i]
            sum += diff * diff
          }
          distancia.value = Math.sqrt(sum).toFixed(4)
        }
      } catch (err) {
        distancia.value = '-'
      }

      // esperar DOM
      await nextTick()

      try {
        const resLeft = await detectAndDraw(log.value.foto_cadastro, canvasLeft)
        const resRight = await detectAndDraw(log.value.foto_captura, canvasRight)

        // calcular distâncias por landmark (68 pontos) se ambos detectados
        if (resLeft && resRight && resLeft.landmarks && resRight.landmarks) {
          const ptsL = resLeft.landmarks.positions
          const ptsR = resRight.landmarks.positions
          const n = Math.min(ptsL.length, ptsR.length)
          const distances = []
          let total = 0
          for (let i = 0; i < n; i++) {
            const d = euclid(ptsL[i], ptsR[i])
            distances.push({ index: i + 1, dx: d })
            total += d
          }
          // calcular percentuais
          perPoint.value = distances.map(d => ({ ...d, pct: total > 0 ? ((d.dx / total) * 100).toFixed(2) : '0.00' }))
        }
      } catch (err) {
        console.error('Erro ao detectar landmarks:', err)
      }
    }

    onMounted(() => carregar())

    return { log, distancia, perPoint, canvasLeft, canvasRight }
  }
}
</script>

<style scoped>
</style>
