import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { AppBackground } from './AppBackground'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <AppBackground />
      <div className="relative z-10 min-h-screen sm:flex">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 pb-14 pt-6 sm:px-8 sm:pt-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </>
  )
}
