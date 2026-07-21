import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { SkeletonCard } from './components/ui/Skeleton'
import { Toaster } from './components/ui/Toaster'
import { RequireAuth, RequireRole } from './components/auth/RequireAuth'
import { useAuthStore } from './store/authStore'

const Login = lazy(() => import('./pages/Auth/Login').then((m) => ({ default: m.Login })))
const Cadastro = lazy(() => import('./pages/Auth/Cadastro').then((m) => ({ default: m.Cadastro })))
const EsqueciSenha = lazy(() => import('./pages/Auth/EsqueciSenha').then((m) => ({ default: m.EsqueciSenha })))
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const NovoFormulario = lazy(() => import('./pages/NovoFormulario').then((m) => ({ default: m.NovoFormulario })))
const Historico = lazy(() => import('./pages/Historico').then((m) => ({ default: m.Historico })))
const FormDetail = lazy(() => import('./pages/FormDetail').then((m) => ({ default: m.FormDetail })))
const MeuPerfil = lazy(() => import('./pages/MeuPerfil').then((m) => ({ default: m.MeuPerfil })))
const Administracao = lazy(() => import('./pages/Administracao').then((m) => ({ default: m.Administracao })))
const Usuarios = lazy(() => import('./pages/Administracao/Usuarios').then((m) => ({ default: m.Usuarios })))
const Cargos = lazy(() => import('./pages/Administracao/Cargos').then((m) => ({ default: m.Cargos })))
const Configuracoes = lazy(() => import('./pages/Configuracoes').then((m) => ({ default: m.Configuracoes })))
const EnviarEmail = lazy(() => import('./pages/Email/EnviarEmail').then((m) => ({ default: m.EnviarEmail })))
const ModelosEmail = lazy(() => import('./pages/Email/ModelosEmail').then((m) => ({ default: m.ModelosEmail })))
const SolicitacaoSMS = lazy(() => import('./pages/SMS/SolicitacaoSMS').then((m) => ({ default: m.SolicitacaoSMS })))
const Tecnicos = lazy(() => import('./pages/Tecnicos/Tecnicos').then((m) => ({ default: m.Tecnicos })))

export default function App() {
  const inicializado = useAuthStore((s) => s.inicializado)

  if (!inicializado) return null

  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <AppShell>
                <Suspense fallback={<SkeletonCard />}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
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
                      path="/configuracoes"
                      element={
                        <RequireRole roles={['administrador']}>
                          <Configuracoes />
                        </RequireRole>
                      }
                    />
                    <Route
                      path="/emails"
                      element={
                        <RequireRole roles={['administrador', 'operador']}>
                          <EnviarEmail />
                        </RequireRole>
                      }
                    />
                    <Route
                      path="/emails/modelos"
                      element={
                        <RequireRole roles={['administrador']}>
                          <ModelosEmail />
                        </RequireRole>
                      }
                    />
                    <Route
                      path="/sms"
                      element={
                        <RequireRole roles={['administrador', 'operador']}>
                          <SolicitacaoSMS />
                        </RequireRole>
                      }
                    />
                    <Route
                      path="/tecnicos"
                      element={
                        <RequireRole roles={['administrador']}>
                          <Tecnicos />
                        </RequireRole>
                      }
                    />
                  </Routes>
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
