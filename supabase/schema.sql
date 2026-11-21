-- =====================================================================
-- ViaAlerta — esquema da base de dados (Supabase / PostgreSQL)
-- Executar TUDO de uma vez no Supabase: SQL Editor → New query → colar → Run.
-- As permissões são aplicadas AQUI (Row Level Security), não apenas na interface Vue.
-- =====================================================================

-- ---------- Tipos ----------
do $$ begin
  create type funcao_t as enum ('cidadao', 'responsavel', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_t as enum ('pendente', 'em_analise', 'precisa_info', 'rejeitada', 'publicada', 'em_resolucao', 'resolvida');
exception when duplicate_object then null; end $$;


-- ---------- Tabelas ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default '',
  email text not null,
  funcao funcao_t not null default 'cidadao',
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
alter table public.profiles add column if not exists ativo boolean not null default true;

-- Categorias configuráveis pelo administrador (cor e ícone iguais no mapa e na legenda)
create table if not exists public.categorias (
  id text primary key check (id ~ '^[a-z0-9_]{3,40}$'),
  nome text not null check (char_length(nome) between 3 and 60),
  cor text not null check (cor ~ '^#[0-9A-Fa-f]{6}$'),
  cor_texto text not null default '#FFFFFF' check (cor_texto ~ '^#[0-9A-Fa-f]{6}$'),
  borda text check (borda is null or borda ~ '^#[0-9A-Fa-f]{6}$'),
  icone text not null default 'alerta',
  ativa boolean not null default true,
  ordem int not null default 0
);
insert into public.categorias (id, nome, cor, cor_texto, borda, icone, ordem) values
  ('buraco_estrada', 'Buracos nas estradas', '#0B8A4E', '#FFFFFF', null, 'construcao', 1),
  ('passeio_danificado', 'Passeios danificados', '#F2C500', '#1A1A1A', null, 'pegadas', 2),
  ('iluminacao_avariada', 'Iluminação pública avariada', '#D21034', '#FFFFFF', null, 'lampada', 3),
  ('semaforo_sinal', 'Semáforos e sinais danificados', '#FFFFFF', '#1A1A1A', '#1A1A1A', 'transito', 4),
  ('erosao', 'Estradas danificadas por erosão', '#1A1A1A', '#FFFFFF', null, 'montanha', 5)
on conflict (id) do nothing;

-- Regras do sistema (uma única linha, editável pelo administrador)
create table if not exists public.configuracoes (
  id int primary key default 1 check (id = 1),
  foto_obrigatoria boolean not null default true,
  permitir_anonimas boolean not null default true,
  descricao_min int not null default 20 check (descricao_min between 10 and 300),
  foto_max_mb int not null default 10 check (foto_max_mb between 1 and 20),
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid references public.profiles (id) on delete set null
);
insert into public.configuracoes (id) values (1) on conflict (id) do nothing;

-- Registo de auditoria: todas as acções de moderação e de administração
create table if not exists public.auditoria (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  acao text not null,
  alvo_tipo text not null,
  alvo_id text,
  detalhes jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now()
);
create index if not exists auditoria_data_idx on public.auditoria (criado_em desc);

create sequence if not exists public.referencia_seq;

create table if not exists public.incidentes (
  id uuid primary key default gen_random_uuid(),
  referencia text unique,
  user_id uuid not null references public.profiles (id) on delete cascade,
  titulo text not null check (char_length(titulo) between 8 and 90),
  categoria text not null references public.categorias (id),
  descricao text not null check (char_length(descricao) between 20 and 1000),
  provincia text not null,
  distrito text not null,
  localidade text not null,
  -- Coordenadas válidas apenas dentro (da caixa envolvente) de Moçambique
  latitude double precision not null check (latitude between -27.2 and -10.2),
  longitude double precision not null check (longitude between 30.0 and 41.2),
  foto_path text,
  anonima boolean not null default false,
  estado estado_t not null default 'pendente',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
-- Bases criadas com a versão anterior (categoria como enum) passam a usar a tabela categorias
drop view if exists public.denuncias_publicas, public.historico_publico, public.estatisticas_publicas;
alter table public.incidentes alter column categoria type text using categoria::text;
do $$ begin
  alter table public.incidentes add constraint incidentes_categoria_fkey foreign key (categoria) references public.categorias (id);
exception when duplicate_object then null; end $$;
drop type if exists categoria_t;
create index if not exists incidentes_estado_idx on public.incidentes (estado);
create index if not exists incidentes_user_idx on public.incidentes (user_id);

create table if not exists public.historico_estados (
  id uuid primary key default gen_random_uuid(),
  incidente_id uuid not null references public.incidentes (id) on delete cascade,
  estado estado_t not null,
  nota text,
  actor_id uuid references public.profiles (id) on delete set null,
  criado_em timestamptz not null default now()
);
create index if not exists historico_incidente_idx on public.historico_estados (incidente_id);

create table if not exists public.mensagens (
  id uuid primary key default gen_random_uuid(),
  incidente_id uuid not null references public.incidentes (id) on delete cascade,
  autor_id uuid references public.profiles (id) on delete set null,
  mensagem text not null check (char_length(mensagem) between 2 and 2000),
  de_staff boolean not null default false,
  criado_em timestamptz not null default now()
);

create table if not exists public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  incidente_id uuid references public.incidentes (id) on delete cascade,
  titulo text not null,
  mensagem text not null,
  lida boolean not null default false,
  criado_em timestamptz not null default now()
);

create table if not exists public.alteracoes_funcao (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  funcao_antiga funcao_t not null,
  funcao_nova funcao_t not null,
  alterado_por uuid references public.profiles (id) on delete set null,
  criado_em timestamptz not null default now()
);

-- Eventos públicos SEM dados pessoais, usados pelo Realtime para actualizar o mapa
create table if not exists public.eventos_publicos (
  id bigint generated always as identity primary key,
  incidente_id uuid not null,
  estado estado_t not null,
  criado_em timestamptz not null default now()
);

-- ---------- Funções auxiliares (security definer evita recursão nas políticas) ----------
create or replace function public.funcao_atual() returns funcao_t
language sql stable security definer set search_path = public as $$
  -- Contas desactivadas perdem todas as permissões
  select funcao from public.profiles where id = auth.uid() and ativo
$$;

create or replace function public.auditar(p_acao text, p_alvo_tipo text, p_alvo_id text, p_detalhes jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.auditoria (actor_id, acao, alvo_tipo, alvo_id, detalhes) values (auth.uid(), p_acao, p_alvo_tipo, p_alvo_id, coalesce(p_detalhes, '{}'::jsonb))
$$;
revoke execute on function public.auditar(text, text, text, jsonb) from public, anon, authenticated;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.funcao_atual() in ('responsavel', 'admin'), false)
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.funcao_atual() = 'admin', false)
$$;

