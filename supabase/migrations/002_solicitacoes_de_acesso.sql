-- ============================================================================
-- Migração 002 — solicitações de acesso automáticas
--
-- Ao entrar com a Microsoft, quem ainda não tem conta gera uma solicitação
-- pendente sozinho. O administrador só aprova.
--
-- POR QUE NO BANCO: a base de usuários do app vive no IndexedDB de cada
-- aparelho. Uma solicitação criada no celular de um colaborador jamais
-- apareceria no computador do administrador. A fila de aprovação precisa de um
-- lugar único, e é esta tabela.
--
-- Rode no SQL Editor do Supabase. É idempotente.
-- ============================================================================

-- 1) Quem administra ------------------------------------------------------
-- Fonte da verdade das permissões de administrador, usada pelas policies.
-- Manter aqui (e não numa lista no código do app) é o que impede alguém de
-- editar o JavaScript no navegador e se aprovar sozinho.
create table if not exists administradores (
  email text primary key,
  criado_em timestamptz not null default now()
);

insert into administradores (email) values ('gabriel.cruz@normatel.com.br')
on conflict (email) do nothing;

-- `security definer` para a função poder ler `administradores` mesmo quando o
-- chamador não tem permissão de select nela. `stable` deixa o Postgres avaliar
-- uma vez por consulta em vez de por linha.
create or replace function eh_administrador()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from administradores
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- 2) Fila de solicitações -------------------------------------------------
do $$ begin
  create type status_solicitacao as enum ('pendente', 'aprovado', 'rejeitado');
exception when duplicate_object then null;
end $$;

create table if not exists solicitacoes_acesso (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  nome text not null default '',
  status status_solicitacao not null default 'pendente',
  -- Papel e projeto só ganham valor de verdade na aprovação; o padrão é o
  -- acesso mais restrito, para uma aprovação distraída não virar administrador.
  papel text not null default 'visualizador',
  projeto text not null default '',
  observacao text default '',
  "criadoEm" timestamptz not null default now(),
  "decididoEm" timestamptz,
  "decididoPor" text
);

-- Um e-mail, uma solicitação: sem isso cada tentativa de login criaria uma nova
-- linha e a fila do administrador encheria de duplicatas.
create unique index if not exists idx_solicitacoes_email
  on solicitacoes_acesso (lower(email));

create index if not exists idx_solicitacoes_status
  on solicitacoes_acesso (status, "criadoEm" desc);

alter table solicitacoes_acesso enable row level security;

-- 3) Policies -------------------------------------------------------------
-- A pessoa autenticada só cria a solicitação do PRÓPRIO e-mail, e só como
-- pendente. Assim ninguém se insere já aprovado nem abre pedido por outro.
drop policy if exists "Criar a própria solicitação" on solicitacoes_acesso;
create policy "Criar a própria solicitação"
  on solicitacoes_acesso for insert
  to authenticated
  with check (
    lower(email) = lower(auth.jwt() ->> 'email')
    and status = 'pendente'
    and papel = 'visualizador'
  );

drop policy if exists "Ver a própria solicitação ou todas se admin" on solicitacoes_acesso;
create policy "Ver a própria solicitação ou todas se admin"
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

-- A lista de administradores é lida pela função com security definer; ninguém
-- precisa (nem deve) ler ou escrever nela pelo app.
alter table administradores enable row level security;

-- 4) Fechar a leitura das fichas ------------------------------------------
-- IMPORTANTE. Com login por autoatendimento, qualquer conta Microsoft que
-- consiga autenticar passa a ser `authenticated` para o Postgres. A policy
-- antiga liberava SELECT para todo `authenticated`, então uma conta apenas
-- *pendente* — barrada na interface — ainda conseguiria ler todas as fichas
-- chamando a API direto. Aprovação passa a ser requisito no próprio banco.
create or replace function acesso_aprovado()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select eh_administrador() or exists (
    select 1 from solicitacoes_acesso
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and status = 'aprovado'
  );
$$;

drop policy if exists "Permitir leitura para usuários autenticados" on formularios_avaliacao;
create policy "Leitura para acesso aprovado"
  on formularios_avaliacao for select
  to authenticated
  using (acesso_aprovado());

drop policy if exists "Permitir atualização para usuários autenticados" on formularios_avaliacao;
create policy "Atualização para acesso aprovado"
  on formularios_avaliacao for update
  to authenticated
  using (acesso_aprovado())
  with check (acesso_aprovado());

drop policy if exists "Permitir exclusão para usuários autenticados" on formularios_avaliacao;
create policy "Exclusão somente para admin"
  on formularios_avaliacao for delete
  to authenticated
  using (eh_administrador());

-- O envio da ficha continua aberto: é a razão de o app não exigir login na
-- entrada. Quem está autenticado (mesmo pendente) também pode enviar.
drop policy if exists "Permitir escrita para usuários autenticados" on formularios_avaliacao;
create policy "Envio para autenticados"
  on formularios_avaliacao for insert
  to authenticated
  with check (true);
