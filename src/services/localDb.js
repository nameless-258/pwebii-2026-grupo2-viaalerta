// "Modo demonstração": implementação local (localStorage) com a MESMA interface do backendSupabase.js.
// É usada automaticamente quando o .env não tem as chaves do Supabase, para que a aplicação
// possa ser testada sem servidor. As regras (estados, visibilidade, permissões) imitam as do schema.sql.
// Os dados iniciais (fictícios) vêm de public/dados/denuncias_demo.json, carregado com fetch().
import { ESTADOS_PUBLICOS, TRANSICOES } from '@/constants/estados'
import { isStaff } from '@/constants/funcoes'
import { CATEGORIAS_PADRAO } from '@/constants/categorias'

const CONFIG_PADRAO = { fotoObrigatoria: true, permitirAnonimas: true, descricaoMin: 20, fotoMaxMb: 10 }

const CHAVE_DB = 'viaalerta-demo-db-v5'
const CHAVE_SESSAO = 'viaalerta-demo-sessao'
const ouvintesAuth = new Set()
const ouvintesEventos = new Set()
let db = null

// Armazenamento seguro: se o localStorage estiver bloqueado, usa memória (os dados duram só a sessão)
const memoria = {}
const armazem = {
  get: (k) => { try { return localStorage.getItem(k) } catch { return memoria[k] ?? null } },
  set: (k, v) => { try { localStorage.setItem(k, v) } catch { memoria[k] = v } },
  del: (k) => { try { localStorage.removeItem(k) } catch { delete memoria[k] } }
}

const agora = () => new Date().toISOString()
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36))
const espera = (ms = 250) => new Promise((r) => setTimeout(r, ms)) // simula latência de rede

