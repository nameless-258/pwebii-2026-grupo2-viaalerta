<script setup>
import { useToast } from '@/composables/useToast'
import AppIcon from './AppIcon.vue'

const { toasts, fechar } = useToast()
const icone = { success: 'check', error: 'alerta', warning: 'alerta', info: 'info' }
</script>

<template>
  <div class="toasts" aria-live="polite">
    <TransitionGroup name="fade">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="t.tipo" role="status">
        <AppIcon :name="icone[t.tipo]" :size="18" />
        <span>{{ t.mensagem }}</span>
        <button class="fechar" type="button" aria-label="Fechar" @click="fechar(t.id)"><AppIcon name="fechar" :size="16" /></button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toasts { position: fixed; z-index: 3000; bottom: 16px; left: 16px; right: 16px; display: flex; flex-direction: column; gap: 8px; align-items: center; pointer-events: none; }
.toast { pointer-events: auto; display: flex; align-items: center; gap: 10px; width: 100%; max-width: 440px; padding: 12px 14px; border-radius: 12px; background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow-lg); font-size: 0.92rem; }
.toast.success { border-left: 4px solid var(--primary); }
.toast.error { border-left: 4px solid var(--red); }
.toast.warning { border-left: 4px solid var(--yellow); }
.toast.info { border-left: 4px solid var(--blue); }
.toast span { flex: 1; }
.fechar { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 2px; }
</style>