-- Fotografia pertence a uma denúncia pública?
create or replace function public.foto_publica(caminho text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.incidentes where foto_path = caminho and estado in ('publicada', 'em_resolucao'))
$$;

-- ---------- Triggers ----------
-- 1) Cria o perfil quando um utilizador se regista no Supabase Auth (sempre como cidadão)
create or replace function public.criar_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nome, email, funcao)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)), new.email, 'cidadao')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.criar_perfil();

-- 2) Nova denúncia: força estado pendente, gera referência VA-AAAA-NNNN e regista histórico
create or replace function public.antes_inserir_incidente() returns trigger
language plpgsql security definer set search_path = public as $$
declare cfg public.configuracoes;
begin
  -- Só cidadãos criam denúncias; responsáveis e administradores apenas as gerem
  if exists (select 1 from public.profiles where id = auth.uid() and not ativo) then
    raise exception 'Esta conta foi desactivada por um administrador.';
  end if;
  if coalesce(public.funcao_atual()::text, '') <> 'cidadao' then
    raise exception 'Apenas cidadãos podem criar denúncias.';
  end if;
  select * into cfg from public.configuracoes where id = 1;
  if not exists (select 1 from public.categorias where id = new.categoria and ativa) then
    raise exception 'Categoria inválida ou desactivada.';
  end if;
  if char_length(trim(new.descricao)) < cfg.descricao_min then
    raise exception 'A descrição deve ter pelo menos % caracteres.', cfg.descricao_min;
  end if;
  if new.anonima and not cfg.permitir_anonimas then
    raise exception 'As denúncias anónimas estão desactivadas.';
  end if;
  if cfg.foto_obrigatoria and new.foto_path is null then
    raise exception 'A fotografia é obrigatória.';
  end if;
  new.estado := 'pendente';
  new.user_id := auth.uid();
  new.referencia := 'VA-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.referencia_seq')::text, 4, '0');
  new.criado_em := now();
  new.atualizado_em := now();
  return new;
