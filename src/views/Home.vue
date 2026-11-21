<script setup>
import { ref, computed, onMounted } from 'vue'
import WelcomeSection from '@/components/dashboard/WelcomeSection.vue'
import StatsOverview from '@/components/dashboard/StatsOverview.vue'
import InfrastructureContext from '@/components/context/InfrastructureContext.vue'
import MozambiqueMap from '@/components/map/MozambiqueMap.vue'
import MapFilters from '@/components/map/MapFilters.vue'
import RecentIncidents from '@/components/incidents/RecentIncidents.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import { useDenunciasPublicas, filtrarDenuncias, filtrosVazios } from '@/composables/useIncidents'
import { useMozambiqueData } from '@/composables/useMozambiqueData'
import { useToast } from '@/composables/useToast'

const { denuncias, estatisticas, recentes, aCarregar, erro, recarregar } = useDenunciasPublicas()
const { provincias, carregarProvincias, pesquisarLocal } = useMozambiqueData()
const toast = useToast()

const filtros = ref(filtrosVazios())
const localFoco = ref(null)
const mapaRef = ref(null)
const seccaoMapa = ref(null)

onMounted(carregarProvincias)

const filtradas = computed(() => filtrarDenuncias(denuncias.value, filtros.value))

async function irParaLocal(texto) {
  try {
    const r = await pesquisarLocal(texto)
    if (!r.length) { toast.aviso(`Não encontrámos «${texto}» em Moçambique.`); return }
    localFoco.value = r[0]
    filtros.value = { ...filtros.value, pesquisa: '' }
  } catch {
    toast.erro('A pesquisa de locais (OpenStreetMap) não está disponível agora.')
  }
}

function verMapa() {
  seccaoMapa.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
function verNoMapa(d) {
  verMapa()
  setTimeout(() => mapaRef.value?.focarDenuncia(d), 400)
}
</script>

<template>
  <div class="container page home">
    <WelcomeSection @ver-mapa="verMapa" />

    <div class="section">
      <StatsOverview :estatisticas="estatisticas" :a-carregar="aCarregar" />
    </div>

    <section ref="seccaoMapa" class="section mapa-seccao">
      <div class="section-title">
        <h2>Mapa de denúncias</h2>
        <span class="small muted">Apenas denúncias verificadas e ainda não resolvidas</span>
      </div>
      <MapFilters
        v-model="filtros"
        :provincias="provincias"
        :total="filtradas.length"
        @pesquisar-local="irParaLocal"
        @limpar="filtros = filtrosVazios(); localFoco = null"
      />
      <ErrorState v-if="erro" :mensagem="erro" @tentar="recarregar" />
      <MozambiqueMap ref="mapaRef" class="mapa" :denuncias="filtradas" :provincia-foco="filtros.provincia" :local-foco="localFoco" altura="min(70vh, 560px)" />
    </section>

    <div class="section">
      <InfrastructureContext />
    </div>

    <RecentIncidents :denuncias="recentes" :a-carregar="aCarregar" @ver-no-mapa="verNoMapa" />
  </div>
</template>

<style scoped>
.mapa-seccao { scroll-margin-top: 80px; display: flex; flex-direction: column; gap: 12px; }
.mapa-seccao .section-title { margin-bottom: 0; }
</style>
