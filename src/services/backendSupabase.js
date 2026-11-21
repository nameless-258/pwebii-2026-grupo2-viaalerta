// Implementação do acesso a dados com Supabase (Auth + PostgreSQL + Storage + Realtime).
// Todas as regras de segurança estão também em supabase/schema.sql (RLS, funções e triggers).
import { createClient } from '@supabase/supabase-js'
import { supabase, BUCKET_FOTOS, url, anonKey } from './supabase'

// ---------- utilitários ----------
function falha(error, mensagem) {
  if (error) {
    console.error('[Supabase]', error)
    throw new Error(traduzirErro(error.message) || mensagem)
  }
}

function traduzirErro(msg = '') {
  if (msg.includes('Invalid login credentials')) return 'Email ou palavra-passe incorrectos.'
  if (msg.includes('Email not confirmed')) return 'Confirme o seu email antes de iniciar sessão (verifique a caixa de entrada).'
  if (msg.includes('User already registered')) return 'Já existe uma conta com este email.'
  if (msg.includes('Password should be')) return 'A palavra-passe deve ter pelo menos 6 caracteres.'
  if (msg.includes('email rate limit')) return 'O Supabase atingiu o limite de emails de confirmação por hora. Desligue «Confirm email» em Authentication ou aguarde.'
  if (msg.includes('rate limit')) return 'Demasiadas tentativas. Aguarde um pouco e tente novamente.'
  if (msg.includes('Failed to fetch')) return 'Sem ligação ao servidor. Verifique a sua Internet.'
  return msg
}

export function mapearDenuncia(r) {
  if (!r) return null
  return {
    id: r.id,
    referencia: r.referencia,
    titulo: r.titulo,
    categoria: r.categoria,
    descricao: r.descricao,
    provincia: r.provincia,
    distrito: r.distrito,
    localidade: r.localidade,
    lat: Number(r.latitude),
    lng: Number(r.longitude),
    fotoPath: r.foto_path,
    fotoUrl: null,
    anonima: r.anonima ?? null,
    estado: r.estado,
    criadoEm: r.criado_em,
    atualizadoEm: r.atualizado_em,
    userId: r.user_id ?? null,
    autor: r.autor ? { nome: r.autor.nome, email: r.autor.email } : null
  }
}

const mapearHistorico = (h) => ({ id: h.id, estado: h.estado, nota: h.nota ?? null, criadoEm: h.criado_em, actor: h.actor?.nome ?? null })

// Gera URLs assinadas (temporárias) para as fotografias — o bucket é privado.
// Fotografias de exemplo incluídas no próprio site (public/images/demo/...), usadas nos dados de exemplo
const ehFotoExemplo = (p) => typeof p === 'string' && p.startsWith('images/demo/')

async function juntarFotos(lista) {
  lista = lista.map((d) => (ehFotoExemplo(d.fotoPath) ? { ...d, fotoUrl: `${import.meta.env.BASE_URL}${d.fotoPath}` } : d))
  const caminhos = [...new Set(lista.map((d) => d.fotoPath).filter((p) => p && !ehFotoExemplo(p)))]
  if (!caminhos.length) return lista
  const { data, error } = await supabase.storage.from(BUCKET_FOTOS).createSignedUrls(caminhos, 60 * 60)
  if (error) { console.warn('[Supabase] fotos', error); return lista }
  const mapa = Object.fromEntries(data.filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl]))
  return lista.map((d) => (ehFotoExemplo(d.fotoPath) ? d : { ...d, fotoUrl: mapa[d.fotoPath] || null }))
}

// ---------- autenticação ----------
export async function obterSessao() {
  const { data } = await supabase.auth.getSession()
  return data.session?.user ?? null
}

export async function obterPerfil(userId) {
  const { data, error } = await supabase.from('profiles').select('id, nome, email, funcao, ativo, criado_em').eq('id', userId).maybeSingle()
  falha(error, 'Não foi possível carregar o perfil.')
  return data
}

export function aoMudarAuth(cb) {
  const { data } = supabase.auth.onAuthStateChange((_evento, sessao) => cb(sessao?.user ?? null))
  return () => data.subscription.unsubscribe()
}

export async function registar({ nome, email, password }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nome }, emailRedirectTo: window.location.origin + window.location.pathname }
  })
  falha(error, 'Não foi possível criar a conta.')
  return { precisaConfirmacao: !data.session, user: data.user }
}

export async function entrar({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  falha(error, 'Não foi possível iniciar sessão.')
  return data.user
}

export async function sair() {
  await supabase.auth.signOut()
}

export async function recuperarPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname
  })
  falha(error, 'Não foi possível enviar o email de recuperação.')
}

// ---------- dados públicos ----------
const COLUNAS_PUBLICAS = 'id, referencia, titulo, categoria, descricao, provincia, distrito, localidade, latitude, longitude, foto_path, estado, criado_em, atualizado_em'

