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
        <label class="block text-sm font-medium text-gray-700">Foto (jpg, jpeg, png)</label>
        <input ref="fileRef" @change="onFileChange" accept="image/jpeg,image/jpg,image/png" type="file" class="w-full mt-1" />
        <div v-if="preview" class="mt-3">
          <img :src="preview" alt="preview" class="w-48 h-48 object-cover rounded" />
        </div>
      </div>

      <div class="flex gap-3">
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
import { ref, onMounted } from 'vue'
import * as faceapi from 'face-api.js'
import * as api from '../services/api.js'

const cpf = ref('')
const nome = ref('')
const fileRef = ref(null)
const preview = ref(null)
const carregando = ref(false)
const mensagem = ref('')
const mensagemTipo = ref('')

const MODEL_URL = '/models'
let modelosCarregados = false

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

function onFileChange(e) {
  const f = e.target.files && e.target.files[0]
  if (!f) return
  const reader = new FileReader()
  reader.onload = () => {
    preview.value = reader.result
  }
  reader.readAsDataURL(f)
}

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
    throw new Error('Não foi possível detectar um rosto na foto. Use outra imagem mais nítida.')
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
    mensagem.value = 'Selecione uma foto (jpg/png).'
    return
  }
  if (!modelosCarregados) {
    mensagemTipo.value = 'erro'
    mensagem.value = 'Modelos de IA ainda não foram carregados. Aguarde alguns segundos e tente novamente.'
    return
  }

  carregando.value = true
  try {
    const descriptor = await extractFaceDescriptor(preview.value)
    const formatted = formatCpfDigits(digits)
    await api.cadastrarPessoa(formatted, nome.value.trim(), preview.value, descriptor)
    mensagemTipo.value = 'sucesso'
    mensagem.value = 'Cadastro realizado com sucesso.'
    // limpar form
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
