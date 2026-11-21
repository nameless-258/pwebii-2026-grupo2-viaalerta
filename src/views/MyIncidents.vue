<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useMinhasDenuncias } from '@/composables/useIncidents'
import { useToast } from '@/composables/useToast'
import { formatarData, formatarDataHora } from '@/composables/useFormat'
import { ESTADOS_PUBLICOS } from '@/constants/estados'
import CategoryBadge from '@/components/incidents/CategoryBadge.vue'
import StatusBadge from '@/components/incidents/StatusBadge.vue'
import IncidentTimeline from '@/components/incidents/IncidentTimeline.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const { minhas, aCarregar, erro, carregar, detalhesDe, responder } = useMinhasDenuncias()
const toast = useToast()

const aberta = ref(null)
const detalhes = reactive({}) // id -> { historico, mensagens }
const resposta = ref('')
const erroResposta = ref('')
const aResponder = ref(false)

onMounted(carregar)

const resumo = computed(() => ({
  total: minhas.value.length,
  analise: minhas.value.filter((d) => ['pendente', 'em_analise', 'precisa_info'].includes(d.estado)).length,
  publicas: minhas.value.filter((d) => ESTADOS_PUBLICOS.includes(d.estado)).length,
  resolvidas: minhas.value.filter((d) => d.estado === 'resolvida').length
}))

async function alternar(d) {
  if (aberta.value === d.id) { aberta.value = null; return }
  aberta.value = d.id
  resposta.value = ''
  erroResposta.value = ''
  try {
    detalhes[d.id] = await detalhesDe(d.id)
  } catch (e) {
    toast.erro(e.message)
  }
}

async function enviarResposta(d) {
  if (resposta.value.trim().length < 10) { erroResposta.value = 'Escreva pelo menos 10 caracteres.'; return }
  aResponder.value = true
  try {
    await responder(d.id, resposta.value.trim())
    toast.sucesso('Resposta enviada. A denúncia voltou para análise.')
    resposta.value = ''
    detalhes[d.id] = await detalhesDe(d.id)
  } catch (e) {
    toast.erro(e.message)
  } finally {
    aResponder.value = false
  }
}
</script>

