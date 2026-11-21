<script setup>
// Cartão genérico de indicador: valor, unidade, ano, nome do indicador, fonte e link para os dados originais
import AppIcon from '@/components/common/AppIcon.vue'

defineProps({
  icone: { type: String, default: 'grafico' },
  cor: { type: String, default: 'var(--primary)' },
  titulo: { type: String, required: true },
  indicador: { type: Object, default: null }, // { valor, unidade, ano, nome, fonte, link, codigo, nota }
  formato: { type: String, default: 'percent' }, // percent | numero
  descricao: { type: String, default: '' },
  aCarregar: { type: Boolean, default: false }
})

function formatar(ind, formato) {
  if (!ind) return '—'
  if (formato === 'numero') {
    return ind.valor >= 1e6 ? `${(ind.valor / 1e6).toFixed(1).replace('.', ',')} M` : new Intl.NumberFormat('pt-MZ').format(ind.valor)
  }
  return `${ind.valor.toFixed(1).replace('.', ',')}%`
}
</script>

<template>
  <article class="card ind" :style="{ '--c': cor }">
    <div class="topo">
      <span class="ico"><AppIcon :name="icone" :size="20" /></span>
      <span v-if="indicador" class="ano">{{ indicador.ano }}</span>
    </div>
    <span v-if="aCarregar" class="skeleton sk"></span>
    <strong v-else class="valor">{{ formatar(indicador, formato) }}</strong>
    <h3>{{ titulo }}</h3>
    <p class="small muted desc">{{ indicador ? `${indicador.unidade} · ${indicador.ano}` : (aCarregar ? 'A carregar…' : 'Sem dados disponíveis') }}</p>
    <p v-if="descricao" class="small desc2">{{ descricao }}</p>
    <footer v-if="indicador" class="fonte small">
      <span>{{ indicador.fonte }}</span>
      <a :href="indicador.link" target="_blank" rel="noopener" :title="indicador.codigo">Ver dados ↗</a>
    </footer>
    <p v-if="indicador?.nota" class="nota small muted">{{ indicador.nota }}</p>
  </article>
</template>

<style scoped>
.ind { display: flex; flex-direction: column; gap: 4px; border-top: 4px solid var(--c); }
.topo { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.ico { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; background: color-mix(in srgb, var(--c) 14%, transparent); color: var(--c); }
.ano { font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: var(--surface-2); color: var(--text-muted); }
.valor { font-size: 2rem; font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; }
.sk { display: block; width: 90px; height: 34px; }
h3 { margin: 2px 0 0; font-size: 1rem; }
.desc, .desc2, .nota { margin: 0; }
.desc2 { color: var(--text-muted); }
.fonte { margin-top: auto; padding-top: 10px; border-top: 1px dashed var(--border); display: flex; justify-content: space-between; gap: 8px; color: var(--text-muted); }
.nota { font-size: 0.75rem; }
</style>
