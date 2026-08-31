-- ============================================================================
-- Migracao 009 - contagem de fotos sem carregar as fotos
--
-- RODE DEPOIS DA 008.
--
-- POR QUE: a listagem do Historico e do Dashboard parou de baixar a coluna
-- imagens, que guarda as fotos em base64 e respondia por quase todo o peso de
-- uma ficha. Sem ela, porem, o app perdia como saber quantas fotos existem, e
-- o botao de exportar ficaria sempre desligado.
--
-- Esta coluna calculada resolve pelo banco: ela e um numero, custa quase nada
-- para trafegar, e o Postgres a mantem sempre certa sozinho. Nao ha o que
-- sincronizar nem risco de ficar defasada, porque ela nao e preenchida pelo
-- app.
--
-- Respeite a nota de formato da migracao 002 ao editar: sem bloco DO, sem
-- ponto-e-virgula dentro de aspas-dolar, e sem ponto-e-virgula em comentario.
-- ============================================================================

alter table formularios_avaliacao
  add column if not exists "qtdImagens" integer
  generated always as (jsonb_array_length(coalesce(imagens, '[]'::jsonb))) stored;

-- Conferencia: quantas fichas tem foto e quantas fotos existem no total.
select
  count(*) filter (where "qtdImagens" > 0) as fichas_com_foto,
  coalesce(sum("qtdImagens"), 0) as fotos,
  count(*) as fichas
from formularios_avaliacao;