<template>
  <section class="container page">
    <header class="page-header section-title">
      <div>
        <h1>Minhas denúncias</h1>
        <p>Acompanhe o estado das denúncias que submeteu, incluindo as anónimas.</p>
      </div>
      <RouterLink to="/denunciar" class="btn btn-primary"><AppIcon name="mais" :size="18" /> Nova denúncia</RouterLink>
    </header>

    <div class="resumo">
      <div class="card-flat"><strong>{{ resumo.total }}</strong><span>Total</span></div>
      <div class="card-flat"><strong>{{ resumo.analise }}</strong><span>Em verificação</span></div>
      <div class="card-flat"><strong>{{ resumo.publicas }}</strong><span>Públicas</span></div>
      <div class="card-flat"><strong>{{ resumo.resolvidas }}</strong><span>Resolvidas</span></div>
    </div>

    <LoadingState v-if="aCarregar" />
    <ErrorState v-else-if="erro" :mensagem="erro" @tentar="carregar" />
    <EmptyState v-else-if="!minhas.length" titulo="Ainda não fez nenhuma denúncia" mensagem="Viu um buraco, um candeeiro avariado ou um passeio partido? Denuncie e acompanhe aqui." icone="pin">
      <RouterLink to="/denunciar" class="btn btn-primary">Fazer a primeira denúncia</RouterLink>
    </EmptyState>

    <ul v-else class="lista">
      <li v-for="d in minhas" :key="d.id" class="card item" :class="{ alerta: d.estado === 'precisa_info' }">
        <button class="cab" type="button" :aria-expanded="aberta === d.id" @click="alternar(d)">
          <img v-if="d.fotoUrl" :src="d.fotoUrl" alt="" class="mini" loading="lazy" />
          <div class="info">
            <div class="row">
              <span class="ref">{{ d.referencia }}</span>
              <StatusBadge :estado="d.estado" />
              <span v-if="d.anonima" class="badge"><AppIcon name="escudo" :size="12" /> Anónima</span>
            </div>
            <strong class="titulo">{{ d.titulo }}</strong>
            <span class="small muted">{{ d.localidade }}, {{ d.distrito }} · {{ formatarData(d.criadoEm) }}</span>
          </div>
          <AppIcon :name="aberta === d.id ? 'baixo' : 'seta_dir'" class="seta" />
        </button>

        <div v-if="d.estado === 'precisa_info' && aberta !== d.id" class="aviso small">
          <AppIcon name="alerta" :size="15" /> Faltam dados nesta denúncia. Abra-a para ver o que falta e responder.
        </div>

        <div v-if="aberta === d.id" class="corpo">
          <CategoryBadge :categoria="d.categoria" />
          <p class="descricao">{{ d.descricao }}</p>
          <RouterLink v-if="['publicada', 'em_resolucao'].includes(d.estado)" :to="`/denuncias/${d.id}`" class="btn btn-outline btn-sm">Ver página pública</RouterLink>

          <LoadingState v-if="!detalhes[d.id]" compacto />
          <div v-else class="duas">
            <div>
              <h3>Histórico</h3>
              <IncidentTimeline :eventos="detalhes[d.id].historico" mostrar-notas />
            </div>
            <div>
              <h3>Comentários dos responsáveis</h3>
              <p v-if="!detalhes[d.id].mensagens.length" class="small muted">Ainda não há comentários.</p>
              <ul class="msgs">
                <li v-for="m in detalhes[d.id].mensagens" :key="m.id" :class="{ staff: m.deStaff }">
                  <span class="small autor">{{ m.deStaff ? 'Responsável ViaAlerta' : 'Você' }} · {{ formatarDataHora(m.criadoEm) }}</span>
                  {{ m.mensagem }}
                </li>
              </ul>
              <form v-if="d.estado === 'precisa_info'" class="responder" novalidate @submit.prevent="enviarResposta(d)">
                <div class="field">
                  <label :for="`resp-${d.id}`">Enviar os dados em falta</label>
                  <textarea :id="`resp-${d.id}`" v-model="resposta" class="textarea" :class="{ invalid: erroResposta }" rows="3"></textarea>
                  <span v-if="erroResposta" class="error">{{ erroResposta }}</span>
                </div>
                <button class="btn btn-primary btn-sm" type="submit" :disabled="aResponder"><AppIcon name="enviar" :size="15" /> {{ aResponder ? 'A enviar…' : 'Enviar resposta' }}</button>
              </form>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.resumo { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 18px; }
@media (min-width: 700px) { .resumo { grid-template-columns: repeat(4, 1fr); } }
.resumo div { display: flex; flex-direction: column; }
.resumo strong { font-size: 1.5rem; }
.resumo span { font-size: 0.82rem; color: var(--text-muted); }
.lista { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
.item { padding: 0; overflow: hidden; }
.item.alerta { border-color: var(--yellow); }
.cab { width: 100%; display: flex; gap: 12px; align-items: center; padding: 14px; background: none; border: none; cursor: pointer; text-align: left; }
.mini { width: 64px; height: 64px; border-radius: 10px; object-fit: cover; flex-shrink: 0; }
.info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.info .row { gap: 6px; }
.ref { font-family: ui-monospace, Menlo, monospace; font-size: 0.8rem; color: var(--text-muted); }
.titulo { overflow: hidden; text-overflow: ellipsis; }
.seta { color: var(--text-muted); }
.aviso { display: flex; gap: 6px; align-items: center; padding: 8px 14px; background: var(--yellow-soft); }
.corpo { padding: 0 16px 16px; border-top: 1px solid var(--border); padding-top: 14px; }
.descricao { margin: 10px 0; white-space: pre-line; }
.duas { display: grid; gap: 20px; margin-top: 16px; grid-template-columns: 1fr; }
@media (min-width: 800px) { .duas { grid-template-columns: 1fr 1fr; } }
.msgs { list-style: none; padding: 0; margin: 0 0 12px; display: flex; flex-direction: column; gap: 8px; }
.msgs li { padding: 10px 12px; border-radius: 10px; background: var(--surface-2); font-size: 0.92rem; display: flex; flex-direction: column; gap: 4px; }
.msgs li.staff { background: var(--primary-soft); }
.autor { color: var(--text-muted); font-weight: 600; }
</style>
