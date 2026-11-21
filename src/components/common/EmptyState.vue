<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  titulo: { type: String, default: 'Sem resultados' },
  mensagem: { type: String, default: 'Não encontrámos nada com os critérios escolhidos.' },
  icone: { type: String, default: 'pesquisa' }
})
</script>

<template>
  <div class="state">
    <div class="icon"><AppIcon :name="icone" :size="26" /></div>
    <h3>{{ titulo }}</h3>
    <p class="muted">{{ mensagem }}</p>
    <slot />
  </div>
</template>

<style scoped>
.state { text-align: center; padding: 32px 16px; }
.icon { width: 52px; height: 52px; margin: 0 auto 12px; border-radius: 50%; display: grid; place-items: center; background: var(--surface-2); color: var(--text-muted); }
p { max-width: 420px; margin: 0 auto 14px; }
</style>
