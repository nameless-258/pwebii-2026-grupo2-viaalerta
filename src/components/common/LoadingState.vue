<script setup>
defineProps({
  mensagem: { type: String, default: 'A carregar…' },
  compacto: { type: Boolean, default: false }
})
</script>

<template>
  <div class="loading" :class="{ compacto }" role="status" aria-live="polite">
    <span class="spinner" aria-hidden="true"></span>
    <span>{{ mensagem }}</span>
  </div>
</template>

<style scoped>
.loading { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 40px 16px; color: var(--text-muted); }
.loading.compacto { padding: 12px; justify-content: flex-start; }
.spinner { width: 22px; height: 22px; border: 3px solid var(--surface-3); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
</style>
