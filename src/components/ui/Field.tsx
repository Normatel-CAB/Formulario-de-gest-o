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
        <label
          htmlFor={id}
          className="text-[10px] font-bold uppercase tracking-[0.1em] text-txt-faint"
        >
          {label} {required && <span className="text-viz-red">*</span>}
        </label>
      )}
      {children(id)}
      {hint && !error && <p className="text-[11px] text-txt-faint">{hint}</p>}
      {error && (
        <p className="text-[11px] font-medium text-viz-red" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

/** Mesma caixa de entrada do organograma (ui/input.tsx), um pouco mais alta
    porque aqui o formulário é preenchido em campo, muitas vezes no celular. */
const baseInputClasses =
  'w-full rounded-md border border-hairline bg-surface px-3 py-2.5 text-[12.5px] text-txt shadow-sm transition-all duration-200 placeholder:text-txt-faint focus-visible:border-hairline-hi focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-50'

const errorClasses = 'border-viz-red/60 focus-visible:border-viz-red focus-visible:ring-viz-red/15'

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
          className={cn(baseInputClasses, error && errorClasses, className)}
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
          className={cn(baseInputClasses, 'min-h-28 resize-y leading-relaxed', error && errorClasses, className)}
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

/* A seta é desenhada em SVG inline com a cor da marca, para o select não herdar
   o widget nativo (que ignora o tema e fica branco no modo escuro). */
const selectArrow =
  'appearance-none bg-[url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%234caf50" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>\')] bg-[right_0.65rem_center] bg-no-repeat pr-9'

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
          className={cn(baseInputClasses, selectArrow, error && errorClasses, className)}
          {...props}
        >
          {children}
        </select>
      )}
    </FieldWrapper>
  )
})
