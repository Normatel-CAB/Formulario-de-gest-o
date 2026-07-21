import { useEffect, useMemo, useState } from 'react'
import { useTecnicosStore } from '../../store/tecnicosStore'
import { useAuthStore } from '../../store/authStore'
import { Card, CardContent } from '../../components/ui/Card'
import { Input, Select, Textarea } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Dialog } from '../../components/ui/Dialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { Pagination } from '../../components/ui/Pagination'
import { toast } from '../../store/toastStore'
import type { StatusRegistro, Tecnico } from '../../lib/types'

const POR_PAGINA = 8

interface FormState {
  nome: string
  empresa: string
  email: string
  telefone: string
  cargo: string
  regiao: string
  status: StatusRegistro
  observacoes: string
}

const ESTADO_INICIAL: FormState = {
  nome: '',
  empresa: '',
  email: '',
  telefone: '',
  cargo: '',
  regiao: '',
  status: 'ativo',
  observacoes: '',
}

export function Tecnicos() {
  const { tecnicos, loading, carregar, criar, atualizar, remover } = useTecnicosStore()
  const usuarioLogado = useAuthStore((s) => s.usuario)

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<StatusRegistro | 'todos'>('todos')
  const [pagina, setPagina] = useState(1)

  const [dialogAberto, setDialogAberto] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(ESTADO_INICIAL)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState<Tecnico | null>(null)

  useEffect(() => {
    void carregar()
  }, [carregar])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return tecnicos.filter((t) => {
      const matchBusca =
        !termo || t.nome.toLowerCase().includes(termo) || t.empresa.toLowerCase().includes(termo) || t.email.toLowerCase().includes(termo)
      const matchStatus = filtroStatus === 'todos' || t.status === filtroStatus
      return matchBusca && matchStatus
    })
  }, [tecnicos, busca, filtroStatus])

  useEffect(() => setPagina(1), [busca, filtroStatus])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const paginados = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  function abrirCriacao() {
    setEditandoId(null)
    setForm(ESTADO_INICIAL)
    setErros({})
    setDialogAberto(true)
  }

  function abrirEdicao(t: Tecnico) {
    setEditandoId(t.id)
    setForm({
      nome: t.nome,
      empresa: t.empresa,
      email: t.email,
      telefone: t.telefone,
      cargo: t.cargo,
      regiao: t.regiao,
      status: t.status,
      observacoes: t.observacoes,
    })
    setErros({})
    setDialogAberto(true)
  }

  function validar() {
    const novosErros: Record<string, string> = {}
    if (!form.nome.trim()) novosErros.nome = 'Informe o nome.'
    if (!form.email.trim()) novosErros.email = 'Informe o e-mail.'
    if (!form.empresa.trim()) novosErros.empresa = 'Informe a empresa.'
    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  async function salvar() {
    if (!validar()) return
    setSalvando(true)
    try {
      if (editandoId) {
        await atualizar(editandoId, { ...form }, usuarioLogado)
        toast({ variant: 'success', title: 'Técnico atualizado' })
      } else {
        await criar({ ...form }, usuarioLogado)
        toast({ variant: 'success', title: 'Técnico cadastrado com sucesso' })
      }
      setDialogAberto(false)
    } finally {
      setSalvando(false)
    }
  }

  async function confirmarExclusao() {
    if (!excluindo) return
    await remover(excluindo.id, usuarioLogado)
    toast({ variant: 'success', title: 'Técnico excluído' })
    setExcluindo(null)
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-ink">Técnicos de Segurança</h2>
          <p className="text-sm text-ink-muted">Cadastro de técnicos e supervisores de segurança do trabalho.</p>
        </div>
        <Button onClick={abrirCriacao}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Novo técnico
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_200px]">
          <Input
            placeholder="Pesquisar por nome, empresa ou e-mail"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            aria-label="Pesquisar técnicos"
          />
          <Select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value as StatusRegistro | 'todos')} aria-label="Filtrar por status">
            <option value="todos">Todos os status</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </Select>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-ink-muted">Carregando técnicos…</div>
        ) : filtrados.length === 0 ? (
          <div className="p-4">
            <EmptyState title="Nenhum técnico encontrado" description="Ajuste os filtros ou cadastre um novo técnico." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-ink-subtle">
                  <th className="px-4 py-3 font-semibold">Nome</th>
                  <th className="px-4 py-3 font-semibold">Empresa</th>
                  <th className="px-4 py-3 font-semibold">E-mail</th>
                  <th className="px-4 py-3 font-semibold">Telefone</th>
                  <th className="px-4 py-3 font-semibold">Região</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginados.map((t, i) => (
                  <tr key={t.id} className={`border-b border-border/60 transition-colors hover:bg-surface-2 ${i % 2 === 1 ? 'bg-surface-2/40' : ''}`}>
                    <td className="px-4 py-3 font-medium text-ink">{t.nome}</td>
                    <td className="px-4 py-3 text-ink-muted">{t.empresa}</td>
                    <td className="px-4 py-3 text-ink-muted">{t.email}</td>
                    <td className="px-4 py-3 text-ink-muted">{t.telefone || '—'}</td>
                    <td className="px-4 py-3 text-ink-muted">{t.regiao || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge tone={t.status === 'ativo' ? 'brand' : 'slate'}>{t.status === 'ativo' ? 'Ativo' : 'Inativo'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => abrirEdicao(t)}>
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => atualizar(t.id, { status: t.status === 'ativo' ? 'inativo' : 'ativo' }, usuarioLogado)}
                        >
                          {t.status === 'ativo' ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-rose-400 hover:bg-rose-500/10" onClick={() => setExcluindo(t)}>
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Pagination page={pagina} totalPages={totalPaginas} onChange={setPagina} />

      <Dialog
        open={dialogAberto}
        onClose={() => setDialogAberto(false)}
        title={editandoId ? 'Editar técnico' : 'Novo técnico'}
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nome" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} error={erros.nome} />
          <Input label="Empresa" required value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} error={erros.empresa} />
          <Input label="E-mail" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={erros.email} />
          <Input label="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(00) 00000-0000" />
          <Input label="Cargo" value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} placeholder="Ex.: Técnico de Segurança do Trabalho" />
          <Input label="Região" value={form.regiao} onChange={(e) => setForm({ ...form, regiao: e.target.value })} placeholder="Ex.: São Paulo - Capital" />
          <Textarea
            label="Observações"
            value={form.observacoes}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            className="sm:col-span-2"
          />
        </div>
      </Dialog>

      <Dialog
        open={Boolean(excluindo)}
        onClose={() => setExcluindo(null)}
        title="Excluir técnico?"
        description={`O técnico "${excluindo?.nome}" será removido permanentemente.`}
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
