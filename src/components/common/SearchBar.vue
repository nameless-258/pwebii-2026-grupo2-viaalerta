<script setup>
import { ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Pesquisar…' },
  comBotaoLocal: { type: Boolean, default: false },
  atraso: { type: Number, default: 250 }
})
const emit = defineEmits(['update:modelValue', 'pesquisar-local'])

const texto = ref(props.modelValue)
watch(() => props.modelValue, (v) => { if (v !== texto.value) texto.value = v })

let temporizador
function aoEscrever() {
  clearTimeout(temporizador)
  temporizador = setTimeout(() => emit('update:modelValue', texto.value), props.atraso)
}
function limpar() {
  texto.value = ''
  emit('update:modelValue', '')
}
</script>

<template>
  <form class="search" role="search" @submit.prevent="comBotaoLocal && emit('pesquisar-local', texto)">
    <AppIcon name="pesquisa" :size="18" class="lupa" />
    <input v-model="texto" class="input" type="search" :placeholder="placeholder" :aria-label="placeholder" @input="aoEscrever" />
    <button v-if="texto && !comBotaoLocal" class="limpar" type="button" aria-label="Limpar pesquisa" @click="limpar"><AppIcon name="fechar" :size="16" /></button>
    <button v-if="comBotaoLocal" class="btn btn-primary local" type="submit" :disabled="texto.trim().length < 3" title="Procurar este local no mapa (OpenStreetMap)">
      <AppIcon name="pin" :size="16" /><span class="txt">Ir para local</span>
    </button>
  </form>
</template>

<style scoped>
.search { position: relative; display: flex; gap: 8px; align-items: center; }
.input { padding-left: 38px; padding-right: 34px; }
.lupa { position: absolute; left: 12px; color: var(--text-soft); pointer-events: none; }
.limpar { position: absolute; right: 8px; background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; }
.txt { display: none; }
@media (min-width: 600px) { .txt { display: inline; } }
</style>
