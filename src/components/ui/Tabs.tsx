import { cn } from '../../lib/cn'

export interface AbaItem<T extends string> {
  valor: T
  label: string
  /** Contagem exibida ao lado do rótulo. `0` fica visível, para não parecer bug. */
  total?: number
  /** Cor do ponto à esquerda, geralmente a cor do status. */
  cor?: string
}

/**
 * Abas em pílula, no padrão do design system.
 *
 * Rola na horizontal no celular em vez de quebrar em duas linhas: com quatro ou
 * cinco abas, quebrar empurraria o conteúdo para baixo da dobra justamente na
 * tela onde o espaço é mais curto.
 */
export function Tabs<T extends string>({
  itens,
  valor,
  onChange,
  className,
}: {
  itens: AbaItem<T>[]
  valor: T
  onChange: (valor: T) => void
  className?: string
}) {
  return (
    <div
      role="tablist"
      aria-label="Filtrar por situação"
      className={cn(
        '-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {itens.map((item) => {
        const ativo = item.valor === valor
        return (
          <button
            key={item.valor}
            type="button"
            role="tab"
            aria-selected={ativo}
            onClick={() => onChange(item.valor)}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-[12.5px] font-medium transition-all duration-200 ease-smooth',
              ativo
                ? 'border-transparent bg-gradient-to-r from-brand to-[#3D9142] font-semibold text-white shadow-brand-sm ring-1 ring-inset ring-white/10'
                : 'border-hairline bg-surface-2 text-txt-dim hover:border-hairline-hi hover:text-txt',
            )}
          >
            {item.cor && (
              <span
                aria-hidden
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: ativo ? 'rgba(255,255,255,0.85)' : item.cor }}
              />
            )}
            {item.label}
            {item.total !== undefined && (
              <span
                className={cn(
                  'tabular rounded-sm px-1.5 py-0.5 text-[10.5px] font-bold',
                  ativo ? 'bg-white/20 text-white' : 'bg-surface text-txt-faint',
                )}
              >
                {item.total}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
