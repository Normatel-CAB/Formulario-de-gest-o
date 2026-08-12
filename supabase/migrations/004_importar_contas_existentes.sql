-- ============================================================================
-- Migracao 004 - importar quem ja tinha entrado
--
-- O QUE RESOLVE: as contas que voce ve no painel do Supabase estao em
-- auth.users, a tabela do login. Ela e do schema auth e o app nao consegue ler
-- pelo navegador, entao aquelas pessoas nunca apareceram na tela de acessos.
-- Antes da migracao 002 o login liberava direto, sem criar pedido, e por isso
-- solicitacoes_acesso ficou vazia mesmo com gente usando o sistema.
--
-- Este arquivo copia todas as contas de auth.users para a fila, como pendentes.
-- Depois disso elas aparecem em Usuarios e voce aprova com um clique cada,
-- escolhendo papel e projeto. Nao precisa digitar e-mail nenhum.
--
-- Quem ja esta em administradores fica de fora, porque entra direto.
-- Quem ja tem linha na fila fica de fora, para nao voltar ninguem decidido
-- para pendente.
--
-- E idempotente, pode rodar mais de uma vez. Rodar de novo depois de novos
-- logins e uma forma de reimportar quem faltou.
--
-- Respeite a nota de formato da migracao 002 ao editar: sem bloco DO, sem
-- ponto-e-virgula dentro de aspas-dolar, e sem ponto-e-virgula em comentario.
-- ============================================================================

insert into solicitacoes_acesso (email, nome, status, papel, projeto)
select
  lower(u.email),
  coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
    nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
    split_part(u.email, '@', 1)
  ),
  'pendente',
  'visualizador',
  ''
from auth.users u
where u.email is not null
  and not exists (
    select 1 from solicitacoes_acesso s where lower(s.email) = lower(u.email)
  )
  and not exists (
    select 1 from administradores a where lower(a.email) = lower(u.email)
  )
on conflict (lower(email)) do nothing;

-- Conferencia: quantas linhas existem em cada situacao depois da importacao.
select status, count(*) as total
from solicitacoes_acesso
group by status
order by status;
