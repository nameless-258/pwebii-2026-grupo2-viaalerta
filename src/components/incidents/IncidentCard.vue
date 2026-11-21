<script setup>
import CategoryBadge from './CategoryBadge.vue'
import StatusBadge from './StatusBadge.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import { categoriaPorId } from '@/constants/categorias'
import { formatarData } from '@/composables/useFormat'

const props = defineProps({
  denuncia: { type: Object, required: true },
  destaque: { type: Boolean, default: false }
})
const emit = defineEmits(['ver-no-mapa'])
const cor = categoriaPorId(props.denuncia.categoria).cor
</script>

<template>
  <article class="card inc" :class="{ destaque }">
    <div class="foto" :style="{ '--cor': cor }">
      <img v-if="denuncia.fotoUrl" :src="denuncia.fotoUrl" :alt="`Fotografia: ${denuncia.titulo}`" loading="lazy" />
      <div v-else class="sem-foto"><AppIcon name="camera" :size="28" /></div>
      <StatusBadge class="estado" :estado="denuncia.estado" />
    </div>
    <div class="corpo">
      <CategoryBadge :categoria="denuncia.categoria" />
      <h3 class="titulo">{{ denuncia.titulo }}</h3>
      <p class="meta"><AppIcon name="pin" :size="15" /> {{ denuncia.localidade }}, {{ denuncia.distrito }} · {{ denuncia.provincia }}</p>
      <p class="meta"><AppIcon name="relogio" :size="15" /> {{ formatarData(denuncia.criadoEm) }}</p>
      <div class="acoes">
        <RouterLink :to="`/denuncias/${denuncia.id}`" class="btn btn-primary btn-sm">Ver detalhes</RouterLink>
        <button class="btn btn-ghost btn-sm" type="button" @click="emit('ver-no-mapa', denuncia)"><AppIcon name="mapa" :size="16" /> No mapa</button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.inc { padding: 0; overflow: hidden; display: flex; flex-direction: column; transition: box-shadow 0.15s, transform 0.15s; }
.inc:hover { box-shadow: var(--shadow); transform: translateY(-2px); }
.foto { position: relative; aspect-ratio: 16 / 9; background: var(--surface-2); border-bottom: 3px solid var(--cor); }
.foto img { width: 100%; height: 100%; object-fit: cover; }
.sem-foto { height: 100%; display: grid; place-items: center; color: var(--text-soft); }
.estado { position: absolute; top: 10px; right: 10px; box-shadow: var(--shadow-sm); }
.corpo { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 6px; flex: 1; }
.titulo { margin: 6px 0 2px; font-size: 1.02rem; }
.meta { margin: 0; display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: var(--text-muted); }
.acoes { display: flex; gap: 8px; margin-top: auto; padding-top: 10px; }
</style>
