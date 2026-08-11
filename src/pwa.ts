import { registerSW } from 'virtual:pwa-register'
import { toast } from './store/toastStore'

/**
 * Registra o service worker e avisa o usuário sobre atualização.
 *
 * O registro é manual (o plugin está com `injectRegister: null`) porque a
 * atualização automática troca o app por baixo de quem está preenchendo uma
 * ficha — no meio do formulário isso é perda de contexto. Aqui a nova versão só
 * entra quando a pessoa aceita.
 */
export function registrarServiceWorker() {
  const atualizar = registerSW({
    immediate: true,
    onNeedRefresh() {
      toast({
        variant: 'info',
        title: 'Nova versão disponível',
        description: 'Feche e abra o app para atualizar, ou toque aqui.',
        duracao: 15000,
        acao: {
          label: 'Atualizar agora',
          onClick: () => void atualizar(true),
        },
      })
    },
    onOfflineReady() {
      toast({
        variant: 'success',
        title: 'App pronto para uso offline',
        description: 'As fichas preenchidas sem internet são sincronizadas ao reconectar.',
      })
    },
  })
}
