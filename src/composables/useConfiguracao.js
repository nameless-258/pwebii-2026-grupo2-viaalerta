import { reactive } from 'vue'
import api from '@/services/api'
import { aplicarCategorias } from '@/constants/categorias'

// Regras do sistema, partilhadas por toda a aplicação (editáveis pelo administrador).
// Os valores por omissão são usados até a base de dados responder.
export const configuracao = reactive({
  fotoObrigatoria: true,
  permitirAnonimas: true,
  descricaoMin: 20,
  fotoMaxMb: 10,
  atualizadoEm: null,
  carregada: false
})

export async function carregarConfiguracao() {
  try {
    const [cats, cfg] = await Promise.all([api.listarCategorias(), api.obterConfiguracao()])
    aplicarCategorias(cats)
    if (cfg) Object.assign(configuracao, cfg)
  } catch (e) {
    console.warn('[configuração] a usar valores por omissão:', e.message)
  } finally {
    configuracao.carregada = true
  }
}

export function useConfiguracao() {
  async function guardarCategoria(c) {
    await api.guardarCategoria(c)
    aplicarCategorias(await api.listarCategorias())
  }
  async function guardarRegras(cfg) {
    await api.guardarConfiguracao(cfg)
    Object.assign(configuracao, (await api.obterConfiguracao()) || cfg)
  }
  return { configuracao, guardarCategoria, guardarRegras, recarregar: carregarConfiguracao }
}
