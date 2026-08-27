-- ============================================================================
-- Migracao 007 - dono da ficha e papel valendo no banco
--
-- RODE DEPOIS DA 005 E DA 006. A auditoria mostrou que elas nunca foram
-- executadas neste projeto: a funcao registrar_acesso e a tabela
-- dominios_liberados nao existem no banco. Rode 005, depois 006, depois esta.
--
-- O QUE ESTA MIGRACAO CORRIGE
--
-- Ate aqui, toda a diferenca entre visualizador, operador e administrador
-- morava no JavaScript. Para o banco existiam apenas duas categorias: aprovado
-- e nao aprovado. Qualquer conta aprovada podia, chamando a API direto:
--   1. ler TODAS as fichas, com fotos, assinatura e coordenadas de GPS
--   2. alterar QUALQUER ficha, inclusive marcar a propria como aprovada
-- O filtro por autor do historico e os botoes escondidos por papel controlam a
-- tela, nao o acesso. Quem abre o DevTools nao usa a tela.
--
-- A regra passa a ser: administrador ve e decide tudo, operador mexe apenas nas
-- proprias fichas e apenas enquanto elas sao rascunho ou enviado, visualizador
-- so le as proprias.
--
-- ATENCAO A UM EFEITO COLATERAL: fichas antigas sem criadoPorEmail preenchido
-- deixam de aparecer para quem nao e administrador. Elas ja nao apareciam na
-- tela, porque o historico filtra por autor, mas confira o resultado da
-- consulta de conferencia no fim do arquivo antes de considerar concluido.
--
-- Respeite a nota de formato da migracao 002 ao editar: sem bloco DO, sem
-- ponto-e-virgula dentro de aspas-dolar, e sem ponto-e-virgula em comentario.
-- ============================================================================

-- 1) Coluna do autor ------------------------------------------------------
-- O app ja envia criadoPorEmail. A coluna e criada aqui por seguranca, para a
-- migracao rodar tambem num banco que ainda nao a tenha.
alter table formularios_avaliacao
  add column if not exists "criadoPorEmail" text;

alter table formularios_avaliacao
  add column if not exists "criadoPorId" text;

create index if not exists idx_formularios_autor
  on formularios_avaliacao (lower("criadoPorEmail"));

-- 2) Identidade e papel, lidos do banco -----------------------------------
-- E-mail da sessao, sempre em minusculas. Evita repetir o coalesce em cada
-- policy e garante a mesma normalizacao em todas elas.
create or replace function email_da_sessao()
returns text
language sql
stable
as $fn$
  select lower(coalesce(auth.jwt() ->> 'email', ''))
$fn$;

-- Papel efetivo da conta, decidido pelo banco e nao pelo navegador. Devolve
-- nenhum para quem nao esta aprovado, o que ja barra as policies abaixo.
create or replace function papel_atual()
returns text
language sql
stable
security definer
set search_path = public
as $fn$
  select case
    when eh_administrador() then 'administrador'
    else coalesce(
      (
        select s.papel from solicitacoes_acesso s
        where lower(s.email) = email_da_sessao() and s.status = 'aprovado'
        limit 1
      ),
      'nenhum'
    )
  end
$fn$;

-- Quem pode decidir uma ficha, ou seja, aprovar e reprovar.
--
-- Hoje devolve o mesmo que eh_administrador. Existe separada de proposito: a
-- intencao e ter gente que aprova e reprova ficha SEM administrar acessos de
-- usuario, e essas duas coisas nao sao o mesmo poder. Quando esse papel for
-- criado, basta acrescentar o nome dele na lista aqui embaixo e as policies de
-- leitura e alteracao passam a respeita-lo sozinhas, sem reescrever nada.
create or replace function pode_decidir_ficha()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select papel_atual() in ('administrador')
$fn$;

