import { ref, computed } from 'vue'
import api from '@/services/api'
import { isStaff, isCidadao } from '@/constants/funcoes'

// Estado de autenticação partilhado (singleton)
const utilizador = ref(null)
const perfil = ref(null)
const pronto = ref(false)

async function carregarPerfil(user) {
  utilizador.value = user
  perfil.value = null
  if (!user) return
  try {
    perfil.value = await api.obterPerfil(user.id)
  } catch (e) {
    console.error(e)
  }
  // Se o trigger ainda não criou o perfil, usa os dados mínimos da sessão
  if (!perfil.value) perfil.value = { id: user.id, email: user.email, nome: user.user_metadata?.nome || user.email, funcao: 'cidadao', ativo: true }
  // Conta desactivada por um administrador: termina a sessão
  if (perfil.value.ativo === false) {
    await api.sair()
    utilizador.value = null
    perfil.value = null
    throw new Error('Esta conta foi desactivada por um administrador. Contacte o ViaAlerta.')
  }
}

// Chamado uma vez em main.js, antes de montar a app
export async function iniciarAuth() {
  try {
    await carregarPerfil(await api.obterSessao())
  } catch (e) {
    console.error('[auth]', e)
  }
  api.aoMudarAuth((user) => {
    if (user?.id !== utilizador.value?.id) carregarPerfil(user).catch((e) => console.warn(e.message))
  })
  pronto.value = true
}

export function useAuth() {
  const autenticado = computed(() => !!utilizador.value)
  const staff = computed(() => isStaff(perfil.value?.funcao))
  const admin = computed(() => perfil.value?.funcao === 'admin')
  const cidadao = computed(() => isCidadao(perfil.value?.funcao))

  async function entrar(email, password) {
    const user = await api.entrar({ email, password })
    await carregarPerfil(user)
  }

  async function registar(nome, email, password) {
    const r = await api.registar({ nome, email, password })
    if (!r.precisaConfirmacao) await carregarPerfil(r.user)
    return r
  }

  async function terminarSessao() {
    await api.sair()
    await carregarPerfil(null)
  }

  const recuperarPassword = (email) => api.recuperarPassword(email)

  return { utilizador, perfil, pronto, autenticado, staff, admin, cidadao, entrar, registar, terminarSessao, recuperarPassword }
}
