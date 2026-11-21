import { ref, computed } from 'vue'
import api from '@/services/api'
import { enviarEmail } from '@/services/email'
import { estadoInfo } from '@/constants/estados'
import { useAuth } from './useAuth'

// Notificações na aplicação (sino) + emails ao cidadão
const notificacoes = ref([])
const aCarregar = ref(false)
let temporizador = null

const linkDenuncia = (id) => `${window.location.origin}${window.location.pathname}#/minhas-denuncias?d=${id}`

const MENSAGENS_ESTADO = {
  em_analise: 'A sua denúncia começou a ser analisada por um responsável do ViaAlerta.',
  precisa_info: 'Faltam dados na sua denúncia. Veja o que falta e responda na página «Minhas denúncias».',
  publicada: 'Boas notícias! A sua denúncia foi verificada e já está publicada no mapa público.',
  rejeitada: 'Infelizmente a sua denúncia não foi aprovada. Consulte o motivo em «Minhas denúncias».',
  em_resolucao: 'O problema que denunciou está agora a ser tratado.',
  resolvida: 'O problema que denunciou foi marcado como resolvido. Obrigado por ajudar a melhorar Moçambique!'
}

export function useNotifications() {
  const { utilizador } = useAuth()
  const naoLidas = computed(() => notificacoes.value.filter((n) => !n.lida).length)

  async function carregar() {
    if (!utilizador.value) { notificacoes.value = []; return }
    aCarregar.value = true
    try {
      notificacoes.value = await api.listarNotificacoes()
    } catch (e) {
      console.warn('[notificações]', e)
    } finally {
      aCarregar.value = false
    }
  }

  // Actualiza de 2 em 2 minutos e quando o separador volta a estar visível (poupa dados)
  function iniciar() {
    carregar()
    clearInterval(temporizador)
    temporizador = setInterval(() => { if (document.visibilityState === 'visible') carregar() }, 120000)
    document.addEventListener('visibilitychange', aoMudarVisibilidade)
  }
  function parar() {
    clearInterval(temporizador)
    document.removeEventListener('visibilitychange', aoMudarVisibilidade)
  }
  function aoMudarVisibilidade() { if (document.visibilityState === 'visible') carregar() }

  async function marcarLidas() {
    if (!naoLidas.value) return
    notificacoes.value = notificacoes.value.map((n) => ({ ...n, lida: true }))
    try { await api.marcarNotificacoesLidas(utilizador.value.id) } catch (e) { console.warn(e) }
  }

  // Email 1 — confirmação ao cidadão depois de submeter (acção do utilizador)
  async function enviarEmailConfirmacao(perfil, denuncia) {
    const estado = await enviarEmail({
      to_email: perfil?.email,
      to_name: perfil?.nome || 'Cidadão',
      assunto: `Denúncia ${denuncia.referencia} recebida`,
      mensagem: `Recebemos a sua denúncia «${denuncia.titulo}» (${denuncia.localidade}, ${denuncia.distrito}). Ficará pendente até ser verificada por um responsável. Será notificado quando o estado mudar.`,
      referencia: denuncia.referencia,
      estado: estadoInfo('pendente').nome,
      link: linkDenuncia(denuncia.id)
    })
    return { estado }
  }

  // Email 2 — aviso ao cidadão quando um responsável altera o estado
  async function enviarEmailEstado(denuncia, novoEstado, nota) {
    if (!denuncia?.autor?.email) return { estado: 'falhou' }
    const estado = await enviarEmail({
      to_email: denuncia.autor.email,
      to_name: denuncia.autor.nome || 'Cidadão',
      assunto: `Denúncia ${denuncia.referencia}: ${estadoInfo(novoEstado).nome}`,
      mensagem: MENSAGENS_ESTADO[novoEstado] + (nota ? `\n\nNota do responsável: ${nota}` : ''),
      referencia: denuncia.referencia,
      estado: estadoInfo(novoEstado).nome,
      link: linkDenuncia(denuncia.id)
    })
    return { estado }
  }

  return { notificacoes, naoLidas, aCarregar, carregar, iniciar, parar, marcarLidas, enviarEmailConfirmacao, enviarEmailEstado }
}
