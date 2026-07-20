import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFormsStore } from '../store/formsStore'
import { Card, CardContent } from '../components/ui/Card'
import { Input, Select } from '../components/ui/Field'
import { StatusBadge } from '../components/ui/StatusBadge'
import { EmptyState } from '../components/ui/EmptyState'
import { SkeletonCard } from '../components/ui/Skeleton'
import { Button } from '../components/ui/Button'
import type { FormStatus } from '../lib/types'
import { STATUS_LABELS } from '../lib/types'
import { formatarDataHora } from '../lib/format'

export function Historico() {
  const { formularios, loading, carregar } = useFormsStore()
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState<FormStatus | 'todos'>('todos')

  useEffect(() => {
    void carregar()
  }, [carregar])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return formularios.filter((f) => {
      const matchStatus = status === 'todos' || f.status === status
      const matchBusca =
        !termo ||
        f.infoGerais.responsavel.toLowerCase().includes(termo) ||
        f.infoGerais.localAtividade.toLowerCase().includes(termo) ||
        f.infoGerais.numeroSolicitacao.toLowerCase().includes(termo)
      return matchStatus && matchBusca
    })
  }, [formularios, busca, status])

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h2 className="text-xl font-bold text-brand-950">Histórico de Formulários</h2>
        <p className="text-sm text-brand-700/70">Pesquise, filtre e acompanhe o status de todas as fichas técnicas.</p>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_220px]">
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
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((f) => (
            <Link
              key={f.id}
              to={`/formulario/${f.id}`}
              className="animate-slide-up rounded-2xl border border-brand-100 bg-white p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-brand-950 line-clamp-1">
                  {f.infoGerais.localAtividade || 'Atividade sem nome'}
                </p>
                <StatusBadge status={f.status} />
              </div>
              <p className="mt-2 text-xs text-brand-500">Nº {f.infoGerais.numeroSolicitacao || '—'}</p>
              <p className="text-xs text-brand-500">Responsável: {f.infoGerais.responsavel || '—'}</p>
              <p className="mt-2 text-xs text-brand-400">{formatarDataHora(f.updatedAt)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
