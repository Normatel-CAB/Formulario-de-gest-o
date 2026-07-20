import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import type { Papel } from '../../lib/types'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { usuario, inicializado } = useAuthStore()
  const location = useLocation()

  if (!inicializado) return null
  if (!usuario) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <>{children}</>
}

export function RequireRole({ roles, children }: { roles: Papel[]; children: ReactNode }) {
  const { usuario, inicializado } = useAuthStore()
  const location = useLocation()

  if (!inicializado) return null
  if (!usuario) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!roles.includes(usuario.papel)) return <Navigate to="/" replace />
  return <>{children}</>
}
