<script setup>
import { estadoInfo } from '@/constants/estados'
import { formatarDataHora } from '@/composables/useFormat'

defineProps({
  eventos: { type: Array, default: () => [] },
  mostrarNotas: { type: Boolean, default: false }
})

// Descrição pública de cada passo (sem notas internas)
const DESCRICAO = {
  pendente: 'Denúncia submetida, aguarda análise',
  em_analise: 'Um responsável está a analisar a denúncia',
  precisa_info: 'Foi pedida informação adicional ao cidadão',
  rejeitada: 'A denúncia não foi aprovada',
  publicada: 'Denúncia aprovada — publicada no ViaAlerta',
  em_resolucao: 'Responsável iniciou o tratamento do problema',
  resolvida: 'Problema confirmado como resolvido'
}
const titulo = (e) => (e === 'publicada' ? 'Denúncia aprovada' : estadoInfo(e).nome)
</script>

<template>
  <ol class="timeline">
    <li v-for="(ev, i) in eventos" :key="ev.id || i" :class="{ ultimo: i === eventos.length - 1 }">
      <span class="marca" :style="{ background: estadoInfo(ev.estado).cor }"></span>
      <div>
        <strong>{{ titulo(ev.estado) }}</strong>
        <div class="small muted">{{ formatarDataHora(ev.criadoEm) }} — {{ DESCRICAO[ev.estado] }}</div>
        <p v-if="mostrarNotas && ev.nota" class="nota">«{{ ev.nota }}»<span v-if="ev.actor"> — {{ ev.actor }}</span></p>
      </div>
    </li>
  </ol>
</template>

<style scoped>
.timeline { list-style: none; margin: 0; padding: 0; }
.timeline li { position: relative; display: flex; gap: 14px; padding-bottom: 18px; }
.timeline li::before { content: ''; position: absolute; left: 6px; top: 16px; bottom: 0; width: 2px; background: var(--border); }
.timeline li.ultimo::before { display: none; }
.marca { width: 14px; height: 14px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; box-shadow: 0 0 0 4px var(--surface); }
.nota { margin: 6px 0 0; font-size: 0.88rem; background: var(--surface-2); padding: 8px 10px; border-radius: 8px; }
</style>
