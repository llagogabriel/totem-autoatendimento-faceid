<template>
  <div class="p-6">
    <h1 class="text-2xl font-semibold mb-4">Painel Admin</h1>
    <div class="grid grid-cols-2 gap-4">
      <router-link to="/admin/cadastro" class="p-6 bg-white rounded shadow hover:shadow-md">
        <h2 class="font-medium">Cadastro Isolado</h2>
        <p class="text-sm text-gray-500">Acesso restrito ao operador</p>
      </router-link>
      <router-link to="/admin/usuarios" class="p-6 bg-white rounded shadow hover:shadow-md">
        <h2 class="font-medium">Gerenciamento</h2>
        <p class="text-sm text-gray-500">Listagem e controle de status</p>
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminHome'
}
</script>

<style scoped>
</style>
