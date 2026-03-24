import { createRouter, createWebHistory } from 'vue-router'
import TelaCPF from '../views/TelaCPF.vue'
import TelaConfirmacao from '../views/TelaConfirmacao.vue'
import TelaCaptura from '../views/TelaCaptura.vue' // <-- Importe a nova tela

const routes = [
  { path: '/', name: 'CPF', component: TelaCPF },
  { path: '/confirmacao', name: 'Confirmacao', component: TelaConfirmacao },
  { path: '/captura', name: 'Captura', component: TelaCaptura } // <-- Adicione a rota
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router