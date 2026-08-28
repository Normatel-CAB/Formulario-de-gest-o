-- ============================================================================
-- Migracao 008 - cargos e permissoes passam a valer de verdade
--
-- RODE DEPOIS DA 007.
--
-- O QUE MUDA: ate aqui a tela de Cargos escrevia no IndexedDB do navegador e
-- nao concedia nada. Quem mandava era o campo papel, com tres valores fixos.
-- Agora o cargo mora no banco, carrega a lista de permissoes marcadas na tela,
-- e as policies leem essa lista. Criar um cargo Planejador e dar a ele o
-- direito de aprovar passa a ter efeito real.
--
-- DUAS REGRAS DE PROJETO
--   1. quem tem projeto em branco no acesso ve todos os projetos
--   2. quem tem um projeto nomeado so alcanca fichas daquele projeto
-- A ficha guarda o projeto de quem preencheu, entao o recorte ja funciona sem
-- migrar dado nenhum.
--
-- CHAVE RESERVA: a tabela administradores continua passando por cima de tudo.
-- E o que impede uma permissao removida por engano de trancar todo mundo para
-- fora da administracao. Ela nao entra em nenhuma tela, so no banco.
--
-- ONDE O BANCO NAO ALCANCA: permissoes como Dashboard Visualizar, Exportar PDF
-- e Enviar Outlook nao viram policy, porque nao existe leitura ou escrita
-- correspondente. Elas continuam valendo como no app, escondendo botao. As que
-- protegem dado de verdade sao as de Formularios, Historico e Usuarios.
--
-- Respeite a nota de formato da migracao 002 ao editar: sem bloco DO, sem
-- ponto-e-virgula dentro de aspas-dolar, e sem ponto-e-virgula em comentario.
-- ============================================================================

-- 1) Tabela de cargos -----------------------------------------------------
create table if not exists cargos (
  identificador text primary key,
  nome text not null,
  descricao text not null default '',
  cor text not null default '#0b6e4f',
  icone text not null default 'shield',
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  -- Cargo de sistema nao pode ser excluido. Sao os tres que o app pressupoe.
  sistema boolean not null default false,
  permissoes text[] not null default '{}',
  "criadoEm" timestamptz not null default now(),
  "atualizadoEm" timestamptz not null default now()
);

alter table cargos enable row level security;

-- Os tres cargos de sistema, com as mesmas permissoes que o app ja usava como
-- padrao. Sem eles, quem ja tem acesso ficaria sem cargo e perderia tudo.
insert into cargos (identificador, nome, descricao, cor, icone, sistema, permissoes) values
  (
    'administrador',
    'Administrador',
    'Acesso total ao sistema, incluindo administracao, usuarios e cargos.',
    '#0b6e4f',
    'crown',
    true,
    array[
      'dashboard.visualizar',
      'formularios.criar', 'formularios.editar', 'formularios.excluir',
      'formularios.aprovar', 'formularios.reprovar', 'formularios.reabrir',
      'formularios.exportar.pdf', 'formularios.baixar.imagens', 'formularios.enviar.outlook',
      'historico.visualizar', 'historico.ver.de.todos', 'historico.editar',
      'historico.excluir', 'historico.exportar',
      'usuarios.criar', 'usuarios.editar', 'usuarios.excluir',
      'usuarios.ativar', 'usuarios.desativar', 'usuarios.resetar.senha',
      'administracao.gerenciar.cargos', 'administracao.gerenciar.permissoes',
      'administracao.configuracoes', 'administracao.auditoria', 'administracao.logs'
    ]
  ),
  (
    'operador',
    'Operador',
    'Cria e acompanha formularios de avaliacao de servicos.',
    '#2563eb',
    'user',
    true,
    array[
      'dashboard.visualizar',
      'formularios.criar', 'formularios.editar',
      'formularios.exportar.pdf', 'formularios.baixar.imagens',
      'historico.visualizar', 'historico.exportar'
    ]
  ),
  (
    'visualizador',
    'Visualizador',
    'Consulta o dashboard e o historico em modo somente leitura.',
    '#4b5563',
    'eye',
    true,
    array['dashboard.visualizar', 'historico.visualizar']
  )
on conflict (identificador) do nothing;

-- 2) Cargo de cada pessoa -------------------------------------------------
alter table solicitacoes_acesso
  add column if not exists cargo text;

-- Herda do papel antigo. Sem isto, todo mundo que ja tinha acesso amanheceria
-- sem cargo e, portanto, sem permissao nenhuma.
update solicitacoes_acesso
set cargo = papel
where cargo is null or cargo = '';

-- 3) Identidade, cargo e permissoes ---------------------------------------
-- security definer em todas: elas consultam solicitacoes_acesso e cargos, e sem
-- isso a propria policy que as chama entraria em recursao com a policy de
-- leitura dessas tabelas.
create or replace function cargo_atual()
returns text
language sql
stable
security definer
set search_path = public
as $fn$
  select coalesce(
    (
      select s.cargo from solicitacoes_acesso s
      where lower(s.email) = email_da_sessao() and s.status = 'aprovado'
      limit 1
    ),
    ''
  )
