import { ref, computed } from 'vue'
import api from '@/services/api'
import { useAuth } from './useAuth'

// ===== Denúncias públicas (mapa, listas, estatísticas) =====
// Cache partilhada: evita pedidos repetidos ao navegar entre páginas (dados móveis são caros).
const publicas = ref([])
const estatisticas = ref(null)
const aCarregar = ref(false)
const erro = ref(null)
let carregadoEm = 0
let pedidoEmCurso = null
let cancelarSubscricao = null
const VALIDADE_MS = 2 * 60 * 1000

async function carregarPublicas(forcar = false) {
  if (!forcar && carregadoEm && Date.now() - carregadoEm < VALIDADE_MS) return
  if (pedidoEmCurso) return pedidoEmCurso
  aCarregar.value = !publicas.value.length
  erro.value = null
  pedidoEmCurso = (async () => {
    try {
      const [lista, stats] = await Promise.all([api.listarPublicas(), api.estatisticasPublicas()])
      publicas.value = lista
      estatisticas.value = stats
      carregadoEm = Date.now()
    } catch (e) {
      erro.value = e.message || 'Erro ao carregar as denúncias.'
    } finally {
      aCarregar.value = false
      pedidoEmCurso = null
    }
  })()
  return pedidoEmCurso
}

const normalizar = (t) => (t || '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Invalida a cache (usado depois de uma acção de moderação)
export function invalidarPublicas() {
  carregadoEm = 0
}

export function filtrarDenuncias(lista, f) {
  const termo = normalizar(f.pesquisa)
  return lista.filter((d) => {
    if (f.provincia && d.provincia !== f.provincia) return false
    if (f.distrito && d.distrito !== f.distrito) return false
    if (f.categoria && d.categoria !== f.categoria) return false
    if (f.estado && d.estado !== f.estado) return false
    if (termo) {
      const alvo = normalizar(`${d.titulo} ${d.descricao} ${d.localidade} ${d.distrito} ${d.provincia} ${d.referencia}`)
      if (!alvo.includes(termo)) return false
    }
    return true
  })
}

export const filtrosVazios = () => ({ pesquisa: '', provincia: '', distrito: '', categoria: '', estado: '' })

export function useDenunciasPublicas() {
  carregarPublicas()

  // Tempo real: quando uma denúncia muda de estado (ex.: resolvida), recarrega
  // e o pin desaparece automaticamente do mapa. Uma única subscrição para toda a app.
  if (!cancelarSubscricao) cancelarSubscricao = api.subscreverAlteracoes(() => carregarPublicas(true))

  const recentes = computed(() => publicas.value.slice(0, 6))

  return { denuncias: publicas, estatisticas, recentes, aCarregar, erro, recarregar: () => carregarPublicas(true) }
}

// ===== Uma denúncia pública (página de detalhes) =====
export function useDenunciaPublica() {
  const denuncia = ref(null)
  const historico = ref([])
  const aCarregarD = ref(false)
  const erroD = ref(null)

  async function carregar(id) {
    aCarregarD.value = true
    erroD.value = null
    try {
      const [d, h] = await Promise.all([api.obterPublica(id), api.historicoPublico(id)])
      denuncia.value = d
      historico.value = h
    } catch (e) {
      erroD.value = e.message
    } finally {
      aCarregarD.value = false
    }
  }
  return { denuncia, historico, aCarregar: aCarregarD, erro: erroD, carregar }
}

// ===== Denúncias do cidadão autenticado =====
export function useMinhasDenuncias() {
  const { utilizador } = useAuth()
  const minhas = ref([])
  const aCarregarM = ref(false)
  const erroM = ref(null)

  async function carregar() {
    if (!utilizador.value) return
    aCarregarM.value = true
    erroM.value = null
    try {
      minhas.value = await api.listarMinhas(utilizador.value.id)
    } catch (e) {
      erroM.value = e.message
    } finally {
      aCarregarM.value = false
    }
  }

  const detalhesDe = async (id) => {
    const [historico, mensagens] = await Promise.all([api.historicoDe(id), api.mensagensDe(id)])
    return { historico, mensagens }
  }

  async function responder(id, mensagem) {
    await api.responderPedido(id, mensagem)
    await carregar()
  }

  return { minhas, aCarregar: aCarregarM, erro: erroM, carregar, detalhesDe, responder }
}

// ===== Submissão de uma nova denúncia =====
export function useNovaDenuncia() {
  const { utilizador } = useAuth()
  const aEnviar = ref(false)

  async function submeter(dados, ficheiro) {
    aEnviar.value = true
    try {
      const d = await api.criarDenuncia(dados, ficheiro, utilizador.value.id)
      return d
    } finally {
      aEnviar.value = false
    }
  }
  return { aEnviar, submeter }
}
