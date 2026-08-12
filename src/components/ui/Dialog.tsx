import { type ReactNode, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

export function Dialog({ open, onClose, title, description, children, footer, size = 'md' }: DialogProps) {
  const ref = useRef<HTMLDivElement>(null)

  /**
   * `onClose` chega como arrow function inline em toda chamada, então sua
   * identidade muda a cada render de quem usa o Dialog. Guardar num ref permite
   * que o efeito abaixo dependa só de `open`.
   */
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)

    // BUG QUE ISTO CORRIGE: com `onClose` na lista de dependências, o efeito
    // rodava a cada tecla digitada (nova identidade da função a cada render) e
    // o `focus()` roubava o cursor do campo. O resultado era ter que clicar de
    // novo no campo para cada letra. Focar só na abertura resolve.
    ref.current?.focus()

    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center" role="presentation">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/55 backdrop-blur-[3px]"
            onClick={onClose}
          />
          <motion.div
            ref={ref}
            tabIndex={-1}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'dialog-title' : undefined}
            className={`glass safe-bottom relative z-10 max-h-[88dvh] w-full ${sizeClasses[size]} overflow-y-auto rounded-b-none p-5 sm:max-h-[85vh] sm:rounded-b-[var(--radius)] sm:p-6`}
          >
            {title && (
              <h2 id="dialog-title" className="text-[17px] font-bold tracking-[-0.02em] text-txt">
                {title}
              </h2>
            )}
            {description && <p className="mt-1 text-[12.5px] text-txt-dim">{description}</p>}
            <div className={title || description ? 'mt-4' : ''}>{children}</div>
            {footer && <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