async function hash(texto) {
  const dados = new TextEncoder().encode('viaalerta:' + texto)
  const buf = await crypto.subtle.digest('SHA-256', dados)
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function guardar() {
  try {
    armazem.set(CHAVE_DB, JSON.stringify(db))
  } catch {
    throw new Error('O armazenamento do navegador está cheio. Use fotografias mais pequenas.')
  }
}

async function carregar() {
  if (db) return db
  const bruto = armazem.get(CHAVE_DB)
  if (bruto) {
    db = JSON.parse(bruto)
    return db
  }
  const resp = await fetch(`${import.meta.env.BASE_URL}dados/denuncias_demo.json`)
  if (!resp.ok) throw new Error('Não foi possível carregar os dados de demonstração.')
  const semente = await resp.json()
  db = { seq: 0, utilizadores: [], incidentes: [], historico: [], mensagens: [], notificacoes: [], funcoesLog: [], eventos: [], auditoria: [],
    categorias: CATEGORIAS_PADRAO.map((c) => ({ ...c })), configuracao: { ...CONFIG_PADRAO, atualizadoEm: agora() } }
  for (const u of semente.utilizadores) {
    db.utilizadores.push({ id: u.id, nome: u.nome, email: u.email, funcao: u.funcao, ativo: true, passwordHash: await hash(u.password), criado_em: semente.dataBase })
  }
  for (const i of semente.incidentes) {
    db.seq += 1
    const inc = { ...i, referencia: `VA-2026-${String(db.seq).padStart(4, '0')}`, foto_path: i.foto ? `${import.meta.env.BASE_URL}${i.foto}` : null }
    delete inc.foto
    delete inc.historico
    db.incidentes.push(inc)
    for (const h of i.historico) db.historico.push({ id: uuid(), incidente_id: i.id, estado: h.estado, nota: h.nota || null, actor_id: h.actor_id || null, criado_em: h.criado_em })
    for (const h of i.historico) {
      if (h.nota && h.actor_id !== i.user_id) db.mensagens.push({ id: uuid(), incidente_id: i.id, autor_id: h.actor_id, mensagem: h.nota, de_staff: true, criado_em: h.criado_em })
    }
  }
  guardar()
  return db
}

// Sincroniza entre separadores do navegador (simula o "tempo real")
window.addEventListener('storage', (e) => {
  if (e.key === CHAVE_DB && e.newValue) {
    db = JSON.parse(e.newValue)
    ouvintesEventos.forEach((cb) => cb({}))
  }
  if (e.key === CHAVE_SESSAO) {
    utilizadorSessao().then((u) => ouvintesAuth.forEach((cb) => cb(u)))
  }
})

function emitirEvento(incidenteId, estado) {
  db.eventos.push({ id: uuid(), incidente_id: incidenteId, estado, criado_em: agora() })
  db.eventos = db.eventos.slice(-50)
  ouvintesEventos.forEach((cb) => cb({ incidente_id: incidenteId, estado }))
}

async function utilizadorSessao() {
  await carregar()
  const id = armazem.get(CHAVE_SESSAO)
  const u = db.utilizadores.find((x) => x.id === id)
  return u ? { id: u.id, email: u.email } : null
}

async function exigir(staff = false, admin = false) {
  const u = await utilizadorSessao()
  if (!u) throw new Error('Sessão expirada. Inicie sessão novamente.')
  const p = db.utilizadores.find((x) => x.id === u.id)
  if (p.ativo === false) throw new Error('Esta conta foi desactivada por um administrador.')
  if (staff && !isStaff(p.funcao)) throw new Error('Sem permissão para esta acção.')
  if (admin && p.funcao !== 'admin') throw new Error('Apenas administradores podem fazer isto.')
  return p
}

function mapear(r, comAutor = false) {
  const autor = comAutor ? db.utilizadores.find((u) => u.id === r.user_id) : null
  return {
    id: r.id, referencia: r.referencia, titulo: r.titulo, categoria: r.categoria, descricao: r.descricao,
    provincia: r.provincia, distrito: r.distrito, localidade: r.localidade,
    lat: Number(r.latitude), lng: Number(r.longitude),
    fotoPath: r.foto_path, fotoUrl: r.foto_path, anonima: r.anonima, estado: r.estado,
    criadoEm: r.criado_em, atualizadoEm: r.atualizado_em, userId: comAutor ? r.user_id : null,
    autor: autor ? { nome: autor.nome, email: autor.email } : null
  }
}
// Versão pública: sem user_id, sem anonimato, sem autor (nunca expor identidade)
const mapearPublica = (r) => ({ ...mapear(r), anonima: null, userId: null, autor: null })

// Registo de auditoria (apenas o administrador o consulta)
function auditar(actorId, acao, alvoTipo, alvo, detalhes = {}) {
  db.auditoria.unshift({ id: uuid(), actor_id: actorId, acao, alvo_tipo: alvoTipo, alvo_id: alvo, detalhes, criado_em: agora() })
  db.auditoria = db.auditoria.slice(0, 500)
}

function notificar(userId, incidenteId, titulo, mensagem) {
  db.notificacoes.unshift({ id: uuid(), user_id: userId, incidente_id: incidenteId, titulo, mensagem, lida: false, criado_em: agora() })
}

// ---------- autenticação ----------
export async function obterSessao() { return utilizadorSessao() }

export async function obterPerfil(userId) {
  await carregar()
  const u = db.utilizadores.find((x) => x.id === userId)
  return u ? { id: u.id, nome: u.nome, email: u.email, funcao: u.funcao, ativo: u.ativo !== false, criado_em: u.criado_em } : null
}

export function aoMudarAuth(cb) {
  ouvintesAuth.add(cb)
  return () => ouvintesAuth.delete(cb)
}

export async function registar({ nome, email, password }) {
  await carregar(); await espera()
  const e = email.trim().toLowerCase()
  if (db.utilizadores.some((u) => u.email === e)) throw new Error('Já existe uma conta com este email.')
  const u = { id: uuid(), nome: nome.trim(), email: e, funcao: 'cidadao', ativo: true, passwordHash: await hash(password), criado_em: agora() }
  db.utilizadores.push(u)
  guardar()
  armazem.set(CHAVE_SESSAO, u.id)
  const user = { id: u.id, email: u.email }
  ouvintesAuth.forEach((cb) => cb(user))
  return { precisaConfirmacao: false, user }
}

export async function entrar({ email, password }) {
  await carregar(); await espera()
  const u = db.utilizadores.find((x) => x.email === email.trim().toLowerCase())
  if (!u || u.passwordHash !== (await hash(password))) throw new Error('Email ou palavra-passe incorrectos.')
  armazem.set(CHAVE_SESSAO, u.id)
  const user = { id: u.id, email: u.email }
  ouvintesAuth.forEach((cb) => cb(user))
  return user
}

export async function sair() {
  armazem.del(CHAVE_SESSAO)
  ouvintesAuth.forEach((cb) => cb(null))
}

export async function recuperarPassword() {
  await espera()
  // No modo demonstração não há servidor de email de autenticação.
}

// ---------- dados públicos ----------
export async function listarPublicas() {
  await carregar(); await espera()
  return db.incidentes.filter((i) => ESTADOS_PUBLICOS.includes(i.estado)).sort((a, b) => b.criado_em.localeCompare(a.criado_em)).map(mapearPublica)
}

export async function obterPublica(id) {
  await carregar(); await espera()
  const i = db.incidentes.find((x) => x.id === id && ESTADOS_PUBLICOS.includes(x.estado))
  return i ? mapearPublica(i) : null
}

export async function historicoPublico(id) {
  await carregar()
  return db.historico
    .filter((h) => h.incidente_id === id && ['publicada', 'em_resolucao', 'resolvida'].includes(h.estado))
    .sort((a, b) => a.criado_em.localeCompare(b.criado_em))
    .map((h) => ({ id: h.id, estado: h.estado, nota: null, criadoEm: h.criado_em, actor: null }))
}

export async function estatisticasPublicas() {
  await carregar(); await espera(150)
  const publicadas = db.incidentes.filter((i) => i.estado === 'publicada').length
  const emResolucao = db.incidentes.filter((i) => i.estado === 'em_resolucao').length
  return { publicadas, emResolucao, totalAtivo: publicadas + emResolucao }
}

export function subscreverAlteracoes(cb) {
  ouvintesEventos.add(cb)
  return () => ouvintesEventos.delete(cb)
}

// ---------- cidadão ----------
function lerFicheiro(ficheiro) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => reject(new Error('Não foi possível ler a fotografia.'))
    r.readAsDataURL(ficheiro)
  })
}

