<script setup>
// Painel de filtros reutilizável: no telemóvel abre/fecha com um botão; no desktop está sempre visível.
import { ref } from 'vue'
import AppIcon from './AppIcon.vue'

defineProps({
  ativos: { type: Number, default: 0 },
  titulo: { type: String, default: 'Filtros' }
})
const emit = defineEmits(['limpar'])
const aberto = ref(false)
</script>

<template>
  <div class="painel">
    <div class="cab">
      <button class="btn btn-outline toggle" type="button" :aria-expanded="aberto" @click="aberto = !aberto">
        <AppIcon name="filtro" :size="17" /> {{ titulo }}<span v-if="ativos" class="contador">{{ ativos }}</span>
        <AppIcon name="baixo" :size="16" />
      </button>
    </div>
    <div class="conteudo" :class="{ aberto }">
      <slot />
      <button class="btn btn-ghost" type="button" :disabled="!ativos" @click="emit('limpar')"><AppIcon name="fechar" :size="16" /> Limpar filtros</button>
    </div>
  </div>
</template>

<style scoped>
.toggle { width: 100%; justify-content: space-between; }
.contador { background: var(--primary); color: var(--primary-contrast); border-radius: 999px; font-size: 0.72rem; padding: 0 7px; margin-right: auto; margin-left: 6px; }
.conteudo { display: none; gap: 8px; grid-template-columns: 1fr; margin-top: 8px; }
.conteudo.aberto { display: grid; }
@media (min-width: 900px) {
  .cab { display: none; }
  .conteudo { display: grid; margin-top: 0; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); }
}
</style>
