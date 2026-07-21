import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useFormsStore } from '../store/formsStore'
import { useAuthStore } from '../store/authStore'
import type { FormularioAvaliacao, FormStatus } from '../lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Dialog } from '../components/ui/Dialog'
import { toast } from '../store/toastStore'
import { formatarData, formatarDataHora } from '../lib/format'
import { gerarPdfFormulario, nomeArquivoPdf } from '../lib/pdf'
import { StepRevisao } from './NovoFormulario/StepRevisao'

const STATUS_TRANSICOES: FormStatus[] = ['enviado', 'em_analise', 'aprovado', 'reprovado']

export function FormDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { obter, atualizarStatus, remover } = useFormsStore()
  const usuario = useAuthStore((s) => s.usuario)
  const [formulario, setFormulario] = useState<FormularioAvaliacao | null>(null)
  const [confirmarExclusao, setConfirmarExclusao] = useState(false)

  useEffect(() => {
    if (!id) return
    void obter(id).then((f) => setFormulario(f ?? null))
  }, [id, obter])

  const semAcesso =
    formulario &&
    usuario?.papel !== 'administrador' &&
    Boolean(formulario.projeto) &&
    Boolean(usuario?.projeto) &&
    formulario.projeto !== usuario?.projeto

  if (!formulario || semAcesso) {
    return (
      <div className="animate-fade-in">
        <p className="text-sm text-ink-muted">Formulário não encontrado.</p>
        <Link to="/historico" className="text-sm font-medium text-brand-400 underline">
          Voltar ao histórico
        </Link>
      </div>
    )
  }

  const ehDono = formulario.criadoPorId === usuario?.id
  const podeAlterarStatus = usuario?.papel === 'administrador'
  const podeEditar = formulario.status === 'rascunho' && (usuario?.papel === 'administrador' || ehDono)
  const podeExcluir = usuario?.papel === 'administrador' || (usuario?.papel === 'operador' && ehDono)
  const somenteLeitura = usuario?.papel === 'visualizador'

  async function mudarStatus(status: FormStatus) {
    if (!formulario) return
    await atualizarStatus(formulario.id, status)
    setFormulario({ ...formulario, status })
    toast({ variant: 'success', title: 'Status atualizado' })
  }

  async function excluir() {
    if (!formulario) return
    await remover(formulario.id)
    toast({ variant: 'success', title: 'Formulário excluído' })
    navigate('/historico')
  }

  function baixarPdf() {
    if (!formulario) return
    const blob = gerarPdfFormulario(formulario)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = nomeArquivoPdf(formulario)
    link.click()
    URL.revokeObjectURL(url)
    toast({ variant: 'success', title: 'PDF exportado com sucesso' })
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-ink">{formulario.infoGerais.localAtividade || 'Atividade sem nome'}</h2>
            <StatusBadge status={formulario.status} />
          </div>
          <p className="text-sm text-ink-muted">
            Nº {formulario.infoGerais.numeroSolicitacao || '—'} · Atualizado em {formatarDataHora(formulario.updatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={baixarPdf}>
            Exportar PDF
          </Button>
          {!somenteLeitura && podeEditar && (
            <Link to={`/novo/${formulario.id}`}>
              <Button variant="outline">Continuar edição</Button>
            </Link>
          )}
          {!somenteLeitura && podeExcluir && (
            <Button variant="danger" onClick={() => setConfirmarExclusao(true)}>
              Excluir
            </Button>
          )}
        </div>
      </div>

      {podeAlterarStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Atualizar status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {STATUS_TRANSICOES.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={formulario.status === s ? 'primary' : 'outline'}
                onClick={() => mudarStatus(s)}
              >
                {s === 'enviado' && 'Marcar Enviado'}
                {s === 'em_analise' && 'Em Análise'}
                {s === 'aprovado' && 'Aprovar'}
                {s === 'reprovado' && 'Reprovar'}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      <StepRevisao formulario={formulario} />

      {formulario.imagens.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Imagens</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {formulario.imagens.map((img) => (
              <img key={img.id} src={img.dataUrl} alt={img.nome} className="aspect-square rounded-xl border border-border object-cover" />
            ))}
          </CardContent>
        </Card>
      )}

      {formulario.assinaturaDataUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Assinatura</CardTitle>
          </CardHeader>
          <CardContent>
            <img src={formulario.assinaturaDataUrl} alt="Assinatura digital" className="h-32 rounded-xl border border-border bg-surface-2" />
          </CardContent>
        </Card>
      )}

      {formulario.observacoes && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-ink-muted">{formulario.observacoes}</p>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-ink-subtle">
        Criado em {formatarData(formulario.createdAt.slice(0, 10))}
        {formulario.criadoPorNome && ` por ${formulario.criadoPorNome}`} <Badge tone="outline">{formulario.id.slice(0, 8)}</Badge>
      </p>

      <Dialog
        open={confirmarExclusao}
        onClose={() => setConfirmarExclusao(false)}
        title="Excluir formulário?"
        description="Esta ação não pode ser desfeita. O formulário será removido permanentemente."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmarExclusao(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={excluir}>
              Excluir
            </Button>
          </>
        }
      />
    </div>
  )
}
