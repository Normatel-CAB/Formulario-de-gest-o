import { useCallback, useEffect, useState } from 'react'

/** O evento não está no lib.dom padrão; só o Chromium o implementa. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISPENSADO_KEY = 'gestao-integrada:instalacao-dispensada'

function estaInstalado() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    // iOS não expõe display-mode antes do iOS 16.4
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function ehIOS() {
  const ua = navigator.userAgent
  // O iPad em modo desktop se anuncia como Mac; a presença de toque desmascara.
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
}

/**
 * Estado de instalação do PWA.
 *
 * O Chromium dispara `beforeinstallprompt` e nos deixa abrir o diálogo nativo na
 * hora que quisermos — guardamos o evento e chamamos no clique do botão. O
 * Safari não implementa nada disso: no iPhone e iPad a instalação é manual, pelo
 * menu Compartilhar, então o caminho é explicar em vez de oferecer um botão que
 * não faria nada (`instrucoesManuais`).
 */
export function useInstalarApp() {
  const [evento, setEvento] = useState<BeforeInstallPromptEvent | null>(null)
  const [instalado, setInstalado] = useState(estaInstalado)
  const [dispensado, setDispensado] = useState(() => localStorage.getItem(DISPENSADO_KEY) === '1')

  useEffect(() => {
    const onPrompt = (e: Event) => {
      // Sem isto o Chrome mostra a própria barra de instalação e perdemos o
      // controle de onde o convite aparece.
      e.preventDefault()
      setEvento(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalado(true)
      setEvento(null)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)

    const mq = window.matchMedia('(display-mode: standalone)')
    const onModo = () => setInstalado(estaInstalado())
    mq.addEventListener('change', onModo)

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      mq.removeEventListener('change', onModo)
    }
  }, [])

  const instalar = useCallback(async () => {
    if (!evento) return false
    await evento.prompt()
    const { outcome } = await evento.userChoice
    // O evento é de uso único: depois de mostrado, o navegador não o reemite.
    setEvento(null)
    return outcome === 'accepted'
  }, [evento])

  const dispensar = useCallback(() => {
    localStorage.setItem(DISPENSADO_KEY, '1')
    setDispensado(true)
  }, [])

  const instrucoesManuais = !instalado && !evento && ehIOS()

  return {
    /** Já roda como app instalado. */
    instalado,
    /** Dá para abrir o diálogo nativo agora. */
    podeInstalar: Boolean(evento) && !instalado,
    /** iPhone/iPad: precisa explicar o caminho do menu Compartilhar. */
    instrucoesManuais,
    /** O usuário já fechou o convite antes. */
    dispensado,
    instalar,
    dispensar,
  }
}
