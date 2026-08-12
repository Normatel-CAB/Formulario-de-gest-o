-- ============================================================================
-- Migracao 003 - administrador gerencia acessos diretamente
--
-- POR QUE: a tela "Usuarios" lista o IndexedDB, que e local de cada aparelho.
-- Quem entrou pelo proprio celular criou a conta lá, e essa conta nunca apareceu
-- para o administrador. A tabela solicitacoes_acesso passa a ser o diretorio
-- compartilhado de acessos, e nao so uma fila de pedidos.
--
-- O que muda: o administrador pode INSERIR um acesso ja aprovado, para liberar
-- quem entrou antes desta mudanca sem obrigar a pessoa a pedir de novo.
--
-- Respeite a nota de formato da migracao 002 ao editar: sem bloco DO, sem
-- ponto-e-virgula dentro de aspas-dolar, e sem ponto-e-virgula em comentario.
-- ============================================================================

-- A policy de insercao da 002 e restrita ao proprio e-mail e a status pendente,
-- de proposito, para ninguem se aprovar sozinho. Ela continua valendo. Esta
-- policy adicional abre a insercao apenas para quem esta em administradores.
--
-- Nao existe policy de auto-atualizacao aqui de proposito. Uma policy que
-- consulta a propria tabela dentro do WITH CHECK dispara a policy de SELECT da
-- mesma tabela e entra em recursao. Alterar nome, papel, projeto ou status fica
-- com o administrador, pela policy "Somente admin decide" da migracao 002.
drop policy if exists "Admin cria acesso" on solicitacoes_acesso;
create policy "Admin cria acesso"
  on solicitacoes_acesso for insert
  to authenticated
  with check (eh_administrador());
