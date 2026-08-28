import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useFormsStore } from '../store/formsStore'
import { useAuthStore } from '../store/authStore'
import { temPermissao, type FormularioAvaliacao, type FormStatus } from '../lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Dialog } from '../components/ui/Dialog'
import { toast } from '../store/toastStore'
import { formatarData, formatarDataHora } from '../lib/format'
import { gerarPdfFormulario, nomeArquivoPdf } from '../lib/pdf'
import { baixarZipFotos, nomeArquivoFotos, totalFotos } from '../lib/exportarFotos'
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
        <p className="text-[13px] text-txt-dim">Formulário não encontrado.</p>
        <Link to="/historico" className="text-sm font-medium text-brand-lite underline">
          Voltar ao histórico
        </Link>
      </div>
    )
  }

  // Dono pelo e-mail, não pelo id: o id é gerado por aparelho, então a mesma
  // pessoa deixava de ser dona da própria ficha ao trocar de navegador.
  const ehDono =
    (formulario.criadoPorEmail ?? '').toLowerCase() === (usuario?.email ?? '').toLowerCase() ||
    (Boolean(formulario.criadoPorId) && formulario.criadoPorId === usuario?.id)

  // Espelham as policies da migração 008. Aqui só escondem botão: quem editar
  // o JavaScript ganha o botão de volta e recebe a recusa da API.
  const podeAlterarStatus =
    temPermissao(usuario, 'formularios.aprovar') ||
    temPermissao(usuario, 'formularios.reprovar') ||
    temPermissao(usuario, 'formularios.reabrir')
  const podeEditar =
    formulario.status === 'rascunho' && (podeAlterarStatus || (ehDono && temPermissao(usuario, 'formularios.editar')))
  const podeExcluir = temPermissao(usuario, 'formularios.excluir') && (podeAlterarStatus || ehDono)
  const somenteLeitura = !podeEditar && !podeAlterarStatus

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

  async function baixarPdf() {
    if (!formulario) return
    const blob = await gerarPdfFormulario(formulario)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = nomeArquivoPdf(formulario)
    link.click()
    URL.revokeObjectURL(url)
    toast({ variant: 'success', title: 'PDF exportado com sucesso' })
  }

  /** Zip com o registro fotográfico, nomeado pelo número da solicitação. */
  function exportarFotos() {
    if (!formulario) return
    try {
      baixarZipFotos(formulario)
      toast({
        variant: 'success',
        title: 'Fotos exportadas',
        description: `Arquivo ${nomeArquivoFotos(formulario)} salvo nos downloads.`,
      })
    } catch (err) {
      toast({
        variant: 'warning',
        title: 'Nada para exportar',
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[19px] font-bold leading-tight tracking-[-0.025em] text-txt sm:text-[24px]">{formulario.infoGerais.localAtividade || 'Atividade sem nome'}</h2>
            <StatusBadge status={formulario.status} />
          </div>
          <p className="text-[13px] text-txt-dim">
            {formulario.infoGerais.numeroSolicitacao
              ? `Nº ${formulario.infoGerais.numeroSolicitacao}`
              : 'Sem número'}{' '}
            · Atualizado em {formatarDataHora(formulario.updatedAt)}
          </p>
        </div>
        {/* No celular as ações viram largura total: são poucos botões e cada um
            precisa da área de toque inteira. */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button variant="outline" onClick={baixarPdf}>
            Exportar PDF
          </Button>
          <Button
            variant="outline"
            disabled={totalFotos(formulario) === 0}
            onClick={exportarFotos}
            title={
              totalFotos(formulario) === 0
                ? 'Esta ficha não tem fotos anexadas'
                : `Baixar ${nomeArquivoFotos(formulario)}`
            }
          >
            Exportar fotos
          </Button>
          {!somenteLeitura && podeEditar && (
            <Link to={`/novo/${formulario.id}`} className="contents">
              <Button variant="outline" className="w-full sm:w-auto">
                Continuar edição
              </Button>
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
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
            <img src={formulario.assinaturaDataUrl} alt="Assinatura digital" className="h-32 rounded-xl border border-hairline bg-surface-2" />
          </CardContent>
        </Card>
      )}

      {formulario.observacoes && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[13px] text-txt-dim">{formulario.observacoes}</p>
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
