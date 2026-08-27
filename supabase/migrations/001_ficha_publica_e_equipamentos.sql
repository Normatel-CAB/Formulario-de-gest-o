-- ============================================================================
-- Migração 001 — ficha pública + bloco de equipamentos + lotação
--
-- Rode este arquivo no SQL Editor do Supabase em um banco que já tenha o
-- schema.sql aplicado. Ele é idempotente: pode rodar mais de uma vez.
--
-- As colunas infoGerais e necessidades sao jsonb, entao os campos novos (lotacao e
-- necessidades.equipamentos) não exigem alteração de coluna. O que muda aqui é
-- só a permissão de envio anônimo e a normalização dos dados já gravados.
-- ============================================================================

-- 1) Envio sem login -------------------------------------------------------
-- A ficha é a tela inicial do sistema e a maioria dos colaboradores não tem
-- e-mail corporativo. O papel anônimo pode inserir, e só inserir.
drop policy if exists "Permitir envio anônimo da ficha" on formularios_avaliacao;
create policy "Permitir envio anônimo da ficha"
  on formularios_avaliacao for insert
  to anon
  with check (status in ('rascunho', 'enviado'));

-- 2) Lotação nas fichas antigas -------------------------------------------
update formularios_avaliacao
set "infoGerais" = "infoGerais" || jsonb_build_object('lotacao', '')
where not ("infoGerais" ? 'lotacao');

-- 3) PEMT e caminhão munck viram equipamentos -----------------------------
-- Antes: necessidades.pemt (dias) e necessidades.caminhaoMunck (data), em
-- blocos separados. Agora: necessidades.equipamentos.{pemt,caminhaoMunck} junto
-- com cesto, drone e retroescavadeira.
update formularios_avaliacao
set necessidades = (necessidades - 'pemt' - 'caminhaoMunck') || jsonb_build_object(
  'equipamentos',
  coalesce(necessidades -> 'equipamentos', '{}'::jsonb) || jsonb_build_object(
    'caminhaoCesto',    coalesce(necessidades -> 'equipamentos' -> 'caminhaoCesto',    '{"necessario": false}'::jsonb),
    'drone',            coalesce(necessidades -> 'equipamentos' -> 'drone',            '{"necessario": false}'::jsonb),
    'retroescavadeira', coalesce(necessidades -> 'equipamentos' -> 'retroescavadeira', '{"necessario": false}'::jsonb),
    'pemt', coalesce(
      necessidades -> 'equipamentos' -> 'pemt',
      case
        when (necessidades -> 'pemt' ->> 'necessario')::boolean
          then jsonb_build_object('necessario', true, 'dias', necessidades -> 'pemt' -> 'dias')
        else '{"necessario": false}'::jsonb
      end
    ),
    'caminhaoMunck', coalesce(
      necessidades -> 'equipamentos' -> 'caminhaoMunck',
      case
        when (necessidades -> 'caminhaoMunck' ->> 'necessario')::boolean
          then jsonb_build_object('necessario', true, 'data', necessidades -> 'caminhaoMunck' -> 'data')
        else '{"necessario": false}'::jsonb
      end
    )
  )
)
where not (necessidades -> 'equipamentos' ? 'retroescavadeira');
