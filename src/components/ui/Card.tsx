import { type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

/**
 * Card de vidro do design system Normatel.
 * `.glass` (index.css) traz a borda hairline, a sombra e o filete de luz no
 * topo; `.glass-hover` adiciona o leve levantar no hover. Passe `flat` quando o
 * card for só um contêiner estático (ex: dentro de um dialog).
 */
export function Card({ className, flat = false, ...props }: HTMLAttributes<HTMLDivElement> & { flat?: boolean }) {
  return <div className={cn('glass text-txt', !flat && 'glass-hover', className)} {...props} />
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
