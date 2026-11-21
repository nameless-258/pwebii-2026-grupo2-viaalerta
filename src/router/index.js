import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

// createWebHashHistory: as rotas funcionam ao actualizar a página no GitHub Pages
const routes = [
  { path: '/', name: 'inicio', component: () => import('@/views/Home.vue'), meta: { titulo: 'Início' } },
  { path: '/denuncias', name: 'denuncias', component: () => import('@/views/Incidents.vue'), meta: { titulo: 'Explorar denúncias' } },
  { path: '/denuncias/:id', name: 'detalhe', component: () => import('@/views/IncidentDetails.vue'), props: true, meta: { titulo: 'Detalhes da denúncia' } },
  { path: '/denunciar', name: 'denunciar', component: () => import('@/views/Report.vue'), meta: { titulo: 'Fazer denúncia', requerAuth: true, requerCidadao: true } },
  { path: '/minhas-denuncias', name: 'minhas', component: () => import('@/views/MyIncidents.vue'), meta: { titulo: 'Minhas denúncias', requerAuth: true, requerCidadao: true } },
  { path: '/sobre', name: 'sobre', component: () => import('@/views/About.vue'), meta: { titulo: 'Sobre' } },
  { path: '/entrar', name: 'entrar', component: () => import('@/views/Login.vue'), meta: { titulo: 'Iniciar sessão', soVisitante: true } },
  { path: '/registar', name: 'registar', component: () => import('@/views/Register.vue'), meta: { titulo: 'Criar conta', soVisitante: true } },
  { path: '/admin', name: 'admin', component: () => import('@/views/AdminDashboard.vue'), meta: { titulo: 'Painel administrativo', requerStaff: true } },
  { path: '/admin/denuncias/:id', name: 'gestao', component: () => import('@/views/IncidentManagement.vue'), props: true, meta: { titulo: 'Gestão de denúncia', requerStaff: true } },
  { path: '/admin/utilizadores', name: 'utilizadores', component: () => import('@/views/UserManagement.vue'), meta: { titulo: 'Gestão de utilizadores', requerAdmin: true } },
  { path: '/admin/auditoria', name: 'auditoria', component: () => import('@/views/AuditLog.vue'), meta: { titulo: 'Registo de auditoria', requerAdmin: true } },
  { path: '/admin/configuracao', name: 'configuracao', component: () => import('@/views/Settings.vue'), meta: { titulo: 'Configuração do sistema', requerAdmin: true } },
  { path: '/:pathMatch(.*)*', name: 'nao-encontrada', component: () => import('@/views/NotFound.vue'), meta: { titulo: 'Página não encontrada' } }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash, top: 80, behavior: 'smooth' }
    return { top: 0 }
  }
})

// Guardas de navegação. ATENÇÃO: isto é só experiência de utilizador;
// a segurança real está nas políticas RLS do Supabase (supabase/schema.sql).
router.beforeEach((to) => {
  const { autenticado, staff, admin } = useAuth()
  if ((to.meta.requerAuth || to.meta.requerStaff || to.meta.requerAdmin) && !autenticado.value) {
    return { name: 'entrar', query: { redirect: to.fullPath } }
  }
  // Responsáveis e administradores não criam denúncias: vão para o painel de gestão
  if (to.meta.requerCidadao && staff.value) return { name: 'admin' }
  if (to.meta.requerStaff && !staff.value) return { name: 'inicio' }
  if (to.meta.requerAdmin && !admin.value) return { name: 'admin' }
  if (to.meta.soVisitante && autenticado.value) return { name: 'inicio' }
})

router.afterEach((to) => {
  document.title = `${to.meta.titulo || 'ViaAlerta'} · ViaAlerta`
})

export default router
