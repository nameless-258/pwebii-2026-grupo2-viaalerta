<script setup>
import AppIcon from '@/components/common/AppIcon.vue'
import { formatarNumero } from '@/composables/useFormat'

defineProps({
  titulo: { type: String, required: true },
  valor: { type: Number, default: null },
  descricao: { type: String, default: '' },
  icone: { type: String, default: 'grafico' },
  cor: { type: String, default: 'var(--primary)' },
  aCarregar: { type: Boolean, default: false }
})
</script>

<template>
  <div class="card stat" :style="{ '--c': cor }">
    <div class="ico"><AppIcon :name="icone" :size="22" /></div>
    <div>
      <span v-if="aCarregar" class="skeleton num-sk"></span>
      <strong v-else class="num">{{ valor == null ? '—' : formatarNumero(valor) }}</strong>
      <span class="titulo">{{ titulo }}</span>
      <span v-if="descricao" class="small muted">{{ descricao }}</span>
    </div>
  </div>
</template>

<style scoped>
.stat { display: flex; gap: 14px; align-items: center; border-left: 4px solid var(--c); }
.ico { width: 46px; height: 46px; border-radius: 12px; display: grid; place-items: center; background: color-mix(in srgb, var(--c) 14%, transparent); color: var(--c); flex-shrink: 0; }
.stat > div:last-child { display: flex; flex-direction: column; }
.num { font-size: 1.8rem; font-weight: 800; line-height: 1.1; }
.num-sk { display: block; width: 60px; height: 30px; margin-bottom: 2px; }
.titulo { font-weight: 600; }
</style>
