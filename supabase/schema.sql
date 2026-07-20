-- Sistema de Gestão Integrada — Ficha Técnica de Avaliação de Serviços
-- Schema Supabase (PostgreSQL)

create extension if not exists "pgcrypto";

create type form_status as enum ('rascunho', 'enviado', 'em_analise', 'aprovado', 'reprovado');

create table if not exists formularios_avaliacao (
  id uuid primary key default gen_random_uuid(),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  status form_status not null default 'rascunho',
  "infoGerais" jsonb not null default '{}'::jsonb,
  necessidades jsonb not null default '{}'::jsonb,
  "descricaoApoio" text default '',
  observacoes text default '',
  imagens jsonb not null default '[]'::jsonb,
  localizacao jsonb,
  "assinaturaDataUrl" text
);

create index if not exists idx_formularios_status on formularios_avaliacao (status);
create index if not exists idx_formularios_updated_at on formularios_avaliacao ("updatedAt" desc);

create or replace function set_updated_at()
returns trigger as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_formularios_updated_at on formularios_avaliacao;
create trigger trg_formularios_updated_at
  before update on formularios_avaliacao
  for each row execute function set_updated_at();

alter table formularios_avaliacao enable row level security;

create policy "Permitir leitura para usuários autenticados"
  on formularios_avaliacao for select
  to authenticated
  using (true);

create policy "Permitir escrita para usuários autenticados"
  on formularios_avaliacao for insert
  to authenticated
  with check (true);

create policy "Permitir atualização para usuários autenticados"
  on formularios_avaliacao for update
  to authenticated
  using (true);

create policy "Permitir exclusão para usuários autenticados"
  on formularios_avaliacao for delete
  to authenticated
  using (true);

-- Storage: buckets para anexos e configurações (logo da empresa)
insert into storage.buckets (id, name, public)
values ('formularios-anexos', 'formularios-anexos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('configuracoes', 'configuracoes', true)
on conflict (id) do nothing;
