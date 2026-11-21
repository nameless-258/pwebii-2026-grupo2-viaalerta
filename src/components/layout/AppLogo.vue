<script setup>
defineProps({
  comSlogan: { type: Boolean, default: false },
  tamanho: { type: Number, default: 34 }
})
</script>

<template>
  <span class="logo">
    <svg :width="tamanho" :height="tamanho" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#0B8A4E" />
      <path d="M16 6c-4.4 0-8 3.4-8 7.7 0 5.6 8 12.3 8 12.3s8-6.7 8-12.3C24 9.4 20.4 6 16 6z" fill="#FCE100" />
      <circle cx="16" cy="13.5" r="3" fill="#D21034" />
    </svg>
    <span class="texto">
      <span class="nome">Via<strong>Alerta</strong></span>
      <span v-if="comSlogan" class="slogan">A tua voz. A nossa infraestrutura.</span>
    </span>
  </span>
</template>

<style scoped>
.logo { display: inline-flex; align-items: center; gap: 10px; color: var(--text); }
.texto { display: flex; flex-direction: column; line-height: 1.1; }
.nome { font-size: 1.2rem; font-weight: 600; letter-spacing: -0.02em; }
.nome strong { color: var(--primary); font-weight: 800; }
.slogan { font-size: 0.75rem; color: var(--text-muted); margin-top: 3px; }
</style>
