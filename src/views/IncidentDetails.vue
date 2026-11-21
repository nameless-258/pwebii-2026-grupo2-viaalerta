<script setup>
import { watch, onMounted, onBeforeUnmount, ref, nextTick } from 'vue'
import L from 'leaflet'
import { useDenunciaPublica } from '@/composables/useIncidents'
import { categoriaPorId } from '@/constants/categorias'
import { formatarData } from '@/composables/useFormat'
import CategoryBadge from '@/components/incidents/CategoryBadge.vue'
import StatusBadge from '@/components/incidents/StatusBadge.vue'
import IncidentTimeline from '@/components/incidents/IncidentTimeline.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import { criarIconePin } from '@/components/map/MapPin.vue'

const props = defineProps({ id: { type: String, required: true } })
const { denuncia, historico, aCarregar, erro, carregar } = useDenunciaPublica()
const elMapa = ref(null)
let mapa = null

async function desenharMapa() {
  await nextTick()
  if (!denuncia.value || !elMapa.value) return
  mapa?.remove()
  const { lat, lng, categoria } = denuncia.value
  mapa = L.map(elMapa.value, { scrollWheelZoom: false }).setView([lat, lng], 16)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(mapa)
  L.marker([lat, lng], { icon: criarIconePin(categoria) }).addTo(mapa)
}

watch(() => props.id, async (id) => { await carregar(id); desenharMapa() })
onMounted(async () => { await carregar(props.id); desenharMapa() })
onBeforeUnmount(() => mapa?.remove())

async function partilhar() {
  const url = window.location.href
  if (navigator.share) {
    try { await navigator.share({ title: denuncia.value.titulo, url }) } catch { /* cancelado */ }
  } else {
    await navigator.clipboard?.writeText(url)
    alertaCopiado.value = true
    setTimeout(() => (alertaCopiado.value = false), 2000)
  }
}
const alertaCopiado = ref(false)
</script>

<template>
  <section class="container page">
    <RouterLink to="/denuncias" class="voltar"><AppIcon name="seta_esq" :size="18" /> Voltar às denúncias</RouterLink>

    <LoadingState v-if="aCarregar" mensagem="A carregar denúncia…" />
    <ErrorState v-else-if="erro" :mensagem="erro" @tentar="carregar(id)" />
    <EmptyState v-else-if="!denuncia" titulo="Denúncia não disponível" mensagem="Esta denúncia não existe, ainda não foi publicada ou já foi resolvida." icone="mapa">
      <RouterLink to="/denuncias" class="btn btn-primary">Explorar denúncias</RouterLink>
    </EmptyState>

    <div v-else class="detalhe">
      <div class="principal">
        <div class="foto card" :style="{ borderTopColor: categoriaPorId(denuncia.categoria).cor }">
          <img v-if="denuncia.fotoUrl" :src="denuncia.fotoUrl" :alt="`Fotografia: ${denuncia.titulo}`" />
          <div v-else class="sem-foto"><AppIcon name="camera" :size="40" /></div>
        </div>
        <div class="card">
          <div class="row">
            <CategoryBadge :categoria="denuncia.categoria" />
            <StatusBadge :estado="denuncia.estado" />
            <span class="badge">{{ denuncia.referencia }}</span>
          </div>
          <h1 class="titulo">{{ denuncia.titulo }}</h1>
          <p class="descricao">{{ denuncia.descricao }}</p>
          <dl class="dados">
            <div><dt>Província</dt><dd>{{ denuncia.provincia }}</dd></div>
            <div><dt>Distrito</dt><dd>{{ denuncia.distrito }}</dd></div>
            <div><dt>Localidade</dt><dd>{{ denuncia.localidade }}</dd></div>
            <div><dt>Data da denúncia</dt><dd>{{ formatarData(denuncia.criadoEm) }}</dd></div>
          </dl>
          <p class="small muted privado"><AppIcon name="escudo" :size="15" /> A identidade de quem denunciou não é apresentada publicamente.</p>
          <button class="btn btn-outline btn-sm" type="button" @click="partilhar"><AppIcon name="enviar" :size="15" /> {{ alertaCopiado ? 'Link copiado!' : 'Partilhar' }}</button>
        </div>
      </div>
      <aside class="lateral">
        <div class="card">
          <h3>Localização exacta</h3>
          <div ref="elMapa" class="mini-mapa"></div>
          <p class="small muted coords">{{ denuncia.lat.toFixed(5) }}, {{ denuncia.lng.toFixed(5) }}</p>
        </div>
        <div class="card">
          <h3>Histórico</h3>
          <IncidentTimeline :eventos="historico" />
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.voltar { display: inline-flex; align-items: center; gap: 4px; margin-bottom: 16px; font-weight: 500; }
.detalhe { display: grid; gap: 16px; grid-template-columns: 1fr; }
@media (min-width: 960px) { .detalhe { grid-template-columns: 1.6fr 1fr; } }
.principal, .lateral { display: flex; flex-direction: column; gap: 16px; }
.foto { padding: 0; overflow: hidden; border-top: 4px solid; }
.foto img { width: 100%; max-height: 460px; object-fit: cover; }
.sem-foto { height: 220px; display: grid; place-items: center; color: var(--text-soft); }
.titulo { margin: 14px 0 10px; font-size: clamp(1.4rem, 3vw, 1.9rem); }
.descricao { white-space: pre-line; }
.dados { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 0 0 16px; }
.dados dt { font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
.dados dd { margin: 2px 0 0; font-weight: 600; }
.privado { display: flex; gap: 6px; align-items: center; }
.mini-mapa { height: 240px; border-radius: 10px; z-index: 0; }
.coords { margin: 8px 0 0; }
</style>
