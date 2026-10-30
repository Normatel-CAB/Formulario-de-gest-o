-- ============================================================================
-- Migracao 011 - supervisor, Em Compras, Programado e carteiras
--
-- RODE DEPOIS DA 010.
--
-- FLUXO NOVO
--   operador    cria e envia
--   supervisor  poe em analise, aprova, reprova ou manda pra Em Compras com
--               justificativa. Quando o material chega, ele mesmo aprova.
--   planejador  so enxerga ficha ja avaliada (aprovada, reprovada, em compras,
--               programada) e marca Programado nas aprovadas
--
-- PERMISSOES NOVAS (aparecem na tela de Cargos)
--   formularios.em.compras    mandar pra Em Compras. Conta como direito de
--                             decidir, igual aprovar e reprovar
--   formularios.programar     marcar Programado e editar ficha aprovada ou
--                             programada
--   historico.ver.avaliadas   ver ficha de outras pessoas so depois que o
--                             supervisor avaliou
--
-- Status e um enum. Valor novo de enum nao pode ser usado na mesma transacao
-- em que foi criado, e o SQL Editor roda tudo junto. Por isso as policies
-- comparam status::text, que nao depende do valor ja estar gravado.
--
-- Respeite a nota de formato da migracao 002 ao editar: sem bloco DO, sem
-- ponto-e-virgula dentro de aspas-dolar, e sem ponto-e-virgula em comentario.
-- ============================================================================

-- 1) Status novos ------------------------------------------------------------
alter type form_status add value if not exists 'em_compras';
alter type form_status add value if not exists 'programado';

-- 2) Justificativa do Em Compras ---------------------------------------------
alter table formularios_avaliacao
  add column if not exists "justificativaCompras" text;

-- 3) Quem decide passa a incluir Em Compras ----------------------------------
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
    or tem_permissao('formularios.em.compras')
$fn$;

-- 4) Leitura -----------------------------------------------------------------
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
        or (
          tem_permissao('historico.ver.avaliadas')
          and alcanca_projeto(projeto)
          and status::text in ('aprovado', 'reprovado', 'em_compras', 'programado')
        )
      )
    )
  );

-- 5) Alteracao ---------------------------------------------------------------
-- Tres portas. Quem decide mexe em tudo no proprio alcance. O planejador mexe
-- so em ficha aprovada ou programada, e so consegue deixar ela num desses dois.
-- O autor corrige a propria enquanto nao foi aprovada (regra da 010).
drop policy if exists "Alteracao por cargo" on formularios_avaliacao;
create policy "Alteracao por cargo"
  on formularios_avaliacao for update
  to authenticated
  using (
    (pode_decidir_ficha() and alcanca_projeto(projeto))
    or (
      tem_permissao('formularios.programar')
      and alcanca_projeto(projeto)
      and status::text in ('aprovado', 'programado')
    )
    or (
      tem_permissao('formularios.editar')
      and lower(coalesce("criadoPorEmail", '')) = email_da_sessao()
      and status::text in ('rascunho', 'enviado', 'em_analise', 'reprovado', 'em_compras')
    )
  )
  with check (
    (pode_decidir_ficha() and alcanca_projeto(projeto))
    or (
      tem_permissao('formularios.programar')
      and alcanca_projeto(projeto)
      and status::text in ('aprovado', 'programado')
    )
    or (
      tem_permissao('formularios.editar')
      and lower(coalesce("criadoPorEmail", '')) = email_da_sessao()
      and status::text in ('rascunho', 'enviado')
    )
  );

-- 6) Cargo Supervisor --------------------------------------------------------
insert into cargos (identificador, nome, descricao, cor, icone, sistema, permissoes) values
  (
    'supervisor',
    'Supervisor',
    'Avalia as fichas: aprova, reprova ou manda para compras.',
    '#d97706',
    'check-circle',
    false,
    array[
      'dashboard.visualizar',
      'formularios.aprovar', 'formularios.reprovar', 'formularios.reabrir', 'formularios.em.compras',
      'formularios.exportar.pdf', 'formularios.baixar.imagens',
      'historico.visualizar', 'historico.ver.de.todos', 'historico.exportar'
    ]
  )
on conflict (identificador) do nothing;

-- 7) Planejador deixa de aprovar e passa a programar -------------------------
-- So mexe se existir um cargo com identificador planejador. Se o de voces tiver
-- outro nome, ajuste na tela de Cargos.
update cargos
set permissoes = array(
      select distinct p
      from unnest(
        array_cat(
          array(
            select x from unnest(permissoes) x
            where x not in (
              'formularios.aprovar', 'formularios.reprovar', 'formularios.reabrir',
              'formularios.em.compras', 'historico.ver.de.todos'
            )
          ),
          array['formularios.programar', 'historico.ver.avaliadas', 'historico.visualizar']
        )
      ) p
    ),
    "atualizadoEm" = now()
where identificador = 'planejador';

-- 8) Carteiras ---------------------------------------------------------------
create table if not exists carteiras (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ativo boolean not null default true,
  "criadoEm" timestamptz not null default now()
);

create unique index if not exists carteiras_nome_unico on carteiras (lower(nome));

alter table carteiras enable row level security;

drop policy if exists "Todos leem as carteiras" on carteiras;
create policy "Todos leem as carteiras"
  on carteiras for select
  to authenticated
  using (true);

drop policy if exists "Configuracao cria carteira" on carteiras;
create policy "Configuracao cria carteira"
  on carteiras for insert
  to authenticated
  with check (tem_permissao('administracao.configuracoes'))
;

drop policy if exists "Configuracao edita carteira" on carteiras;
create policy "Configuracao edita carteira"
  on carteiras for update
  to authenticated
  using (tem_permissao('administracao.configuracoes'))
  with check (tem_permissao('administracao.configuracoes'));

drop policy if exists "Configuracao exclui carteira" on carteiras;
create policy "Configuracao exclui carteira"
  on carteiras for delete
  to authenticated
  using (tem_permissao('administracao.configuracoes'));

-- 9) Conferencia -------------------------------------------------------------
select identificador, nome, permissoes from cargos
where identificador in ('supervisor', 'planejador');
