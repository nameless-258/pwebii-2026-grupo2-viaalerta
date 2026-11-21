<script setup>
import { computed } from 'vue'
import { categoriaPorId } from '@/constants/categorias'
import AppIcon from '@/components/common/AppIcon.vue'

const props = defineProps({
  categoria: { type: String, required: true },
  curto: { type: Boolean, default: false }
})
const c = computed(() => categoriaPorId(props.categoria))
</script>

<template>
  <span class="badge cat" :title="c.nome">
    <span class="ico" :style="{ background: c.cor, color: c.texto, borderColor: c.borda || c.cor }">
      <AppIcon :name="c.icone" :size="12" :stroke="2.4" />
    </span>
    <span v-if="!curto">{{ c.nome }}</span>
  </span>
</template>

<style scoped>
.cat { color: var(--text); padding-left: 4px; }
.ico { width: 20px; height: 20px; border-radius: 50%; display: grid; place-items: center; border: 1.5px solid; }
</style>
