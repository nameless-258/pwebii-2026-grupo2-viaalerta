<script setup>
import InfrastructureIndicatorCard from './InfrastructureIndicatorCard.vue'
defineProps({ indicador: { type: Object, default: null }, aCarregar: { type: Boolean, default: false } })
</script>

<template>
  <InfrastructureIndicatorCard titulo="População total" icone="utilizadores" cor="#2A5BD7" formato="numero"
    :indicador="indicador" :a-carregar="aCarregar" descricao="Pessoas que dependem diariamente das estradas, passeios e iluminação." />
</template>
