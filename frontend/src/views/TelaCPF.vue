<template>
  <div class="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-800">
    <div class="bg-white p-10 rounded-2xl shadow-xl flex flex-col items-center border border-gray-200">
      <h1 class="text-4xl font-black mb-4 text-blue-900">TOTEM DE ACESSO</h1>
      <p class="text-xl mb-8">Digite seu CPF para iniciar o atendimento</p>
      
      <input 
        v-model="cpf"
        type="text" 
        placeholder="000.000.000-00"
        class="w-full p-5 border-4 border-blue-200 rounded-xl text-4xl mb-6 text-center focus:border-blue-500 outline-none transition-all"
      />

      <button 
        @click="confirmar"
        class="w-full bg-blue-600 text-white py-5 rounded-xl font-bold text-2xl hover:bg-blue-700 active:scale-95 transition-all shadow-lg"
      >
        CONFIRMAR IDENTIDADE
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const cpf = ref('')
const router = useRouter()

const confirmar = () => {
  if (cpf.value.length >= 11) {
    router.push('/confirmacao')
  } else {
    alert('Por favor, digite o CPF completo.')
  }
}
</script>