<script setup>
import IncidentCard from './IncidentCard.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import EmptyState from '@/components/common/EmptyState.vue'

defineProps({
  denuncias: { type: Array, default: () => [] },
  aCarregar: { type: Boolean, default: false }
})
const emit = defineEmits(['ver-no-mapa'])
</script>

<template>
  <section class="section">
    <div class="section-title">
      <h2>Denúncias recentes</h2>
      <RouterLink to="/denuncias" class="btn btn-outline btn-sm">Explorar todas</RouterLink>
    </div>
    <LoadingState v-if="aCarregar" />
    <EmptyState v-else-if="!denuncias.length" titulo="Ainda não há denúncias publicadas" mensagem="Seja o primeiro a denunciar um problema na sua comunidade." icone="pin" />
    <div v-else class="grid-cards">
      <IncidentCard v-for="d in denuncias" :key="d.id" :denuncia="d" @ver-no-mapa="(x) => emit('ver-no-mapa', x)" />
    </div>
  </section>
</template>
