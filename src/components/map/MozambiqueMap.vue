<script setup>
// Mapa interactivo de Moçambique (Leaflet + OpenStreetMap).
// - Pins criados a partir das coordenadas reais das denúncias recebidas por props;
// - Cor e ícone por categoria (iguais na legenda);
// - Popups com o componente IncidentPopup;
// - Limites provinciais do GeoJSON público; zoom e movimento livres.
import { ref, onMounted, onBeforeUnmount, watch, createApp, h } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import { criarIconePin } from './MapPin.vue'
import MapPin from './MapPin.vue'
import IncidentPopup from './IncidentPopup.vue'
import { categoriasAtivas } from '@/constants/categorias'
import { useMozambiqueData } from '@/composables/useMozambiqueData'

const props = defineProps({
  denuncias: { type: Array, default: () => [] },
  provinciaFoco: { type: String, default: '' },
  localFoco: { type: Object, default: null }, // { lat, lng, caixa? }
  altura: { type: String, default: '520px' },
  mostrarLegenda: { type: Boolean, default: true }
})
const emit = defineEmits(['ver-detalhes'])

const router = useRouter()
const { carregarProvincias, limitesDe } = useMozambiqueData()

const el = ref(null)
const legendaAberta = ref(true)
let mapa = null
let camadaPins = null
let camadaLimites = null
let marcadorLocal = null
const marcadores = new Map()
const popupsMontados = []
const LIMITES_MZ = L.latLngBounds([-26.95, 30.1], [-10.3, 41.0])

function montarPopup(d) {
  const div = document.createElement('div')
  const app = createApp({
    render: () => h(IncidentPopup, { denuncia: d, onVerDetalhes: (id) => { emit('ver-detalhes', id); router.push(`/denuncias/${id}`) } })
  })
  app.mount(div)
  popupsMontados.push(app)
  return div
}

function desenharPins() {
  if (!mapa) return
  camadaPins.clearLayers()
  marcadores.clear()
  popupsMontados.splice(0).forEach((a) => a.unmount())
  for (const d of props.denuncias) {
    if (!Number.isFinite(d.lat) || !Number.isFinite(d.lng)) continue
    const m = L.marker([d.lat, d.lng], { icon: criarIconePin(d.categoria), title: d.titulo, alt: d.titulo })
    // Popup montado só quando é aberto (poupa memória com muitos pins)
    m.bindPopup(() => montarPopup(d), { maxWidth: 280, minWidth: 260, autoPanPadding: [20, 80] })
    m.addTo(camadaPins)
    marcadores.set(d.id, m)
  }
}

function focarProvincia(nome) {
  if (!mapa) return
  const f = nome ? limitesDe(nome) : null
  if (f) mapa.flyToBounds(L.geoJSON(f).getBounds(), { padding: [20, 20], duration: 0.8 })
  else mapa.flyToBounds(LIMITES_MZ, { duration: 0.8 })
  camadaLimites?.setStyle((feat) => estiloProvincia(feat, nome))
}

function estiloProvincia(feat, foco = props.provinciaFoco) {
  const ativo = foco && feat.properties.nome === foco
  return { color: ativo ? '#0B8A4E' : '#5b6b64', weight: ativo ? 2.5 : 1, fillColor: '#0B8A4E', fillOpacity: ativo ? 0.08 : 0.02, dashArray: ativo ? null : '4 4' }
}

// Usado pela página-pai: abre o popup de uma denúncia
function focarDenuncia(d) {
  const m = marcadores.get(d.id)
  if (!mapa || !m) return
  mapa.flyTo([d.lat, d.lng], 15, { duration: 0.8 })
  mapa.once('moveend', () => m.openPopup())
}
defineExpose({ focarDenuncia })

onMounted(async () => {
  mapa = L.map(el.value, { zoomControl: true, minZoom: 4, zoomSnap: 0.25, maxBounds: LIMITES_MZ.pad(0.5), worldCopyJump: false })
  mapa.fitBounds(LIMITES_MZ, { padding: [8, 8] })
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · Limites: Natural Earth'
  }).addTo(mapa)
  camadaPins = L.layerGroup().addTo(mapa)
  desenharPins()
  const g = await carregarProvincias()
  if (g && mapa) {
    camadaLimites = L.geoJSON(g, {
      style: (f) => estiloProvincia(f),
      interactive: false
    }).addTo(mapa)
    camadaLimites.bringToBack()
    if (props.provinciaFoco) focarProvincia(props.provinciaFoco)
  }
})

watch(() => props.denuncias, desenharPins)
watch(() => props.provinciaFoco, focarProvincia)
watch(() => props.localFoco, (l) => {
  if (!mapa || !l) return
  if (l.caixa) mapa.flyToBounds([[l.caixa[0], l.caixa[2]], [l.caixa[1], l.caixa[3]]], { maxZoom: 16, duration: 0.8 })
  else mapa.flyTo([l.lat, l.lng], 15)
  marcadorLocal?.remove()
  marcadorLocal = L.circleMarker([l.lat, l.lng], { radius: 9, color: '#2a5bd7', weight: 3, fillOpacity: 0.25 }).addTo(mapa).bindTooltip(l.nome || 'Local pesquisado')
})

onBeforeUnmount(() => {
  popupsMontados.forEach((a) => a.unmount())
  mapa?.remove()
  mapa = null
})
</script>

<template>
  <div class="mapa-wrap" :style="{ height: altura }">
    <div ref="el" class="mapa" role="region" aria-label="Mapa de Moçambique com as denúncias publicadas"></div>
    <div v-if="mostrarLegenda" class="legenda card" :class="{ fechada: !legendaAberta }">
      <button class="leg-cab" type="button" :aria-expanded="legendaAberta" @click="legendaAberta = !legendaAberta">
        <strong>Legenda</strong><span>{{ legendaAberta ? '−' : '+' }}</span>
      </button>
      <ul v-show="legendaAberta">
        <li v-for="c in categoriasAtivas()" :key="c.id"><MapPin :categoria="c.id" :tamanho="22" /> {{ c.nome }}</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.mapa-wrap { position: relative; border-radius: 14px; overflow: hidden; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
.mapa { width: 100%; height: 100%; z-index: 0; }
.legenda { position: absolute; z-index: 500; left: 10px; bottom: 26px; padding: 8px 10px; max-width: 240px; font-size: 0.8rem; box-shadow: var(--shadow); }
.leg-cab { display: flex; justify-content: space-between; width: 100%; background: none; border: none; cursor: pointer; padding: 0; gap: 16px; font-size: 0.82rem; }
.legenda ul { list-style: none; margin: 8px 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.legenda li { display: flex; align-items: center; gap: 8px; }
</style>
