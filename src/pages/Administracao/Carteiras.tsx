import { useEffect, useState } from 'react'
import { useCarteirasStore, type Carteira } from '../../store/carteirasStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Field'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Reveal } from '../../components/ui/Reveal'
import { toast } from '../../store/toastStore'

function avisarErro(titulo: string, err: unknown) {
  toast({ variant: 'error', title: titulo, description: err instanceof Error ? err.message : undefined })
}

export function Carteiras() {
  const { carteiras, carregar, criar, atualizar, remover } = useCarteirasStore()
  const [nova, setNova] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [editando, setEditando] = useState<{ id: string; nome: string } | null>(null)

  useEffect(() => {
    void carregar()
  }, [carregar])

  async function adicionar(e: React.FormEvent) {
    e.preventDefault()
    if (!nova.trim()) return
    setSalvando(true)
    try {
      await criar(nova)
      setNova('')
      toast({ variant: 'success', title: 'Carteira adicionada' })
    } catch (err) {
      avisarErro('Não foi possível adicionar', err)
    } finally {
      setSalvando(false)
    }
  }

  async function renomear() {
    if (!editando || !editando.nome.trim()) return
    try {
      await atualizar(editando.id, { nome: editando.nome.trim() })
      setEditando(null)
    } catch (err) {
      avisarErro('Não foi possível renomear', err)
    }
  }

  async function alternar(c: Carteira) {
    try {
      await atualizar(c.id, { ativo: !c.ativo })
    } catch (err) {
      avisarErro('Não foi possível alterar', err)
    }
  }

  async function excluir(c: Carteira) {
    if (!window.confirm(`Excluir a carteira "${c.nome}"? Fichas que já usam esse nome continuam com ele.`)) return
    try {
      await remover(c.id)
    } catch (err) {
      avisarErro('Não foi possível excluir', err)
    }
  }

  return (
    <div className="space-y-5">
      <Reveal index={0}>
        <div>
          <span className="chip">Área administrativa</span>
          <h1 className="mt-2 text-[22px] font-bold tracking-[-0.025em] sm:text-[27px]">Carteiras</h1>
          <p className="mt-1 text-[13px] text-txt-dim">Opções da lista de Carteira na ficha. Carteira desativada some da lista mas continua nas fichas antigas.</p>
        </div>
      </Reveal>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Nova carteira</CardTitle>
            <CardDescription>Digite o nome como deve aparecer na ficha.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={adicionar} className="flex gap-2">
            <Input value={nova} onChange={(e) => setNova(e.target.value)} placeholder="Nome da carteira" aria-label="Nome da carteira" />
            <Button type="submit" loading={salvando} disabled={!nova.trim()} className="shrink-0">
              Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Carteiras cadastradas ({carteiras.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {carteiras.length === 0 ? (
            <EmptyState title="Nenhuma carteira" description="Adicione a primeira acima. Enquanto a lista estiver vazia, a ficha não pede carteira." />
          ) : (
            <div className="space-y-2">
              {carteiras.map((c) => (
                <div key={c.id} className="flex flex-col gap-2 rounded-md border border-hairline bg-surface-2 p-3 sm:flex-row sm:items-center">
                  {editando?.id === c.id ? (
                    <Input
                      autoFocus
                      value={editando.nome}
                      onChange={(e) => setEditando({ id: c.id, nome: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void renomear()
                        if (e.key === 'Escape') setEditando(null)
                      }}
                      aria-label="Novo nome"
                    />
                  ) : (
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <p className="truncate text-[12.5px] font-semibold">{c.nome}</p>
                      {!c.ativo && <Badge tone="slate">Desativada</Badge>}
                    </div>
                  )}
                  <div className="flex shrink-0 gap-2">
                    {editando?.id === c.id ? (
                      <>
                        <Button size="sm" onClick={() => void renomear()}>
                          Salvar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditando(null)}>
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setEditando({ id: c.id, nome: c.nome })}>
                          Renomear
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => void alternar(c)}>
                          {c.ativo ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => void excluir(c)}>
                          Excluir
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