$fn$;

-- Projeto do acesso. Vazio significa todos os projetos.
create or replace function projeto_atual()
returns text
language sql
stable
security definer
set search_path = public
as $fn$
  select coalesce(
    (
      select s.projeto from solicitacoes_acesso s
      where lower(s.email) = email_da_sessao() and s.status = 'aprovado'
      limit 1
    ),
    ''
  )
$fn$;

-- A pergunta central das policies. O administrador da tabela administradores
-- responde sim para tudo, que e a chave reserva contra travar o acesso.
create or replace function tem_permissao(p_permissao text)
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select eh_administrador() or exists (
    select 1
    from solicitacoes_acesso s
    join cargos c on c.identificador = s.cargo
    where lower(s.email) = email_da_sessao()
      and s.status = 'aprovado'
      and c.status = 'ativo'
      and p_permissao = any (c.permissoes)
  )
$fn$;

-- Alcance por projeto. Projeto em branco no acesso ve tudo, projeto nomeado ve
-- so o proprio. Ficha sem projeto preenchido fica visivel apenas para quem ve
-- todos, que e o caso das fichas antigas do periodo sem login.
create or replace function alcanca_projeto(p_projeto text)
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select eh_administrador()
    or projeto_atual() = ''
    or coalesce(p_projeto, '') = projeto_atual()
$fn$;

-- Substitui a versao da 007, que olhava so para administrador. Agora qualquer
-- cargo com um dos tres direitos de decisao entra aqui.
create or replace function pode_decidir_ficha()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select tem_permissao('formularios.aprovar')
    or tem_permissao('formularios.reprovar')
    or tem_permissao('formularios.reabrir')
$fn$;

-- 4) Leitura das fichas ---------------------------------------------------
-- A propria ficha sempre aparece para quem a preencheu, mesmo que o cargo mude
-- depois. Ficha de outra pessoa exige a permissao e o alcance de projeto.
drop policy if exists "Leitura das proprias fichas" on formularios_avaliacao;
drop policy if exists "Leitura por cargo" on formularios_avaliacao;
create policy "Leitura por cargo"
  on formularios_avaliacao for select
  to authenticated
  using (
    eh_administrador()
    or (
      acesso_aprovado()
      and (
        lower(coalesce("criadoPorEmail", '')) = email_da_sessao()
        or (tem_permissao('historico.ver.de.todos') and alcanca_projeto(projeto))
      )
    )
  );

-- 5) Envio ----------------------------------------------------------------
drop policy if exists "Envio assinado pelo autor" on formularios_avaliacao;
drop policy if exists "Envio por cargo" on formularios_avaliacao;
create policy "Envio por cargo"
  on formularios_avaliacao for insert
  to authenticated
  with check (
    tem_permissao('formularios.criar')
    and lower(coalesce("criadoPorEmail", '')) = email_da_sessao()
    and status in ('rascunho', 'enviado')
  );

-- 6) Alteracao ------------------------------------------------------------
-- Duas portas diferentes na mesma policy. A de cima e a de quem decide: mexe em
-- ficha alheia, inclusive no status, dentro do alcance de projeto. A de baixo e
-- a do autor: mexe so na propria e so enquanto ela nao foi decidida, porque
-- status aparece nas duas metades e impede levar a propria ficha para aprovado.
drop policy if exists "Atualizacao do autor ou do admin" on formularios_avaliacao;
drop policy if exists "Alteracao por cargo" on formularios_avaliacao;
create policy "Alteracao por cargo"
  on formularios_avaliacao for update
  to authenticated
  using (
    (pode_decidir_ficha() and alcanca_projeto(projeto))
    or (
      tem_permissao('formularios.editar')
      and lower(coalesce("criadoPorEmail", '')) = email_da_sessao()
      and status in ('rascunho', 'enviado')
    )
  )
  with check (
    (pode_decidir_ficha() and alcanca_projeto(projeto))
    or (
      tem_permissao('formularios.editar')
      and lower(coalesce("criadoPorEmail", '')) = email_da_sessao()
      and status in ('rascunho', 'enviado')
    )
  );

-- 7) Exclusao -------------------------------------------------------------
drop policy if exists "Exclusao somente para admin" on formularios_avaliacao;
drop policy if exists "Exclusao por cargo" on formularios_avaliacao;
create policy "Exclusao por cargo"
  on formularios_avaliacao for delete
  to authenticated
  using (
    tem_permissao('formularios.excluir')
    and (
      lower(coalesce("criadoPorEmail", '')) = email_da_sessao()
      or alcanca_projeto(projeto)
    )
  );

