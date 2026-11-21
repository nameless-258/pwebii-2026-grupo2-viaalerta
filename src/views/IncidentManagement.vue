<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import L from 'leaflet'
import { useAdmin } from '@/composables/useAdmin'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { TRANSICOES, ACOES, estadoInfo } from '@/constants/estados'
import { formatarDataHora } from '@/composables/useFormat'
import { criarIconePin } from '@/components/map/MapPin.vue'
import CategoryBadge from '@/components/incidents/CategoryBadge.vue'
import StatusBadge from '@/components/incidents/StatusBadge.vue'
import IncidentTimeline from '@/components/incidents/IncidentTimeline.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const props = defineProps({ id: { type: String, required: true } })
const { obter, historico, mensagens, alterarEstado } = useAdmin()
const { admin } = useAuth()
const toast = useToast()

const d = ref(null)
const hist = ref([])
const msgs = ref([])
const aCarregar = ref(true)
const erro = ref(null)
const verIdentidade = ref(false)
const elMapa = ref(null)
let mapa = null

const acao = ref(null) // estado de destino em confirmação
const aProcessar = ref(false)

async function carregar() {
  aCarregar.value = true
  erro.value = null
  try {
    const [den, h, m] = await Promise.all([obter(props.id), historico(props.id), mensagens(props.id)])
    d.value = den
    hist.value = h
    msgs.value = m
  } catch (e) {
    erro.value = e.message
  } finally {
    aCarregar.value = false
  }
  await nextTick()
  if (d.value && elMapa.value) {
    mapa?.remove()
    mapa = L.map(elMapa.value, { scrollWheelZoom: false }).setView([d.value.lat, d.value.lng], 16)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(mapa)
    L.marker([d.value.lat, d.value.lng], { icon: criarIconePin(d.value.categoria) }).addTo(mapa)
  }
}
onMounted(carregar)
onBeforeUnmount(() => mapa?.remove())

const possiveis = computed(() => (d.value ? TRANSICOES[d.value.estado] || [] : []))
const podeVerIdentidade = computed(() => d.value && (!d.value.anonima || admin.value))

const CONFIG = {
  em_analise: { msg: 'A denúncia passa para «Em análise».', perigo: false },
  precisa_info: { msg: 'O cidadão é avisado (notificação e email) de que faltam dados na denúncia e pode responder em «Minhas denúncias».', perigo: false, nota: true, obrigatoria: true, rotulo: 'Que dados faltam? (mensagem enviada ao cidadão)' },
  publicada: { msg: 'A denúncia é publicada automaticamente: passa a aparecer no mapa, nas listas e nas estatísticas públicas.', perigo: false, nota: true },
  rejeitada: { msg: 'A denúncia não será publicada. Indique o motivo, que será enviado ao cidadão.', perigo: true, nota: true, obrigatoria: true, rotulo: 'Motivo da rejeição' },
  em_resolucao: { msg: 'O problema passa a estar «Em resolução». O pin continua visível no mapa.', perigo: false, nota: true },
  resolvida: { msg: 'O pin desaparece imediatamente do mapa público. O registo e o histórico ficam guardados.', perigo: false, nota: true }
}

async function confirmar(nota) {
  aProcessar.value = true
  try {
    const email = await alterarEstado(d.value, acao.value, nota)
    toast.sucesso(`Estado alterado para «${estadoInfo(acao.value).nome}».` + (email === 'enviado' ? ' O cidadão foi avisado por email.' : email === 'simulado' ? ' (Email simulado.)' : ''))
    acao.value = null
    await carregar()
  } catch (e) {
    toast.erro(e.message)
  } finally {
    aProcessar.value = false
  }
}
const corBotao = (e) => (e === 'rejeitada' ? 'btn-danger' : e === 'precisa_info' ? 'btn-warning' : e === 'em_analise' ? 'btn-outline' : 'btn-primary')
</script>

