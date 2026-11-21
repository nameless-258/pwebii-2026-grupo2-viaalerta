import { reactive } from 'vue'

// Categorias por omissão (cores inspiradas na bandeira de Moçambique).
// O administrador pode editá-las, criar novas ou desactivá-las na página Configuração;
// a lista real é carregada da base de dados por useConfiguracao().
// A cor de cada categoria é SEMPRE a mesma no mapa, na legenda e nos badges.
export const CATEGORIAS_PADRAO = [
  { id: 'buraco_estrada', nome: 'Buracos nas estradas', cor: '#0B8A4E', texto: '#FFFFFF', icone: 'construcao', ativa: true, ordem: 1 },
  { id: 'passeio_danificado', nome: 'Passeios danificados', cor: '#F2C500', texto: '#1A1A1A', icone: 'pegadas', ativa: true, ordem: 2 },
  { id: 'iluminacao_avariada', nome: 'Iluminação pública avariada', cor: '#D21034', texto: '#FFFFFF', icone: 'lampada', ativa: true, ordem: 3 },
  { id: 'semaforo_sinal', nome: 'Semáforos e sinais danificados', cor: '#FFFFFF', texto: '#1A1A1A', icone: 'transito', borda: '#1A1A1A', ativa: true, ordem: 4 },
  { id: 'erosao', nome: 'Estradas danificadas por erosão', cor: '#1A1A1A', texto: '#FFFFFF', icone: 'montanha', ativa: true, ordem: 5 }
]

// Lista reactiva partilhada (todas as categorias, incluindo desactivadas)
export const CATEGORIAS = reactive(CATEGORIAS_PADRAO.map((c) => ({ ...c })))

export function aplicarCategorias(lista) {
  if (!Array.isArray(lista) || !lista.length) return
  const ordenadas = [...lista].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
  CATEGORIAS.splice(0, CATEGORIAS.length, ...ordenadas)
}

export const categoriasAtivas = () => CATEGORIAS.filter((c) => c.ativa !== false)

const DESCONHECIDA = { id: 'outra', nome: 'Outra', cor: '#5B6B64', texto: '#FFFFFF', icone: 'alerta', ativa: false }
export const categoriaPorId = (id) => CATEGORIAS.find((c) => c.id === id) || { ...DESCONHECIDA, id, nome: id }

// Ícones que o administrador pode escolher para uma categoria
export const ICONES_CATEGORIA = ['construcao', 'pegadas', 'lampada', 'transito', 'montanha', 'alerta', 'pin', 'lixo', 'mapa', 'escudo', 'camera', 'info']
