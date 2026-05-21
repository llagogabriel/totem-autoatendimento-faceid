<template>
  <div class="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-800">
    <div class="bg-white p-10 rounded-2xl shadow-xl flex flex-col items-center border border-gray-200">
      <h1 class="text-4xl font-black mb-4 text-blue-900">TOTEM DE ACESSO</h1>
      <p class="text-xl mb-8">Digite seu CPF para iniciar o atendimento</p>
      
      <input 
        :value="cpf"
        @input="onCpfInput"
        type="text" 
        placeholder="000.000.000-00"
        :disabled="carregando"
        class="w-full p-5 border-4 border-blue-200 rounded-xl text-4xl mb-2 text-center focus:border-blue-500 outline-none transition-all disabled:bg-gray-100"
      />

      <p class="text-sm text-gray-400 mb-4">Digite apenas números (ex: 00000000000). A máscara será aplicada automaticamente.</p>

      <div v-if="erro" class="w-full bg-red-100 border-2 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-4 text-center">
        {{ erro }}
      </div>

      <button 
        @click="confirmar"
        :disabled="carregando"
        class="w-full bg-blue-600 text-white py-5 rounded-xl font-bold text-2xl hover:bg-blue-700 active:scale-95 transition-all shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <span v-if="carregando" class="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        {{ carregando ? 'VALIDANDO...' : 'CONFIRMAR IDENTIDADE' }}
      </button>
    
      <div class="w-full text-center mt-4">
        <router-link to="/cadastro" class="text-sm text-blue-600 hover:underline">Cadastrar pessoa de teste</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import * as api from '../services/api.js'

const cpf = ref('')
const router = useRouter()
const carregando = ref(false)
const erro = ref('')

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

const confirmar = async () => {
  erro.value = ''
  
  const digits = cpf.value.replace(/\D/g, '')
  if (digits.length < 11) {
    erro.value = 'Por favor, digite o CPF completo (11 dígitos).'
    return
  }

  carregando.value = true

  try {
    // Formatar CPF para envio (xxx.xxx.xxx-xx)
    const formatted = formatCpfDigits(digits)

    // Validar se a pessoa existe no banco
    await api.buscarPessoa(formatted)

    // Armazenar CPF para usar nas próximas telas
    sessionStorage.setItem('cpf_atual', formatted)

    router.push('/confirmacao')
  } catch (err) {
    erro.value = err.message || 'CPF não encontrado no sistema'
    console.error('Erro:', err)
  } finally {
    carregando.value = false
  }
}
</script>