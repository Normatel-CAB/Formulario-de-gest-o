import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFormsStore } from '../store/formsStore'
import { useAuthStore } from '../store/authStore'
import { Card, CardContent } from '../components/ui/Card'
import { Input, Select } from '../components/ui/Field'
import { StatusBadge } from '../components/ui/StatusBadge'
import { EmptyState } from '../components/ui/EmptyState'
import { SkeletonCard } from '../components/ui/Skeleton'
import { Button } from '../components/ui/Button'
import { Pagination } from '../components/ui/Pagination'
import { Reveal } from '../components/ui/Reveal'
import type { FormStatus } from '../lib/types'
import { PROJETOS_PADRAO, STATUS_LABELS } from '../lib/types'
import { formatarDataHora } from '../lib/format'

const POR_PAGINA = 9

export function Historico() {
  const { formularios, loading, carregar } = useFormsStore()
  const usuario = useAuthStore((s) => s.usuario)
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState<FormStatus | 'todos'>('todos')
  const [filtroProjeto, setFiltroProjeto] = useState('')
  const [pagina, setPagina] = useState(1)

  const ehAdministrador = usuario?.papel === 'administrador'

  useEffect(() => {
    void carregar()
  }, [carregar])

  const visiveis = useMemo(() => {
    let lista = formularios
    if (usuario?.papel === 'operador') {
      lista = lista.filter((f) => f.criadoPorId === usuario.id)
    }
    if (!ehAdministrador && usuario) {
      lista = lista.filter((f) => !f.projeto || !usuario.projeto || f.projeto === usuario.projeto)
    }
    return lista
  }, [formularios, usuario, ehAdministrador])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return visiveis.filter((f) => {
      const matchStatus = status === 'todos' || f.status === status
      const matchProjeto = !ehAdministrador || !filtroProjeto || f.projeto === filtroProjeto
      const matchBusca =
        !termo ||
        f.infoGerais.responsavel.toLowerCase().includes(termo) ||
        f.infoGerais.localAtividade.toLowerCase().includes(termo) ||
        f.infoGerais.numeroSolicitacao.toLowerCase().includes(termo)
      return matchStatus && matchProjeto && matchBusca
    })
  }, [visiveis, busca, status, filtroProjeto, ehAdministrador])

  useEffect(() => {
    setPagina(1)
  }, [busca, status, filtroProjeto])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const paginados = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  return (
    <div className="space-y-5">
      <div>
        <span className="chip">Fichas técnicas</span>
        <h2 className="mt-2 text-[22px] font-bold tracking-[-0.025em] text-txt sm:text-[27px]">
          Histórico de Formulários
        </h2>
        <p className="mt-1 text-[13px] text-txt-dim">
          {usuario?.papel === 'operador'
            ? 'Pesquise e acompanhe o status dos formulários que você criou.'
            : 'Pesquise, filtre e acompanhe o status de todas as fichas técnicas.'}
        </p>
      </div>

      <Card>
        <CardContent className={`grid gap-3 p-4 ${ehAdministrador ? 'md:grid-cols-[1fr_180px_180px]' : 'md:grid-cols-[1fr_220px]'}`}>
          <Input
            placeholder="Pesquisar por responsável, local ou nº da solicitação"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            aria-label="Pesquisar formulários"
          />
          <Select value={status} onChange={(e) => setStatus(e.target.value as FormStatus | 'todos')} aria-label="Filtrar por status">
            <option value="todos">Todos os status</option>
            {(Object.keys(STATUS_LABELS) as FormStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
          {ehAdministrador && (
            <Select value={filtroProjeto} onChange={(e) => setFiltroProjeto(e.target.value)} aria-label="Filtrar por projeto">
              <option value="">Todos os projetos</option>
              {PROJETOS_PADRAO.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <EmptyState
          title="Nenhum formulário encontrado"
          description="Ajuste os filtros de pesquisa ou crie um novo formulário."
          action={
            <Link to="/novo">
              <Button>Criar formulário</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {paginados.map((f, i) => (
              <Reveal key={f.id} index={i} className="min-w-0">
                <Link
                  to={`/formulario/${f.id}`}
                  className="glass glass-hover block h-full p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-[12.5px] font-semibold">
                      {f.infoGerais.localAtividade || 'Atividade sem nome'}
                    </p>
                    <StatusBadge status={f.status} className="shrink-0" />
                  </div>
                  <p className="mt-2 truncate text-[11.5px] text-txt-dim">
                    {f.infoGerais.numeroSolicitacao ? `Nº ${f.infoGerais.numeroSolicitacao}` : 'Sem número'}
                  </p>
                  <p className="truncate text-[11.5px] text-txt-dim">
                    Responsável: {f.infoGerais.responsavel || 'não informado'}
                  </p>
                  <p className="mt-2 truncate text-[10.5px] text-txt-faint">
                    {f.infoGerais.lotacao ? `${f.infoGerais.lotacao} · ` : ''}
                    {formatarDataHora(f.updatedAt)}
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
          <Pagination page={pagina} totalPages={totalPaginas} onChange={setPagina} />
        </>
      )}
    </div>
  )
}
