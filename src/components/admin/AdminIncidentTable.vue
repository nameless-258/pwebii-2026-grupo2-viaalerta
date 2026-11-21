<script setup>
// Tabela de moderação. Mostra o denunciante apenas a quem tem permissão
// (denúncias anónimas: só o administrador vê a identidade).
import { computed, ref } from 'vue'
import CategoryBadge from '@/components/incidents/CategoryBadge.vue'
import StatusBadge from '@/components/incidents/StatusBadge.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { formatarData } from '@/composables/useFormat'

const props = defineProps({
  denuncias: { type: Array, default: () => [] },
  verIdentidadeAnonima: { type: Boolean, default: false }
})
const emit = defineEmits(['abrir'])

const pesquisa = ref('')
const lista = computed(() => {
  const t = pesquisa.value.trim().toLowerCase()
  if (!t) return props.denuncias
  return props.denuncias.filter((d) => `${d.referencia} ${d.titulo} ${d.provincia} ${d.distrito} ${d.localidade}`.toLowerCase().includes(t))
})
const autor = (d) => (d.anonima && !props.verIdentidadeAnonima ? 'Anónimo' : d.autor?.nome || '—')
</script>

<template>
  <div>
    <input v-model="pesquisa" class="input filtro" type="search" placeholder="Filtrar por referência, título ou local…" aria-label="Filtrar denúncias" />
    <EmptyState v-if="!lista.length" titulo="Nada para mostrar" mensagem="Não há denúncias nesta secção." icone="check" />
    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr><th>Referência</th><th>Denúncia</th><th class="h-m">Local</th><th class="h-m">Denunciante</th><th>Estado</th><th class="h-m">Data</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="d in lista" :key="d.id" class="linha" @click="emit('abrir', d.id)">
            <td class="ref">{{ d.referencia }}</td>
            <td><strong class="tit">{{ d.titulo }}</strong><CategoryBadge :categoria="d.categoria" curto /></td>
            <td class="h-m">{{ d.distrito }}<br /><span class="small muted">{{ d.provincia }}</span></td>
            <td class="h-m">{{ autor(d) }}<span v-if="d.anonima" class="badge anon">anónima</span></td>
            <td><StatusBadge :estado="d.estado" /></td>
            <td class="h-m small">{{ formatarData(d.criadoEm) }}</td>
            <td><button class="btn btn-outline btn-sm" type="button" @click.stop="emit('abrir', d.id)">Analisar</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.filtro { margin-bottom: 12px; }
.linha { cursor: pointer; }
.linha:hover td { background: var(--surface-2); }
.ref { font-family: ui-monospace, Menlo, monospace; font-size: 0.8rem; white-space: nowrap; }
.tit { display: block; margin-bottom: 4px; }
.anon { margin-left: 6px; }
.h-m { display: none; }
@media (min-width: 760px) { .h-m { display: table-cell; } }
</style>
