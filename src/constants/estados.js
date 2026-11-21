// Estados possíveis de uma denúncia e regras de visibilidade pública.
export const ESTADOS = {
  pendente: { nome: 'Pendente', cor: '#8a6d00', fundo: 'var(--yellow-soft)', publico: false },
  em_analise: { nome: 'Em análise', cor: 'var(--blue)', fundo: 'var(--blue-soft)', publico: false },
  precisa_info: { nome: 'Precisa de informação', cor: '#b35c00', fundo: 'var(--yellow-soft)', publico: false },
  rejeitada: { nome: 'Rejeitada', cor: 'var(--red)', fundo: 'var(--red-soft)', publico: false },
  publicada: { nome: 'Publicada', cor: 'var(--primary)', fundo: 'var(--primary-soft)', publico: true },
  em_resolucao: { nome: 'Em resolução', cor: '#b35c00', fundo: 'var(--yellow-soft)', publico: true },
  resolvida: { nome: 'Resolvida', cor: 'var(--text-muted)', fundo: 'var(--surface-2)', publico: false }
}

// Estados que aparecem no mapa e nas listas públicas (pins visíveis).
export const ESTADOS_PUBLICOS = ['publicada', 'em_resolucao']

// Transições permitidas no painel de moderação (validadas também no Supabase).
export const TRANSICOES = {
  pendente: ['em_analise', 'precisa_info', 'publicada', 'rejeitada'],
  em_analise: ['precisa_info', 'publicada', 'rejeitada'],
  precisa_info: ['em_analise', 'publicada', 'rejeitada'],
  publicada: ['em_resolucao', 'resolvida'],
  em_resolucao: ['resolvida'],
  rejeitada: [],
  resolvida: []
}

// Nome da acção apresentada no botão para cada estado de destino.
export const ACOES = {
  em_analise: 'Iniciar análise',
  precisa_info: 'Pedir dados em falta',
  publicada: 'Aprovar e publicar',
  rejeitada: 'Rejeitar',
  em_resolucao: 'Marcar em resolução',
  resolvida: 'Marcar como resolvida'
}

export const estadoInfo = (id) => ESTADOS[id] || { nome: id, cor: 'var(--text-muted)', fundo: 'var(--surface-2)' }
