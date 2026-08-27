-- ============================================================================
-- Migracao 005 - login obrigatorio e liberacao por dominio
--
-- MUDANCA DE REGRA: a ficha deixa de ser publica. Todo mundo entra com a conta
-- Microsoft, inclusive quem so preenche. Assim a pessoa passa a ver o proprio
-- historico e sabe que o envio chegou.
--
-- Para isso nao virar uma fila de aprovacao diaria, quem tem e-mail do dominio
-- normatel.com.br entra liberado como visualizador. Qualquer outro dominio
-- continua caindo na fila.
--
-- A regra mora aqui, e nao no JavaScript, porque no navegador ela seria
-- burlavel: bastaria editar o codigo para se inserir como aprovado.
--
-- Respeite a nota de formato da migracao 002 ao editar: sem bloco DO, sem
-- ponto-e-virgula dentro de aspas-dolar, e sem ponto-e-virgula em comentario.
-- ============================================================================

-- 1) Dominios liberados ---------------------------------------------------
create table if not exists dominios_liberados (
  dominio text primary key,
  papel text not null default 'visualizador'
    check (papel in ('administrador', 'operador', 'visualizador')),
  criado_em timestamptz not null default now()
);

insert into dominios_liberados (dominio, papel) values ('normatel.com.br', 'visualizador')
on conflict (dominio) do nothing;

alter table dominios_liberados enable row level security;

-- 2) Registro de acesso ---------------------------------------------------
-- Chamada uma vez por login. Cria a linha da pessoa se ainda nao existir e
-- devolve a situacao dela. Como e security definer, o status vem do banco e o
-- app so obedece.
--
-- Uma unica instrucao de propriedade, sem ponto-e-virgula interno. Se o e-mail
-- ja existe, nada de status muda: quem foi recusado continua recusado, e quem
-- foi promovido a operador nao volta para visualizador.
create or replace function registrar_acesso(p_nome text default '')
returns table (status text, papel text, projeto text)
language sql
security definer
set search_path = public
as $fn$
  insert into solicitacoes_acesso (email, nome, status, papel, projeto, "decididoEm", "decididoPor")
  select
    lower(auth.jwt() ->> 'email'),
    coalesce(nullif(trim(p_nome), ''), split_part(lower(auth.jwt() ->> 'email'), '@', 1)),
    case when d.dominio is null then 'pendente' else 'aprovado' end,
    coalesce(d.papel, 'visualizador'),
    '',
    case when d.dominio is null then null else now() end,
    case when d.dominio is null then null else 'liberacao automatica por dominio' end
  from (select lower(split_part(auth.jwt() ->> 'email', '@', 2)) as dom) e
  left join dominios_liberados d on lower(d.dominio) = e.dom
  where nullif(auth.jwt() ->> 'email', '') is not null
  on conflict (lower(email)) do update
    set nome = coalesce(nullif(excluded.nome, ''), solicitacoes_acesso.nome)
  returning solicitacoes_acesso.status, solicitacoes_acesso.papel, solicitacoes_acesso.projeto
$fn$;

grant execute on function registrar_acesso(text) to authenticated;

-- 3) Fechar o envio anonimo ----------------------------------------------
-- A ficha nao e mais publica, entao o papel anonimo perde o direito de inserir.
-- Sem isto continuaria existindo um caminho para gravar ficha sem identificacao,
-- que e justamente o que causava ficha sem dono aparecendo para ninguem.
drop policy if exists "Permitir envio anônimo da ficha" on formularios_avaliacao;
drop policy if exists "Envio anonimo da ficha" on formularios_avaliacao;

-- Enviar exige acesso aprovado, igual a leitura.
drop policy if exists "Envio para autenticados" on formularios_avaliacao;
drop policy if exists "Envio para acesso aprovado" on formularios_avaliacao;
create policy "Envio para acesso aprovado"
  on formularios_avaliacao for insert
  to authenticated
  with check (acesso_aprovado());