export async function listarPublicas() {
  const { data, error } = await supabase.from('denuncias_publicas').select(COLUNAS_PUBLICAS).order('criado_em', { ascending: false }).limit(500)
  falha(error, 'Não foi possível carregar as denúncias.')
  return juntarFotos(data.map(mapearDenuncia))
}

export async function obterPublica(id) {
  const { data, error } = await supabase.from('denuncias_publicas').select(COLUNAS_PUBLICAS).eq('id', id).maybeSingle()
  falha(error, 'Não foi possível carregar a denúncia.')
  if (!data) return null
  const [d] = await juntarFotos([mapearDenuncia(data)])
  return d
}

export async function historicoPublico(id) {
  const { data, error } = await supabase.from('historico_publico').select('id, estado, criado_em').eq('incidente_id', id).order('criado_em')
  falha(error, 'Não foi possível carregar o histórico.')
  return data.map(mapearHistorico)
}

export async function estatisticasPublicas() {
  const { data, error } = await supabase.from('estatisticas_publicas').select('*').single()
  falha(error, 'Não foi possível carregar as estatísticas.')
  return { publicadas: data.publicadas, emResolucao: data.em_resolucao, totalAtivo: data.total_ativo }
}

// Tempo real: a tabela eventos_publicos recebe uma linha (sem dados pessoais) sempre que
// uma denúncia muda de estado. O mapa volta a carregar quando chega um evento.
export function subscreverAlteracoes(cb) {
  const canal = supabase
    .channel('eventos-publicos')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'eventos_publicos' }, (p) => cb(p.new))
    .subscribe()
  return () => supabase.removeChannel(canal)
}

// ---------- cidadão ----------
export async function criarDenuncia(dados, ficheiro, userId) {
  let fotoPath = null
  if (ficheiro) {
    const ext = (ficheiro.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
    fotoPath = `${userId}/${crypto.randomUUID()}.${ext}`
    const { error: errFoto } = await supabase.storage.from(BUCKET_FOTOS).upload(fotoPath, ficheiro, { contentType: ficheiro.type, upsert: false })
    falha(errFoto, 'Não foi possível enviar a fotografia.')
  }
  const { data, error } = await supabase
    .from('incidentes')
    .insert({
      user_id: userId,
      titulo: dados.titulo,
      categoria: dados.categoria,
      descricao: dados.descricao,
      provincia: dados.provincia,
      distrito: dados.distrito,
      localidade: dados.localidade,
      latitude: dados.lat,
      longitude: dados.lng,
      foto_path: fotoPath,
      anonima: dados.anonima
    })
    .select('*')
    .single()
  falha(error, 'Não foi possível submeter a denúncia.')
  return mapearDenuncia(data)
}

export async function listarMinhas(userId) {
  const { data, error } = await supabase.from('incidentes').select('*').eq('user_id', userId).order('criado_em', { ascending: false })
  falha(error, 'Não foi possível carregar as suas denúncias.')
  return juntarFotos(data.map(mapearDenuncia))
}

export async function historicoDe(id) {
  const { data, error } = await supabase.from('historico_estados').select('id, estado, nota, criado_em, actor:profiles(nome)').eq('incidente_id', id).order('criado_em')
  falha(error, 'Não foi possível carregar o histórico.')
  return data.map(mapearHistorico)
}

export async function mensagensDe(id) {
  const { data, error } = await supabase.from('mensagens').select('id, mensagem, de_staff, criado_em').eq('incidente_id', id).order('criado_em')
  falha(error, 'Não foi possível carregar as mensagens.')
  return data.map((m) => ({ id: m.id, mensagem: m.mensagem, deStaff: m.de_staff, criadoEm: m.criado_em }))
}

export async function responderPedido(id, mensagem) {
  const { error } = await supabase.rpc('responder_pedido', { p_incidente: id, p_mensagem: mensagem })
  falha(error, 'Não foi possível enviar a resposta.')
}

// ---------- notificações ----------
export async function listarNotificacoes() {
  const { data, error } = await supabase.from('notificacoes').select('*').order('criado_em', { ascending: false }).limit(30)
  falha(error, 'Não foi possível carregar as notificações.')
  return data.map((n) => ({ id: n.id, titulo: n.titulo, mensagem: n.mensagem, lida: n.lida, incidenteId: n.incidente_id, criadoEm: n.criado_em }))
}

export async function marcarNotificacoesLidas(userId) {
  const { error } = await supabase.from('notificacoes').update({ lida: true }).eq('user_id', userId).eq('lida', false)
  falha(error, 'Não foi possível actualizar as notificações.')
}

// ---------- responsáveis / administradores ----------
export async function listarTodas() {
  const { data, error } = await supabase.from('incidentes').select('*, autor:profiles(nome, email)').order('criado_em', { ascending: false }).limit(1000)
  falha(error, 'Não foi possível carregar as denúncias.')
  return data.map(mapearDenuncia)
}

export async function obterDenuncia(id) {
  const { data, error } = await supabase.from('incidentes').select('*, autor:profiles(nome, email)').eq('id', id).maybeSingle()
  falha(error, 'Não foi possível carregar a denúncia.')
  if (!data) return null
  const [d] = await juntarFotos([mapearDenuncia(data)])
  return d
}

export async function alterarEstado(id, estado, nota) {
  const { error } = await supabase.rpc('alterar_estado', { p_incidente: id, p_estado: estado, p_nota: nota || null })
  falha(error, 'Não foi possível alterar o estado.')
}

export async function listarUtilizadores() {
  const { data, error } = await supabase.from('profiles').select('id, nome, email, funcao, ativo, criado_em').order('criado_em', { ascending: false })
  falha(error, 'Não foi possível carregar os utilizadores.')
  return data
}

export async function alterarFuncao(userId, funcao) {
  const { error } = await supabase.rpc('alterar_funcao', { p_user: userId, p_funcao: funcao })
  falha(error, 'Não foi possível alterar a função.')
}

export async function historicoFuncoes() {
  const { data, error } = await supabase
    .from('alteracoes_funcao')
    .select('id, funcao_antiga, funcao_nova, criado_em, alvo:profiles!alteracoes_funcao_user_id_fkey(nome, email), autor:profiles!alteracoes_funcao_alterado_por_fkey(nome)')
    .order('criado_em', { ascending: false })
    .limit(50)
  falha(error, 'Não foi possível carregar o registo de alterações.')
  return data.map((r) => ({ id: r.id, antiga: r.funcao_antiga, nova: r.funcao_nova, criadoEm: r.criado_em, alvo: r.alvo?.nome || r.alvo?.email, autor: r.autor?.nome }))
}

// ---------- administração: contas, auditoria, categorias e regras ----------
export async function criarResponsavel({ nome, email, password }) {
  // Cliente temporário: cria a conta sem terminar a sessão do administrador
  const temp = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'viaalerta-criar-conta' }
  })
  const { data, error } = await temp.auth.signUp({ email, password, options: { data: { nome } } })
  falha(error, 'Não foi possível criar a conta.')
  if (!data.user || data.user.identities?.length === 0) throw new Error('Já existe uma conta com este email.')
  const { error: e2 } = await supabase.rpc('definir_responsavel_criado', { p_user: data.user.id })
  falha(e2, 'A conta foi criada mas não foi possível atribuir a função de responsável.')
  return { precisaConfirmacao: !data.session }
}

