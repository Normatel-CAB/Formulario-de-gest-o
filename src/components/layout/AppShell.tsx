import type { ReactNode } from 'react'
import { Header } from './Header'
import { NavBar } from './NavBar'
import { Sidebar } from './Sidebar'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 pb-24 pt-6 sm:px-6 sm:pb-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
      <NavBar />
    </div>
  )
}
