<script setup>
import InfrastructureIndicatorCard from './InfrastructureIndicatorCard.vue'
defineProps({ indicador: { type: Object, default: null }, aCarregar: { type: Boolean, default: false } })
</script>

<template>
  <InfrastructureIndicatorCard titulo="Acesso a estradas" icone="construcao" cor="#0B8A4E"
    :indicador="indicador" :a-carregar="aCarregar"
    descricao="População rural que vive a menos de 2 km de uma estrada transitável todo o ano (não é o mesmo que ter qualquer estrada por perto)." />
</template>
