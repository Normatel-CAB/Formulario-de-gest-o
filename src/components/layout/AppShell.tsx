import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { AppBackground } from './AppBackground'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <AppBackground />
      <div className="relative z-10 min-h-screen lg:flex">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 pb-16 pt-5 sm:px-6 lg:px-8 lg:pt-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </>
  )
}
