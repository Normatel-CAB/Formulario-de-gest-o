import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { Logo } from '../ui/Logo'
import { useInstalarApp } from '../../hooks/useInstalarApp'
import { useEntranceMotion } from '../../lib/motion'

function IconeBaixar({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 4v11m0 0l-4-4m4 4l4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 18h16" strokeLinecap="round" />
    </svg>
  )
}

/** Ícone de compartilhar do iOS — é o que a pessoa procura na barra do Safari. */
function IconeCompartilhariOS({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 3v12" strokeLinecap="round" />
      <path d="M8.5 6.5L12 3l3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 11H5v9h14v-9h-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * Botão "Instalar app" para o cabeçalho.
 *
 * Só aparece quando há o que fazer: se o app já está instalado, ou se o
 * navegador não oferece instalação, ele não renderiza nada — um botão que não
 * funciona é pior que a ausência dele.
 */
export function BotaoInstalar({ className }: { className?: string }) {
  const { podeInstalar, instrucoesManuais, instalar } = useInstalarApp()
  const [ajudaAberta, setAjudaAberta] = useState(false)

  if (!podeInstalar && !instrucoesManuais) return null

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={className}
        onClick={() => (instrucoesManuais ? setAjudaAberta(true) : void instalar())}
      >
        <IconeBaixar />
        <span className="hidden sm:inline">Instalar app</span>
        <span className="sm:hidden">Instalar</span>
      </Button>

      <AjudaIOS aberta={ajudaAberta} onFechar={() => setAjudaAberta(false)} />
    </>
  )
}

function AjudaIOS({ aberta, onFechar }: { aberta: boolean; onFechar: () => void }) {
  return (
    <Dialog
      open={aberta}
      onClose={onFechar}
      title="Instalar no iPhone ou iPad"
      description="No Safari a instalação é feita pelo menu de compartilhar."
      footer={
        <Button variant="outline" onClick={onFechar}>
          Entendi
        </Button>
      }
    >
      <ol className="grid gap-3">
        {[
          <>
            Toque em <IconeCompartilhariOS className="mx-1 inline h-4 w-4 align-[-3px]" />
            <b className="font-semibold">Compartilhar</b>, na barra do Safari
          </>,
          <>
            Escolha <b className="font-semibold">Adicionar à Tela de Início</b>
          </>,
          <>
            Confirme em <b className="font-semibold">Adicionar</b> — o ícone aparece junto dos outros apps
          </>,
        ].map((texto, i) => (
          <li key={i} className="flex gap-3 text-[12.5px] text-txt-dim">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-hairline bg-surface-2 text-[11px] font-bold text-txt">
              {i + 1}
            </span>
            <span className="pt-0.5">{texto}</span>
          </li>
        ))}
      </ol>
      <p className="mt-4 rounded-md border border-hairline bg-surface-2 px-3 py-2 text-[11.5px] text-txt-faint">
        Precisa ser o Safari. No Chrome ou Firefox do iPhone a opção não existe — é limitação do
        sistema.
      </p>
    </Dialog>
  )
}

/**
 * Convite de instalação no rodapé da ficha, dispensável.
 *
 * O botão do cabeçalho é discreto e passa batido para quem só quer preencher e
 * sair; este bloco explica o ganho (abrir sem navegador, funcionar sem sinal) e
 * fica guardado no localStorage quando a pessoa fecha, para não insistir.
 */
export function ConviteInstalacao() {
  const { podeInstalar, instrucoesManuais, dispensado, instalar, dispensar } = useInstalarApp()
  const [ajudaAberta, setAjudaAberta] = useState(false)
  const { reduce } = useEntranceMotion()

  const visivel = (podeInstalar || instrucoesManuais) && !dispensado

  return (
    <>
      <AnimatePresence>
        {visivel && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: reduce ? 0 : 0.35, ease: [0.22, 0.75, 0.28, 1] }}
            className="glass flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5"
          >
            <Logo className="h-11 w-11 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-txt">Instale a ficha no seu celular</p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-txt-dim">
                Abre direto pelo ícone, sem navegador, e continua funcionando em área sem sinal — o
                que você preencher é enviado quando a rede voltar.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="ghost" onClick={dispensar}>
                Agora não
              </Button>
              <Button size="sm" onClick={() => (instrucoesManuais ? setAjudaAberta(true) : void instalar())}>
                <IconeBaixar />
                Instalar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AjudaIOS aberta={ajudaAberta} onFechar={() => setAjudaAberta(false)} />
    </>
  )
}
