import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { useSettingsStore } from './store/settingsStore'
import { useAuthStore } from './store/authStore'
import { iniciarSincronizacaoAutomatica } from './lib/sync'
import { ThemeProvider } from './components/theme/ThemeProvider'
import { registrarServiceWorker } from './pwa'

function Root() {
  const initSettings = useSettingsStore((s) => s.init)
  const initAuth = useAuthStore((s) => s.inicializar)

  useEffect(() => {
    void initSettings()
    void initAuth()
    registrarServiceWorker()
    return iniciarSincronizacaoAutomatica()
  }, [initSettings, initAuth])

  return (
    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
