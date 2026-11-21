<script setup>
import AppIcon from '@/components/common/AppIcon.vue'
import { formatarDataHora } from '@/composables/useFormat'
defineProps({ atualizadoEm: { type: Number, default: null }, aCarregar: { type: Boolean, default: false } })
const emit = defineEmits(['actualizar'])
const FONTES = [
  { nome: 'Banco Mundial — Dados de Moçambique', desc: 'População, electricidade e água', link: 'https://data.worldbank.org/country/MZ' },
  { nome: 'Nações Unidas — Perfil dos ODS de Moçambique', desc: 'Indicador 9.1.1 (acesso rural a estradas)', link: 'https://unstats.un.org/sdgs/dataportal/countryprofiles/MOZ' },
  { nome: 'Banco Mundial — Rural Access Index', desc: 'Metodologia e estimativas do RAI', link: 'https://datacatalog.worldbank.org/infrastructure-data/search/dataset/0038250/rural-access-index-rai' },
  { nome: 'Administração Nacional de Estradas (ANE)', desc: 'Relatório do sector rodoviário', link: 'https://www.fe.gov.mz/storage/app/uploads/public/683/f05/d5d/683f05d5d4294819359954.pdf' }
]
</script>

<template>
  <section class="fontes">
    <div class="cab">
      <h3>Fontes dos dados</h3>
      <div class="row">
        <span v-if="atualizadoEm" class="small muted">Dados obtidos em {{ formatarDataHora(atualizadoEm) }}</span>
        <button class="btn btn-ghost btn-sm" type="button" :disabled="aCarregar" @click="emit('actualizar')"><AppIcon name="atualizar" :size="15" /> Actualizar</button>
      </div>
    </div>
    <ul>
      <li v-for="f in FONTES" :key="f.nome"><a :href="f.link" target="_blank" rel="noopener">{{ f.nome }} ↗</a><span class="small muted"> — {{ f.desc }}</span></li>
    </ul>
    <p class="small muted">Cada valor mostra o último ano disponível na fonte; quando um indicador não tem dados recentes, é indicado o ano real da medição.</p>
  </section>
</template>

<style scoped>
.fontes { margin-top: 16px; padding: 16px; border-radius: 14px; background: var(--surface-2); }
.cab { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }
h3 { margin: 0; font-size: 1rem; }
ul { margin: 10px 0; padding-left: 18px; display: flex; flex-direction: column; gap: 4px; font-size: 0.9rem; }
p { margin: 0; }
</style>
