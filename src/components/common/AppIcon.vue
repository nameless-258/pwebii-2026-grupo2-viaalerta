<script setup>
// Ícones SVG simples (traço), desenhados para o ViaAlerta. Uso: <AppIcon name="sol" />
import { computed } from 'vue'
import { ICONES } from '@/constants/icones'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 20 },
  stroke: { type: [Number, String], default: 2 }
})


const svg = computed(() => ICONES[props.name] || ICONES.info)
</script>

<template>
  <svg
    class="app-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="stroke"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="svg"
  />
</template>

<style scoped>
.app-icon { flex-shrink: 0; display: inline-block; vertical-align: middle; }
</style>