-- 8) Quem administra acessos ----------------------------------------------
-- Deixa de ser so a tabela administradores: um cargo com Usuarios Editar
-- tambem decide. A chave reserva continua dentro de tem_permissao.
drop policy if exists "Somente admin decide" on solicitacoes_acesso;
drop policy if exists "Decide quem tem permissao de usuarios" on solicitacoes_acesso;
create policy "Decide quem tem permissao de usuarios"
  on solicitacoes_acesso for update
  to authenticated
  using (tem_permissao('usuarios.editar'))
  with check (tem_permissao('usuarios.editar'));

drop policy if exists "Somente admin exclui" on solicitacoes_acesso;
drop policy if exists "Exclui quem tem permissao de usuarios" on solicitacoes_acesso;
create policy "Exclui quem tem permissao de usuarios"
  on solicitacoes_acesso for delete
  to authenticated
  using (tem_permissao('usuarios.excluir'));

drop policy if exists "Admin cria acesso" on solicitacoes_acesso;
drop policy if exists "Cria acesso quem tem permissao de usuarios" on solicitacoes_acesso;
create policy "Cria acesso quem tem permissao de usuarios"
  on solicitacoes_acesso for insert
  to authenticated
  with check (tem_permissao('usuarios.criar'));

drop policy if exists "Ver a propria solicitacao ou todas se admin" on solicitacoes_acesso;
drop policy if exists "Ver a propria solicitacao ou todas com permissao" on solicitacoes_acesso;
create policy "Ver a propria solicitacao ou todas com permissao"
  on solicitacoes_acesso for select
  to authenticated
  using (lower(email) = email_da_sessao() or tem_permissao('usuarios.editar'));

-- 9) Policies da tabela de cargos -----------------------------------------
-- Leitura liberada para quem esta autenticado: o app precisa da lista para
-- montar a tela e para saber as proprias permissoes. Nao ha dado sensivel ali.
drop policy if exists "Todos leem os cargos" on cargos;
create policy "Todos leem os cargos"
  on cargos for select
  to authenticated
  using (true);

drop policy if exists "Gerencia de cargos" on cargos;
create policy "Gerencia de cargos"
  on cargos for insert
  to authenticated
  with check (tem_permissao('administracao.gerenciar.cargos'));

drop policy if exists "Edicao de cargos" on cargos;
create policy "Edicao de cargos"
  on cargos for update
  to authenticated
  using (tem_permissao('administracao.gerenciar.cargos'))
  with check (tem_permissao('administracao.gerenciar.cargos'));

-- Cargo de sistema nao se exclui nem com permissao. O app depende dos tres.
drop policy if exists "Exclusao de cargos" on cargos;
create policy "Exclusao de cargos"
  on cargos for delete
  to authenticated
  using (tem_permissao('administracao.gerenciar.cargos') and sistema = false);

-- 10) registrar_acesso passa a devolver o cargo ---------------------------
-- Mesma funcao da 005, agora carregando cargo junto. Quem entra pelo dominio
-- recebe o cargo de mesmo nome que o papel configurado em dominios_liberados.
--
-- O DROP nao e enfeite. A funcao ganhou uma quarta coluna no retorno, e o
-- Postgres recusa create or replace quando o tipo de retorno muda, com a
-- mensagem de que nao da para trocar o tipo de retorno de uma funcao existente.
-- Sem esta linha a migracao para aqui.
drop function if exists registrar_acesso(text);

create or replace function registrar_acesso(p_nome text default '')
returns table (status text, papel text, projeto text, cargo text)
language sql
security definer
set search_path = public
as $fn$
  insert into solicitacoes_acesso (email, nome, status, papel, cargo, projeto, "decididoEm", "decididoPor")
  select
    lower(auth.jwt() ->> 'email'),
    coalesce(nullif(trim(p_nome), ''), split_part(lower(auth.jwt() ->> 'email'), '@', 1)),
    case when d.dominio is null then 'pendente' else 'aprovado' end,
    coalesce(d.papel, 'visualizador'),
    coalesce(d.papel, 'visualizador'),
    '',
    case when d.dominio is null then null else now() end,
    case when d.dominio is null then null else 'liberacao automatica por dominio' end
  from (select lower(split_part(auth.jwt() ->> 'email', '@', 2)) as dom) e
  left join dominios_liberados d on lower(d.dominio) = e.dom
  where nullif(auth.jwt() ->> 'email', '') is not null
  on conflict (lower(email)) do update
    set nome = coalesce(nullif(excluded.nome, ''), solicitacoes_acesso.nome)
  returning
    solicitacoes_acesso.status,
    solicitacoes_acesso.papel,
    solicitacoes_acesso.projeto,
    coalesce(solicitacoes_acesso.cargo, solicitacoes_acesso.papel)
$fn$;

grant execute on function registrar_acesso(text) to authenticated;

-- 11) Conferencia ---------------------------------------------------------
-- Quantas pessoas em cada cargo. Serve para confirmar que ninguem ficou sem.
select coalesce(nullif(cargo, ''), 'SEM CARGO') as cargo, status, count(*) as total
from solicitacoes_acesso
group by 1, 2
order by 1, 2;
