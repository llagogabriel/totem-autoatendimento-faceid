<template>
  <div class="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-800">
    <div class="bg-white p-10 rounded-2xl shadow-xl flex flex-col items-center border border-gray-200">
      <h1 class="text-4xl font-black mb-4 text-blue-900">TOTEM DE ACESSO</h1>
      <p class="text-xl mb-8">Digite seu CPF para iniciar o atendimento</p>
      
      <input 
        v-model="cpf"
        type="text" 
        placeholder="000.000.000-00"
        :disabled="carregando"
        class="w-full p-5 border-4 border-blue-200 rounded-xl text-4xl mb-6 text-center focus:border-blue-500 outline-none transition-all disabled:bg-gray-100"
      />

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

const confirmar = async () => {
  erro.value = ''
  
  if (cpf.value.length < 11) {
    erro.value = 'Por favor, digite o CPF completo.'
    return
  }

  carregando.value = true

  try {
    // Validar se a pessoa existe no banco
    await api.buscarPessoa(cpf.value)
    
    // Armazenar CPF para usar nas próximas telas
    sessionStorage.setItem('cpf_atual', cpf.value)
    
    router.push('/confirmacao')
  } catch (err) {
    erro.value = err.message || 'CPF não encontrado no sistema'
    console.error('Erro:', err)
  } finally {
    carregando.value = false
  }
}
</script>