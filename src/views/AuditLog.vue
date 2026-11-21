<script setup>
// Registo de auditoria: todas as acções de moderação e de administração (apenas administradores)
import { ref, computed, onMounted } from 'vue'
import { useAdmin } from '@/composables/useAdmin'
import { formatarDataHora } from '@/composables/useFormat'
import { estadoInfo } from '@/constants/estados'
import { FUNCOES } from '@/constants/funcoes'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const { listarAuditoria } = useAdmin()
const registos = ref([])
const aCarregar = ref(true)
const erro = ref(null)
const filtroAcao = ref('')
const pesquisa = ref('')

const ACOES = {
  alterar_estado: { nome: 'Mudança de estado', icone: 'atualizar', cor: 'var(--blue)' },
  criar_responsavel: { nome: 'Conta de responsável criada', icone: 'utilizadores', cor: 'var(--primary)' },
  alterar_funcao: { nome: 'Função alterada', icone: 'escudo', cor: '#b35c00' },
  desactivar_conta: { nome: 'Conta desactivada', icone: 'fechar', cor: 'var(--red)' },
  activar_conta: { nome: 'Conta reactivada', icone: 'check', cor: 'var(--primary)' },
  criar_categoria: { nome: 'Categoria criada', icone: 'mais', cor: 'var(--primary)' },
  editar_categoria: { nome: 'Categoria editada', icone: 'filtro', cor: '#b35c00' },
  alterar_regras: { nome: 'Regras do sistema alteradas', icone: 'painel', cor: '#b35c00' }
}
const info = (a) => ACOES[a] || { nome: a, icone: 'info', cor: 'var(--text-muted)' }

async function carregar() {
  aCarregar.value = true
  erro.value = null
  try {
    registos.value = await listarAuditoria()
  } catch (e) {
    erro.value = e.message
  } finally {
    aCarregar.value = false
  }
}
onMounted(carregar)

const lista = computed(() => {
  const t = pesquisa.value.trim().toLowerCase()
  return registos.value.filter((r) => (!filtroAcao.value || r.acao === filtroAcao.value) && (!t || `${r.actor} ${r.alvo} ${JSON.stringify(r.detalhes)}`.toLowerCase().includes(t)))
})

function descrever(r) {
  const d = r.detalhes || {}
  switch (r.acao) {
    case 'alterar_estado': return `${r.alvo}: ${estadoInfo(d.de).nome} → ${estadoInfo(d.para).nome}${d.nota ? ` («${d.nota}»)` : ''}`
    case 'alterar_funcao': return `${r.alvo}: ${FUNCOES[d.de] || d.de} → ${FUNCOES[d.para] || d.para}`
    case 'criar_responsavel':
    case 'desactivar_conta':
    case 'activar_conta': return r.alvo
    case 'criar_categoria':
    case 'editar_categoria': return `${d.nome || r.alvo} (${d.ativa === false ? 'desactivada' : 'activa'})`
    case 'alterar_regras': return `Foto obrigatória: ${d.foto_obrigatoria ?? d.fotoObrigatoria ? 'sim' : 'não'} · Anónimas: ${d.permitir_anonimas ?? d.permitirAnonimas ? 'sim' : 'não'} · Descrição mín.: ${d.descricao_min ?? d.descricaoMin} · Foto máx.: ${d.foto_max_mb ?? d.fotoMaxMb} MB`
    default: return r.alvo || ''
  }
}
</script>

<template>
  <section class="container page">
    <RouterLink to="/admin" class="voltar"><AppIcon name="seta_esq" :size="18" /> Painel administrativo</RouterLink>
    <header class="page-header section-title">
      <div>
        <h1>Registo de auditoria</h1>
        <p>Quem fez o quê e quando: moderação de denúncias, contas, funções, categorias e regras.</p>
      </div>
      <button class="btn btn-outline btn-sm" type="button" :disabled="aCarregar" @click="carregar"><AppIcon name="atualizar" :size="16" /> Actualizar</button>
    </header>

    <div class="filtros">
      <input v-model="pesquisa" class="input" type="search" placeholder="Pesquisar por pessoa, referência ou detalhe…" aria-label="Pesquisar no registo" />
      <select v-model="filtroAcao" class="select" aria-label="Tipo de acção">
        <option value="">Todas as acções</option>
        <option v-for="(a, k) in ACOES" :key="k" :value="k">{{ a.nome }}</option>
      </select>
    </div>

    <LoadingState v-if="aCarregar" />
    <ErrorState v-else-if="erro" :mensagem="erro" @tentar="carregar" />
    <EmptyState v-else-if="!lista.length" titulo="Sem registos" mensagem="Ainda não há acções registadas com estes critérios." icone="lista" />
    <ul v-else class="registos">
      <li v-for="r in lista" :key="r.id" class="card">
        <span class="ico" :style="{ color: info(r.acao).cor }"><AppIcon :name="info(r.acao).icone" :size="18" /></span>
        <div class="corpo">
          <strong>{{ info(r.acao).nome }}</strong>
          <span class="desc">{{ descrever(r) }}</span>
          <span class="small muted">{{ r.actor }} · {{ formatarDataHora(r.criadoEm) }}</span>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.voltar { display: inline-flex; align-items: center; gap: 4px; margin-bottom: 16px; font-weight: 500; }
.filtros { display: grid; gap: 10px; grid-template-columns: 1fr; margin-bottom: 16px; }
@media (min-width: 700px) { .filtros { grid-template-columns: 2fr 1fr; } }
.registos { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.registos li { display: flex; gap: 12px; align-items: flex-start; padding: 12px 14px; }
.ico { width: 36px; height: 36px; border-radius: 10px; background: var(--surface-2); display: grid; place-items: center; flex-shrink: 0; }
.corpo { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.desc { font-size: 0.92rem; overflow-wrap: anywhere; }
</style>
