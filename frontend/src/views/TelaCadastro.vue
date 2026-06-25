<template>
  <div class="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-800 p-6">
    <div class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-xl">
      <h2 class="text-2xl font-bold mb-4">Cadastrar Pessoa de Teste</h2>

      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700">CPF</label>
        <input :value="cpf" @input="onCpfInput" type="text" placeholder="000.000.000-00" class="w-full p-3 border rounded mt-1" />
        <p class="text-xs text-gray-500 mt-1">Digite apenas números. A máscara será aplicada automaticamente.</p>
      </div>

      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700">Nome completo</label>
        <input v-model="nome" type="text" placeholder="Nome completo" class="w-full p-3 border rounded mt-1" />
      </div>

      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700">Foto (arquivo ou webcam)</label>
        <div class="flex gap-3 mt-2">
          <button @click="$refs.fileRef.click()" type="button" class="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded">Adicionar foto</button>
          <button @click="openCamera" type="button" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded">Usar webcam</button>
        </div>

        <input ref="fileRef" @change="onFileChange" accept="image/*" capture="environment" type="file" class="hidden mt-1" />

        <div v-if="preview" class="mt-3">
          <img :src="preview" alt="preview" class="w-48 h-48 object-cover rounded" />
        </div>
      </div>

      <div v-if="cameraActive" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-85 p-4">
        <div class="relative w-full max-w-lg overflow-hidden rounded-2xl bg-slate-900 p-6 shadow-2xl border border-slate-800">
          
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-white">Posicione o Rosto</h3>
            <button @click="closeCamera" type="button" class="text-slate-400 hover:text-white transition-colors">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-inner">
            <img ref="cameraImg" alt="camera preview" class="h-full w-full object-cover" />
            <canvas ref="cameraCanvas" class="hidden"></canvas>
            
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="w-56 h-56 border-4 border-dashed border-blue-500 rounded-full bg-opacity-0 shadow-[0_0_0_9999px_rgba(15,23,42,0.65)]"></div>
            </div>
            
            <div class="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
              <span class="bg-blue-600 bg-opacity-90 text-white text-xs px-3 py-1.5 rounded-full font-medium tracking-wide shadow">
                Centralize seu rosto no círculo
              </span>
            </div>
          </div>

          <div class="mt-6 flex justify-end space-x-3">
            <button @click="closeCamera" type="button" class="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Cancelar
            </button>
            <button @click="captureFromCamera" type="button" class="flex items-center justify-center space-x-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Capturar Foto</span>
            </button>
          </div>
        </div>
      </div>

      <div class="flex gap-3 mt-6">
        <button @click="submit" :disabled="carregando" class="bg-blue-600 text-white px-4 py-2 rounded">{{ carregando ? 'Enviando...' : 'Cadastrar' }}</button>
        <button @click="$router.push('/')" class="bg-gray-200 px-4 py-2 rounded">Voltar</button>
      </div>

      <div v-if="mensagem" class="mt-4 p-3 rounded" :class="mensagemTipo==='erro' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'">
        {{ mensagem }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as faceapi from 'face-api.js'
import * as api from '../services/api.js'

// --- Estados do Formulário e Controle ---
const cpf = ref('')
const nome = ref('')
const fileRef = ref(null)
const preview = ref(null)
const carregando = ref(false)
const mensagem = ref('')
const mensagemTipo = ref('')

// --- Estados do Modal de Câmera Biométrica ---
const cameraActive = ref(false)
const cameraImg = ref(null)
const cameraCanvas = ref(null)

const MODEL_URL = '/models'
let modelosCarregados = false

// --- Carga Inicial dos Modelos da face-api.js ---
onMounted(async () => {
  try {
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    modelosCarregados = true
  } catch (err) {
    console.error('Erro ao carregar modelos de IA:', err)
  }
})

// --- Máscara e Validação de CPF ---
function formatCpfDigits(digits) {
  const d = digits || ''
  const part1 = d.slice(0,3)
  const part2 = d.slice(3,6)
  const part3 = d.slice(6,9)
  const part4 = d.slice(9,11)
  let out = ''
  if (part1) out += part1
  if (part2) out += '.' + part2
  if (part3) out += '.' + part3
  if (part4) out += '-' + part4
  return out
}

function onCpfInput(e) {
  const raw = e.target.value || ''
  const digits = raw.replace(/\D/g, '').slice(0,11)
  cpf.value = formatCpfDigits(digits)
}

// --- Upload de Arquivo Local ---
function onFileChange(e) {
  const f = e.target.files && e.target.files[0]
  if (!f) return
  const reader = new FileReader()
  reader.onload = () => {
    preview.value = reader.result
  }
  reader.readAsDataURL(f)
}

// --- Controle de Fluxo da Webcam ---
const openCamera = async () => {
  mensagem.value = ''
  mensagemTipo.value = ''
  cameraActive.value = true
  
  await nextTick()

  try {
    const img = cameraImg.value
    if (!img) throw new Error('Elemento de imagem não encontrado')

    console.log('📷 Conectando a Tela de Cadastro ao fluxo fluido RTSP...')
    
    try { img.crossOrigin = 'anonymous' } catch (e) {}
    
    // Aponta o elemento diretamente para o nosso stream contínuo do service de API
    img.src = api.obterUrlStream()

  } catch (err) {
    cameraActive.value = false
    console.error('Erro ao abrir câmera:', err)
    mensagemTipo.value = 'erro'
    mensagem.value = 'Falha ao acessar a câmera: ' + err.message
  }
}

const closeCamera = () => {
  cameraActive.value = false
  if (cameraImg.value) {
    cameraImg.value.src = ''
  }
}

// --- Captura de Foto a partir do Stream ---
const captureFromCamera = () => {
  if (!cameraImg.value || !cameraCanvas.value) {
    mensagemTipo.value = 'erro'
    mensagem.value = 'A stream da câmera não está pronta. Tente novamente.'
    return
  }
  const img = cameraImg.value
  const canvas = cameraCanvas.value
  
  // Utiliza as dimensões nativas da imagem recebida do FFmpeg
  canvas.width = img.naturalWidth || 1280
  canvas.height = img.naturalHeight || 720
  
  const ctx = canvas.getContext('2d')
  // Desenhando o quadro limpo direto do stream contínuo
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  
  preview.value = canvas.toDataURL('image/jpeg', 0.95)
  closeCamera()
}

// --- Processamento de IA e Envio para o Backend ---
async function extractFaceDescriptor(imageDataUrl) {
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
    throw new Error('Não foi possível detectar um rosto na foto. Posicione-se melhor e use uma imagem mais nítida.')
  }

  return Array.from(detection.descriptor)
}

