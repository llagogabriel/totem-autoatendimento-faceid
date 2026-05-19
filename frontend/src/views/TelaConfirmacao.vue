<template>
  <div class="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-100">
    <div v-if="carregando" class="text-3xl font-bold text-blue-900 animate-pulse">
      Buscando dados no banco de dados...
    </div>

    <div v-else-if="erro" class="bg-red-100 border-4 border-red-500 text-red-700 px-8 py-6 rounded-2xl shadow-xl max-w-md text-center">
      <p class="text-2xl font-bold mb-4">❌ Erro</p>
      <p class="text-lg mb-6">{{ erro }}</p>
      <button @click="$router.push('/')" class="bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700">
        Voltar ao Início
      </button>
    </div>

    <div v-else class="bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center max-w-2xl w-full border-t-8 border-blue-600">
      <h2 class="text-2xl font-bold text-gray-400 mb-6 uppercase tracking-widest text-center">Confirme sua Identidade</h2>
      
      <div class="w-48 h-48 bg-gray-200 rounded-full mb-8 border-4 border-blue-100 flex items-center justify-center overflow-hidden shadow-lg">
        <img v-if="pessoa.foto" :src="pessoa.foto" class="w-full h-full object-cover" alt="Foto da pessoa" />
      </div>

      <p class="text-2xl mb-2 text-gray-600">Você é:</p>
      <h1 class="text-4xl font-black text-blue-900 mb-10 text-center uppercase">
        {{ pessoa.nome }}
      </h1>

      <div class="flex gap-6 w-full">
        <button 
          @click="confirmar" 
          :disabled="carregando"
          class="flex-1 bg-green-600 text-white py-8 rounded-2xl font-black text-2xl shadow-lg hover:bg-green-700 transition-all active:scale-95 disabled:bg-gray-400 flex items-center justify-center gap-2"
        >
          <span v-if="carregando" class="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          {{ carregando ? '...' : 'SIM, SOU EU' }}
        </button>
        <button 
          @click="$router.push('/')" 
          :disabled="carregando"
          class="flex-1 bg-red-500 text-white py-8 rounded-2xl font-black text-2xl shadow-lg hover:bg-red-600 transition-all active:scale-95 disabled:bg-gray-400"
        >
          NÃO
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import * as api from '../services/api.js'

const router = useRouter()
const carregando = ref(true)
const erro = ref('')
const pessoa = ref({ nome: '', foto: '' })

onMounted(async () => {
  try {
    const cpf = sessionStorage.getItem('cpf_atual')
    
    if (!cpf) {
      router.push('/')
      return
    }

    // Buscar dados da pessoa
    const dados = await api.buscarPessoa(cpf)
    pessoa.value.nome = dados.nome

    // Buscar foto
    const fotoBase64 = await api.buscarFoto(cpf)
    pessoa.value.foto = fotoBase64

    carregando.value = false
  } catch (err) {
    console.error('Erro:', err)
    erro.value = err.message || 'Erro ao buscar dados'
    carregando.value = false
  }
})

const confirmar = () => {
  router.push('/captura')
}
</script>