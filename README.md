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

### Quem entra como administrador

A base de usuários vive no dispositivo (IndexedDB), então não existe um "servidor" para consultar papéis no primeiro acesso de cada celular. Quem decide isso é a lista em `src/lib/auth.ts`:

```ts
export const EMAILS_ADMINISTRADORES = ['gabriel.cruz@normatel.com.br']
```

Um e-mail nessa lista entra como **administrador** ao logar com a Microsoft — e uma conta que já havia entrado antes como visualizador é promovida no login seguinte. Qualquer outra conta Microsoft entra como `visualizador`, e um administrador pode mudar o papel em *Usuários*. Para dar acesso administrativo a mais alguém, acrescente o e-mail (em minúsculas) à lista.

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
- Logo da empresa configurável no cabeçalho (padrão: `public/logo.png`)

### Dashboard

Mesmos blocos do dashboard do organograma, construídos com os componentes de `src/components/ui` e `src/components/dashboard`:

- 4 KPIs com contador animado e sparkline (total, pendentes, aprovadas, equipamento mais pedido)
- rosca de participação por status, em SVG puro, com rótulo central que cicla
- volume de fichas por mês e ranking de equipamentos solicitados, em barras
- tabela de fichas por lotação com a barra de proporção crescendo ao fundo da linha

Os gráficos são feitos à mão em SVG/CSS de propósito — o app não tem Recharts nas dependências, e trazer uma biblioteca de gráficos pesaria mais no bundle (que roda offline no celular) do que os componentes inteiros.

### Celular e tablet

- A gaveta de navegação vale até 1023px: no tablet em retrato uma coluna fixa comeria a largura útil da ficha
- Campos sobem para 16px abaixo de 768px — o Safari do iPhone dá zoom (e não volta) em campos com fonte menor
- Em tela de toque, campos têm 44px de altura mínima; controles que não podem crescer (interruptor, bolinha do stepper) ganham área de toque por um pseudo-elemento (`.tap-target`)
- O stepper mostra "Etapa N de 4 · nome" no celular, onde não cabe o rótulo de cada etapa
- Tabelas rolam dentro do próprio wrapper e escondem colunas de apoio nas telas estreitas; nada cria rolagem horizontal na página
- Barra de ações da ficha, diálogos e avisos respeitam a área segura (notch e barra inferior do iPhone)

## Instalar no celular e no tablet (PWA)

O app é instalável: abre pelo ícone, em tela cheia, sem barra de navegador, e continua funcionando sem sinal.

| Sistema | Como instalar |
| --- | --- |
| Android (Chrome, Edge) | Botão **Instalar app** no cabeçalho, ou menu ⋮ → *Instalar aplicativo* |
| iPhone / iPad (Safari) | **Compartilhar** → *Adicionar à Tela de Início*. O botão do app abre um passo a passo. |
| Windows / macOS (Chrome, Edge) | Ícone de instalar na barra de endereço, ou o mesmo botão do cabeçalho |

O convite de instalação também aparece abaixo da ficha e fica dispensado no `localStorage` quando a pessoa fecha — não insiste a cada visita.

> **Requisito:** o navegador só oferece instalação em **HTTPS** ou em **localhost**. Demonstrando pelo IP da rede local (`http://192.168.x.x:5173`) o botão não aparece — publique em HTTPS (Vercel, Netlify) ou use `localhost` na própria máquina.

### O que está configurado

- `orientation: 'any'` — travar em retrato deixaria o app de lado no tablet
- `display_override: ['standalone', 'minimal-ui']` — se o sistema não suportar tela cheia, cai no próximo em vez de abrir no navegador comum
- atalhos no toque longo do ícone: *Nova ficha técnica* e *Painel de indicadores*
- metas próprias do iOS (`apple-mobile-web-app-*`), que ignora o manifest para tela cheia e nome do ícone
- ícones 192/512 (`any`) e um 512 `maskable` com fundo verde-escuro, porque o Android corta o ícone em círculo
- Google Fonts em cache: sem isso o app abriria offline com a fonte do sistema e o layout dançaria
- `registerType: 'prompt'` — a versão nova só entra quando a pessoa aceita o aviso. Atualização automática trocaria o app por baixo de quem está no meio de uma ficha.
- `devOptions.enabled` — dá para instalar e testar o PWA rodando `npm run dev`. Se algo parecer desatualizado em desenvolvimento, remova o service worker em DevTools → Application → Service workers → Unregister.

## Build de produção

```bash
npm run build
npm run preview
```

## Publicação na Vercel

O `vercel.json` na raiz é obrigatório e faz uma coisa essencial: reescreve toda
rota para o `index.html`.

Sem isso, um app de página única só funciona na raiz — abrir ou recarregar
`/dashboard`, `/historico` ou `/login` devolve **404**, porque esses arquivos não
existem no disco. E como o login Microsoft volta justamente em `/dashboard`, o
login inteiro quebraria em produção. O arquivo também tira o `sw.js` e o
manifest do cache longo (senão o navegador serviria um service worker velho
depois de cada deploy) e fixa o cache imutável dos `assets/`, que já têm hash no
nome.

### Variáveis de ambiente

O `.env` **não vai** para a Vercel — é ignorado no git e no upload. As duas
variáveis precisam ser cadastradas no painel, em *Settings → Environment
Variables*, para os ambientes Production e Preview:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Elas são lidas **no momento do build**, não em execução: depois de cadastrar é
preciso um novo deploy (*Deployments → ⋯ → Redeploy*). Sem elas o app sobe
funcionando, mas 100% local — o botão da Microsoft mostra "indisponível" e nada
chega ao Supabase.

### Depois do primeiro deploy

No Supabase, em *Authentication → URL Configuration*, aponte para o domínio
publicado:

- **Site URL**: `https://<seu-app>.vercel.app`
- **Redirect URLs**: acrescente `https://<seu-app>.vercel.app/**`

O Redirect URI do Azure **não muda** — continua sendo o callback do Supabase
(`https://<projeto>.supabase.co/auth/v1/callback`).

### Deploy por pasta vs. Git

O arraste de pasta (*Vercel Drop*) funciona, mas cada atualização é um novo
arraste e não há histórico ligado ao código. Conectando o repositório
(*Connect Git*), cada `git push` publica sozinho e o *Instant Rollback* volta
para uma versão anterior com um clique. O `.vercelignore` mantém `node_modules`,
`dist` e `dev-dist` fora do upload — o `dev-dist` em especial carrega um service
worker de desenvolvimento que atrapalharia o cache do app publicado.
