<script setup>
import AppIcon from '@/components/common/AppIcon.vue'
</script>

<template>
  <section class="container page nf">
    <div class="icone"><AppIcon name="mapa" :size="44" :stroke="1.6" /></div>
    <p class="codigo">404</p>
    <h1>Página não encontrada</h1>
    <p class="muted">O endereço que procurou não existe ou foi removido. Talvez a estrada tenha mudado de sítio…</p>
    <RouterLink to="/" class="btn btn-primary btn-lg">Voltar ao início</RouterLink>
  </section>
</template>

<style scoped>
.nf { text-align: center; padding-top: 72px; padding-bottom: 72px; max-width: 560px; }
.icone { width: 96px; height: 96px; margin: 0 auto 18px; border-radius: 28px; display: grid; place-items: center; background: var(--primary-soft); color: var(--primary); }
.codigo { font-size: 0.9rem; font-weight: 800; letter-spacing: 0.3em; color: var(--primary); margin-bottom: 6px; }
</style>
