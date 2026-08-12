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
import {
  baixarZipFotos,
  baixarZipFotosLote,
  nomeArquivoFotos,
  nomeArquivoLote,
  resumoLote,
  totalFotos,
} from '../lib/exportarFotos'
import { toast } from '../store/toastStore'
import type { FormStatus, FormularioAvaliacao } from '../lib/types'
import { PROJETOS_PADRAO, STATUS_LABELS } from '../lib/types'
import { formatarDataHora } from '../lib/format'

const POR_PAGINA = 9

function IconeFotos() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10" r="1.5" />
      <path d="M4 17l5-5 3.5 3.5L16 12l4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Gera o .zip das fotos e avisa o resultado; erro aqui não pode passar batido. */
function exportarFotos(formulario: FormularioAvaliacao) {
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

export function Historico() {
  const { formularios, loading, carregar } = useFormsStore()
  const usuario = useAuthStore((s) => s.usuario)
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState<FormStatus | 'todos'>('todos')
  const [filtroProjeto, setFiltroProjeto] = useState('')
  const [de, setDe] = useState('')
  const [ate, setAte] = useState('')
  const [pagina, setPagina] = useState(1)
  const [exportando, setExportando] = useState(false)

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
      // A data da avaliação e os limites do filtro são todos "YYYY-MM-DD", então
      // comparar como texto já dá a ordem certa: nada de fuso horário no meio.
      // Ficha sem data preenchida usa a data de criação como referência.
      const dataFicha = f.infoGerais.dataAvaliacao || (f.createdAt ?? '').slice(0, 10)
      const matchDe = !de || (dataFicha !== '' && dataFicha >= de)
      const matchAte = !ate || (dataFicha !== '' && dataFicha <= ate)
      return matchStatus && matchProjeto && matchBusca && matchDe && matchAte
    })
  }, [visiveis, busca, status, filtroProjeto, ehAdministrador, de, ate])

  const lote = useMemo(() => resumoLote(filtrados), [filtrados])

  useEffect(() => {
    setPagina(1)
  }, [busca, status, filtroProjeto, de, ate])

  /**
   * Exporta as fotos de todas as fichas filtradas num único zip.
   *
   * Montar o zip trava a thread por alguns instantes com muitas fotos, então o
   * botão entra em estado de carregando antes: sem isso a interface parece
   * congelada e a pessoa clica de novo.
   */
  function exportarLote() {
    setExportando(true)
    window.setTimeout(() => {
      try {
        baixarZipFotosLote(filtrados, de || undefined, ate || undefined)
        toast({
          variant: 'success',
          title: `${lote.fotos} foto(s) exportada(s)`,
          description: `Arquivo ${nomeArquivoLote(de || undefined, ate || undefined)} salvo nos downloads.`,
        })
      } catch (err) {
        toast({
          variant: 'warning',
          title: 'Nada para exportar',
          description: err instanceof Error ? err.message : undefined,
        })
      } finally {
        setExportando(false)
      }
    }, 30)
  }

  function limparPeriodo() {
    setDe('')
    setAte('')
  }

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

      {/* ---------------- Período e exportação em lote ---------------- */}
      <Card>
        <CardContent className="grid gap-3 p-4 lg:grid-cols-[180px_180px_auto_1fr]">
          <Input
            label="Data da avaliação: de"
            type="date"
            value={de}
            max={ate || undefined}
            onChange={(e) => setDe(e.target.value)}
          />
          <Input
            label="até"
            type="date"
            value={ate}
            min={de || undefined}
            onChange={(e) => setAte(e.target.value)}
          />
          <div className="flex items-end">
            <Button variant="ghost" size="sm" onClick={limparPeriodo} disabled={!de && !ate}>
              Limpar período
            </Button>
          </div>

          <div className="flex flex-col justify-end gap-2 sm:flex-row sm:items-end sm:justify-end">
            <p className="text-[11px] leading-tight text-txt-faint sm:self-center sm:text-right">
              {filtrados.length} ficha(s) no filtro
              <br className="hidden sm:block" />{' '}
              {lote.fichas > 0 ? `${lote.fotos} foto(s) em ${lote.fichas} ficha(s)` : 'nenhuma com foto'}
            </p>
            <Button onClick={exportarLote} loading={exportando} disabled={lote.fichas === 0}>
              <IconeFotos />
              Exportar fotos do período
            </Button>
          </div>
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
            {paginados.map((f, i) => {
              const fotos = totalFotos(f)
              return (
                <Reveal key={f.id} index={i} className="min-w-0">
                  {/* O cartão não é mais um <Link> inteiro: o botão de exportar
                      precisa viver dentro dele, e botão dentro de link é HTML
                      inválido (o clique vira navegação). O link cobre só o
                      texto; as ações ficam no rodapé. */}
                  <div className="glass glass-hover flex h-full flex-col p-4">
                    <Link to={`/formulario/${f.id}`} className="block min-w-0">
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

                    <div className="mt-3 flex items-center gap-2 border-t border-hairline pt-3">
                      <span className="min-w-0 flex-1 truncate text-[10.5px] text-txt-faint">
                        {fotos > 0 ? `${fotos} foto(s)` : 'Sem fotos'}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={fotos === 0}
                        onClick={() => exportarFotos(f)}
                        title={
                          fotos === 0
                            ? 'Esta ficha não tem fotos anexadas'
                            : `Baixar ${nomeArquivoFotos(f)}`
                        }
                      >
                        <IconeFotos />
                        Exportar fotos
                      </Button>
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>
          <Pagination page={pagina} totalPages={totalPaginas} onChange={setPagina} />
        </>
      )}
    </div>
  )
}
