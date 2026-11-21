<script setup>
defineProps({
  etiqueta: { type: String, default: '' },
  titulo: { type: String, required: true },
  descricao: { type: String, default: '' }
})
</script>

<template>
  <header class="cab">
    <div>
      <span v-if="etiqueta" class="etiqueta">{{ etiqueta }}</span>
      <h2>{{ titulo }}</h2>
      <p v-if="descricao" class="muted">{{ descricao }}</p>
    </div>
    <slot />
  </header>
</template>

<style scoped>
.cab { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
.etiqueta { display: inline-block; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--primary); margin-bottom: 6px; }
h2 { margin: 0 0 4px; }
p { margin: 0; max-width: 640px; }
</style>