async function submit() {
  mensagem.value = ''
  mensagemTipo.value = ''
  const digits = cpf.value.replace(/\D/g, '')
  
  if (digits.length !== 11) {
    mensagemTipo.value = 'erro'
    mensagem.value = 'CPF inválido. Informe 11 dígitos.'
    return
  }
  if (!nome.value.trim()) {
    mensagemTipo.value = 'erro'
    mensagem.value = 'Informe o nome.'
    return
  }
  if (!preview.value) {
    mensagemTipo.value = 'erro'
    mensagem.value = 'Selecione uma foto (jpg/png) ou use a webcam.'
    return
  }
  if (!modelosCarregados) {
    mensagemTipo.value = 'erro'
    mensagem.value = 'Modelos de IA ainda estão sendo carregados. Aguarde alguns segundos.'
    return
  }

  carregando.value = true
  try {
    const descriptor = await extractFaceDescriptor(preview.value)
    const formatted = formatCpfDigits(digits)
    
    await api.cadastrarPessoa(formatted, nome.value.trim(), preview.value, descriptor)
    
    mensagemTipo.value = 'sucesso'
    mensagem.value = 'Cadastro realizado com sucesso.'
    
    cpf.value = ''
    nome.value = ''
    preview.value = null
    if (fileRef.value) fileRef.value.value = null
  } catch (err) {
    mensagemTipo.value = 'erro'
    mensagem.value = err.message || 'Erro ao cadastrar pessoa.'
  } finally {
    carregando.value = false
  }
}
</script>

<style scoped>
/* minimal styling kept via tailwind classes */
</style>