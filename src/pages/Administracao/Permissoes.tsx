import { useEffect, useMemo, useState } from 'react'
import { useFuncoesStore } from '../../store/funcoesStore'
import { Card, CardContent } from '../../components/ui/Card'
import { Input, Select, Textarea } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Dialog } from '../../components/ui/Dialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { Switch } from '../../components/ui/Switch'
import { RbacIcon } from '../../components/ui/RbacIcon'
import { toast } from '../../store/toastStore'
import type { Funcao, StatusRegistro } from '../../lib/types'
import { ICONES_DISPONIVEIS, identificadorFuncao, MODULOS_PERMISSOES } from '../../lib/permissoes'
import { cn } from '../../lib/cn'

interface FormState {
  nome: string
  categoria: string
  descricao: string
  icone: string
  status: StatusRegistro
}

const ESTADO_INICIAL: FormState = {
  nome: '',
  categoria: MODULOS_PERMISSOES[0].categoria,
  descricao: '',
  icone: 'check-circle',
  status: 'ativo',
}

export function Permissoes() {
  const { funcoes, loading, carregar, criar, atualizar, remover } = useFuncoesStore()

  const [busca, setBusca] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<StatusRegistro | 'todos'>('todos')

  const [dialogAberto, setDialogAberto] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(ESTADO_INICIAL)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState<Funcao | null>(null)

  useEffect(() => {
    void carregar()
  }, [carregar])

  const categorias = useMemo(() => Array.from(new Set(funcoes.map((f) => f.categoria))), [funcoes])

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return funcoes.filter((f) => {
      const matchBusca = !termo || f.nome.toLowerCase().includes(termo) || f.descricao.toLowerCase().includes(termo)
      const matchCategoria = !filtroCategoria || f.categoria === filtroCategoria
      const matchStatus = filtroStatus === 'todos' || f.status === filtroStatus
      return matchBusca && matchCategoria && matchStatus
    })
  }, [funcoes, busca, filtroCategoria, filtroStatus])

  const agrupadas = useMemo(() => {
    const mapa = new Map<string, Funcao[]>()
    filtradas.forEach((f) => {
      if (!mapa.has(f.categoria)) mapa.set(f.categoria, [])
      mapa.get(f.categoria)!.push(f)
    })
    return mapa
  }, [filtradas])

  function abrirCriacao() {
    setEditandoId(null)
    setForm(ESTADO_INICIAL)
    setErros({})
    setDialogAberto(true)
  }

  function abrirEdicao(f: Funcao) {
    setEditandoId(f.id)
    setForm({ nome: f.nome, categoria: f.categoria, descricao: f.descricao, icone: f.icone, status: f.status })
    setErros({})
    setDialogAberto(true)
  }

  function validar() {
    const novosErros: Record<string, string> = {}
    if (!form.nome.trim()) novosErros.nome = 'Informe o nome da permissão.'
    if (!form.categoria.trim()) novosErros.categoria = 'Informe a categoria.'
    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  async function salvar() {
    if (!validar()) return
    setSalvando(true)
    try {
      if (editandoId) {
        await atualizar(editandoId, { ...form })
        toast({ variant: 'success', title: 'Permissão atualizada' })
      } else {
        await criar({ ...form })
        toast({ variant: 'success', title: 'Permissão criada com sucesso' })
      }
      setDialogAberto(false)
    } finally {
      setSalvando(false)
    }
  }

  async function confirmarExclusao() {
    if (!excluindo) return
    await remover(excluindo.id)
    toast({ variant: 'success', title: 'Permissão excluída' })
    setExcluindo(null)
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-[22px] font-bold tracking-[-0.025em] text-txt sm:text-[27px]">Permissões</h2>
          <p className="text-[13px] text-txt-dim">Gerencie as permissões disponíveis para vincular aos cargos.</p>
        </div>
        <Button onClick={abrirCriacao}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Adicionar Permissão
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-[1fr_200px_160px]">
          <Input placeholder="Pesquisar por nome ou descrição" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Pesquisar permissões" />
          <Select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} aria-label="Filtrar por categoria">
            <option value="">Todas as categorias</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value as StatusRegistro | 'todos')} aria-label="Filtrar por status">
            <option value="todos">Todos os status</option>
            <option value="ativo">Ativas</option>
            <option value="inativo">Inativas</option>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <div className="p-8 text-center text-sm text-ink-muted">Carregando permissões…</div>
      ) : filtradas.length === 0 ? (
        <EmptyState title="Nenhuma permissão encontrada" description="Ajuste os filtros ou crie uma nova permissão." />
      ) : (
        <div className="space-y-4">
          {Array.from(agrupadas.entries()).map(([categoria, lista]) => (
            <Card key={categoria}>
              <CardContent className="p-4">
                <p className="mb-3 text-sm font-semibold text-ink">{categoria}</p>
                <div className="space-y-1.5">
                  {lista.map((f) => (
                    <div key={f.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <RbacIcon nome={f.icone} className="h-4 w-4 shrink-0 text-ink-subtle" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">{f.nome}</p>
                          <p className="truncate text-xs text-ink-subtle">{f.descricao || f.identificador}</p>
                        </div>
                        {f.status === 'inativo' && <Badge tone="slate">Inativa</Badge>}
                        {f.sistema && <Badge tone="outline">Sistema</Badge>}
                      </div>
                      {!f.sistema && (
                        <div className="flex shrink-0 gap-1">
                          <Button size="sm" variant="ghost" onClick={() => abrirEdicao(f)}>
                            Editar
                          </Button>
                          <Button size="sm" variant="ghost" className="text-viz-red hover:bg-viz-red/10" onClick={() => setExcluindo(f)}>
                            Excluir
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={dialogAberto}
        onClose={() => setDialogAberto(false)}
        title={editandoId ? 'Editar permissão' : 'Nova permissão'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialogAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar} loading={salvando}>
              Salvar Alterações
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Nome" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} error={erros.nome} />
          <Input
            label="Categoria"
            required
            list="categorias-permissao"
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            error={erros.categoria}
          />
          <datalist id="categorias-permissao">
            {categorias.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          {form.nome && form.categoria && (
            <p className="-mt-2 text-xs text-ink-subtle">
              Identificador: <span className="font-mono text-ink-muted">{identificadorFuncao(form.categoria, form.nome)}</span>
            </p>
          )}
          <Textarea label="Descrição" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />

          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Ícone</p>
            <div className="flex flex-wrap gap-2">
              {ICONES_DISPONIVEIS.map((icone) => (
                <button
                  key={icone}
                  type="button"
                  onClick={() => setForm({ ...form, icone })}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
                    form.icone === icone ? 'border-brand-500 border border-brand/25 bg-brand/13 text-brand-lite' : 'border-border-light text-ink-muted hover:bg-surface-3',
                  )}
                  aria-label={`Selecionar ícone ${icone}`}
                >
                  <RbacIcon nome={icone} className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">Status</span>
            <div className="flex items-center gap-2">
              <span className={cn('text-xs font-semibold', form.status === 'ativo' ? 'text-ink-subtle' : 'text-ink')}>Inativa</span>
              <Switch checked={form.status === 'ativo'} onChange={(v) => setForm({ ...form, status: v ? 'ativo' : 'inativo' })} />
              <span className={cn('text-xs font-semibold', form.status === 'ativo' ? 'text-brand-lite' : 'text-ink-subtle')}>Ativa</span>
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(excluindo)}
        onClose={() => setExcluindo(null)}
        title="Excluir permissão?"
        description={`A permissão "${excluindo?.nome}" será removida de todos os cargos.`}
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