export async function criarDenuncia(dados, ficheiro) {
  const u = await exigir(); await espera(400)
  if (u.funcao !== 'cidadao') throw new Error('Responsáveis e administradores não criam denúncias: apenas gerem as denúncias dos cidadãos.')
  const cfg = db.configuracao
  if (!db.categorias.some((c) => c.id === dados.categoria && c.ativa !== false)) throw new Error('Categoria inválida ou desactivada.')
  if (dados.descricao.trim().length < cfg.descricaoMin) throw new Error(`A descrição deve ter pelo menos ${cfg.descricaoMin} caracteres.`)
  if (dados.anonima && !cfg.permitirAnonimas) throw new Error('As denúncias anónimas estão desactivadas.')
  if (cfg.fotoObrigatoria && !ficheiro) throw new Error('A fotografia é obrigatória.')
  db.seq += 1
  const ano = new Date().getFullYear()
  const inc = {
    id: uuid(), referencia: `VA-${ano}-${String(db.seq).padStart(4, '0')}`, user_id: u.id,
    titulo: dados.titulo, categoria: dados.categoria, descricao: dados.descricao,
    provincia: dados.provincia, distrito: dados.distrito, localidade: dados.localidade,
    latitude: dados.lat, longitude: dados.lng, anonima: dados.anonima,
    foto_path: ficheiro ? await lerFicheiro(ficheiro) : null,
    estado: 'pendente', criado_em: agora(), atualizado_em: agora()
  }
  db.incidentes.push(inc)
  db.historico.push({ id: uuid(), incidente_id: inc.id, estado: 'pendente', nota: 'Denúncia submetida', actor_id: u.id, criado_em: agora() })
  guardar()
  return mapear(inc)
}

export async function listarMinhas(userId) {
  await carregar(); await espera()
  return db.incidentes.filter((i) => i.user_id === userId).sort((a, b) => b.criado_em.localeCompare(a.criado_em)).map((i) => mapear(i))
}

export async function historicoDe(id) {
  await carregar()
  return db.historico
    .filter((h) => h.incidente_id === id)
    .sort((a, b) => a.criado_em.localeCompare(b.criado_em))
    .map((h) => ({ id: h.id, estado: h.estado, nota: h.nota, criadoEm: h.criado_em, actor: db.utilizadores.find((u) => u.id === h.actor_id)?.nome || null }))
}

