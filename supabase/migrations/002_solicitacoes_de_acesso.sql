-- ============================================================================
-- Migracao 002 - solicitacoes de acesso automaticas
--
-- Ao entrar com a Microsoft, quem ainda nao tem conta gera uma solicitacao
-- pendente sozinho. O administrador so aprova.
--
-- POR QUE NO BANCO: a base de usuarios do app vive no IndexedDB de cada
-- aparelho. Uma solicitacao criada no celular de um colaborador jamais
-- apareceria no computador do administrador. A fila de aprovacao precisa de um
-- lugar unico, e e esta tabela.
--
-- COMO RODAR: cole tudo no SQL Editor do Supabase e execute. E idempotente,
-- pode rodar mais de uma vez.
--
-- NOTA DE FORMATO (a causa do erro 42601 na primeira versao): o editor de SQL
-- divide o script para executar um comando por vez, e a divisao nao respeita
-- ponto-e-virgula dentro de bloco com aspas-dolar nem dentro de comentario.
-- Por isso, aqui:
--   1. nao existe bloco DO, e o status usa CHECK em vez de tipo enumerado
--   2. o corpo das funcoes e uma unica expressao, sem ponto-e-virgula interno
--   3. nenhum comentario contem ponto-e-virgula, aspas-dolar ou acento grave
-- Mexer nisso reabre o mesmo erro.
-- ============================================================================

-- 1) Quem administra ------------------------------------------------------
-- Fonte da verdade das permissoes de administrador, usada pelas policies.
-- Manter no banco, e nao numa lista no codigo do app, e o que impede alguem de
-- editar o JavaScript no navegador e se aprovar sozinho.
create table if not exists administradores (
  email text primary key,
  criado_em timestamptz not null default now()
);

insert into administradores (email) values ('gabriel.cruz@normatel.com.br')
on conflict (email) do nothing;

alter table administradores enable row level security;

-- security definer para a funcao ler administradores mesmo quando o chamador
-- nao tem permissao de select nela. stable deixa o Postgres avaliar uma vez por
-- consulta em vez de uma vez por linha.
create or replace function eh_administrador()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1 from administradores
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
$fn$;

-- 2) Fila de solicitacoes -------------------------------------------------
create table if not exists solicitacoes_acesso (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  nome text not null default '',
  -- Texto com CHECK em vez de tipo enumerado, pela nota de formato acima.
  status text not null default 'pendente'
    check (status in ('pendente', 'aprovado', 'rejeitado')),
  -- Papel e projeto so ganham valor de verdade na aprovacao. O padrao e o
  -- acesso mais restrito, para uma aprovacao distraida nao virar administrador.
  papel text not null default 'visualizador'
    check (papel in ('administrador', 'operador', 'visualizador')),
  projeto text not null default '',
  observacao text default '',
  "criadoEm" timestamptz not null default now(),
  "decididoEm" timestamptz,
  "decididoPor" text
);

-- Um e-mail, uma solicitacao. Sem este indice, cada tentativa de login criaria
-- uma linha nova e a fila do administrador encheria de duplicatas.
create unique index if not exists idx_solicitacoes_email
  on solicitacoes_acesso (lower(email));

create index if not exists idx_solicitacoes_status
  on solicitacoes_acesso (status, "criadoEm" desc);

alter table solicitacoes_acesso enable row level security;

-- 3) Policies da fila -----------------------------------------------------
-- A pessoa autenticada so cria a solicitacao do PROPRIO e-mail, e so como
-- pendente. Assim ninguem se insere ja aprovado nem abre pedido por outro.
drop policy if exists "Criar a propria solicitacao" on solicitacoes_acesso;
create policy "Criar a propria solicitacao"
  on solicitacoes_acesso for insert
  to authenticated
  with check (
    lower(email) = lower(auth.jwt() ->> 'email')
    and status = 'pendente'
    and papel = 'visualizador'
  );

drop policy if exists "Ver a propria solicitacao ou todas se admin" on solicitacoes_acesso;
create policy "Ver a propria solicitacao ou todas se admin"
  on solicitacoes_acesso for select
  to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email') or eh_administrador());

drop policy if exists "Somente admin decide" on solicitacoes_acesso;
create policy "Somente admin decide"
  on solicitacoes_acesso for update
  to authenticated
  using (eh_administrador())
  with check (eh_administrador());

drop policy if exists "Somente admin exclui" on solicitacoes_acesso;
create policy "Somente admin exclui"
  on solicitacoes_acesso for delete
  to authenticated
  using (eh_administrador());

-- 4) Fechar a leitura das fichas ------------------------------------------
-- IMPORTANTE. Com login por autoatendimento, qualquer conta Microsoft que
-- consiga autenticar passa a ser authenticated para o Postgres. A policy antiga
-- liberava SELECT para todo authenticated, entao uma conta apenas pendente,
-- barrada na interface, ainda conseguiria ler todas as fichas chamando a API
-- direto. Aprovacao passa a ser requisito no proprio banco.
create or replace function acesso_aprovado()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select eh_administrador() or exists (
    select 1 from solicitacoes_acesso
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and status = 'aprovado'
  )
$fn$;

drop policy if exists "Permitir leitura para usuários autenticados" on formularios_avaliacao;
drop policy if exists "Leitura para acesso aprovado" on formularios_avaliacao;
create policy "Leitura para acesso aprovado"
  on formularios_avaliacao for select
  to authenticated
  using (acesso_aprovado());

drop policy if exists "Permitir atualização para usuários autenticados" on formularios_avaliacao;
drop policy if exists "Atualizacao para acesso aprovado" on formularios_avaliacao;
create policy "Atualizacao para acesso aprovado"
  on formularios_avaliacao for update
  to authenticated
  using (acesso_aprovado())
  with check (acesso_aprovado());

drop policy if exists "Permitir exclusão para usuários autenticados" on formularios_avaliacao;
drop policy if exists "Exclusao somente para admin" on formularios_avaliacao;
create policy "Exclusao somente para admin"
  on formularios_avaliacao for delete
  to authenticated
  using (eh_administrador());

-- O envio da ficha continua aberto, que e a razao de o app nao exigir login na
-- entrada. Quem esta autenticado, mesmo pendente, tambem pode enviar.
drop policy if exists "Permitir escrita para usuários autenticados" on formularios_avaliacao;
drop policy if exists "Envio para autenticados" on formularios_avaliacao;
create policy "Envio para autenticados"
  on formularios_avaliacao for insert
  to authenticated
  with check (true);
