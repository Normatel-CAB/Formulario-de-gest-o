import type { ReactNode } from 'react'
import { Header } from './Header'
import { NavBar } from './NavBar'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <NavBar />
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 sm:pb-10">{children}</main>
    </div>
  )
}
