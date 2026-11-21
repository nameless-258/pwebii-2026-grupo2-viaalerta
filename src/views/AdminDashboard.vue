<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AdminIncidentTable from '@/components/admin/AdminIncidentTable.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import { useAdmin } from '@/composables/useAdmin'
import { useAuth } from '@/composables/useAuth'
import { estadoInfo } from '@/constants/estados'
import { FUNCOES } from '@/constants/funcoes'

const route = useRoute()
const router = useRouter()
const { todas, aCarregar, erro, estatisticas, carregarTodas } = useAdmin()
const { perfil, admin } = useAuth()

onMounted(carregarTodas)

const secao = computed(() => route.query.secao || 'geral')
const escolher = (s) => router.replace({ query: s === 'geral' ? {} : { secao: s } })

const daSecao = computed(() => {
  if (secao.value === 'geral') return todas.value.filter((d) => ['pendente', 'em_analise', 'precisa_info'].includes(d.estado))
  if (secao.value === 'em_analise') return todas.value.filter((d) => ['em_analise', 'precisa_info'].includes(d.estado))
  return todas.value.filter((d) => d.estado === secao.value)
})
const tituloSecao = computed(() => (secao.value === 'geral' ? 'A aguardar moderação' : secao.value === 'publicada' ? 'Denúncias aprovadas' : estadoInfo(secao.value).nome))

const cartoes = computed(() => [
  { t: 'Total recebidas', v: estatisticas.value.total, i: 'grafico', c: '#2a5bd7' },
  { t: 'Pendentes de análise', v: estatisticas.value.pendente, i: 'relogio', c: '#d49b00' },
  { t: 'Em análise', v: estatisticas.value.em_analise, i: 'pesquisa', c: '#2a5bd7' },
  { t: 'Aprovadas (publicadas)', v: estatisticas.value.publicada, i: 'check', c: '#0B8A4E' },
  { t: 'Rejeitadas', v: estatisticas.value.rejeitada, i: 'fechar', c: '#D21034' },
  { t: 'Em resolução', v: estatisticas.value.em_resolucao, i: 'construcao', c: '#d49b00' },
  { t: 'Resolvidas', v: estatisticas.value.resolvida, i: 'escudo', c: '#5b6b64' }
])
</script>

<template>
  <section class="container page">
    <header class="page-header section-title">
      <div>
        <h1>Painel administrativo</h1>
        <p>Olá, {{ perfil?.nome }} · {{ FUNCOES[perfil?.funcao] }}</p>
      </div>
      <button class="btn btn-outline btn-sm" type="button" :disabled="aCarregar" @click="carregarTodas"><AppIcon name="atualizar" :size="16" /> Actualizar</button>
    </header>

    <div class="layout">
      <AppSidebar :ativa="secao" :contagens="estatisticas" @escolher="escolher" />
      <div class="conteudo">
        <LoadingState v-if="aCarregar && !todas.length" />
        <ErrorState v-else-if="erro" :mensagem="erro" @tentar="carregarTodas" />
        <template v-else>
          <div v-if="secao === 'geral'" class="stats">
            <StatCard v-for="c in cartoes" :key="c.t" :titulo="c.t" :valor="c.v" :icone="c.i" :cor="c.c" />
          </div>
          <h2 class="tit">{{ tituloSecao }} <span class="muted small">({{ daSecao.length }})</span></h2>
          <AdminIncidentTable :denuncias="daSecao" :ver-identidade-anonima="admin" @abrir="(id) => router.push(`/admin/denuncias/${id}`)" />
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
.layout { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr); }
.layout > * { min-width: 0; }
@media (min-width: 960px) { .layout { grid-template-columns: 250px minmax(0, 1fr); align-items: start; } }
.conteudo { min-width: 0; }
.stats { display: grid; gap: 12px; grid-template-columns: 1fr 1fr; margin-bottom: 24px; }
@media (min-width: 1100px) { .stats { grid-template-columns: repeat(4, 1fr); } }
.stats :deep(.num) { font-size: 1.5rem; }
.stats :deep(.stat) { padding: 14px; }
.stats :deep(.ico) { width: 38px; height: 38px; }
.tit { font-size: 1.2rem; }
</style>