-- 3) Leitura: cada um ve as proprias fichas -------------------------------
drop policy if exists "Permitir leitura para usuários autenticados" on formularios_avaliacao;
drop policy if exists "Leitura para acesso aprovado" on formularios_avaliacao;
drop policy if exists "Leitura das proprias fichas" on formularios_avaliacao;
create policy "Leitura das proprias fichas"
  on formularios_avaliacao for select
  to authenticated
  using (
    pode_decidir_ficha()
    or (
      papel_atual() in ('operador', 'visualizador')
      and lower(coalesce("criadoPorEmail", '')) = email_da_sessao()
    )
  );

-- 4) Envio: so operador e admin, e assinado por quem envia -----------------
-- O criadoPorEmail precisa bater com a sessao. Sem isso alguem gravaria ficha
-- em nome de outra pessoa, e o historico do colega apareceria adulterado.
drop policy if exists "Permitir envio anônimo da ficha" on formularios_avaliacao;
drop policy if exists "Envio anonimo da ficha" on formularios_avaliacao;
drop policy if exists "Permitir escrita para usuários autenticados" on formularios_avaliacao;
drop policy if exists "Envio para autenticados" on formularios_avaliacao;
drop policy if exists "Envio para acesso aprovado" on formularios_avaliacao;
drop policy if exists "Envio assinado pelo autor" on formularios_avaliacao;
create policy "Envio assinado pelo autor"
  on formularios_avaliacao for insert
  to authenticated
  with check (
    papel_atual() in ('administrador', 'operador')
    and lower(coalesce("criadoPorEmail", '')) = email_da_sessao()
    and status in ('rascunho', 'enviado')
  );

-- 5) Alteracao: o status e do administrador -------------------------------
-- O USING olha a linha como ela esta, o WITH CHECK olha como ela ficaria. Com
-- a mesma condicao nos dois, o operador nao consegue nem partir de uma ficha ja
-- aprovada nem levar a propria ficha para aprovado. Aprovar e reprovar fica com
-- o administrador, que e o que o fluxo de planejamento pressupoe.
drop policy if exists "Permitir atualização para usuários autenticados" on formularios_avaliacao;
drop policy if exists "Atualizacao para acesso aprovado" on formularios_avaliacao;
drop policy if exists "Atualizacao do autor ou do admin" on formularios_avaliacao;
create policy "Atualizacao do autor ou do admin"
  on formularios_avaliacao for update
  to authenticated
  using (
    pode_decidir_ficha()
    or (
      papel_atual() = 'operador'
      and lower(coalesce("criadoPorEmail", '')) = email_da_sessao()
      and status in ('rascunho', 'enviado')
    )
  )
  with check (
    pode_decidir_ficha()
    or (
      papel_atual() = 'operador'
      and lower(coalesce("criadoPorEmail", '')) = email_da_sessao()
      and status in ('rascunho', 'enviado')
    )
  );

-- 6) Exclusao continua so do administrador --------------------------------
drop policy if exists "Permitir exclusão para usuários autenticados" on formularios_avaliacao;
drop policy if exists "Exclusao somente para admin" on formularios_avaliacao;
create policy "Exclusao somente para admin"
  on formularios_avaliacao for delete
  to authenticated
  using (eh_administrador());

-- 7) Buckets de arquivo voltam a ser privados -----------------------------
-- Os dois foram criados como publicos no schema inicial e nenhum codigo do app
-- usa qualquer um deles hoje. Bucket publico entrega o arquivo a quem souber o
-- caminho, sem token e sem login, e nao aparece em nenhuma policy do banco.
update storage.buckets
set public = false
where id in ('formularios-anexos', 'configuracoes');

-- 8) Conferencia ----------------------------------------------------------
-- Quantas fichas ficariam invisiveis para o autor por falta de criadoPorEmail.
-- Se vier um numero alto, preencha a coluna antes de avisar a equipe.
select
  count(*) filter (where coalesce("criadoPorEmail", '') = '') as sem_autor,
  count(*) as total
from formularios_avaliacao;
