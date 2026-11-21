<script>
// Função usada pelo Leaflet: cria o ícone (divIcon) do pin a partir da categoria.
// Cada pin é sempre criado a partir das coordenadas reais de uma denúncia (ver MozambiqueMap.vue).
import L from 'leaflet'
import { categoriaPorId } from '@/constants/categorias'
import { ICONES } from '@/constants/icones'

export function htmlPin(categoria, tamanho = 34) {
  const c = categoriaPorId(categoria)
  const borda = c.borda || '#ffffff'
  return `<div class="va-pin-marca" style="--cor:${c.cor};--borda:${borda};--txt:${c.texto};width:${tamanho}px;height:${tamanho}px">
    <svg viewBox="0 0 24 24" width="${tamanho * 0.5}" height="${tamanho * 0.5}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${ICONES[c.icone]}</svg>
  </div>`
}

export function criarIconePin(categoria, tamanho = 34) {
  return L.divIcon({
    className: 'va-pin',
    html: htmlPin(categoria, tamanho),
    iconSize: [tamanho, tamanho],
    iconAnchor: [tamanho / 2, tamanho],
    popupAnchor: [0, -tamanho + 4]
  })
}
</script>

<script setup>
// Versão componente (usada na legenda do mapa)
import { computed } from 'vue'
const props = defineProps({
  categoria: { type: String, required: true },
  tamanho: { type: Number, default: 26 }
})
const html = computed(() => htmlPin(props.categoria, props.tamanho))
</script>

<template>
  <span class="map-pin" :style="{ width: tamanho + 'px', height: tamanho + 'px' }" v-html="html"></span>
</template>

<style>
/* Estilo global: os pins do Leaflet são inseridos fora do componente */
.va-pin-marca {
  display: grid; place-items: center;
  background: var(--cor); color: var(--txt);
  border: 2.5px solid var(--borda);
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.35);
}
.va-pin-marca svg { transform: rotate(45deg); }
.map-pin { display: inline-block; flex-shrink: 0; }
</style>
