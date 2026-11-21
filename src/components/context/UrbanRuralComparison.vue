<script setup>
// Comparação urbano vs. rural com valores reais (mesma fonte e o último ano disponível de cada série)
import { computed } from 'vue'
const props = defineProps({ dados: { type: Object, required: true } })

const linhas = computed(() => [
  { nome: 'Electricidade', urbano: props.dados.electricidadeUrbana, rural: props.dados.electricidadeRural },
  { nome: 'Água potável (serviço básico)', urbano: props.dados.aguaUrbana, rural: props.dados.aguaRural },
  { nome: 'Estradas transitáveis (2 km)', urbano: null, rural: props.dados.estradas, semUrbano: 'Não aplicável: o indicador mede apenas a população rural' }
])
const pct = (i) => (i ? `${i.valor.toFixed(1).replace('.', ',')}%` : '—')
</script>

<template>
  <section class="card comp">
    <h3>O acesso aos serviços essenciais não é igual para todos.</h3>
    <p class="small muted">Percentagem da população com acesso, nas cidades e no campo.</p>
    <div v-for="l in linhas" :key="l.nome" class="linha">
      <strong class="nome">{{ l.nome }}</strong>
      <div class="par">
        <span class="rot">Urbano</span>
        <div class="trilho"><span v-if="l.urbano" class="barra urb" :style="{ width: l.urbano.valor + '%' }"></span></div>
        <span class="val">{{ l.urbano ? pct(l.urbano) : '' }}</span>
      </div>
      <p v-if="l.semUrbano" class="small muted na">{{ l.semUrbano }}</p>
      <div class="par">
        <span class="rot">Rural</span>
        <div class="trilho"><span v-if="l.rural" class="barra rur" :style="{ width: l.rural.valor + '%' }"></span></div>
        <span class="val">{{ pct(l.rural) }}</span>
      </div>
      <p class="small muted anos">
        <template v-if="l.urbano">Urbano: {{ l.urbano.ano }} · </template>Rural: {{ l.rural?.ano || '—' }} · {{ (l.rural || l.urbano)?.fonte || '' }}
      </p>
    </div>
  </section>
</template>

<style scoped>
h3 { margin-bottom: 4px; }
.linha { padding: 12px 0; border-top: 1px solid var(--border); }
.linha:first-of-type { margin-top: 12px; }
.nome { display: block; margin-bottom: 8px; }
.par { display: grid; grid-template-columns: 60px 1fr 56px; align-items: center; gap: 10px; margin-bottom: 6px; font-size: 0.88rem; }
.rot { color: var(--text-muted); }
.trilho { height: 12px; border-radius: 999px; background: var(--surface-2); overflow: hidden; }
.barra { display: block; height: 100%; border-radius: 999px; transition: width 0.6s ease; }
.urb { background: #2A5BD7; }
.rur { background: #0B8A4E; }
.val { text-align: right; font-weight: 700; }
.na { margin: -2px 0 6px 70px; font-size: 0.78rem; }
.anos { margin: 2px 0 0; font-size: 0.75rem; }
</style>
