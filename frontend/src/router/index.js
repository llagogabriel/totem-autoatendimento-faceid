import { createRouter, createWebHistory } from 'vue-router'
import TelaCPF from '../views/TelaCPF.vue'
import TelaConfirmacao from '../views/TelaConfirmacao.vue'
import TelaCaptura from '../views/TelaCaptura.vue' // <-- Importe a nova tela
import TelaCadastro from '../views/TelaCadastro.vue'

const routes = [
  { path: '/', name: 'CPF', component: TelaCPF },
  { path: '/confirmacao', name: 'Confirmacao', component: TelaConfirmacao },
  { path: '/captura', name: 'Captura', component: TelaCaptura } // <-- Adicione a rota
  ,{ path: '/cadastro', name: 'Cadastro', component: TelaCadastro }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router