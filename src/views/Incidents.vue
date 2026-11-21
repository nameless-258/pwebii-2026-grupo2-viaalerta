<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MapFilters from '@/components/map/MapFilters.vue'
import MozambiqueMap from '@/components/map/MozambiqueMap.vue'
import IncidentCard from '@/components/incidents/IncidentCard.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import { useDenunciasPublicas, filtrarDenuncias, filtrosVazios } from '@/composables/useIncidents'
import { useMozambiqueData } from '@/composables/useMozambiqueData'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const { denuncias, aCarregar, erro, recarregar } = useDenunciasPublicas()
const { provincias, distritosDe, carregarProvincias, carregarDistritos, pesquisarLocal } = useMozambiqueData()
const toast = useToast()

// Os filtros ficam no URL (?provincia=...&vista=mapa) para se poder partilhar a pesquisa
const filtros = ref({ ...filtrosVazios(), ...Object.fromEntries(Object.entries(route.query).filter(([k]) => k in filtrosVazios())) })
const vista = ref(route.query.vista === 'mapa' ? 'mapa' : 'lista')
const POR_PAGINA = 9
const mostrar = ref(POR_PAGINA)
const localFoco = ref(null)
const mapaRef = ref(null)

onMounted(() => { carregarProvincias(); carregarDistritos() })

const filtradas = computed(() => filtrarDenuncias(denuncias.value, filtros.value))
const visiveis = computed(() => filtradas.value.slice(0, mostrar.value))
const distritos = computed(() => distritosDe(filtros.value.provincia))

watch([filtros, vista], () => {
  mostrar.value = POR_PAGINA
  const q = Object.fromEntries(Object.entries(filtros.value).filter(([, v]) => v))
  if (vista.value === 'mapa') q.vista = 'mapa'
  router.replace({ query: q })
}, { deep: true })

async function irParaLocal(texto) {
  vista.value = 'mapa'
  try {
    const r = await pesquisarLocal(texto)
    if (!r.length) { toast.aviso(`Não encontrámos «${texto}» em Moçambique.`); return }
    localFoco.value = r[0]
  } catch {
    toast.erro('A pesquisa de locais (OpenStreetMap) não está disponível agora.')
  }
}

function verNoMapa(d) {
  vista.value = 'mapa'
  setTimeout(() => mapaRef.value?.focarDenuncia(d), 300)
}
</script>

<template>
  <section class="container page">
    <header class="page-header section-title">
      <div>
        <h1>Explorar denúncias</h1>
        <p>Denúncias verificadas pelos responsáveis e ainda não resolvidas.</p>
      </div>
      <div class="vistas" role="tablist" aria-label="Tipo de visualização">
        <button role="tab" :aria-selected="vista === 'lista'" :class="{ on: vista === 'lista' }" type="button" @click="vista = 'lista'"><AppIcon name="lista" :size="17" /> Lista</button>
        <button role="tab" :aria-selected="vista === 'mapa'" :class="{ on: vista === 'mapa' }" type="button" @click="vista = 'mapa'"><AppIcon name="mapa" :size="17" /> Mapa</button>
      </div>
    </header>

    <MapFilters
      v-model="filtros"
      :provincias="provincias"
      :distritos="distritos"
      :total="filtradas.length"
      @pesquisar-local="irParaLocal"
      @limpar="filtros = filtrosVazios(); localFoco = null"
    />

    <div class="resultado">
      <LoadingState v-if="aCarregar" mensagem="A carregar denúncias…" />
      <ErrorState v-else-if="erro" :mensagem="erro" @tentar="recarregar" />
      <template v-else>
        <MozambiqueMap v-if="vista === 'mapa'" ref="mapaRef" :denuncias="filtradas" :provincia-foco="filtros.provincia" :local-foco="localFoco" altura="min(72vh, 620px)" />
        <template v-else>
          <EmptyState v-if="!filtradas.length" mensagem="Nenhuma denúncia corresponde aos filtros. Experimente limpar os filtros ou escolher outra província.">
            <button class="btn btn-outline" type="button" @click="filtros = filtrosVazios()">Limpar filtros</button>
          </EmptyState>
          <div v-else class="grid-cards">
            <IncidentCard v-for="d in visiveis" :key="d.id" :denuncia="d" @ver-no-mapa="verNoMapa" />
          </div>
          <div v-if="filtradas.length > mostrar" class="mais">
            <button class="btn btn-outline" type="button" @click="mostrar += POR_PAGINA">Carregar mais ({{ filtradas.length - mostrar }} restantes)</button>
          </div>
        </template>
      </template>
    </div>
  </section>
</template>

<style scoped>
.vistas { display: inline-flex; padding: 4px; border-radius: 12px; background: var(--surface-2); border: 1px solid var(--border); }
.vistas button { display: inline-flex; align-items: center; gap: 6px; border: none; background: none; padding: 8px 14px; border-radius: 9px; cursor: pointer; font-weight: 600; color: var(--text-muted); }
.vistas button.on { background: var(--surface); color: var(--primary); box-shadow: var(--shadow-sm); }
.resultado { margin-top: 16px; }
.mais { text-align: center; margin-top: 20px; }
</style>