<template>
  <section class="container page">
    <RouterLink to="/admin" class="voltar"><AppIcon name="seta_esq" :size="18" /> Painel administrativo</RouterLink>
    <LoadingState v-if="aCarregar && !d" />
    <ErrorState v-else-if="erro" :mensagem="erro" @tentar="carregar" />
    <EmptyState v-else-if="!d" titulo="Denúncia não encontrada" icone="pesquisa" />

    <div v-else class="grelha">
      <div class="col">
        <div class="card">
          <div class="row">
            <span class="badge ref">{{ d.referencia }}</span>
            <StatusBadge :estado="d.estado" />
            <CategoryBadge :categoria="d.categoria" />
          </div>
          <h1 class="titulo">{{ d.titulo }}</h1>
          <p class="descricao">{{ d.descricao }}</p>
          <img v-if="d.fotoUrl" :src="d.fotoUrl" alt="Fotografia enviada pelo cidadão" class="foto" />
          <p v-else class="muted small">Sem fotografia.</p>
        </div>

        <div class="card">
          <h3>Acções de moderação</h3>
          <p class="small muted">O responsável não altera o conteúdo da denúncia: verifica-a, publica-a, muda o estado ou avisa o cidadão de que faltam dados.</p>
          <p v-if="!possiveis.length" class="muted small">Não há mais acções possíveis para este estado.</p>
          <div class="acoes">
            <button v-for="e in possiveis" :key="e" class="btn" :class="corBotao(e)" type="button" @click="acao = e">{{ ACOES[e] }}</button>
          </div>
          <p class="small muted mt">Todas as decisões ficam registadas com o responsável e a data.</p>
        </div>

        <div class="card">
          <h3>Mensagens com o cidadão</h3>
          <p v-if="!msgs.length" class="small muted">Sem mensagens.</p>
          <ul class="msgs">
            <li v-for="m in msgs" :key="m.id" :class="{ staff: m.deStaff }">
              <span class="small autor">{{ m.deStaff ? 'Responsável' : 'Cidadão' }} · {{ formatarDataHora(m.criadoEm) }}</span>
              {{ m.mensagem }}
            </li>
          </ul>
        </div>
      </div>

      <aside class="col">
        <div class="card">
          <h3>Localização</h3>
          <p class="small">{{ d.localidade }}, {{ d.distrito }}, {{ d.provincia }}<br /><span class="muted">{{ d.lat }}, {{ d.lng }}</span></p>
          <div ref="elMapa" class="mini-mapa"></div>
        </div>
        <div class="card">
          <h3>Dados internos</h3>
          <dl class="dados">
            <dt>Submetida</dt><dd>{{ formatarDataHora(d.criadoEm) }}</dd>
            <dt>Última alteração</dt><dd>{{ formatarDataHora(d.atualizadoEm) }}</dd>
            <dt>Anónima</dt><dd>{{ d.anonima ? 'Sim' : 'Não' }}</dd>
            <dt>Denunciante</dt>
            <dd>
              <template v-if="!podeVerIdentidade"><span class="muted">Oculto (denúncia anónima)</span></template>
              <template v-else-if="!verIdentidade"><button class="btn btn-outline btn-sm" type="button" @click="verIdentidade = true"><AppIcon name="olho" :size="15" /> Mostrar (uso interno)</button></template>
              <template v-else>{{ d.autor?.nome }}<br /><span class="small muted">{{ d.autor?.email }}</span></template>
            </dd>
          </dl>
        </div>
        <div class="card">
          <h3>Histórico de acções</h3>
          <IncidentTimeline :eventos="hist" mostrar-notas />
        </div>
      </aside>
    </div>

    <ConfirmDialog
      :aberto="!!acao"
      :titulo="acao ? ACOES[acao] : ''"
      :mensagem="acao ? CONFIG[acao].msg : ''"
      :texto-confirmar="acao ? ACOES[acao] : 'Confirmar'"
      :perigo="acao ? CONFIG[acao].perigo : false"
      :com-nota="acao ? !!CONFIG[acao].nota : false"
      :nota-obrigatoria="acao ? !!CONFIG[acao].obrigatoria : false"
      :rotulo-nota="acao && CONFIG[acao].rotulo ? CONFIG[acao].rotulo : 'Nota (opcional, visível para o cidadão)'"
      :a-carregar="aProcessar"
      @confirmar="confirmar"
      @cancelar="acao = null"
    />
  </section>
</template>

<style scoped>
.voltar { display: inline-flex; align-items: center; gap: 4px; margin-bottom: 16px; font-weight: 500; }
.grelha { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr); }
@media (min-width: 960px) { .grelha { grid-template-columns: 1.5fr 1fr; } }
.col { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.ref { font-family: ui-monospace, Menlo, monospace; }
.titulo { font-size: 1.5rem; margin: 12px 0 8px; }
.descricao { white-space: pre-line; }
.foto { width: 100%; max-height: 420px; object-fit: cover; border-radius: 10px; }
.acoes { display: flex; flex-wrap: wrap; gap: 8px; }
.mt { margin: 12px 0 0; }
.mini-mapa { height: 220px; border-radius: 10px; z-index: 0; }
.dados { display: grid; grid-template-columns: auto 1fr; gap: 8px 14px; margin: 0; font-size: 0.9rem; }
.dados dt { color: var(--text-muted); }
.dados dd { margin: 0; }
.msgs { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.msgs li { padding: 10px 12px; border-radius: 10px; background: var(--surface-2); font-size: 0.92rem; display: flex; flex-direction: column; gap: 4px; }
.msgs li.staff { background: var(--primary-soft); }
.autor { color: var(--text-muted); font-weight: 600; }
</style>
