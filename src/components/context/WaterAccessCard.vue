<script setup>
import InfrastructureIndicatorCard from './InfrastructureIndicatorCard.vue'
defineProps({ indicador: { type: Object, default: null }, aCarregar: { type: Boolean, default: false } })
</script>

<template>
  <InfrastructureIndicatorCard titulo="Acesso à água potável" icone="gota" cor="#1C8FD6"
    :indicador="indicador" :a-carregar="aCarregar"
    descricao="População com serviço básico de água (fonte melhorada a menos de 30 minutos) — não é o mesmo que água gerida com segurança." />
</template>
