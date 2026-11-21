<script setup>
// Filtros acima do mapa. Comunicação por v-model (prop modelValue + emit update:modelValue).
import { computed } from 'vue'
import { categoriasAtivas } from '@/constants/categorias'
import { ESTADOS, ESTADOS_PUBLICOS } from '@/constants/estados'
import SearchBar from '@/components/common/SearchBar.vue'
import FilterPanel from '@/components/common/FilterPanel.vue'

const props = defineProps({
  modelValue: { type: Object, required: true },
  provincias: { type: Array, default: () => [] },
  distritos: { type: Array, default: null }, // null = não mostrar filtro de distrito
  total: { type: Number, default: 0 }
})
const emit = defineEmits(['update:modelValue', 'pesquisar-local', 'limpar'])

const set = (campo, valor) => {
  const novo = { ...props.modelValue, [campo]: valor }
  if (campo === 'provincia') novo.distrito = ''
  emit('update:modelValue', novo)
}
const ativos = computed(() => ['provincia', 'distrito', 'categoria', 'estado', 'pesquisa'].filter((k) => props.modelValue[k]).length)
</script>

<template>
  <div class="filtros card">
    <div class="linha">
      <SearchBar
        class="pesquisa"
        :model-value="modelValue.pesquisa"
        placeholder="Pesquisar denúncia, bairro ou localidade…"
        com-botao-local
        @update:model-value="(v) => set('pesquisa', v)"
        @pesquisar-local="(t) => emit('pesquisar-local', t)"
      />
    </div>
    <FilterPanel :ativos="ativos" @limpar="emit('limpar')">
      <select class="select" aria-label="Província" :value="modelValue.provincia" @change="set('provincia', $event.target.value)">
        <option value="">Todas as províncias</option>
        <option v-for="p in provincias" :key="p" :value="p">{{ p }}</option>
      </select>
      <select v-if="distritos" class="select" aria-label="Distrito" :value="modelValue.distrito" :disabled="!modelValue.provincia" @change="set('distrito', $event.target.value)">
        <option value="">{{ modelValue.provincia ? 'Todos os distritos' : 'Distrito (escolha a província)' }}</option>
        <option v-for="d in distritos" :key="d" :value="d">{{ d }}</option>
      </select>
      <select class="select" aria-label="Categoria" :value="modelValue.categoria" @change="set('categoria', $event.target.value)">
        <option value="">Todas as categorias</option>
        <option v-for="c in categoriasAtivas()" :key="c.id" :value="c.id">{{ c.nome }}</option>
      </select>
      <select class="select" aria-label="Estado" :value="modelValue.estado" @change="set('estado', $event.target.value)">
        <option value="">Todos os estados</option>
        <option v-for="e in ESTADOS_PUBLICOS" :key="e" :value="e">{{ ESTADOS[e].nome }}</option>
      </select>
    </FilterPanel>
    <p class="small muted total">{{ total }} denúncia(s) activa(s) encontradas</p>
  </div>
</template>

<style scoped>
.filtros { padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.linha { display: flex; gap: 8px; }
.pesquisa { flex: 1; }
.total { margin: 0; }
</style>
