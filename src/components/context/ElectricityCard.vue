<script setup>
import InfrastructureIndicatorCard from './InfrastructureIndicatorCard.vue'
defineProps({ indicador: { type: Object, default: null }, aCarregar: { type: Boolean, default: false } })
</script>

<template>
  <InfrastructureIndicatorCard titulo="Acesso à electricidade" icone="lampada" cor="#D49B00"
    :indicador="indicador" :a-carregar="aCarregar"
    descricao="População com acesso à electricidade — base da iluminação pública e dos semáforos." />
</template>
