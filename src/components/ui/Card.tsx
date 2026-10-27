import { type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

/**
 * Card do design system Normatel.
 *
 * `.glass` (index.css) traz o fundo opaco, a borda hairline, a sombra e o
 * filete de luz no topo. O nome ficou por compatibilidade: o card NÃO é
 * translúcido. `.glass-hover` levanta no hover e `.beam` acende o anel de luz
 * girando na borda.
 *
 * Passe `flat` quando for só um contêiner estático, como dentro de um dialog:
 * card parado não deve reagir ao mouse.
 *
 * `contentClassName` existe porque o conteúdo agora mora dentro de
 * `.beam-content`, que fica acima do anel. Esse nível a mais quebra a cadeia
 * quando o próprio card é flex e um filho usa `flex-1`, então quem precisa
 * disso repassa o layout para o wrapper.
 */
export function Card({
  className,
  contentClassName,
  flat = false,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { flat?: boolean; contentClassName?: string }) {
  return (
    <div className={cn('glass text-txt', !flat && 'glass-hover beam-host', className)} {...props}>
      {!flat && <span className="beam" aria-hidden />}
      <div className={cn('beam-content', contentClassName)}>{children}</div>
    </div>
  )
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-start justify-between gap-4 p-5 pb-2', className)} {...props} />
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-[13.5px] font-semibold leading-tight tracking-[-0.01em] text-txt', className)}
      {...props}
    />
  )
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('mt-1 text-[11.5px] leading-relaxed text-txt-faint', className)} {...props} />
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5 pt-2', className)} {...props} />
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center gap-2 border-t border-hairline p-5 pt-3', className)} {...props} />
}
