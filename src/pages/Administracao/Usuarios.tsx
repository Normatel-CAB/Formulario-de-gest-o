import { useEffect, useMemo, useState } from 'react'
import { useUsersStore } from '../../store/usersStore'
import { useCargosStore } from '../../store/cargosStore'
import { useAuthStore } from '../../store/authStore'
import { Card, CardContent } from '../../components/ui/Card'
import { Input, Select } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Dialog } from '../../components/ui/Dialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { Pagination } from '../../components/ui/Pagination'
import { toast } from '../../store/toastStore'
import type { Papel, Usuario } from '../../lib/types'
import { PAPEL_LABELS } from '../../lib/types'
import { formatarDataHora } from '../../lib/format'
import { formatarCPF, validarCPF, validarEmail, validarSenhaForte } from '../../lib/validation'
import { AuthError } from '../../lib/auth'

const POR_PAGINA = 8

interface FormState {
  nome: string
  email: string
  cpf: string
  matricula: string
  cargo: string
  papel: Papel
  senha: string
}

const ESTADO_INICIAL: FormState = { nome: '', email: '', cpf: '', matricula: '', cargo: '', papel: 'operador', senha: '' }

export function Usuarios() {
  const { usuarios, loading, carregar, criar, atualizar, alternarStatus, remover } = useUsersStore()
  const { cargos, carregar: carregarCargos } = useCargosStore()
  const usuarioLogado = useAuthStore((s) => s.usuario)

  const [busca, setBusca] = useState('')
  const [filtroPapel, setFiltroPapel] = useState<Papel | 'todos'>('todos')
  const [pagina, setPagina] = useState(1)

  const [dialogAberto, setDialogAberto] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(ESTADO_INICIAL)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState<Usuario | null>(null)

  useEffect(() => {
    void carregar()
    void carregarCargos()
  }, [carregar, carregarCargos])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return usuarios.filter((u) => {
      const matchBusca = !termo || u.nome.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo)
      const matchPapel = filtroPapel === 'todos' || u.papel === filtroPapel
      return matchBusca && matchPapel
    })
  }, [usuarios, busca, filtroPapel])

  useEffect(() => setPagina(1), [busca, filtroPapel])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const paginados = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  function abrirCriacao() {
    setEditandoId(null)
    setForm(ESTADO_INICIAL)
    setErros({})
    setDialogAberto(true)
  }

  function abrirEdicao(u: Usuario) {
    setEditandoId(u.id)
    setForm({ nome: u.nome, email: u.email, cpf: u.cpf, matricula: u.matricula, cargo: u.cargo, papel: u.papel, senha: '' })
    setErros({})
    setDialogAberto(true)
  }

  function validar() {
    const novosErros: Record<string, string> = {}
    if (!form.nome.trim()) novosErros.nome = 'Informe o nome.'
    if (!validarEmail(form.email)) novosErros.email = 'E-mail inválido.'
    if (!editandoId && !validarCPF(form.cpf)) novosErros.cpf = 'CPF inválido.'
    if (!form.matricula.trim()) novosErros.matricula = 'Informe a matrícula.'
    if (!form.cargo) novosErros.cargo = 'Selecione o cargo.'
    if (!editandoId && !validarSenhaForte(form.senha)) novosErros.senha = 'Mínimo de 6 caracteres.'
    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  async function salvar() {
    if (!validar()) return
    setSalvando(true)
    try {
      if (editandoId) {
        await atualizar(editandoId, {
          nome: form.nome,
          email: form.email,
          cpf: form.cpf,
          matricula: form.matricula,
          cargo: form.cargo,
          papel: form.papel,
        })
        toast({ variant: 'success', title: 'Usuário atualizado' })
      } else {
        await criar({ ...form })
        toast({ variant: 'success', title: 'Usuário criado com sucesso' })
      }
      setDialogAberto(false)
    } catch (err) {
      toast({ variant: 'error', title: 'Não foi possível salvar', description: err instanceof AuthError ? err.message : undefined })
    } finally {
      setSalvando(false)
    }
  }

  async function confirmarExclusao() {
    if (!excluindo) return
    await remover(excluindo.id)
    toast({ variant: 'success', title: 'Usuário excluído' })
    setExcluindo(null)
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-ink">Usuários</h2>
          <p className="text-sm text-ink-muted">Gerencie contas, cargos e permissões de acesso ao sistema.</p>
        </div>
        <Button onClick={abrirCriacao}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Novo usuário
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_220px]">
          <Input placeholder="Pesquisar por nome ou e-mail" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Pesquisar usuários" />
          <Select value={filtroPapel} onChange={(e) => setFiltroPapel(e.target.value as Papel | 'todos')} aria-label="Filtrar por cargo">
            <option value="todos">Todos os papéis</option>
            {(Object.keys(PAPEL_LABELS) as Papel[]).map((p) => (
              <option key={p} value={p}>
                {PAPEL_LABELS[p]}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-ink-muted">Carregando usuários…</div>
        ) : filtrados.length === 0 ? (
          <div className="p-4">
            <EmptyState title="Nenhum usuário encontrado" description="Ajuste os filtros ou crie um novo usuário." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-ink-subtle">
                  <th className="px-4 py-3 font-semibold">Nome</th>
                  <th className="px-4 py-3 font-semibold">E-mail</th>
                  <th className="px-4 py-3 font-semibold">Cargo</th>
                  <th className="px-4 py-3 font-semibold">Papel</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Último acesso</th>
                  <th className="px-4 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginados.map((u, i) => (
                  <tr
                    key={u.id}
                    className={`border-b border-border/60 transition-colors hover:bg-surface-2 ${i % 2 === 1 ? 'bg-surface-2/40' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium text-ink">{u.nome}</td>
                    <td className="px-4 py-3 text-ink-muted">{u.email}</td>
                    <td className="px-4 py-3 text-ink-muted">{u.cargo || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge tone="brand">{PAPEL_LABELS[u.papel]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={u.status === 'ativo' ? 'brand' : 'slate'}>{u.status === 'ativo' ? 'Ativo' : 'Inativo'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{u.ultimoAcesso ? formatarDataHora(u.ultimoAcesso) : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => abrirEdicao(u)}>
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => alternarStatus(u.id, u.status === 'ativo' ? 'inativo' : 'ativo')}
                          disabled={u.id === usuarioLogado?.id}
                        >
                          {u.status === 'ativo' ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-400 hover:bg-rose-500/10"
                          onClick={() => setExcluindo(u)}
                          disabled={u.id === usuarioLogado?.id}
                        >
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
        title={editandoId ? 'Editar usuário' : 'Novo usuário'}
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
          <Input label="E-mail" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={erros.email} />
          <Input
            label="CPF"
            required={!editandoId}
            disabled={Boolean(editandoId)}
            value={form.cpf}
            onChange={(e) => setForm({ ...form, cpf: formatarCPF(e.target.value) })}
            error={erros.cpf}
            placeholder="000.000.000-00"
          />
          <Input label="Matrícula" required value={form.matricula} onChange={(e) => setForm({ ...form, matricula: e.target.value })} error={erros.matricula} />
          <Select label="Cargo" required value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} error={erros.cargo}>
            <option value="">Selecione</option>
            {cargos.map((c) => (
              <option key={c.id} value={c.nome}>
                {c.nome}
              </option>
            ))}
          </Select>
          <Select label="Papel" required value={form.papel} onChange={(e) => setForm({ ...form, papel: e.target.value as Papel })}>
            {(Object.keys(PAPEL_LABELS) as Papel[]).map((p) => (
              <option key={p} value={p}>
                {PAPEL_LABELS[p]}
              </option>
            ))}
          </Select>
          {!editandoId && (
            <Input
              label="Senha inicial"
              required
              type="password"
              value={form.senha}
              onChange={(e) => setForm({ ...form, senha: e.target.value })}
              error={erros.senha}
              placeholder="Mínimo 6 caracteres"
              className="sm:col-span-2"
            />
          )}
        </div>
      </Dialog>

      <Dialog
        open={Boolean(excluindo)}
        onClose={() => setExcluindo(null)}
        title="Excluir usuário?"
        description={`O usuário "${excluindo?.nome}" será removido permanentemente.`}
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
