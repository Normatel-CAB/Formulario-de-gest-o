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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { SolicitacoesAcesso } from './SolicitacoesAcesso'
import { toast } from '../../store/toastStore'
import type { Papel, Usuario } from '../../lib/types'
import { PAPEL_LABELS, PROJETOS_PADRAO } from '../../lib/types'
import { formatarDataHora } from '../../lib/format'
import { formatarCPF, validarCPF, validarEmail, validarSenhaForte } from '../../lib/validation'
import { AuthError, resetarSenhaAdmin } from '../../lib/auth'

const POR_PAGINA = 8

interface FormState {
  nome: string
  email: string
  cpf: string
  matricula: string
  cargo: string
  papel: Papel
  projeto: string
  senha: string
}

const ESTADO_INICIAL: FormState = {
  nome: '',
  email: '',
  cpf: '',
  matricula: '',
  cargo: '',
  papel: 'operador',
  projeto: '',
  senha: '',
}

export function Usuarios() {
  const { usuarios, loading, carregar, criar, atualizar, alternarStatus, remover } = useUsersStore()
  const { cargos, carregar: carregarCargos } = useCargosStore()
  const usuarioLogado = useAuthStore((s) => s.usuario)

  const [busca, setBusca] = useState('')
  const [filtroPapel, setFiltroPapel] = useState<Papel | 'todos'>('todos')
  const [filtroProjeto, setFiltroProjeto] = useState('')
  const [pagina, setPagina] = useState(1)

  const [dialogAberto, setDialogAberto] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(ESTADO_INICIAL)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState<Usuario | null>(null)

  const [resetandoUsuario, setResetandoUsuario] = useState<Usuario | null>(null)
  const [novaSenhaReset, setNovaSenhaReset] = useState('')
  const [erroReset, setErroReset] = useState('')
  const [resetando, setResetando] = useState(false)

  useEffect(() => {
    void carregar()
    void carregarCargos()
  }, [carregar, carregarCargos])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return usuarios.filter((u) => {
      const matchBusca = !termo || u.nome.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo)
      const matchPapel = filtroPapel === 'todos' || u.papel === filtroPapel
      const matchProjeto = !filtroProjeto || u.projeto === filtroProjeto
      return matchBusca && matchPapel && matchProjeto
    })
  }, [usuarios, busca, filtroPapel, filtroProjeto])

  useEffect(() => setPagina(1), [busca, filtroPapel, filtroProjeto])

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
    setForm({
      nome: u.nome,
      email: u.email,
      cpf: u.cpf,
      matricula: u.matricula,
      cargo: u.cargo,
      papel: u.papel,
      projeto: u.projeto,
      senha: '',
    })
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
    if (!form.projeto) novosErros.projeto = 'Selecione o projeto.'
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
          projeto: form.projeto,
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

  function abrirResetSenha(u: Usuario) {
    setResetandoUsuario(u)
    setNovaSenhaReset('')
    setErroReset('')
  }

  async function confirmarResetSenha() {
    if (!resetandoUsuario) return
    if (!validarSenhaForte(novaSenhaReset)) {
      setErroReset('A senha deve ter ao menos 6 caracteres.')
      return
    }
    setResetando(true)
    try {
      await resetarSenhaAdmin(resetandoUsuario.id, novaSenhaReset)
      toast({ variant: 'success', title: `Senha de ${resetandoUsuario.nome} redefinida` })
      setResetandoUsuario(null)
    } finally {
      setResetando(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-[22px] font-bold tracking-[-0.025em] text-txt sm:text-[27px]">Usuários</h2>
          <p className="text-[13px] text-txt-dim">Gerencie contas, cargos e permissões de acesso ao sistema.</p>
        </div>
        <Button onClick={abrirCriacao}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Novo usuário
        </Button>
      </div>

      <SolicitacoesAcesso />

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_180px_200px]">
          <Input placeholder="Pesquisar por nome ou e-mail" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Pesquisar usuários" />
          <Select value={filtroPapel} onChange={(e) => setFiltroPapel(e.target.value as Papel | 'todos')} aria-label="Filtrar por cargo">
            <option value="todos">Todos os papéis</option>
            {(Object.keys(PAPEL_LABELS) as Papel[]).map((p) => (
              <option key={p} value={p}>
                {PAPEL_LABELS[p]}
              </option>
            ))}
          </Select>
          <Select value={filtroProjeto} onChange={(e) => setFiltroProjeto(e.target.value)} aria-label="Filtrar por projeto">
            <option value="">Todos os projetos</option>
            {PROJETOS_PADRAO.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      <p className="rounded-md border border-viz-amber/25 bg-viz-amber/10 px-3 py-2.5 text-[11.5px] leading-relaxed text-viz-amber">
        <b className="font-semibold">Contas locais deste navegador.</b> A tabela abaixo é o cadastro de
        e-mail e senha guardado neste aparelho, então quem entra com a Microsoft pelo próprio celular
        não aparece aqui. Quem tem acesso de verdade está no painel acima.
      </p>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-ink-muted">Carregando usuários…</div>
        ) : filtrados.length === 0 ? (
          <div className="p-4">
            <EmptyState title="Nenhum usuário encontrado" description="Ajuste os filtros ou crie um novo usuário." />
          </div>
        ) : (
          <Table className="px-3 pb-3">
            <TableHeader>
              <TableRow className="[&>th]:bg-transparent">
                <TableHead>Nome</TableHead>
                {/* Colunas de apoio saem no celular: com 8 colunas a rolagem
                    horizontal viraria a única forma de ler a tabela. */}
                <TableHead className="hidden lg:table-cell">E-mail</TableHead>
                <TableHead className="hidden xl:table-cell">Cargo</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead className="hidden xl:table-cell">Projeto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Último acesso</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginados.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="min-w-[9rem] font-semibold">
                    {u.nome}
                    <span className="block truncate text-[10.5px] font-normal text-txt-faint lg:hidden">{u.email}</span>
                  </TableCell>
                  <TableCell className="hidden text-txt-dim lg:table-cell">{u.email}</TableCell>
                  <TableCell className="hidden whitespace-nowrap text-txt-dim xl:table-cell">{u.cargo || 'Não informado'}</TableCell>
                  <TableCell>
                    <Badge tone="brand">{PAPEL_LABELS[u.papel]}</Badge>
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap text-txt-dim xl:table-cell">{u.projeto || 'Não informado'}</TableCell>
                  <TableCell>
                    <Badge tone={u.status === 'ativo' ? 'brand' : 'slate'}>
                      {u.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap text-txt-dim lg:table-cell">
                    {u.ultimoAcesso ? formatarDataHora(u.ultimoAcesso) : 'Nunca acessou'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                      <Button variant="ghost" size="sm" onClick={() => abrirEdicao(u)}>
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => abrirResetSenha(u)}>
                        Senha
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
                        className="text-viz-red hover:bg-viz-red/10"
                        onClick={() => setExcluindo(u)}
                        disabled={u.id === usuarioLogado?.id}
                      >
                        Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
            {cargos
              .filter((c) => c.status === 'ativo')
              .map((c) => (
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
          <Select label="Projeto" required value={form.projeto} onChange={(e) => setForm({ ...form, projeto: e.target.value })} error={erros.projeto}>
            <option value="">Selecione</option>
            {PROJETOS_PADRAO.map((p) => (
              <option key={p} value={p}>
                {p}
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

      <Dialog
        open={Boolean(resetandoUsuario)}
        onClose={() => setResetandoUsuario(null)}
        title="Resetar senha"
        description={`Defina uma nova senha para "${resetandoUsuario?.nome}".`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetandoUsuario(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmarResetSenha} loading={resetando}>
              Redefinir senha
            </Button>
          </>
        }
      >
        <Input
          label="Nova senha"
          type="password"
          required
          value={novaSenhaReset}
          onChange={(e) => setNovaSenhaReset(e.target.value)}
          error={erroReset}
          placeholder="Mínimo 6 caracteres"
        />
      </Dialog>
    </div>
  )
}
