import type { HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

/**
 * Tabela do design system Normatel: linhas "flutuantes" separadas por espaço
 * (border-spacing) em vez de divisórias contínuas. Cada `<tr>` é um contêiner
 * posicionado, então dá para colocar uma <RowBar /> como primeiro filho de uma
 * célula e desenhar a barra de proporção ao fundo.
 *
 * O wrapper rola na horizontal — é o que salva a tabela no celular. Combine com
 * `whitespace-nowrap` nas colunas que não podem quebrar.
 */
export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative -mx-1 w-[calc(100%+0.5rem)] overflow-x-auto px-1">
      <table
        className={cn('w-full caption-bottom border-separate border-spacing-y-1.5 text-[12.5px]', className)}
        {...props}
      />
    </div>
  )
}

export function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn(className)} {...props} />
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn(className)} {...props} />
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn('group relative transition-colors [&>td]:bg-surface-2 hover:[&>td]:bg-surface', className)}
      {...props}
    />
  )
}

export function TableHead({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'whitespace-nowrap px-3.5 pb-2 text-left align-middle text-[10px] font-bold uppercase tracking-[0.1em] text-txt-faint',
        className,
      )}
      {...props}
    />
  )
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        'relative z-[1] border-y border-hairline px-3.5 py-3 align-middle transition-colors',
        'first:rounded-l-xl first:border-l last:rounded-r-xl last:border-r',
        className,
      )}
      {...props}
    />
  )
}
