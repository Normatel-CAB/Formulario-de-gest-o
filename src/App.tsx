import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { SkeletonCard } from './components/ui/Skeleton'
import { Toaster } from './components/ui/Toaster'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { RequireAuth, RequireRole } from './components/auth/RequireAuth'
import { useAuthStore } from './store/authStore'
import { temPermissao } from './lib/types'

const Login = lazy(() => import('./pages/Auth/Login').then((m) => ({ default: m.Login })))
const AcessoPendente = lazy(() => import('./pages/Auth/AcessoPendente').then((m) => ({ default: m.AcessoPendente })))
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const NovoFormulario = lazy(() => import('./pages/NovoFormulario').then((m) => ({ default: m.NovoFormulario })))
const Historico = lazy(() => import('./pages/Historico').then((m) => ({ default: m.Historico })))
const FormDetail = lazy(() => import('./pages/FormDetail').then((m) => ({ default: m.FormDetail })))
const MeuPerfil = lazy(() => import('./pages/MeuPerfil').then((m) => ({ default: m.MeuPerfil })))
const Administracao = lazy(() => import('./pages/Administracao').then((m) => ({ default: m.Administracao })))
const Usuarios = lazy(() => import('./pages/Administracao/Usuarios').then((m) => ({ default: m.Usuarios })))
const Cargos = lazy(() => import('./pages/Administracao/Cargos').then((m) => ({ default: m.Cargos })))
const Permissoes = lazy(() => import('./pages/Administracao/Permissoes').then((m) => ({ default: m.Permissoes })))
const Configuracoes = lazy(() => import('./pages/Configuracoes').then((m) => ({ default: m.Configuracoes })))

/** Destino da raiz conforme a permissão: preencher para quem preenche,
    consultar para quem só consulta. */
function Inicio() {
  const usuario = useAuthStore((s) => s.usuario)
  if (!temPermissao(usuario ?? null, 'formularios.criar')) return <Navigate to="/historico" replace />
  return <NovoFormulario />
}

export default function App() {
  const inicializado = useAuthStore((s) => s.inicializado)

  if (!inicializado) return null

  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Fora do RequireAuth de propósito: quem cai aqui justamente não tem
            sessão no app, só na Microsoft. */}
        <Route path="/acesso" element={<AcessoPendente />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <AppShell>
                <Suspense fallback={<SkeletonCard />}>
                  <ErrorBoundary>
                    <Routes>
                      {/* Quem entra pelo domínio já vem como operador, então
                          cai direto na ficha sem esperar promoção. O
                          visualizador, que só consulta, começa no histórico —
                          mandá-lo para um formulário que ele não pode enviar
                          seria um beco sem saída. */}
                      <Route path="/" element={<Inicio />} />
                      <Route
                        path="/novo"
                        element={
                          <RequireRole roles={['administrador', 'operador']}>
                            <NovoFormulario />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="/novo/:id"
                        element={
                          <RequireRole roles={['administrador', 'operador']}>
                            <NovoFormulario />
                          </RequireRole>
                        }
                      />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/historico" element={<Historico />} />
                      <Route path="/formulario/:id" element={<FormDetail />} />
                      <Route path="/perfil" element={<MeuPerfil />} />
                      <Route
                        path="/administracao"
                        element={
                          <RequireRole roles={['administrador']}>
                            <Administracao />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="/usuarios"
                        element={
                          <RequireRole roles={['administrador']}>
                            <Usuarios />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="/administracao/cargos"
                        element={
                          <RequireRole roles={['administrador']}>
                            <Cargos />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="/administracao/permissoes"
                        element={
                          <RequireRole roles={['administrador']}>
                            <Permissoes />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="/configuracoes"
                        element={
                          <RequireRole roles={['administrador']}>
                            <Configuracoes />
                          </RequireRole>
                        }
                      />
                    </Routes>
                  </ErrorBoundary>
                </Suspense>
              </AppShell>
            </RequireAuth>
          }
        />
      </Routes>
      <Toaster />
    </Suspense>
  )
}
