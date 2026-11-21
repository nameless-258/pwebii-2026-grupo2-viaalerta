import { ref, computed } from 'vue'
import api from '@/services/api'
import { useNotifications } from './useNotifications'
import { invalidarPublicas } from './useIncidents'

// Gestão e moderação (apenas responsáveis/administradores — reforçado pelas RLS do Supabase)
const todas = ref([])
const aCarregar = ref(false)
const erro = ref(null)

export function useAdmin() {
  const { enviarEmailEstado } = useNotifications()

  async function carregarTodas() {
    aCarregar.value = true
    erro.value = null
    try {
      todas.value = await api.listarTodas()
    } catch (e) {
      erro.value = e.message
    } finally {
      aCarregar.value = false
    }
  }

  // Estatísticas internas (inclui dados de moderação, ao contrário do dashboard público)
  const estatisticas = computed(() => {
    const c = (e) => todas.value.filter((d) => d.estado === e).length
    return {
      total: todas.value.length,
      pendente: c('pendente'),
      em_analise: c('em_analise') + c('precisa_info'),
      publicada: c('publicada'),
      rejeitada: c('rejeitada'),
      em_resolucao: c('em_resolucao'),
      resolvida: c('resolvida')
    }
  })

  const obter = (id) => api.obterDenuncia(id)
  const historico = (id) => api.historicoDe(id)
  const mensagens = (id) => api.mensagensDe(id)

  // Altera o estado (regista responsável e data no histórico) e avisa o cidadão por email
  async function alterarEstado(denuncia, novoEstado, nota) {
    await api.alterarEstado(denuncia.id, novoEstado, nota)
    invalidarPublicas()
    const email = await enviarEmailEstado(denuncia, novoEstado, nota)
    const i = todas.value.findIndex((d) => d.id === denuncia.id)
    if (i >= 0) todas.value[i] = { ...todas.value[i], estado: novoEstado }
    return email.estado
  }

  // Utilizadores (apenas administradores)
  const listarUtilizadores = () => api.listarUtilizadores()
  const alterarFuncao = (id, funcao) => api.alterarFuncao(id, funcao)
  const historicoFuncoes = () => api.historicoFuncoes()
  const criarResponsavel = (dados) => api.criarResponsavel(dados)
  const alterarEstadoConta = (id, ativo) => api.alterarEstadoConta(id, ativo)
  const listarAuditoria = () => api.listarAuditoria()

  return { todas, aCarregar, erro, estatisticas, carregarTodas, obter, historico, mensagens, alterarEstado, listarUtilizadores, alterarFuncao, historicoFuncoes, criarResponsavel, alterarEstadoConta, listarAuditoria }
}
