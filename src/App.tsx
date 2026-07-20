import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { SkeletonCard } from './components/ui/Skeleton'

const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const NovoFormulario = lazy(() => import('./pages/NovoFormulario').then((m) => ({ default: m.NovoFormulario })))
const Historico = lazy(() => import('./pages/Historico').then((m) => ({ default: m.Historico })))
const FormDetail = lazy(() => import('./pages/FormDetail').then((m) => ({ default: m.FormDetail })))

export default function App() {
  return (
    <AppShell>
      <Suspense fallback={<SkeletonCard />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/novo" element={<NovoFormulario />} />
          <Route path="/novo/:id" element={<NovoFormulario />} />
          <Route path="/historico" element={<Historico />} />
          <Route path="/formulario/:id" element={<FormDetail />} />
        </Routes>
      </Suspense>
    </AppShell>
  )
}
