import { type ButtonHTMLAttributes, forwardRef, useImperativeHandle } from 'react'
import { cn } from '../../lib/cn'
import { useMagneticGlow } from '../../hooks/useMagneticGlow'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  /** Desliga a atração magnética num botão da marca (raro; use em listas longas). */
  noGlow?: boolean
}

/**
 * Mesmas variantes do botão do organograma (ui/button.tsx).
 *
 * `primary` é o botão de gradiente da marca e carrega o efeito magnético: o
 * levantar no hover e a sombra NÃO entram como utilitárias aqui de propósito —
 * `hover:-translate-y-0.5` e `hover:shadow-*` são da camada `utilities`, que vem
 * depois de `components` e sobrescreveria o `transform`/`box-shadow` do
 * `.glow-btn`, matando o efeito. Quem cuida dos dois é o `.glow-btn:hover` no
 * index.css.
 */
export const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-r from-brand-lite via-brand to-[#34823A] font-semibold text-white shadow-brand-sm',
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
  return cn(
    buttonBaseClasses,
    variantClasses[variant],
    sizeClasses[size],
    variant === 'primary' && 'glow-btn',
    className,
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, disabled, noGlow, children, ...props },
  ref,
) {
  const comEfeito = variant === 'primary' && !noGlow && !disabled && !loading
  const innerRef = useMagneticGlow<HTMLButtonElement>(comEfeito)
  useImperativeHandle(ref, () => innerRef.current as HTMLButtonElement)

  const conteudo = (
    <>
      {loading && (
        <svg className="h-4 w-4 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </>
  )

  return (
    <button
      ref={innerRef}
      disabled={disabled || loading}
      className={buttonClasses(variant, size, className)}
      {...props}
    >
      {comEfeito ? (
        <>
          {/* O halo fica atrás (z-0) e o conteúdo acima (z-1); sem isolar assim o
              gradiente radial cobriria o texto. */}
          <span className="glow-btn-sheen" aria-hidden />
          <span className="relative z-[1] inline-flex items-center gap-2">{conteudo}</span>
        </>
      ) : (
        conteudo
      )}
    </button>
  )
})
