<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  titulo: { type: String, default: 'Ocorreu um erro' },
  mensagem: { type: String, default: 'Não foi possível carregar os dados. Verifique a sua ligação à Internet.' },
  podeTentar: { type: Boolean, default: true }
})
const emit = defineEmits(['tentar'])
</script>

<template>
  <div class="state" role="alert">
    <div class="icon"><AppIcon name="alerta" :size="26" /></div>
    <h3>{{ titulo }}</h3>
    <p class="muted">{{ mensagem }}</p>
    <button v-if="podeTentar" class="btn btn-outline btn-sm" type="button" @click="emit('tentar')">
      <AppIcon name="atualizar" :size="16" /> Tentar novamente
    </button>
  </div>
</template>

<style scoped>
.state { text-align: center; padding: 32px 16px; }
.icon { width: 52px; height: 52px; margin: 0 auto 12px; border-radius: 50%; display: grid; place-items: center; background: var(--red-soft); color: var(--red); }
p { max-width: 420px; margin: 0 auto 14px; }
</style>
