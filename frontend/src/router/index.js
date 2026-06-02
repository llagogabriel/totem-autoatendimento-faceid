import { createRouter, createWebHistory } from 'vue-router'
import TelaCPF from '../views/TelaCPF.vue'
import TelaConfirmacao from '../views/TelaConfirmacao.vue'
import TelaCaptura from '../views/TelaCaptura.vue' // <-- Importe a nova tela
import TelaCadastro from '../views/TelaCadastro.vue'
import AdminHome from '../views/AdminHome.vue'
import AdminListagem from '../views/AdminListagem.vue'
import VisualizadorBiometrico from '../views/VisualizadorBiometrico.vue'

const routes = [
  { path: '/', name: 'CPF', component: TelaCPF },
  { path: '/confirmacao', name: 'Confirmacao', component: TelaConfirmacao },
  { path: '/captura', name: 'Captura', component: TelaCaptura } // <-- Adicione a rota
  ,{ path: '/cadastro', name: 'Cadastro', component: TelaCadastro }
  ,{ path: '/admin', name: 'AdminHome', component: AdminHome }
  ,{ path: '/admin/cadastro', name: 'AdminCadastro', component: TelaCadastro }
  ,{ path: '/admin/usuarios', name: 'AdminUsuarios', component: AdminListagem }
  ,{ path: '/admin/visualizador/:id', name: 'VisualizadorBiometrico', component: VisualizadorBiometrico }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router