export async function alterarEstadoConta(userId, ativo) {
  const { error } = await supabase.rpc('alterar_estado_conta', { p_user: userId, p_ativo: ativo })
  falha(error, 'Não foi possível alterar o estado da conta.')
}

export async function listarAuditoria() {
  const { data, error } = await supabase
    .from('auditoria')
    .select('id, acao, alvo_tipo, alvo_id, detalhes, criado_em, actor:profiles(nome, email)')
    .order('criado_em', { ascending: false })
    .limit(300)
  falha(error, 'Não foi possível carregar o registo de auditoria.')
  return data.map((r) => ({ id: r.id, acao: r.acao, alvoTipo: r.alvo_tipo, alvo: r.alvo_id, detalhes: r.detalhes || {}, criadoEm: r.criado_em, actor: r.actor?.nome || r.actor?.email || '—' }))
}

const mapearCategoria = (c) => ({ id: c.id, nome: c.nome, cor: c.cor, texto: c.cor_texto, borda: c.borda || undefined, icone: c.icone, ativa: c.ativa, ordem: c.ordem })

export async function listarCategorias() {
  const { data, error } = await supabase.from('categorias').select('*').order('ordem')
  falha(error, 'Não foi possível carregar as categorias.')
  return data.map(mapearCategoria)
}

export async function guardarCategoria(c) {
  const { error } = await supabase.rpc('guardar_categoria', {
    p_id: c.id, p_nome: c.nome, p_cor: c.cor, p_cor_texto: c.texto, p_borda: c.borda || '', p_icone: c.icone, p_ativa: c.ativa, p_ordem: c.ordem
  })
  falha(error, 'Não foi possível guardar a categoria.')
}

export async function obterConfiguracao() {
  const { data, error } = await supabase.from('configuracoes').select('*').eq('id', 1).maybeSingle()
  falha(error, 'Não foi possível carregar as regras do sistema.')
  if (!data) return null
  return { fotoObrigatoria: data.foto_obrigatoria, permitirAnonimas: data.permitir_anonimas, descricaoMin: data.descricao_min, fotoMaxMb: data.foto_max_mb, atualizadoEm: data.atualizado_em }
}

export async function guardarConfiguracao(cfg) {
  const { error } = await supabase.rpc('guardar_configuracao', {
    p_foto_obrigatoria: cfg.fotoObrigatoria, p_permitir_anonimas: cfg.permitirAnonimas, p_descricao_min: cfg.descricaoMin, p_foto_max_mb: cfg.fotoMaxMb
  })
  falha(error, 'Não foi possível guardar as regras.')
}
