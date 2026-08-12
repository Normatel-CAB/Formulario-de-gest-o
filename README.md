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

### Acesso por autoatendimento

Não existe cadastro manual de usuário. Quem clica em **Entrar com Microsoft** e ainda não tem acesso gera sozinho uma solicitação pendente e cai numa tela de espera. O administrador só aprova, escolhendo papel e projeto — o acesso libera no login seguinte da pessoa.

A lista fica em `solicitacoes_acesso`, **no Supabase**, e aparece no topo de *Usuários* e da *Administração* como **Acessos à área administrativa**. É o único cadastro de contas compartilhado entre aparelhos, com três blocos: aguardando aprovação, com acesso liberado e recusados. Dá para mudar papel e projeto de quem já está liberado, e revogar.

> **A tabela "Usuários" logo abaixo é outra coisa.** Ela lê o IndexedDB, ou seja, as contas de e-mail e senha **deste navegador**. Quem entra com a Microsoft pelo próprio celular cria o registro no aparelho dele, e isso nunca aparece para você. Foi por isso que a lista parecia vazia mesmo com gente usando o sistema.

**Importar quem já tinha entrado.** As contas que aparecem no painel do Supabase ficam em `auth.users`, a tabela do login — que é do schema `auth` e o app não lê pelo navegador. Antes da migração 002 o login liberava direto sem criar pedido, então `solicitacoes_acesso` ficou vazia mesmo com gente usando o sistema. `004_importar_contas_existentes.sql` copia todas para a fila como pendentes, de uma vez, e aí você aprova com um clique cada. Rodar de novo depois reimporta quem faltou.

**Liberar um e-mail avulso.** Quem entrava antes da migração 002 não tem linha na tabela e só apareceria na fila depois de logar de novo. O botão **Liberar e-mail** cadastra o acesso já aprovado — a pessoa entra direto no próximo login, sem fila. Se o e-mail já estiver na lista, a ação atualiza a decisão dele.

O que a migração 002 garante no próprio banco, não só na interface:

- a pessoa só insere solicitação para o **próprio** e-mail, e só como `pendente` com papel `visualizador` — sem isso bastaria editar o JavaScript no navegador para entrar como administrador
- só quem está em `administradores` aprova, recusa ou reabre
- **leitura das fichas exige aprovação.** Esta era a brecha que o autoatendimento abria: a policy antiga liberava `SELECT` para todo `authenticated`, então uma conta apenas pendente, barrada na tela, ainda leria tudo chamando a API direto
- exclusão de ficha passa a ser exclusiva de administrador

> **Vale conferir no Azure:** se o App registration estiver como multi-tenant, qualquer conta Microsoft do mundo consegue autenticar e entrar na fila. Para receber pedido só de quem é da Normatel, deixe-o *Single tenant* em *Authentication → Supported account types*.

### Quem entra como administrador

A base de usuários vive no dispositivo (IndexedDB), então não existe um "servidor" para consultar papéis no primeiro acesso de cada celular. Quem decide isso é a lista em `src/lib/auth.ts`:

```ts
export const EMAILS_ADMINISTRADORES = ['gabriel.cruz@normatel.com.br']
```

Um e-mail nessa lista entra direto como **administrador**, sem passar pela fila. Alguém precisa poder entrar para aprovar o primeiro pedido.

A mesma lista existe na tabela `administradores` do Supabase, e é ela que manda de verdade: as policies do banco consultam a tabela, não o código. Para dar acesso administrativo a mais alguém, acrescente o e-mail nos dois lugares — no arquivo (para o app já reconhecer no login) e na tabela (para o banco autorizar as aprovações).

## Banco de dados (Supabase)

Execute `supabase/schema.sql` no SQL Editor, depois as migrações em ordem.

`001_ficha_publica_e_equipamentos.sql`:

- libera `INSERT` para o papel anônimo (só inserir — ler, alterar e excluir continuam exigindo login)
- acrescenta `lotacao` às fichas antigas
- move `necessidades.pemt` e `necessidades.caminhaoMunck` para `necessidades.equipamentos`

`002_solicitacoes_de_acesso.sql`:

- cria `administradores` e `solicitacoes_acesso` com as policies de aprovação
- **fecha a leitura das fichas para quem não foi aprovado** (ver *Acesso por autoatendimento*)

`003_admin_gerencia_acessos.sql`:

- permite ao administrador **cadastrar um acesso já aprovado** (o botão *Liberar e-mail*). A policy da 002 é restrita ao próprio e-mail e a `pendente`, de propósito, para ninguém se aprovar sozinho — esta abre a inserção só para quem está em `administradores`.

> **Ao editar estes arquivos, respeite a nota de formato no topo deles.** O SQL Editor do Supabase divide o script para executar um comando por vez, e a divisão não respeita ponto-e-vírgula dentro de bloco com aspas-dólar nem dentro de comentário. Por isso o arquivo não tem bloco `DO`, o status usa `CHECK` em vez de tipo enumerado, o corpo das funções é uma expressão única sem ponto-e-vírgula, e nenhum comentário contém `;`. A primeira versão tinha essas coisas e falhava com **42601 syntax error**.

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
- **Exportar fotos** no histórico: uma ficha por vez ou todas as do período filtrado, em .zip nomeado pelo nº da solicitação
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

### Exportar fotos (.zip)

Duas formas, as duas no Histórico:

**Uma ficha** — botão no rodapé do cartão (e no detalhe da ficha):

```
SOL-2026-0142.zip
└── SOL-2026-0142/
    ├── SOL-2026-0142-foto-01.jpg
    └── SOL-2026-0142-foto-02.jpg
```

**Várias fichas** — filtro *Data da avaliação: de / até* + botão **Exportar fotos do período**. Sai um zip com uma pasta por ficha:

```
fotos-2026-01-01_a_2026-02-28.zip
├── SOL-2026-0142/
├── SOL-2026-0143/
└── ficha-d4e5f6a7/
```

O lote respeita **todos** os filtros ativos da tela, não só as datas: status, projeto e a busca também entram. O contador ao lado do botão mostra quantas fotos vão no pacote antes de clicar.

Detalhes que evitam surpresa:

- **Só fotos.** A assinatura não entra: ela já consta no PDF da ficha.
- O nome sai do **Nº da Solicitação**, normalizado (sem acento nem caractere que o Windows recuse). Ficha sem número cai em `ficha-<id>`; número repetido em duas fichas ganha sufixo (`-2`), senão as fotos de uma cairiam na pasta da outra.
- Fichas sem foto são ignoradas no lote.
- O filtro de data usa a **data da avaliação**; quando ela está vazia, a data de criação. A comparação é textual sobre `YYYY-MM-DD`, então não há fuso horário no meio.

Tudo roda no navegador, em cima das fotos que já vieram do Supabase: **não há nada para instalar na máquina de quem baixa**, nem passo de servidor. Abrir o site em qualquer computador basta.

O zip é escrito à mão em `src/lib/zip.ts`, sem dependência. O conteúdo são JPEG/PNG, já comprimidos, então usamos o método *store* (cópia direta) — deflate gastaria CPU para não economizar quase nada. Não há Zip64, o que limita a 4 GB por pacote (folgado para fotos, mas vale saber ao exportar períodos muito longos).

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
