# Sistema de Gestão Integrada — Ficha Técnica de Avaliação de Serviços

PWA para preenchimento, acompanhamento e aprovação de fichas técnicas de avaliação de serviços, com suporte completo a uso offline e sincronização automática com Supabase.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 (tema verde/branco premium)
- Zustand (estado)
- IndexedDB (`idb`) para persistência offline e fila de sincronização
- Supabase (Postgres + Storage) como banco de dados
- `vite-plugin-pwa` (Service Worker, manifest, cache offline)
- Framer Motion (animações discretas)

## Como rodar

```bash
npm install
cp .env.example .env   # preencha com as credenciais do seu projeto Supabase
npm run dev
```

## Banco de dados (Supabase)

Execute o script `supabase/schema.sql` no SQL Editor do seu projeto Supabase. Ele cria:

- Tabela `formularios_avaliacao` com Row Level Security
- Buckets de storage `formularios-anexos` e `configuracoes`

Sem as variáveis `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, o app funciona 100% localmente (IndexedDB), mantendo os dados no dispositivo até que a integração seja configurada.

## Funcionalidades

- Formulário em etapas (Stepper): Informações Gerais, Necessidades da Execução, Apoio/Anexos e Revisão
- Campos condicionais (Sim/Não), datas de agendamento e quantidade de dias com fim de semana
- Upload de imagens, captura pela câmera, localização GPS com mapa embutido e assinatura digital
- Rascunho automático (autosave) + salvar rascunho manual
- Histórico com pesquisa, filtros e status (Rascunho, Enviado, Em Análise, Aprovado, Reprovado)
- Dashboard com indicadores e últimos envios
- Funcionamento offline com fila de sincronização automática ao reconectar
- Logo da empresa configurável no cabeçalho

## Build de produção

```bash
npm run build
npm run preview
```
