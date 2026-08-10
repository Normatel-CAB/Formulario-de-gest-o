import { useSettingsStore } from '../../store/settingsStore'
import { cn } from '../../lib/cn'

/** Arte padrão da marca. Verde sobre transparente, então funciona nos dois temas
    sem precisar de plaquinha de fundo. Um admin pode trocar em Configurações. */
export const LOGO_PADRAO = '/logo.png'

/**
 * Marca da empresa. Sempre passe por aqui em vez de escrever o caminho do
 * arquivo: quando o admin envia outra logo, todas as telas seguem juntas.
 */
export function Logo({
  className,
  withWordmark = false,
  wordmarkClassName,
}: {
  className?: string
  /** Acrescenta "Normatel / Engenharia" ao lado — usado na sidebar e no login. */
  withWordmark?: boolean
  wordmarkClassName?: string
}) {
  const logoDataUrl = useSettingsStore((s) => s.logoDataUrl)
  const img = (
    <img
      src={logoDataUrl || LOGO_PADRAO}
      alt="Normatel Engenharia"
      className={cn('object-contain', className)}
    />
  )

  if (!withWordmark) return img

  return (
    <span className="flex min-w-0 items-center gap-2.5">
      {img}
      <span className={cn('min-w-0', wordmarkClassName)}>
        <strong className="block truncate text-[14px] font-semibold tracking-[0.01em] text-txt">
          Normatel
        </strong>
        <span className="block text-[10px] uppercase tracking-[0.14em] text-txt-dim">Engenharia</span>
      </span>
    </span>
  )
}
