import { AnimatePresence, motion } from 'framer-motion'
import { useToastStore, type ToastVariant } from '../../store/toastStore'
import { cn } from '../../lib/cn'

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-brand-200 bg-brand-50 text-brand-900',
  error: 'border-rose-200 bg-rose-50 text-rose-900',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
}

const variantIcon: Record<ToastVariant, string> = {
  success: '✓',
  error: '!',
  info: 'i',
  warning: '⚠',
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end sm:right-4 sm:left-auto"
      role="region"
      aria-live="polite"
      aria-label="Notificações"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-lg shadow-brand-950/5',
              variantStyles[t.variant],
            )}
            role="status"
          >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/60 text-xs font-bold">
              {variantIcon[t.variant]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.description && <p className="mt-0.5 text-xs opacity-80">{t.description}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded-md p-1 text-current/60 hover:bg-black/5"
              aria-label="Fechar notificação"
            >
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
