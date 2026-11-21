<script setup>
// Secção informativa «Moçambique — contexto e infraestrutura»: explica o contexto em que os problemas acontecem.
import { onMounted } from 'vue'
import { useMozambiqueIndicators } from '@/composables/useMozambiqueIndicators'
import SectionHeader from './SectionHeader.vue'
import PopulationCard from './PopulationCard.vue'
import RoadAccessCard from './RoadAccessCard.vue'
import WaterAccessCard from './WaterAccessCard.vue'
import ElectricityCard from './ElectricityCard.vue'
import PopulationDistribution from './PopulationDistribution.vue'
import UrbanRuralComparison from './UrbanRuralComparison.vue'
import DataSources from './DataSources.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const { dados, aCarregar, erro, vazio, atualizadoEm, carregar } = useMozambiqueIndicators()
onMounted(() => carregar())
</script>

<template>
  <section class="contexto">
    <SectionHeader etiqueta="Dados nacionais" titulo="Moçambique — contexto e infraestrutura"
      descricao="Conheça alguns indicadores sobre a população e o acesso a serviços essenciais em Moçambique. Fontes: Banco Mundial, Nações Unidas e entidades oficiais." />

    <ErrorState v-if="erro && !Object.keys(dados).length" titulo="Indicadores indisponíveis" :mensagem="erro" @tentar="carregar(true)" />
    <EmptyState v-else-if="vazio" titulo="Sem dados" mensagem="As fontes não devolveram indicadores para Moçambique neste momento." icone="grafico" />
    <template v-else>
      <div class="cartoes">
        <PopulationCard :indicador="dados.populacao" :a-carregar="aCarregar" />
        <RoadAccessCard :indicador="dados.estradas" :a-carregar="aCarregar" />
        <WaterAccessCard :indicador="dados.agua" :a-carregar="aCarregar" />
        <ElectricityCard :indicador="dados.electricidade" :a-carregar="aCarregar" />
      </div>
      <div class="duas">
        <PopulationDistribution :urbana="dados.urbana" :rural="dados.rural" />
        <UrbanRuralComparison :dados="dados" />
      </div>
    </template>
    <DataSources :atualizado-em="atualizadoEm" :a-carregar="aCarregar" @actualizar="carregar(true)" />
  </section>
</template>

<style scoped>
.cartoes { display: grid; gap: 14px; grid-template-columns: 1fr; }
@media (min-width: 620px) { .cartoes { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1080px) { .cartoes { grid-template-columns: repeat(4, 1fr); } }
.duas { display: grid; gap: 14px; margin-top: 14px; grid-template-columns: 1fr; }
@media (min-width: 960px) { .duas { grid-template-columns: 1fr 1.4fr; align-items: start; } }
</style>
