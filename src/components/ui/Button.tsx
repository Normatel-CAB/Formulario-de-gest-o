import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

/** Mesmas variantes do botão do organograma (ui/button.tsx). */
export const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-brand-lite via-brand to-[#34823A] font-semibold text-white shadow-brand-sm hover:-translate-y-0.5 hover:shadow-brand-md',
  danger: 'bg-viz-red font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:brightness-110',
  outline: 'border border-hairline bg-surface text-txt hover:-translate-y-px hover:border-hairline-hi',
  secondary: 'bg-surface-2 text-txt hover:bg-surface',
  ghost: 'text-txt-dim hover:bg-surface-2 hover:text-txt',
  link: 'text-brand-lite underline-offset-4 hover:underline',
}

export const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 rounded-sm px-3 text-[11.5px]',
  md: 'h-9 rounded-md px-4 py-2 text-[12.5px]',
  lg: 'h-11 rounded-md px-8 text-[13px]',
  icon: 'h-9 w-9 rounded-md justify-center',
}

export const buttonBaseClasses =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:pointer-events-none disabled:opacity-50'

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn(buttonBaseClasses, variantClasses[variant], sizeClasses[size], className)
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={buttonClasses(variant, size, className)}
      {...props}
    >
      {loading && (
        <svg className="h-4 w-4 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </button>
  )
})
