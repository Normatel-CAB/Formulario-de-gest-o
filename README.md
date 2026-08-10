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

## Build de produção

```bash
npm run build
npm run preview
```
