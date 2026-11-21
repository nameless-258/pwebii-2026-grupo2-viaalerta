<script setup>
// Conteúdo do popup que aparece ao clicar num pin. Nunca mostra nome/email do denunciante.
import CategoryBadge from '@/components/incidents/CategoryBadge.vue'
import StatusBadge from '@/components/incidents/StatusBadge.vue'
import { formatarData } from '@/composables/useFormat'

defineProps({ denuncia: { type: Object, required: true } })
const emit = defineEmits(['ver-detalhes'])
</script>

<template>
  <div class="popup">
    <img v-if="denuncia.fotoUrl" :src="denuncia.fotoUrl" :alt="denuncia.titulo" class="foto" />
    <div class="corpo">
      <div class="badges">
        <CategoryBadge :categoria="denuncia.categoria" curto />
        <StatusBadge :estado="denuncia.estado" />
      </div>
      <h4>{{ denuncia.titulo }}</h4>
      <p class="desc">{{ denuncia.descricao }}</p>
      <p class="meta">{{ denuncia.localidade }} · {{ denuncia.distrito }} · {{ denuncia.provincia }}</p>
      <p class="meta">Submetida a {{ formatarData(denuncia.criadoEm) }}</p>
      <button class="btn btn-primary btn-sm btn-block" type="button" @click="emit('ver-detalhes', denuncia.id)">Ver detalhes</button>
    </div>
  </div>
</template>

<style scoped>
.popup { font-family: inherit; color: var(--text); }
.foto { width: 100%; height: 120px; object-fit: cover; border-radius: 12px 12px 0 0; }
.corpo { padding: 10px 12px 12px; }
.badges { display: flex; gap: 6px; flex-wrap: wrap; }
h4 { margin: 8px 0 4px; font-size: 0.95rem; }
.desc { margin: 0 0 6px; font-size: 0.82rem; color: var(--text-muted); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.meta { margin: 0 0 4px; font-size: 0.76rem; color: var(--text-soft); }
.btn { margin-top: 8px; color: var(--primary-contrast) !important; }
</style>
