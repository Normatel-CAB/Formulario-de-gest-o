import { type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, forwardRef, useId } from 'react'
import { cn } from '../../lib/cn'

interface FieldWrapperProps {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  children: (id: string) => React.ReactNode
}

function FieldWrapper({ label, hint, error, required, children }: FieldWrapperProps) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}
      {children(id)}
      {hint && !error && <p className="text-xs text-ink-subtle">{hint}</p>}
      {error && (
        <p className="text-xs font-medium text-rose-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

const baseInputClasses =
  'w-full rounded-xl border border-border-light bg-surface-2 px-4 py-3 text-sm text-ink placeholder:text-ink-subtle transition-colors duration-150 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 disabled:bg-surface disabled:text-ink-subtle'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, required, className, ...props },
  ref,
) {
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required}>
      {(id) => (
        <input
          id={id}
          ref={ref}
          required={required}
          aria-invalid={Boolean(error)}
          className={cn(baseInputClasses, error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20', className)}
          {...props}
        />
      )}
    </FieldWrapper>
  )
})

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, required, className, ...props },
  ref,
) {
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required}>
      {(id) => (
        <textarea
          id={id}
          ref={ref}
          required={required}
          aria-invalid={Boolean(error)}
          className={cn(baseInputClasses, 'min-h-28 resize-y', error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20', className)}
          {...props}
        />
      )}
    </FieldWrapper>
  )
})

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, required, className, children, ...props },
  ref,
) {
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required}>
      {(id) => (
        <select
          id={id}
          ref={ref}
          required={required}
          aria-invalid={Boolean(error)}
          className={cn(baseInputClasses, 'appearance-none bg-[url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2334d399" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>\')] bg-[right_0.75rem_center] bg-no-repeat pr-9', className)}
          {...props}
        >
          {children}
        </select>
      )}
    </FieldWrapper>
  )
})
