-- ============================================================================
-- Migracao 006 - quem entra pelo dominio ja preenche ficha
--
-- O QUE MUDA: o dominio normatel.com.br passa a liberar como OPERADOR, e nao
-- mais como visualizador.
--
-- POR QUE: preencher a ficha e a razao de existir do app. Com o papel de
-- visualizador, o colaborador entrava mas ficava esperando um administrador
-- promover a conta antes de poder preencher qualquer coisa, que e exatamente a
-- espera que a liberacao automatica queria evitar.
--
-- Os papeis voltam a significar o que dizem:
--   visualizador  - so consulta
--   operador      - preenche ficha e ve as proprias
--   administrador - tudo, inclusive aprovar acessos
--
-- Respeite a nota de formato da migracao 002 ao editar: sem bloco DO, sem
-- ponto-e-virgula dentro de aspas-dolar, e sem ponto-e-virgula em comentario.
-- ============================================================================

update dominios_liberados
set papel = 'operador'
where lower(dominio) = 'normatel.com.br';

-- Promove quem ja entrou pela regra automatica enquanto ela dava visualizador.
-- O filtro por decididoPor e proposital: so alcanca as contas liberadas pelo
-- dominio, sem mexer em ninguem que voce tenha decidido a mao.
update solicitacoes_acesso
set papel = 'operador'
where status = 'aprovado'
  and papel = 'visualizador'
  and "decididoPor" = 'liberacao automatica por dominio';

-- Conferencia rapida do resultado.
select papel, status, count(*) as total
from solicitacoes_acesso
group by papel, status
order by papel, status;
