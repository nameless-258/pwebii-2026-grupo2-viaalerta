<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import AppLogo from './AppLogo.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import NotificationBell from '@/components/common/NotificationBell.vue'

const { perfil, autenticado, staff, cidadao, terminarSessao } = useAuth()
const route = useRoute()
const router = useRouter()

const menuAberto = ref(false)
const perfilAberto = ref(false)

// Fecha os menus sempre que se muda de página
watch(() => route.fullPath, () => { menuAberto.value = false; perfilAberto.value = false })

const iniciais = computed(() => {
  const nome = perfil.value?.nome || perfil.value?.email || '?'
  return nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
})
const primeiroNome = computed(() => (perfil.value?.nome || '').split(' ')[0] || 'Conta')

const links = [
  { to: '/', nome: 'Início' },
  { to: '/denuncias', nome: 'Explorar denúncias' },
  { to: '/sobre', nome: 'Sobre' }
]

async function sair() {
  await terminarSessao()
  router.push('/')
}
</script>

<template>
  <header class="header">
    <div class="container bar">
      <RouterLink to="/" class="marca" aria-label="ViaAlerta — página inicial"><AppLogo /></RouterLink>

      <nav class="nav-desktop" aria-label="Navegação principal">
        <RouterLink v-for="l in links" :key="l.to" :to="l.to" class="nav-link" exact-active-class="ativo">{{ l.nome }}</RouterLink>
        <RouterLink v-if="staff" to="/admin" class="nav-link" active-class="ativo">Painel de gestão</RouterLink>
      </nav>

      <div class="acoes">
        <ThemeToggle />
        <template v-if="autenticado">
          <NotificationBell v-if="cidadao" />
          <div class="perfil">
            <button class="perfil-btn" type="button" :aria-expanded="perfilAberto" @click="perfilAberto = !perfilAberto">
              <span class="avatar">{{ iniciais }}</span>
              <span class="nome-utilizador">{{ primeiroNome }}</span>
              <AppIcon name="baixo" :size="16" />
            </button>
            <Transition name="fade">
              <div v-if="perfilAberto" class="dropdown card" @click="perfilAberto = false">
                <div class="dropdown-cab">
                  <strong>{{ perfil?.nome }}</strong>
                  <span class="muted small">{{ perfil?.email }}</span>
                </div>
                <template v-if="cidadao">
                  <RouterLink to="/minhas-denuncias" class="item"><AppIcon name="lista" :size="18" /> Minhas denúncias</RouterLink>
                  <RouterLink to="/denunciar" class="item"><AppIcon name="mais" :size="18" /> Nova denúncia</RouterLink>
                </template>
                <RouterLink v-if="staff" to="/admin" class="item"><AppIcon name="painel" :size="18" /> Painel de gestão</RouterLink>
                <button class="item" type="button" @click="sair"><AppIcon name="sair" :size="18" /> Terminar sessão</button>
              </div>
            </Transition>
          </div>
        </template>
        <template v-else>
          <RouterLink to="/entrar" class="btn btn-ghost btn-sm so-desktop">Entrar</RouterLink>
          <RouterLink to="/registar" class="btn btn-primary btn-sm so-desktop">Criar conta</RouterLink>
        </template>
        <button class="btn btn-ghost icon-btn so-mobile" type="button" aria-label="Abrir menu" :aria-expanded="menuAberto" @click="menuAberto = !menuAberto">
          <AppIcon :name="menuAberto ? 'fechar' : 'menu'" />
        </button>
      </div>
    </div>

    <Transition name="fade">
      <nav v-if="menuAberto" class="nav-mobile container" aria-label="Navegação móvel">
        <RouterLink v-for="l in links" :key="l.to" :to="l.to" class="nav-link" exact-active-class="ativo">{{ l.nome }}</RouterLink>
        <RouterLink v-if="staff" to="/admin" class="nav-link">Painel de gestão</RouterLink>
        <template v-if="autenticado">
          <RouterLink v-if="cidadao" to="/minhas-denuncias" class="nav-link">Minhas denúncias</RouterLink>
          <button class="nav-link" type="button" @click="sair">Terminar sessão</button>
        </template>
        <div v-else class="row auth-mobile">
          <RouterLink to="/entrar" class="btn btn-outline">Entrar</RouterLink>
          <RouterLink to="/registar" class="btn btn-primary">Criar conta</RouterLink>
        </div>
      </nav>
    </Transition>
  </header>
</template>

<style scoped>
.header { position: sticky; top: 0; z-index: 1000; background: color-mix(in srgb, var(--surface) 92%, transparent); backdrop-filter: blur(10px); border-bottom: 1px solid var(--border); }
.bar { display: flex; align-items: center; gap: 16px; height: 64px; }
.marca { text-decoration: none !important; }
.nav-desktop { display: none; gap: 4px; margin-left: 12px; }
.nav-link { padding: 8px 12px; border-radius: 8px; color: var(--text-muted); font-weight: 500; text-decoration: none !important; background: none; border: none; cursor: pointer; text-align: left; font-size: 0.95rem; }
.nav-link:hover { background: var(--surface-2); color: var(--text); }
.nav-link.ativo { color: var(--primary); background: var(--primary-soft); }
.acoes { margin-left: auto; display: flex; align-items: center; gap: 6px; }
.perfil { position: relative; }
.perfil-btn { display: flex; align-items: center; gap: 8px; background: none; border: 1px solid var(--border); border-radius: 999px; padding: 3px 10px 3px 3px; cursor: pointer; }
.avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--primary); color: var(--primary-contrast); display: grid; place-items: center; font-weight: 700; font-size: 0.8rem; }
.nome-utilizador { display: none; font-weight: 600; font-size: 0.9rem; }
.dropdown { position: absolute; right: 0; top: calc(100% + 8px); width: 250px; padding: 6px; box-shadow: var(--shadow-lg); }
.dropdown-cab { display: flex; flex-direction: column; padding: 10px 10px 12px; border-bottom: 1px solid var(--border); margin-bottom: 6px; overflow: hidden; }
.dropdown-cab span { overflow: hidden; text-overflow: ellipsis; }
.item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px; border-radius: 8px; color: var(--text); background: none; border: none; cursor: pointer; text-decoration: none !important; font-size: 0.92rem; }
.item:hover { background: var(--surface-2); }
.nav-mobile { display: flex; flex-direction: column; gap: 2px; padding-bottom: 14px; }
.nav-mobile .nav-link { padding: 12px; }
.auth-mobile { padding-top: 8px; }
.auth-mobile .btn { flex: 1; }
.so-desktop { display: none; }
@media (min-width: 900px) {
  .nav-desktop { display: flex; }
  .so-desktop { display: inline-flex; }
  .so-mobile { display: none; }
  .nome-utilizador { display: inline; }
  .nav-mobile { display: none; }
}
</style>
