<template>
  <div class="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-100">
    <div v-if="loading" class="text-3xl font-bold text-blue-900 animate-pulse">
      Buscando dados no Sisponto...
    </div>

    <div v-else class="bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center max-w-2xl w-full border-t-8 border-blue-600">
      <h2 class="text-2xl font-bold text-gray-400 mb-6 uppercase tracking-widest text-center">Confirme sua Identidade</h2>
      
      <div class="w-48 h-48 bg-gray-200 rounded-full mb-8 border-4 border-blue-100 flex items-center justify-center overflow-hidden">
        <img :src="municipe.foto" class="w-full h-full object-cover" />
      </div>

      <p class="text-2xl mb-2 text-gray-600">Você é:</p>
      <h1 class="text-4xl font-black text-blue-900 mb-10 text-center uppercase">
        {{ municipe.nome }}
      </h1>

      <div class="flex gap-6 w-full">
        <button @click="confirmar" class="flex-1 bg-green-600 text-white py-8 rounded-2xl font-black text-2xl shadow-lg hover:bg-green-700 transition-all active:scale-95">
          SIM, SOU EU
        </button>
        <button @click="$router.push('/')" class="flex-1 bg-red-500 text-white py-8 rounded-2xl font-black text-2xl shadow-lg hover:bg-red-600 transition-all active:scale-95">
          NÃO
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(true)
const municipe = ref({ nome: '', foto: '' })

onMounted(() => {
  // Simula o tempo de resposta do SQL Server
  setTimeout(() => {
    municipe.value = {
      nome: "GABRIEL A**** DE O*****",
      foto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Gabriel"
    }
    loading.value = false
  }, 1200)
})

const confirmar = () => {
  router.push('/captura')
}
</script>