import { useEffect, useState } from 'react'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Field'

export function DialogoCompras({
  aberto,
  justificativaAtual,
  onFechar,
  onConfirmar,
}: {
  aberto: boolean
  justificativaAtual?: string
  onFechar: () => void
  onConfirmar: (justificativa: string) => Promise<void> | void
}) {
  const [texto, setTexto] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (aberto) setTexto(justificativaAtual ?? '')
  }, [aberto, justificativaAtual])

  async function confirmar() {
    setSalvando(true)
    try {
      await onConfirmar(texto.trim())
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog
      open={aberto}
      onClose={onFechar}
      title="Mandar para Em Compras"
      description="Explique o que precisa ser comprado. Quando o material chegar, aprove a ficha para o planejador programar."
      footer={
        <>
          <Button variant="ghost" onClick={onFechar}>
            Cancelar
          </Button>
          <Button loading={salvando} disabled={!texto.trim()} onClick={() => void confirmar()}>
            Confirmar
          </Button>
        </>
      }
    >
      <Textarea
        label="Justificativa"
        required
        autoFocus
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Ex.: aguardando compra de 20 luminárias LED"
        className="min-h-28"
      />
    </Dialog>
  )
}
