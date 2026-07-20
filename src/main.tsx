import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { useSettingsStore } from './store/settingsStore'
import { iniciarSincronizacaoAutomatica } from './lib/sync'

function Root() {
  const init = useSettingsStore((s) => s.init)

  useEffect(() => {
    void init()
    return iniciarSincronizacaoAutomatica()
  }, [init])

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
