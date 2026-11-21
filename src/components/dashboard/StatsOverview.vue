<script setup>
// Estatísticas públicas: apenas denúncias publicadas e activas (nunca pendentes/rejeitadas).
import StatCard from './StatCard.vue'

defineProps({
  estatisticas: { type: Object, default: null },
  aCarregar: { type: Boolean, default: false }
})
</script>

<template>
  <section class="stats" aria-label="Estatísticas públicas">
    <StatCard titulo="Publicadas" descricao="Aprovadas e visíveis no mapa" icone="pin" cor="#0B8A4E" :valor="estatisticas?.publicadas" :a-carregar="aCarregar" />
    <StatCard titulo="Em resolução" descricao="Problemas a ser tratados" icone="construcao" cor="#d49b00" :valor="estatisticas?.emResolucao" :a-carregar="aCarregar" />
    <StatCard titulo="Total activo" descricao="Publicadas ainda não resolvidas" icone="alerta" cor="#D21034" :valor="estatisticas?.totalAtivo" :a-carregar="aCarregar" />
  </section>
</template>

<style scoped>
.stats { display: grid; gap: 12px; grid-template-columns: 1fr; }
@media (min-width: 640px) { .stats { grid-template-columns: repeat(3, 1fr); } }
</style>
