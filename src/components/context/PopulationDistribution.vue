<script setup>
import { computed } from 'vue'
const props = defineProps({ urbana: { type: Object, default: null }, rural: { type: Object, default: null } })
const pct = (v) => (v == null ? '—' : `${v.toFixed(1).replace('.', ',')}%`)
const u = computed(() => props.urbana?.valor ?? null)
const r = computed(() => props.rural?.valor ?? (u.value != null ? 100 - u.value : null))
</script>

<template>
  <section class="card dist">
    <h3>Onde vive a população?</h3>
    <p class="small muted">Os problemas de infraestrutura não se limitam às cidades: as zonas rurais também precisam de estradas transitáveis e de serviços essenciais.</p>
    <div v-if="u != null" class="barra" role="img" :aria-label="`População urbana ${pct(u)}, rural ${pct(r)}`">
      <span class="seg urb" :style="{ width: u + '%' }"></span>
      <span class="seg rur" :style="{ width: r + '%' }"></span>
    </div>
    <div class="legenda">
      <div><span class="ponto urb"></span><strong>{{ pct(u) }}</strong> População urbana</div>
      <div><span class="ponto rur"></span><strong>{{ pct(r) }}</strong> População rural</div>
    </div>
    <p v-if="urbana" class="small muted fonte">Banco Mundial · {{ urbana.ano }} · <a :href="urbana.link" target="_blank" rel="noopener">ver dados ↗</a></p>
  </section>
</template>

<style scoped>
h3 { margin-bottom: 4px; }
.barra { display: flex; height: 18px; border-radius: 999px; overflow: hidden; margin: 14px 0 10px; background: var(--surface-2); }
.seg { height: 100%; transition: width 0.6s ease; }
.urb { background: #2A5BD7; }
.rur { background: #0B8A4E; }
.legenda { display: flex; gap: 20px; flex-wrap: wrap; font-size: 0.92rem; }
.legenda div { display: flex; align-items: center; gap: 6px; }
.legenda strong { font-size: 1.2rem; }
.ponto { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }
.fonte { margin: 10px 0 0; }
</style>