end $$;

drop trigger if exists incidentes_antes_inserir on public.incidentes;
create trigger incidentes_antes_inserir before insert on public.incidentes
for each row execute function public.antes_inserir_incidente();

create or replace function public.depois_inserir_incidente() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.historico_estados (incidente_id, estado, nota, actor_id)
  values (new.id, 'pendente', 'Denúncia submetida', new.user_id);
  return new;
end $$;

drop trigger if exists incidentes_depois_inserir on public.incidentes;
create trigger incidentes_depois_inserir after insert on public.incidentes
for each row execute function public.depois_inserir_incidente();

-- ---------- RPC: alterar estado (apenas responsáveis/administradores) ----------
create or replace function public.alterar_estado(p_incidente uuid, p_estado estado_t, p_nota text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  atual estado_t;
  dono uuid;
  ref text;
  permitido boolean;
  titulo_n text;
  msg_n text;
begin
  if not public.is_staff() then
    raise exception 'Sem permissão: apenas responsáveis autorizados podem moderar denúncias.';
  end if;

  select estado, user_id, referencia into atual, dono, ref from public.incidentes where id = p_incidente for update;
  if not found then raise exception 'Denúncia não encontrada.'; end if;

  permitido := case atual
    when 'pendente'     then p_estado in ('em_analise', 'precisa_info', 'publicada', 'rejeitada')
    when 'em_analise'   then p_estado in ('precisa_info', 'publicada', 'rejeitada')
    when 'precisa_info' then p_estado in ('em_analise', 'publicada', 'rejeitada')
    when 'publicada'    then p_estado in ('em_resolucao', 'resolvida')
    when 'em_resolucao' then p_estado in ('resolvida')
    else false end;
  if not permitido then
    raise exception 'Transição de estado não permitida (% → %).', atual, p_estado;
  end if;
  if p_estado in ('precisa_info', 'rejeitada') and coalesce(trim(p_nota), '') = '' then
    raise exception 'Indique o motivo.';
  end if;

  update public.incidentes set estado = p_estado, atualizado_em = now() where id = p_incidente;
  insert into public.historico_estados (incidente_id, estado, nota, actor_id) values (p_incidente, p_estado, nullif(trim(p_nota), ''), auth.uid());

  if coalesce(trim(p_nota), '') <> '' then
    insert into public.mensagens (incidente_id, autor_id, mensagem, de_staff) values (p_incidente, auth.uid(), trim(p_nota), true);
  end if;

  titulo_n := case p_estado
    when 'em_analise' then 'A sua denúncia está em análise'
    when 'precisa_info' then 'Faltam dados na sua denúncia'
    when 'publicada' then 'Denúncia aprovada e publicada'
    when 'rejeitada' then 'Denúncia rejeitada'
    when 'em_resolucao' then 'Problema em resolução'
    when 'resolvida' then 'Problema resolvido' end;
  msg_n := case p_estado
    when 'em_analise' then 'Um responsável começou a analisar a sua denúncia.'
    when 'precisa_info' then 'Um responsável indicou que faltam dados na sua denúncia.'
    when 'publicada' then 'A sua denúncia foi aprovada e já está visível no mapa público.'
    when 'rejeitada' then 'A sua denúncia não foi aprovada.'
    when 'em_resolucao' then 'O problema que denunciou está a ser tratado.'
    when 'resolvida' then 'O problema que denunciou foi marcado como resolvido. Obrigado!' end;
  insert into public.notificacoes (user_id, incidente_id, titulo, mensagem) values (dono, p_incidente, titulo_n, ref || ': ' || msg_n);

  -- Evento público (sem dados pessoais) → o mapa actualiza-se sozinho
  insert into public.eventos_publicos (incidente_id, estado) values (p_incidente, p_estado);
  perform public.auditar('alterar_estado', 'denuncia', ref, jsonb_build_object('de', atual, 'para', p_estado, 'nota', nullif(trim(p_nota), '')));
end $$;

-- ---------- RPC: cidadão responde a um pedido de informação ----------
create or replace function public.responder_pedido(p_incidente uuid, p_mensagem text)
returns void language plpgsql security definer set search_path = public as $$
declare atual estado_t; dono uuid;
begin
  select estado, user_id into atual, dono from public.incidentes where id = p_incidente for update;
  if not found or dono <> auth.uid() then raise exception 'Denúncia não encontrada.'; end if;
  if atual <> 'precisa_info' then raise exception 'Esta denúncia não está à espera de informação.'; end if;
  if char_length(trim(p_mensagem)) < 10 then raise exception 'A resposta é demasiado curta.'; end if;

  insert into public.mensagens (incidente_id, autor_id, mensagem, de_staff) values (p_incidente, auth.uid(), trim(p_mensagem), false);
  update public.incidentes set estado = 'em_analise', atualizado_em = now() where id = p_incidente;
  insert into public.historico_estados (incidente_id, estado, nota, actor_id)
  values (p_incidente, 'em_analise', 'Cidadão respondeu ao pedido de informação', auth.uid());
end $$;

-- ---------- RPC: alterar função de um utilizador (apenas administradores, com registo) ----------
create or replace function public.alterar_funcao(p_user uuid, p_funcao funcao_t)
returns void language plpgsql security definer set search_path = public as $$
declare antiga funcao_t;
begin
  if not public.is_admin() then raise exception 'Apenas administradores podem alterar funções.'; end if;
  if p_user = auth.uid() then raise exception 'Não pode alterar a sua própria função.'; end if;
  select funcao into antiga from public.profiles where id = p_user for update;
  if not found then raise exception 'Utilizador não encontrado.'; end if;
  if antiga = p_funcao then return; end if;
  update public.profiles set funcao = p_funcao where id = p_user;
  insert into public.alteracoes_funcao (user_id, funcao_antiga, funcao_nova, alterado_por) values (p_user, antiga, p_funcao, auth.uid());
  perform public.auditar('alterar_funcao', 'utilizador', (select email from public.profiles where id = p_user), jsonb_build_object('de', antiga, 'para', p_funcao));
end $$;

-- ---------- RPC: administrador cria conta de responsável ----------
-- A conta é criada no Supabase Auth pela aplicação (signUp); esta função marca-a como responsável.
create or replace function public.definir_responsavel_criado(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare antiga funcao_t;
begin
  if not public.is_admin() then raise exception 'Apenas administradores podem criar contas de responsáveis.'; end if;
  select funcao into antiga from public.profiles where id = p_user for update;
  if not found then raise exception 'Conta não encontrada.'; end if;
  if (select criado_em from public.profiles where id = p_user) < now() - interval '15 minutes' then
    raise exception 'Esta conta já existia: use a alteração de função.';
  end if;
  update public.profiles set funcao = 'responsavel' where id = p_user;
  insert into public.alteracoes_funcao (user_id, funcao_antiga, funcao_nova, alterado_por) values (p_user, antiga, 'responsavel', auth.uid());
  perform public.auditar('criar_responsavel', 'utilizador', (select email from public.profiles where id = p_user), '{}'::jsonb);
end $$;

-- ---------- RPC: activar / desactivar contas (apenas administradores) ----------
create or replace function public.alterar_estado_conta(p_user uuid, p_ativo boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Apenas administradores podem desactivar contas.'; end if;
  if p_user = auth.uid() then raise exception 'Não pode desactivar a sua própria conta.'; end if;
  update public.profiles set ativo = p_ativo where id = p_user;
  if not found then raise exception 'Utilizador não encontrado.'; end if;
  perform public.auditar(case when p_ativo then 'activar_conta' else 'desactivar_conta' end, 'utilizador', (select email from public.profiles where id = p_user), '{}'::jsonb);
end $$;

-- ---------- RPC: categorias e regras do sistema (apenas administradores) ----------
create or replace function public.guardar_categoria(p_id text, p_nome text, p_cor text, p_cor_texto text, p_borda text, p_icone text, p_ativa boolean, p_ordem int)
returns void language plpgsql security definer set search_path = public as $$
declare novo boolean;
begin
  if not public.is_admin() then raise exception 'Apenas administradores podem configurar categorias.'; end if;
  novo := not exists (select 1 from public.categorias where id = p_id);
  insert into public.categorias (id, nome, cor, cor_texto, borda, icone, ativa, ordem)
  values (p_id, trim(p_nome), upper(p_cor), upper(p_cor_texto), nullif(upper(p_borda), ''), p_icone, p_ativa, p_ordem)
  on conflict (id) do update set nome = excluded.nome, cor = excluded.cor, cor_texto = excluded.cor_texto,
    borda = excluded.borda, icone = excluded.icone, ativa = excluded.ativa, ordem = excluded.ordem;
  perform public.auditar(case when novo then 'criar_categoria' else 'editar_categoria' end, 'categoria', p_id,
    jsonb_build_object('nome', p_nome, 'cor', p_cor, 'ativa', p_ativa));
end $$;

create or replace function public.guardar_configuracao(p_foto_obrigatoria boolean, p_permitir_anonimas boolean, p_descricao_min int, p_foto_max_mb int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Apenas administradores podem alterar as regras do sistema.'; end if;
  update public.configuracoes set foto_obrigatoria = p_foto_obrigatoria, permitir_anonimas = p_permitir_anonimas,
    descricao_min = p_descricao_min, foto_max_mb = p_foto_max_mb, atualizado_em = now(), atualizado_por = auth.uid()
  where id = 1;
  perform public.auditar('alterar_regras', 'sistema', 'configuracoes', jsonb_build_object('foto_obrigatoria', p_foto_obrigatoria,
    'permitir_anonimas', p_permitir_anonimas, 'descricao_min', p_descricao_min, 'foto_max_mb', p_foto_max_mb));
end $$;

-- ---------- Vistas públicas (sem user_id, sem anonimato, sem dados pessoais) ----------
-- As vistas correm com os privilégios do dono (postgres), por isso só expõem estas colunas.
create or replace view public.denuncias_publicas as
  select id, referencia, titulo, categoria, descricao, provincia, distrito, localidade,
         latitude, longitude, foto_path, estado, criado_em, atualizado_em
  from public.incidentes
  where estado in ('publicada', 'em_resolucao');

create or replace view public.historico_publico as
  select h.id, h.incidente_id, h.estado, h.criado_em
  from public.historico_estados h
  join public.incidentes i on i.id = h.incidente_id
  where i.estado in ('publicada', 'em_resolucao')
    and h.estado in ('publicada', 'em_resolucao', 'resolvida');

create or replace view public.estatisticas_publicas as
  select
    count(*) filter (where estado = 'publicada')::int as publicadas,
    count(*) filter (where estado = 'em_resolucao')::int as em_resolucao,
    count(*) filter (where estado in ('publicada', 'em_resolucao'))::int as total_ativo
  from public.incidentes;

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.incidentes enable row level security;
alter table public.historico_estados enable row level security;
alter table public.mensagens enable row level security;
alter table public.notificacoes enable row level security;
alter table public.alteracoes_funcao enable row level security;
alter table public.eventos_publicos enable row level security;
alter table public.categorias enable row level security;
alter table public.configuracoes enable row level security;
alter table public.auditoria enable row level security;

-- categorias e regras: leitura pública; escrita só pelas RPCs de administrador
drop policy if exists "categorias publicas" on public.categorias;
create policy "categorias publicas" on public.categorias for select using (true);
drop policy if exists "configuracao publica" on public.configuracoes;
create policy "configuracao publica" on public.configuracoes for select using (true);
-- auditoria: só administradores (activos)
drop policy if exists "auditoria admin" on public.auditoria;
create policy "auditoria admin" on public.auditoria for select using (public.is_admin());

-- profiles: cada um vê o seu; staff vê todos. Ninguém altera a função por UPDATE directo
-- (apenas pela RPC alterar_funcao), por isso não há política de update/insert.
drop policy if exists "perfil proprio ou staff" on public.profiles;
create policy "perfil proprio ou staff" on public.profiles for select
  using (id = auth.uid() or public.is_staff());

-- incidentes
drop policy if exists "cidadao cria a sua denuncia" on public.incidentes;
create policy "cidadao cria a sua denuncia" on public.incidentes for insert to authenticated
  with check (user_id = auth.uid() and public.funcao_atual() = 'cidadao');

drop policy if exists "dono ou staff le" on public.incidentes;
create policy "dono ou staff le" on public.incidentes for select
  using (user_id = auth.uid() or public.is_staff());
-- (sem UPDATE/DELETE: mudanças de estado só pela RPC alterar_estado)

-- historico_estados
drop policy if exists "historico dono ou staff" on public.historico_estados;
create policy "historico dono ou staff" on public.historico_estados for select
  using (public.is_staff() or exists (select 1 from public.incidentes i where i.id = incidente_id and i.user_id = auth.uid()));

-- mensagens
drop policy if exists "mensagens dono ou staff" on public.mensagens;
create policy "mensagens dono ou staff" on public.mensagens for select
  using (public.is_staff() or exists (select 1 from public.incidentes i where i.id = incidente_id and i.user_id = auth.uid()));

-- notificacoes: cada um vê e marca como lidas as suas
drop policy if exists "notificacoes proprias" on public.notificacoes;
create policy "notificacoes proprias" on public.notificacoes for select using (user_id = auth.uid());
drop policy if exists "marcar notificacoes lidas" on public.notificacoes;
create policy "marcar notificacoes lidas" on public.notificacoes for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- alteracoes_funcao: só administradores
drop policy if exists "registo de funcoes admin" on public.alteracoes_funcao;
create policy "registo de funcoes admin" on public.alteracoes_funcao for select using (public.is_admin());

-- eventos_publicos: leitura pública (não contém dados pessoais)
drop policy if exists "eventos publicos" on public.eventos_publicos;
create policy "eventos publicos" on public.eventos_publicos for select using (true);

-- Privilégios
grant usage on schema public to anon, authenticated;
grant select on public.denuncias_publicas, public.historico_publico, public.estatisticas_publicas, public.eventos_publicos to anon, authenticated;
grant select on public.categorias, public.configuracoes to anon, authenticated;
grant select on public.auditoria to authenticated;
grant select, insert on public.incidentes to authenticated;
grant select on public.profiles, public.historico_estados, public.mensagens, public.alteracoes_funcao to authenticated;
grant select, update (lida) on public.notificacoes to authenticated;
revoke execute on function public.alterar_estado(uuid, estado_t, text) from anon;
revoke execute on function public.responder_pedido(uuid, text) from anon;
revoke execute on function public.alterar_funcao(uuid, funcao_t) from anon;
revoke execute on function public.definir_responsavel_criado(uuid) from anon;
revoke execute on function public.alterar_estado_conta(uuid, boolean) from anon;
revoke execute on function public.guardar_categoria(text, text, text, text, text, text, boolean, int) from anon;
revoke execute on function public.guardar_configuracao(boolean, boolean, int, int) from anon;

-- ---------- Realtime ----------
do $$ begin
  alter publication supabase_realtime add table public.eventos_publicos;
exception when duplicate_object then null; end $$;

-- ---------- Storage: bucket privado para fotografias ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Upload: cada cidadão só escreve na sua pasta  fotos/<user_id>/...
drop policy if exists "upload na propria pasta" on storage.objects;
create policy "upload na propria pasta" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Leitura: dono, staff, ou qualquer pessoa se a denúncia já estiver publicada.
-- Fotografias de denúncias ainda não aprovadas permanecem privadas.
drop policy if exists "ler fotos permitidas" on storage.objects;
create policy "ler fotos permitidas" on storage.objects for select
  using (
    bucket_id = 'fotos' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_staff()
      or public.foto_publica(name)
    )
  );

-- =====================================================================
-- DEPOIS de criar a sua conta na aplicação, torne-a administradora:
--   update public.profiles set funcao = 'admin' where email = 'o-seu-email@exemplo.com';
-- =====================================================================
