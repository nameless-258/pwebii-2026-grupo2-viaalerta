<script setup>
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'
import AppIcon from './AppIcon.vue'

const { tema, alternar } = useTheme()
const rotulo = computed(() => (tema.value === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'))
</script>

<template>
  <button class="btn btn-ghost icon-btn" type="button" :title="rotulo" :aria-label="rotulo" @click="alternar">
    <AppIcon :name="tema === 'dark' ? 'sol' : 'lua'" />
  </button>
</template>
