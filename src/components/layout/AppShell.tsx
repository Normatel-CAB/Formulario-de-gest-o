import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg sm:flex">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 pb-10 pt-6 sm:px-8 sm:pt-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  )
}
