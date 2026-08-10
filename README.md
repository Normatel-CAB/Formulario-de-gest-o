# Sistema de Gestão Integrada — Ficha Técnica de Avaliação de Serviços

PWA para preenchimento, acompanhamento e aprovação de fichas técnicas de avaliação de serviços, com suporte completo a uso offline e sincronização automática com Supabase.

O visual segue o **Design System Normatel** do app do organograma (`organograma-macae-normatel`): mesmos tokens, mesmos cards de vidro, mesmo fundo com halos e grade, temas claro e escuro. Ver `DESIGN.md`.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 com os tokens Normatel (`src/index.css`)
- Zustand (estado)
- IndexedDB (`idb`) para persistência offline e fila de sincronização
- Supabase (Postgres + Storage + Auth/Azure) como banco de dados e login
- `vite-plugin-pwa` (Service Worker, manifest, cache offline)
- Framer Motion (animações discretas, sempre com `prefers-reduced-motion`)

## Como rodar

```bash
npm install
cp .env.example .env   # preencha com as credenciais do seu projeto Supabase
npm run dev
```

## Navegação

| Rota | Quem acessa | O que é |
| --- | --- | --- |
| `/` | qualquer pessoa, sem login | Nova Ficha Técnica de Avaliação (tela inicial) |
| `/login` | qualquer pessoa | Área administrativa (Microsoft ou e-mail/senha) |
| `/dashboard`, `/historico`, `/usuarios`, … | autenticado | Gestão, histórico e administração |

A raiz é a ficha **de propósito**: a maioria dos colaboradores não tem e-mail corporativo, então exigir login na entrada bloquearia justamente quem preenche a ficha. O acesso à área administrativa fica num painel que abre no próprio cabeçalho da ficha.

## Login Microsoft (Supabase + Entra ID)

O botão usa `supabase.auth.signInWithOAuth({ provider: 'azure' })`. Para funcionar, os três lados precisam concordar:

**1. Arquivo `.env`** (sem ele o botão só mostra "indisponível"):

```
VITE_SUPABASE_URL=https://<projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

**2. Azure — App registration** (portal.azure.com → Microsoft Entra ID → App registrations):

- Redirect URI (tipo **Web**): `https://<projeto>.supabase.co/auth/v1/callback`
- Anote *Application (client) ID*, *Directory (tenant) ID* e crie um *Client secret*
- Permissões delegadas do Microsoft Graph: `openid`, `profile`, `email`, `offline_access`

**3. Supabase — Authentication:**

- *Providers → Azure*: habilite e cole Client ID, Client Secret e a Azure Tenant URL (`https://login.microsoftonline.com/<tenant-id>`)
- *URL Configuration → Site URL*: o endereço do app (ex.: `http://localhost:5173` em desenvolvimento)
- *URL Configuration → Redirect URLs*: adicione `http://localhost:5173/**` e o domínio de produção com `/**`. O app volta em `/dashboard`.

### O que já foi corrigido no código

- `detectSessionInUrl` e `flowType: 'pkce'` explícitos no cliente Supabase — sem isso o retorno da Microsoft era ignorado e o usuário voltava para a tela de login como se nada tivesse acontecido
- escopo `offline_access` (garante o refresh token; sem ele a sessão expira em minutos)
- `onAuthStateChange` além do `getSession()`: a troca do código pela sessão termina *depois* da inicialização, e quem só olhava o `getSession` perdia o login
- erro devolvido na URL (`?error=…`) é lido e exibido em vez de sumir silenciosamente
- `signOut()` no Supabase ao sair — antes a sessão sobrevivia ao logout e o app reautenticava sozinho

> **Papel do usuário Microsoft:** uma conta Microsoft que ainda não existe na base entra como `visualizador`. Para virar administrador, um admin precisa promovê-la em *Usuários*, ou o e-mail precisa já existir cadastrado com o papel desejado.

## Banco de dados (Supabase)

Execute `supabase/schema.sql` no SQL Editor. Em bancos que já existiam, rode também `supabase/migrations/001_ficha_publica_e_equipamentos.sql`, que:

- libera `INSERT` para o papel anônimo (só inserir — ler, alterar e excluir continuam exigindo login)
- acrescenta `lotacao` às fichas antigas
- move `necessidades.pemt` e `necessidades.caminhaoMunck` para `necessidades.equipamentos`

O app também normaliza fichas antigas ao carregá-las (`normalizarFormulario` em `src/lib/factory.ts`), então rascunhos locais continuam abrindo.

> A sincronização usa `upsert`. Como o papel anônimo só tem permissão de `INSERT`, um reenvio da *mesma* ficha sem login falha na segunda tentativa e fica na fila offline. Se isso virar um problema na prática, o caminho é uma função `rpc` de envio em vez de abrir `UPDATE` para o anônimo.

Sem as variáveis `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, o app funciona 100% localmente (IndexedDB) e o login Microsoft fica indisponível.

## Funcionalidades

- Formulário em etapas: Informações Gerais, Necessidades da Execução, Apoio/Anexos e Revisão
- **Informações Gerais** inclui *Lotação* (Áreas Externas, UTE, Tapera, Cabiúnas, Barra do Furado, Severina) além do local livre da atividade
- **Necessidades da Execução** começa pelos equipamentos: caminhão cesto, caminhão munck, drone, PEMT e retroescavadeira — cada um com dias e data prevista
- Campos condicionais (Sim/Não), datas de agendamento e quantidade de dias com fim de semana
- Upload de imagens, captura pela câmera, localização GPS com mapa embutido e assinatura digital
- Rascunho automático (autosave) + salvar rascunho manual
- Histórico com pesquisa, filtros e status (Rascunho, Enviado, Em Análise, Aprovado, Reprovado)
- Dashboard com indicadores e últimos envios
- Funcionamento offline com fila de sincronização automática ao reconectar
- Temas claro e escuro (padrão escuro), com a preferência salva no navegador
- Logo da empresa configurável no cabeçalho

## Build de produção

```bash
npm run build
npm run preview
```
