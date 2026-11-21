<script setup>
// Selecção da localização: clicar no mapa, arrastar o marcador ou usar o GPS do telemóvel.
// A província é detectada com o GeoJSON oficial de limites e o resto do endereço com o Nominatim (OpenStreetMap).
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import L from 'leaflet'
import AppIcon from '@/components/common/AppIcon.vue'
import { useMozambiqueData } from '@/composables/useMozambiqueData'

const props = defineProps({
  modelValue: { type: Object, default: null }, // { lat, lng }
  erro: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue', 'endereco', 'erro'])

const { carregarProvincias, provinciaDoPonto, geocodificarInverso } = useMozambiqueData()
const el = ref(null)
const aLocalizar = ref(false)
const aObterEndereco = ref(false)
let mapa = null
let marcador = null

const icone = L.divIcon({
  className: 'va-pin',
  html: '<div class="picker-pin"></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 28]
})

async function definir(lat, lng, centrar = false) {
  const prov = provinciaDoPonto(lat, lng)
  if (!prov) {
    emit('erro', 'O ponto escolhido fica fora de Moçambique. Escolha uma localização dentro do país.')
    return
  }
  emit('erro', '')
  const pos = { lat: +lat.toFixed(6), lng: +lng.toFixed(6) }
  emit('update:modelValue', pos)
  colocarMarcador(pos, centrar)
  emit('endereco', { provincia: prov })
  aObterEndereco.value = true
  const end = await geocodificarInverso(lat, lng)
  aObterEndereco.value = false
  if (end) emit('endereco', { provincia: prov, ...end })
}

function colocarMarcador(pos, centrar) {
  if (!mapa) return
  if (!marcador) {
    marcador = L.marker([pos.lat, pos.lng], { icon: icone, draggable: true }).addTo(mapa)
    marcador.on('dragend', () => { const p = marcador.getLatLng(); definir(p.lat, p.lng) })
  } else {
    marcador.setLatLng([pos.lat, pos.lng])
  }
  if (centrar) mapa.setView([pos.lat, pos.lng], 16)
}

function usarGps() {
  if (!navigator.geolocation) { emit('erro', 'O seu navegador não suporta geolocalização.'); return }
  aLocalizar.value = true
  navigator.geolocation.getCurrentPosition(
    (p) => { aLocalizar.value = false; definir(p.coords.latitude, p.coords.longitude, true) },
    () => { aLocalizar.value = false; emit('erro', 'Não foi possível obter a sua localização. Marque o ponto no mapa.') },
    { enableHighAccuracy: true, timeout: 12000 }
  )
}

onMounted(async () => {
  mapa = L.map(el.value, { zoomControl: true }).setView([-18.7, 35.5], 5)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(mapa)
  mapa.on('click', (e) => definir(e.latlng.lat, e.latlng.lng))
  await carregarProvincias()
  if (props.modelValue) colocarMarcador(props.modelValue, true)
})

watch(() => props.modelValue, (v) => { if (v && marcador) marcador.setLatLng([v.lat, v.lng]) })

onBeforeUnmount(() => { mapa?.remove(); mapa = null })
</script>

<template>
  <div class="picker">
    <div class="topo">
      <button class="btn btn-outline btn-sm" type="button" :disabled="aLocalizar" @click="usarGps">
        <AppIcon name="alvo" :size="16" /> {{ aLocalizar ? 'A localizar…' : 'Usar a minha localização' }}
      </button>
      <span class="small muted">ou toque no mapa para marcar o local exacto</span>
    </div>
    <div ref="el" class="mapa" :class="{ invalido: erro }"></div>
    <p class="small muted coord">
      <template v-if="modelValue">
        <AppIcon name="pin" :size="14" /> {{ modelValue.lat }}, {{ modelValue.lng }}
        <span v-if="aObterEndereco"> · a obter endereço…</span>
      </template>
      <template v-else>Nenhum ponto escolhido.</template>
    </p>
  </div>
</template>

<style scoped>
.topo { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 8px; }
.mapa { height: 300px; border-radius: 12px; border: 1px solid var(--border); z-index: 0; }
.mapa.invalido { border-color: var(--red); }
.coord { margin: 6px 0 0; display: flex; align-items: center; gap: 4px; }
:deep(.picker-pin) { width: 28px; height: 28px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); background: var(--primary); border: 3px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,.4); }
</style>
