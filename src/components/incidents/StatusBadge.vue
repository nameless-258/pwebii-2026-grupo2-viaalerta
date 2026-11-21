<script setup>
import { computed } from 'vue'
import { estadoInfo } from '@/constants/estados'

const props = defineProps({ estado: { type: String, required: true } })
const e = computed(() => estadoInfo(props.estado))
</script>

<template>
  <span class="badge" :style="{ color: e.cor, background: e.fundo }">
    <span class="ponto" :style="{ background: e.cor }"></span>{{ e.nome }}
  </span>
</template>

<style scoped>
.ponto { width: 7px; height: 7px; border-radius: 50%; }
</style>