export async function mensagensDe(id) {
  await carregar()
  return db.mensagens.filter((m) => m.incidente_id === id).map((m) => ({ id: m.id, mensagem: m.mensagem, deStaff: m.de_staff, criadoEm: m.criado_em }))
}

export async function responderPedido(id, mensagem) {
  const u = await exigir(); await espera()
  const inc = db.incidentes.find((i) => i.id === id && i.user_id === u.id)
  if (!inc) throw new Error('Denúncia não encontrada.')
  if (inc.estado !== 'precisa_info') throw new Error('Esta denúncia não está à espera de informação.')
  db.mensagens.push({ id: uuid(), incidente_id: id, autor_id: u.id, mensagem, de_staff: false, criado_em: agora() })
  inc.estado = 'em_analise'
  inc.atualizado_em = agora()
  db.historico.push({ id: uuid(), incidente_id: id, estado: 'em_analise', nota: 'Cidadão respondeu ao pedido de informação', actor_id: u.id, criado_em: agora() })
  guardar()
}

// ---------- notificações ----------
export async function listarNotificacoes() {
  const u = await utilizadorSessao()
  if (!u) return []
  return db.notificacoes.filter((n) => n.user_id === u.id).slice(0, 30).map((n) => ({ id: n.id, titulo: n.titulo, mensagem: n.mensagem, lida: n.lida, incidenteId: n.incidente_id, criadoEm: n.criado_em }))
}

export async function marcarNotificacoesLidas(userId) {
  await carregar()
  db.notificacoes.forEach((n) => { if (n.user_id === userId) n.lida = true })
  guardar()
}

// ---------- responsáveis / administradores ----------
export async function listarTodas() {
  await exigir(true); await espera()
  return [...db.incidentes].sort((a, b) => b.criado_em.localeCompare(a.criado_em)).map((i) => mapear(i, true))
}

export async function obterDenuncia(id) {
  await exigir(true); await espera()
  const i = db.incidentes.find((x) => x.id === id)
  return i ? mapear(i, true) : null
}

const TEXTO_NOTIFICACAO = {
  em_analise: ['A sua denúncia está em análise', 'Um responsável começou a analisar a sua denúncia.'],
  precisa_info: ['Faltam dados na sua denúncia', 'Um responsável indicou que faltam dados na sua denúncia.'],
  publicada: ['Denúncia aprovada e publicada', 'A sua denúncia foi aprovada e já está visível no mapa público.'],
  rejeitada: ['Denúncia rejeitada', 'A sua denúncia não foi aprovada.'],
  em_resolucao: ['Problema em resolução', 'O problema que denunciou está a ser tratado.'],
  resolvida: ['Problema resolvido', 'O problema que denunciou foi marcado como resolvido. Obrigado!']
}

export async function alterarEstado(id, estado, nota) {
  const staff = await exigir(true); await espera()
  const inc = db.incidentes.find((x) => x.id === id)
  if (!inc) throw new Error('Denúncia não encontrada.')
  if (!(TRANSICOES[inc.estado] || []).includes(estado)) throw new Error('Transição de estado não permitida.')
  if ((estado === 'precisa_info' || estado === 'rejeitada') && !nota) throw new Error('Indique o motivo.')
  inc.estado = estado
  inc.atualizado_em = agora()
  db.historico.push({ id: uuid(), incidente_id: id, estado, nota: nota || null, actor_id: staff.id, criado_em: agora() })
  if (nota) db.mensagens.push({ id: uuid(), incidente_id: id, autor_id: staff.id, mensagem: nota, de_staff: true, criado_em: agora() })
  const [t, m] = TEXTO_NOTIFICACAO[estado]
  notificar(inc.user_id, id, t, `${inc.referencia}: ${m}`)
  emitirEvento(id, estado)
  auditar(staff.id, 'alterar_estado', 'denuncia', inc.referencia, { de: db.historico.filter((h) => h.incidente_id === id).slice(-2)[0]?.estado, para: estado, nota: nota || null })
  guardar()
}

export async function listarUtilizadores() {
  await exigir(true); await espera()
  return db.utilizadores.map(({ passwordHash, ...u }) => u).sort((a, b) => b.criado_em.localeCompare(a.criado_em))
}

