import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // O registro é feito à mão em src/pwa.ts (via virtual:pwa-register) para
      // podermos avisar o usuário quando há versão nova. Com 'auto' o plugin
      // injetaria um segundo registro e os dois disputariam o mesmo SW.
      registerType: 'prompt',
      injectRegister: null,
      // Permite instalar e testar o PWA rodando `npm run dev`, sem precisar de
      // build + preview a cada ajuste.
      devOptions: { enabled: true, type: 'module', navigateFallback: 'index.html', suppressWarnings: true },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        // O app instalado abre offline; sem isso a primeira navegação sem rede
        // cairia na tela de erro do navegador.
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/rest/v1') || url.pathname.startsWith('/storage/v1'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              networkTimeoutSeconds: 8,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // A fonte vem do Google Fonts; em campo, sem rede, o app apareceria
            // com a fonte do sistema e o layout dançaria.
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'fontes-google',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      includeAssets: ['logo.png', 'favicon.png', 'apple-touch-icon.png', 'icons/*.png'],
      manifest: {
        id: '/',
        name: 'Gestão Integrada · Ficha Técnica de Avaliação de Serviços',
        short_name: 'Ficha Técnica',
        description:
          'Preencha a Ficha Técnica de Avaliação de Serviços em campo, mesmo sem internet, e acompanhe os indicadores por lotação.',
        lang: 'pt-BR',
        dir: 'ltr',
        theme_color: '#4CAF50',
        background_color: '#0A150B',
        display: 'standalone',
        // `window-controls-overlay` e `minimal-ui` como alternativas: se o
        // sistema não suportar standalone, cai no próximo em vez de abrir no
        // navegador comum.
        display_override: ['standalone', 'minimal-ui'],
        // Livre de propósito: em tablet a ficha é preenchida em paisagem, e
        // travar em retrato deixaria o app de lado na tela.
        orientation: 'any',
        start_url: '/',
        scope: '/',
        categories: ['business', 'productivity', 'utilities'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        // Atalhos no toque longo do ícone (Android e Windows).
        shortcuts: [
          {
            name: 'Nova ficha técnica',
            short_name: 'Nova ficha',
            url: '/',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Painel de indicadores',
            short_name: 'Painel',
            url: '/dashboard',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
      },
    }),
  ],
})
