<template>
  <div class="p-6">
    <h1 class="text-2xl font-semibold mb-4">Gerenciamento de Usuários</h1>
    <div class="mb-4">
      <input v-model="busca" @input="onBuscar" placeholder="Buscar por nome ou CPF" class="border p-2 rounded w-full" />
    </div>

    <table class="min-w-full bg-white">
      <thead>
        <tr>
          <th class="px-4 py-2">ID</th>
          <th class="px-4 py-2">Nome</th>
          <th class="px-4 py-2">CPF</th>
          <th class="px-4 py-2">Status</th>
          <th class="px-4 py-2">Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in pessoas" :key="p.cpf" class="border-t">
          <td class="px-4 py-2">{{ p.id }}</td>
          <td class="px-4 py-2">{{ p.nome }}</td>
          <td class="px-4 py-2">{{ p.cpf }}</td>
          <td class="px-4 py-2">{{ p.status }}</td>
          <td class="px-4 py-2 space-x-2">
            <button @click="verFoto(p.cpf)" class="px-2 py-1 bg-blue-500 text-white rounded">Ver Foto</button>
            <button @click="autorizar(p.cpf)" class="px-2 py-1 bg-green-500 text-white rounded">Ativar</button>
            <button @click="revogar(p.cpf)" class="px-2 py-1 bg-yellow-500 text-white rounded">Revogar</button>
            <button @click="bloquear(p.cpf)" class="px-2 py-1 bg-red-600 text-white rounded">Bloquear</button>
            <button @click="excluir(p.cpf)" class="px-2 py-1 bg-gray-700 text-white rounded">Excluir</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal simples para exibir foto -->
    <div v-if="fotoModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div class="bg-white p-4 rounded max-w-xl w-full">
        <button @click="fotoModal = false" class="float-right px-2">Fechar</button>
        <div v-if="fotoData">
          <img :src="fotoData" alt="foto" class="max-w-full h-auto" />
        </div>
        <div v-else>Carregando...</div>
      </div>
    </div>
  </div>
</template>

<script>
import { listarPessoas, buscarFoto, autorizarPessoa, revogarPessoa, bloquearPessoa, excluirPessoa } from '../services/api'
import { ref } from 'vue'

export default {
  name: 'AdminListagem',
  setup() {
    const busca = ref('')
    const pessoas = ref([])
    const fotoModal = ref(false)
    const fotoData = ref(null)

    async function carregar(val = '') {
      const data = await listarPessoas(val)
      pessoas.value = data
    }

    function onBuscar() {
      carregar(busca.value)
    }

    async function verFoto(cpf) {
      fotoModal.value = true
      fotoData.value = null
      try {
        fotoData.value = await buscarFoto(cpf)
      } catch (err) {
        fotoData.value = null
        alert('Erro ao buscar foto')
      }
    }

    async function autorizar(cpf) {
      await autorizarPessoa(cpf)
      carregar(busca.value)
    }

    async function revogar(cpf) {
      await revogarPessoa(cpf)
      carregar(busca.value)
    }

    async function bloquear(cpf) {
      if (!confirm('Confirma bloqueio permanente deste usuário?')) return
      await bloquearPessoa(cpf)
      carregar(busca.value)
    }

    async function excluir(cpf) {
      if (!confirm('Deseja realmente excluir este cadastro? Esta ação é irreversível.')) return
      try {
        await excluirPessoa(cpf)
        carregar(busca.value)
      } catch (err) {
        alert('Erro ao excluir pessoa')
      }
    }

    // load initially
    carregar()

    return { busca, pessoas, onBuscar, verFoto, fotoModal, fotoData, autorizar, revogar, bloquear, excluir }
  }
}
</script>

<style scoped>
</style>