export async function alterarFuncao(userId, funcao) {
  const admin = await exigir(true, true); await espera()
  if (userId === admin.id) throw new Error('Não pode alterar a sua própria função.')
  const u = db.utilizadores.find((x) => x.id === userId)
  if (!u) throw new Error('Utilizador não encontrado.')
  db.funcoesLog.unshift({ id: uuid(), user_id: userId, funcao_antiga: u.funcao, funcao_nova: funcao, alterado_por: admin.id, criado_em: agora() })
  auditar(admin.id, 'alterar_funcao', 'utilizador', u.email, { de: u.funcao, para: funcao })
  u.funcao = funcao
  guardar()
}

export async function historicoFuncoes() {
  await exigir(true, true)
  return db.funcoesLog.slice(0, 50).map((r) => ({
    id: r.id, antiga: r.funcao_antiga, nova: r.funcao_nova, criadoEm: r.criado_em,
    alvo: db.utilizadores.find((u) => u.id === r.user_id)?.nome,
    autor: db.utilizadores.find((u) => u.id === r.alterado_por)?.nome
  }))
}

// ---------- administração: contas, auditoria, categorias e regras ----------
export async function criarResponsavel({ nome, email, password }) {
  const admin = await exigir(true, true); await espera()
  const e = email.trim().toLowerCase()
  if (db.utilizadores.some((u) => u.email === e)) throw new Error('Já existe uma conta com este email.')
  const u = { id: uuid(), nome: nome.trim(), email: e, funcao: 'responsavel', ativo: true, passwordHash: await hash(password), criado_em: agora() }
  db.utilizadores.push(u)
  db.funcoesLog.unshift({ id: uuid(), user_id: u.id, funcao_antiga: 'cidadao', funcao_nova: 'responsavel', alterado_por: admin.id, criado_em: agora() })
  auditar(admin.id, 'criar_responsavel', 'utilizador', e)
  guardar()
  return { precisaConfirmacao: false }
}

export async function alterarEstadoConta(userId, ativo) {
  const admin = await exigir(true, true); await espera()
  if (userId === admin.id) throw new Error('Não pode desactivar a sua própria conta.')
  const u = db.utilizadores.find((x) => x.id === userId)
  if (!u) throw new Error('Utilizador não encontrado.')
  u.ativo = ativo
  auditar(admin.id, ativo ? 'activar_conta' : 'desactivar_conta', 'utilizador', u.email)
  guardar()
}

export async function listarAuditoria() {
  await exigir(true, true); await espera()
  return db.auditoria.map((r) => {
    const a = db.utilizadores.find((u) => u.id === r.actor_id)
    return { id: r.id, acao: r.acao, alvoTipo: r.alvo_tipo, alvo: r.alvo_id, detalhes: r.detalhes || {}, criadoEm: r.criado_em, actor: a?.nome || '—' }
  })
}

export async function listarCategorias() {
  await carregar()
  return db.categorias.map((c) => ({ ...c }))
}

export async function guardarCategoria(c) {
  const admin = await exigir(true, true); await espera()
  const i = db.categorias.findIndex((x) => x.id === c.id)
  const nova = { id: c.id, nome: c.nome.trim(), cor: c.cor.toUpperCase(), texto: c.texto.toUpperCase(), borda: c.borda || undefined, icone: c.icone, ativa: c.ativa, ordem: c.ordem }
  if (i >= 0) db.categorias[i] = nova
  else db.categorias.push(nova)
  auditar(admin.id, i >= 0 ? 'editar_categoria' : 'criar_categoria', 'categoria', c.id, { nome: c.nome, cor: c.cor, ativa: c.ativa })
  guardar()
}

export async function obterConfiguracao() {
  await carregar()
  return { ...db.configuracao }
}

export async function guardarConfiguracao(cfg) {
  const admin = await exigir(true, true); await espera()
  db.configuracao = { fotoObrigatoria: cfg.fotoObrigatoria, permitirAnonimas: cfg.permitirAnonimas, descricaoMin: cfg.descricaoMin, fotoMaxMb: cfg.fotoMaxMb, atualizadoEm: agora() }
  auditar(admin.id, 'alterar_regras', 'sistema', 'configuracoes', { ...cfg })
  guardar()
}

// Apenas para testes: repõe os dados de demonstração
export function reporDemo() {
  armazem.del(CHAVE_DB)
  armazem.del(CHAVE_SESSAO)
  db = null
}
