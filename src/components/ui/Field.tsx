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
        <label htmlFor={id} className="text-sm font-medium text-brand-900">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      {children(id)}
      {hint && !error && <p className="text-xs text-brand-500">{hint}</p>}
      {error && (
        <p className="text-xs font-medium text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

const baseInputClasses =
  'w-full rounded-xl border border-brand-200 bg-white px-3.5 py-2.5 text-sm text-brand-950 placeholder:text-brand-400 transition-colors duration-150 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:bg-brand-50 disabled:text-brand-400'

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
          className={cn(baseInputClasses, error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-100', className)}
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
          className={cn(baseInputClasses, 'min-h-28 resize-y', error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-100', className)}
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
          className={cn(baseInputClasses, 'appearance-none bg-[url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23167f4a" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>\')] bg-[right_0.75rem_center] bg-no-repeat pr-9', className)}
          {...props}
        >
          {children}
        </select>
      )}
    </FieldWrapper>
  )
})
