import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { PublicFormShell } from './components/layout/PublicFormShell'
import { SkeletonCard } from './components/ui/Skeleton'
import { Toaster } from './components/ui/Toaster'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { RequireAuth, RequireRole } from './components/auth/RequireAuth'
import { useAuthStore } from './store/authStore'

const Login = lazy(() => import('./pages/Auth/Login').then((m) => ({ default: m.Login })))
const Cadastro = lazy(() => import('./pages/Auth/Cadastro').then((m) => ({ default: m.Cadastro })))
const EsqueciSenha = lazy(() => import('./pages/Auth/EsqueciSenha').then((m) => ({ default: m.EsqueciSenha })))
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

export default function App() {
  const inicializado = useAuthStore((s) => s.inicializado)

  if (!inicializado) return null

  return (
    <Suspense fallback={null}>
      <Routes>
        {/* A raiz é a ficha técnica aberta: a maioria dos colaboradores não tem
            e-mail corporativo, então o login não pode ser a porta de entrada.
            O acesso administrativo fica no cabeçalho da própria ficha. */}
        <Route path="/" element={<PublicFormShell />} />
        <Route path="/formulario" element={<PublicFormShell />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
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
                      <Route path="/dashboard" element={<Dashboard />} />
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
