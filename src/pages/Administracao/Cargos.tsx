import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCargosStore } from '../../store/cargosStore'
import { useFuncoesStore } from '../../store/funcoesStore'
import { useSolicitacoesStore } from '../../store/solicitacoesStore'
import { Card, CardContent } from '../../components/ui/Card'
import { Input, Select, Textarea } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Dialog } from '../../components/ui/Dialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { Switch } from '../../components/ui/Switch'
import { Checkbox } from '../../components/ui/Checkbox'
import { RbacIcon } from '../../components/ui/RbacIcon'
import { toast } from '../../store/toastStore'
import type { Cargo, Funcao, StatusRegistro } from '../../lib/types'
import { CORES_CARGO, ICONES_DISPONIVEIS } from '../../lib/permissoes'
import { cn } from '../../lib/cn'

interface CargoFormState {
  nome: string
  descricao: string
  cor: string
  icone: string
  status: StatusRegistro
  permissoes: string[]
}

const CARGO_INICIAL: CargoFormState = {
  nome: '',
  descricao: '',
  cor: CORES_CARGO[0],
  icone: ICONES_DISPONIVEIS[0],
  status: 'ativo',
  permissoes: [],
}

export function Cargos() {
  const { cargos, loading, carregar, criar, atualizar, duplicar, alternarStatus, remover } = useCargosStore()
  const { funcoes, carregar: carregarFuncoes } = useFuncoesStore()
  // A contagem vem das solicitações de acesso, no Supabase, e não mais da
  // lista local de usuários. Era essa a causa do "0 usuário(s)" em todos os
  // cargos: a lista local só tem a conta do próprio aparelho.
  const { solicitacoes, carregar: carregarAcessos } = useSolicitacoesStore()

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<StatusRegistro | 'todos'>('todos')

  const [dialogCargoAberto, setDialogCargoAberto] = useState(false)
  const [editandoCargoId, setEditandoCargoId] = useState<string | null>(null)
  const [formCargo, setFormCargo] = useState<CargoFormState>(CARGO_INICIAL)
  const [errosCargo, setErrosCargo] = useState<Record<string, string>>({})
  const [salvandoCargo, setSalvandoCargo] = useState(false)
  const [excluindoCargo, setExcluindoCargo] = useState<Cargo | null>(null)

  useEffect(() => {
    void carregar()
    void carregarFuncoes()
    void carregarAcessos()
  }, [carregar, carregarFuncoes, carregarAcessos])

  const categorias = useMemo(() => Array.from(new Set(funcoes.map((f) => f.categoria))), [funcoes])

  const funcoesPorCategoria = useMemo(() => {
    const mapa = new Map<string, Funcao[]>()
    categorias.forEach((c) => mapa.set(c, []))
    funcoes
      .filter((f) => f.status === 'ativo')
      .forEach((f) => {
        if (!mapa.has(f.categoria)) mapa.set(f.categoria, [])
        mapa.get(f.categoria)!.push(f)
      })
    return mapa
  }, [categorias, funcoes])

  // Chaveado pelo identificador do cargo, que é o vínculo real. Antes a chave
  // era o nome, e renomear um cargo zerava a contagem sem avisar.
  const usuariosPorCargo = useMemo(() => {
    const mapa = new Map<string, number>()
    solicitacoes
      .filter((s) => s.status === 'aprovado')
      .forEach((s) => mapa.set(s.cargo, (mapa.get(s.cargo) ?? 0) + 1))
    return mapa
  }, [solicitacoes])

  const cargosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return cargos.filter((c) => {
      const matchBusca = !termo || c.nome.toLowerCase().includes(termo) || c.descricao.toLowerCase().includes(termo)
      const matchStatus = filtroStatus === 'todos' || c.status === filtroStatus
      return matchBusca && matchStatus
    })
  }, [cargos, busca, filtroStatus])

  function abrirCriacaoCargo() {
    setEditandoCargoId(null)
    setFormCargo(CARGO_INICIAL)
    setErrosCargo({})
    setDialogCargoAberto(true)
  }

  function abrirEdicaoCargo(c: Cargo) {
    setEditandoCargoId(c.id)
    setFormCargo({ nome: c.nome, descricao: c.descricao, cor: c.cor, icone: c.icone, status: c.status, permissoes: [...c.permissoes] })
    setErrosCargo({})
    setDialogCargoAberto(true)
  }

  function validarCargo() {
    const erros: Record<string, string> = {}
    if (!formCargo.nome.trim()) erros.nome = 'Informe o nome do cargo.'
    if (!formCargo.descricao.trim()) erros.descricao = 'Informe a descrição.'
    setErrosCargo(erros)
    return Object.keys(erros).length === 0
  }

  async function salvarCargo() {
    if (!validarCargo()) return
    setSalvandoCargo(true)
    try {
      if (editandoCargoId) {
        await atualizar(editandoCargoId, { ...formCargo })
        toast({ variant: 'success', title: 'Cargo atualizado' })
      } else {
        await criar({ ...formCargo })
        toast({ variant: 'success', title: 'Cargo criado com sucesso' })
      }
      setDialogCargoAberto(false)
    } finally {
      setSalvandoCargo(false)
    }
  }

  async function duplicarCargo(c: Cargo) {
    await duplicar(c.id)
    toast({ variant: 'success', title: `Cargo "${c.nome}" duplicado` })
  }

  async function alternarStatusCargo(c: Cargo) {
    await alternarStatus(c.id, c.status === 'ativo' ? 'inativo' : 'ativo')
  }

  async function confirmarExclusaoCargo() {
    if (!excluindoCargo) return
    const emUso = (usuariosPorCargo.get(excluindoCargo.identificador) ?? 0) > 0
    const resultado = await remover(excluindoCargo.identificador, emUso)
    if (resultado.ok) {
      toast({ variant: 'success', title: 'Cargo excluído' })
    } else {
      toast({ variant: 'error', title: 'Não foi possível excluir', description: resultado.motivo })
    }
    setExcluindoCargo(null)
  }

  function alternarPermissao(identificador: string) {
    setFormCargo((f) => ({
      ...f,
      permissoes: f.permissoes.includes(identificador) ? f.permissoes.filter((p) => p !== identificador) : [...f.permissoes, identificador],
    }))
  }

  function alternarCategoriaCompleta(categoria: string, marcado: boolean) {
    const idsCategoria = (funcoesPorCategoria.get(categoria) ?? []).map((f) => f.identificador)
    setFormCargo((f) => ({
      ...f,
      permissoes: marcado
        ? Array.from(new Set([...f.permissoes, ...idsCategoria]))
        : f.permissoes.filter((p) => !idsCategoria.includes(p)),
    }))
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-[22px] font-bold tracking-[-0.025em] text-txt sm:text-[27px]">Cargos</h2>
          <p className="text-[13px] text-txt-dim">Gerencie cargos e vincule permissões de acesso por módulo.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/administracao/permissoes">
            <Button variant="outline">
              <RbacIcon nome="clipboard" className="h-4 w-4" />
              Gerenciar Permissões
            </Button>
          </Link>
          <Button onClick={abrirCriacaoCargo}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Novo Cargo
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_200px]">
          <Input placeholder="Pesquisar cargos por nome ou descrição" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Pesquisar cargos" />
          <Select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value as StatusRegistro | 'todos')} aria-label="Filtrar por status">
            <option value="todos">Todos os status</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <div className="p-8 text-center text-sm text-ink-muted">Carregando cargos…</div>
      ) : cargosFiltrados.length === 0 ? (
        <EmptyState title="Nenhum cargo encontrado" description="Ajuste os filtros ou crie um novo cargo." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cargosFiltrados.map((c) => {
            const qtdUsuarios = usuariosPorCargo.get(c.identificador) ?? 0
            return (
              <Card key={c.id} className="flex flex-col transition-colors hover:border-brand-600/40">
                <CardContent className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${c.cor}26`, color: c.cor }}
                      >
                        <RbacIcon nome={c.icone} className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{c.nome}</p>
                        <p className="text-xs text-ink-subtle">{c.permissoes.length} permissão(ões)</p>
                      </div>
                    </div>
                    <Badge tone={c.status === 'ativo' ? 'brand' : 'slate'}>{c.status === 'ativo' ? 'Ativo' : 'Inativo'}</Badge>
                  </div>

                  <p className="line-clamp-2 flex-1 text-sm text-ink-muted">{c.descricao}</p>

                  <div className="flex items-center justify-between text-xs text-ink-subtle">
                    <span className="flex items-center gap-1.5">
                      <RbacIcon nome="users" className="h-3.5 w-3.5" />
                      {qtdUsuarios} usuário(s)
                    </span>
                    {c.sistema && <Badge tone="outline">Sistema</Badge>}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
                    <Button size="sm" variant="ghost" onClick={() => abrirEdicaoCargo(c)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => duplicarCargo(c)}>
                      Duplicar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => alternarStatusCargo(c)}>
                      {c.status === 'ativo' ? 'Inativar' : 'Ativar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-viz-red hover:bg-viz-red/10"
                      onClick={() => setExcluindoCargo(c)}
                      disabled={c.sistema || qtdUsuarios > 0}
                      title={c.sistema ? 'Cargos do sistema não podem ser excluídos' : qtdUsuarios > 0 ? 'Cargo em uso não pode ser excluído' : undefined}
                    >
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog
        open={dialogCargoAberto}
        onClose={() => setDialogCargoAberto(false)}
        title={editandoCargoId ? 'Editar cargo' : 'Novo cargo'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialogCargoAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarCargo} loading={salvandoCargo}>
              Salvar Alterações
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nome" required value={formCargo.nome} onChange={(e) => setFormCargo({ ...formCargo, nome: e.target.value })} error={errosCargo.nome} />
            <div className="flex items-end justify-between gap-4">
              <span className="text-sm font-semibold text-ink">Status</span>
              <div className="flex items-center gap-2">
                <span className={cn('text-xs font-semibold', formCargo.status === 'ativo' ? 'text-ink-subtle' : 'text-ink')}>Inativo</span>
                <Switch checked={formCargo.status === 'ativo'} onChange={(v) => setFormCargo({ ...formCargo, status: v ? 'ativo' : 'inativo' })} />
                <span className={cn('text-xs font-semibold', formCargo.status === 'ativo' ? 'text-brand-lite' : 'text-ink-subtle')}>Ativo</span>
              </div>
            </div>
          </div>

          <Textarea
            label="Descrição"
            required
            value={formCargo.descricao}
            onChange={(e) => setFormCargo({ ...formCargo, descricao: e.target.value })}
            error={errosCargo.descricao}
          />

          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Cor do cargo</p>
            <div className="flex flex-wrap gap-2">
              {CORES_CARGO.map((cor) => (
                <button
                  key={cor}
                  type="button"
                  onClick={() => setFormCargo({ ...formCargo, cor })}
                  className={cn(
                    'h-8 w-8 rounded-full border-2 transition-transform hover:scale-110',
                    formCargo.cor === cor ? 'border-white' : 'border-transparent',
                  )}
                  style={{ backgroundColor: cor }}
                  aria-label={`Selecionar cor ${cor}`}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Ícone</p>
            <div className="flex flex-wrap gap-2">
              {ICONES_DISPONIVEIS.map((icone) => (
                <button
                  key={icone}
                  type="button"
                  onClick={() => setFormCargo({ ...formCargo, icone })}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
                    formCargo.icone === icone ? 'border-brand-500 border border-brand/25 bg-brand/13 text-brand-lite' : 'border-border-light text-ink-muted hover:bg-surface-3',
                  )}
                  aria-label={`Selecionar ícone ${icone}`}
                >
                  <RbacIcon nome={icone} className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">Permissões por módulo</p>
              <Link to="/administracao/permissoes" className="text-xs font-medium text-brand-lite hover:text-brand-lite">
                Gerenciar permissões
              </Link>
            </div>
            <div className="space-y-3">
              {categorias.map((categoria) => {
                const funcoesCategoria = funcoesPorCategoria.get(categoria) ?? []
                if (funcoesCategoria.length === 0) return null
                const todasMarcadas = funcoesCategoria.every((f) => formCargo.permissoes.includes(f.identificador))
                return (
                  <div key={categoria} className="rounded-xl border border-border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-ink">{categoria}</p>
                      <Checkbox checked={todasMarcadas} onChange={(v) => alternarCategoriaCompleta(categoria, v)} label="Selecionar tudo" />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {funcoesCategoria.map((f) => (
                        <Checkbox
                          key={f.identificador}
                          checked={formCargo.permissoes.includes(f.identificador)}
                          onChange={() => alternarPermissao(f.identificador)}
                          label={f.nome}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(excluindoCargo)}
        onClose={() => setExcluindoCargo(null)}
        title="Excluir cargo?"
        description={`O cargo "${excluindoCargo?.nome}" será removido permanentemente.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setExcluindoCargo(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmarExclusaoCargo}>
              Excluir
            </Button>
          </>
        }
      />
    </div>
  )
}
