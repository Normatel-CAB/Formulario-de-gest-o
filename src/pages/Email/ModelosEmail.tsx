import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useEmailStore } from '../../store/emailStore'
import { useAuthStore } from '../../store/authStore'
import { Card, CardContent } from '../../components/ui/Card'
import { Input, Textarea } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { toast } from '../../store/toastStore'
import type { ModeloEmail } from '../../lib/types'

interface FormState {
  nome: string
  assunto: string
  corpo: string
}

const ESTADO_INICIAL: FormState = { nome: '', assunto: '', corpo: '' }

export function ModelosEmail() {
  const { modelos, loading, carregarModelos, criarModelo, atualizarModelo, removerModelo } = useEmailStore()
  const usuarioLogado = useAuthStore((s) => s.usuario)

  const [dialogAberto, setDialogAberto] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(ESTADO_INICIAL)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState<ModeloEmail | null>(null)

  useEffect(() => {
    void carregarModelos()
  }, [carregarModelos])

  function abrirCriacao() {
    setEditandoId(null)
    setForm(ESTADO_INICIAL)
    setErros({})
    setDialogAberto(true)
  }

  function abrirEdicao(m: ModeloEmail) {
    setEditandoId(m.id)
    setForm({ nome: m.nome, assunto: m.assunto, corpo: m.corpo })
    setErros({})
    setDialogAberto(true)
  }

  function validar() {
    const novosErros: Record<string, string> = {}
    if (!form.nome.trim()) novosErros.nome = 'Informe o nome do modelo.'
    if (!form.assunto.trim()) novosErros.assunto = 'Informe o assunto.'
    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  async function salvar() {
    if (!validar()) return
    setSalvando(true)
    try {
      if (editandoId) {
        await atualizarModelo(editandoId, { ...form }, usuarioLogado)
        toast({ variant: 'success', title: 'Modelo atualizado' })
      } else {
        await criarModelo({ ...form }, usuarioLogado)
        toast({ variant: 'success', title: 'Modelo criado com sucesso' })
      }
      setDialogAberto(false)
    } finally {
      setSalvando(false)
    }
  }

  async function confirmarExclusao() {
    if (!excluindo) return
    await removerModelo(excluindo.id, usuarioLogado)
    toast({ variant: 'success', title: 'Modelo excluído' })
    setExcluindo(null)
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-ink">Modelos de E-mail</h2>
          <p className="text-sm text-ink-muted">Gerencie modelos reutilizáveis para agilizar o envio de e-mails.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/emails">
            <Button variant="outline">Voltar para E-mails</Button>
          </Link>
          <Button onClick={abrirCriacao}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Novo modelo
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-ink-muted">Carregando modelos…</div>
      ) : modelos.length === 0 ? (
        <EmptyState title="Nenhum modelo cadastrado" description="Crie modelos de e-mail para reutilizar em envios futuros." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modelos.map((m) => (
            <Card key={m.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col gap-2 p-4">
                <p className="text-sm font-semibold text-ink">{m.nome}</p>
                <p className="text-xs text-ink-subtle">Assunto: {m.assunto}</p>
                <p className="line-clamp-3 flex-1 text-sm text-ink-muted">{m.corpo}</p>
                <div className="flex gap-1.5 border-t border-border pt-3">
                  <Button size="sm" variant="ghost" onClick={() => abrirEdicao(m)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="ghost" className="text-rose-400 hover:bg-rose-500/10" onClick={() => setExcluindo(m)}>
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={dialogAberto}
        onClose={() => setDialogAberto(false)}
        title={editandoId ? 'Editar modelo' : 'Novo modelo'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialogAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar} loading={salvando}>
              Salvar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Nome do modelo" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} error={erros.nome} />
          <Input label="Assunto" required value={form.assunto} onChange={(e) => setForm({ ...form, assunto: e.target.value })} error={erros.assunto} />
          <Textarea label="Corpo do e-mail" value={form.corpo} onChange={(e) => setForm({ ...form, corpo: e.target.value })} className="min-h-48" />
        </div>
      </Dialog>

      <Dialog
        open={Boolean(excluindo)}
        onClose={() => setExcluindo(null)}
        title="Excluir modelo?"
        description={`O modelo "${excluindo?.nome}" será removido permanentemente.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setExcluindo(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmarExclusao}>
              Excluir
            </Button>
          </>
        }
      />
    </div>
  )
}
