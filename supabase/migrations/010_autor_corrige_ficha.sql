-- ============================================================================
-- Migracao 010 - autor corrige a propria ficha depois de enviada
--
-- RODE DEPOIS DA 009.
--
-- POR QUE: na 008 o autor so mexia na ficha enquanto ela estava em rascunho ou
-- enviado. Se faltava alguma coisa e a ficha era reprovada, o jeito era fazer
-- outra do zero. Agora o autor pode editar enquanto ela nao foi aprovada, e ao
-- reenviar ela volta para enviado e passa por nova avaliacao.
--
-- O with check continua exigindo rascunho ou enviado na linha nova. Isso
-- impede o autor de aproveitar a edicao para se aprovar.
--
-- Quem decide ficha (pode_decidir_ficha) segue como na 008: edita qualquer
-- ficha do proprio alcance de projeto, em qualquer status.
--
-- Respeite a nota de formato da migracao 002 ao editar: sem bloco DO, sem
-- ponto-e-virgula dentro de aspas-dolar, e sem ponto-e-virgula em comentario.
-- ============================================================================

drop policy if exists "Alteracao por cargo" on formularios_avaliacao;
create policy "Alteracao por cargo"
  on formularios_avaliacao for update
  to authenticated
  using (
    (pode_decidir_ficha() and alcanca_projeto(projeto))
    or (
      tem_permissao('formularios.editar')
      and lower(coalesce("criadoPorEmail", '')) = email_da_sessao()
      and status <> 'aprovado'
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
