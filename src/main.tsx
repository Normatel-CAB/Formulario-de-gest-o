import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { useSettingsStore } from './store/settingsStore'
import { useAuthStore } from './store/authStore'
import { iniciarSincronizacaoAutomatica } from './lib/sync'

function Root() {
  const initSettings = useSettingsStore((s) => s.init)
  const initAuth = useAuthStore((s) => s.inicializar)

  useEffect(() => {
    void initSettings()
    void initAuth()
    return iniciarSincronizacaoAutomatica()
  }, [initSettings, initAuth])

  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
