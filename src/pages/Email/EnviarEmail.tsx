import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useUsersStore } from '../../store/usersStore'
import { useCargosStore } from '../../store/cargosStore'
import { useEmailStore } from '../../store/emailStore'
import { useEmailDraftStore } from '../../store/emailDraftStore'
import { useFormsStore } from '../../store/formsStore'
import { useAuthStore } from '../../store/authStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Input, Select, Textarea } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Checkbox } from '../../components/ui/Checkbox'
import { Dialog } from '../../components/ui/Dialog'
import { toast } from '../../store/toastStore'
import type { FormularioAvaliacao } from '../../lib/types'
import { blobParaDataUrl, nomeArquivoPdf } from '../../lib/pdf'

interface Anexo {
  id: string
  nome: string
  dataUrl: string
}

function ChipsEmail({
  label,
  valores,
  onChange,
  placeholder,
}: {
  label: string
  valores: string[]
  onChange: (valores: string[]) => void
  placeholder?: string
}) {
  const [texto, setTexto] = useState('')

  function adicionar() {
    const email = texto.trim().replace(/,$/, '')
    if (email && !valores.includes(email)) onChange([...valores, email])
    setTexto('')
  }

  return (
    <div>
      <label className="text-sm font-semibold text-ink">{label}</label>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 rounded-xl border border-border-light bg-surface-2 p-2">
        {valores.map((v) => (
          <span key={v} className="flex items-center gap-1 rounded-full bg-brand-500/15 px-2.5 py-1 text-xs font-medium text-brand-300">
            {v}
            <button type="button" onClick={() => onChange(valores.filter((x) => x !== v))} aria-label={`Remover ${v}`}>
              ✕
            </button>
          </span>
        ))}
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              adicionar()
            }
          }}
          onBlur={adicionar}
          placeholder={placeholder}
          className="min-w-[10rem] flex-1 bg-transparent px-1 py-1 text-sm text-ink placeholder:text-ink-subtle focus:outline-none"
        />
      </div>
    </div>
  )
}

export function EnviarEmail() {
  const [searchParams] = useSearchParams()
  const formularioId = searchParams.get('formularioId')

  const { usuarios, carregar: carregarUsuarios } = useUsersStore()
  const { cargos, carregar: carregarCargos } = useCargosStore()
  const { modelos, enviados, carregarModelos, carregarEnviados, enviar } = useEmailStore()
  const { rascunho, limpar: limparRascunho } = useEmailDraftStore()
  const { obter: obterFormulario } = useFormsStore()
  const usuarioLogado = useAuthStore((s) => s.usuario)

  const [buscaUsuario, setBuscaUsuario] = useState('')
  const [filtroCargo, setFiltroCargo] = useState('')
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [destinatariosManuais, setDestinatariosManuais] = useState<string[]>([])
  const [cc, setCc] = useState<string[]>([])
  const [cco, setCco] = useState<string[]>([])
  const [assunto, setAssunto] = useState('')
  const [corpo, setCorpo] = useState('')
  const [modeloSelecionado, setModeloSelecionado] = useState('')
  const [anexos, setAnexos] = useState<Anexo[]>([])
  const [anexarPdf, setAnexarPdf] = useState(Boolean(formularioId))
  const [anexarImagens, setAnexarImagens] = useState(false)
  const [formulario, setFormulario] = useState<FormularioAvaliacao | null>(null)
  const [previaAberta, setPreviaAberta] = useState(false)
  const anexoInputRef = useRef<HTMLInputElement>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    void carregarUsuarios()
    void carregarCargos()
    void carregarModelos()
    void carregarEnviados()
  }, [carregarUsuarios, carregarCargos, carregarModelos, carregarEnviados])

  useEffect(() => {
    if (!formularioId) return
    void obterFormulario(formularioId).then((f) => setFormulario(f ?? null))
  }, [formularioId, obterFormulario])

  useEffect(() => {
    if (!rascunho) return
    setDestinatariosManuais(rascunho.destinatarios)
    setAssunto(rascunho.assunto)
    setCorpo(rascunho.corpo)
    limparRascunho()
  }, [rascunho, limparRascunho])

  const usuariosFiltrados = useMemo(() => {
    const termo = buscaUsuario.trim().toLowerCase()
    return usuarios.filter((u) => {
      const matchBusca = !termo || u.nome.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo)
      const matchCargo = !filtroCargo || u.cargo === filtroCargo
      return matchBusca && matchCargo && u.status === 'ativo'
    })
  }, [usuarios, buscaUsuario, filtroCargo])

  const todosSelecionados = usuariosFiltrados.length > 0 && usuariosFiltrados.every((u) => selecionados.has(u.email))

  function alternarUsuario(email: string) {
    setSelecionados((s) => {
      const novo = new Set(s)
      if (novo.has(email)) novo.delete(email)
      else novo.add(email)
      return novo
    })
  }

  function selecionarTodos(marcar: boolean) {
    setSelecionados((s) => {
      const novo = new Set(s)
      for (const u of usuariosFiltrados) {
        if (marcar) novo.add(u.email)
        else novo.delete(u.email)
      }
      return novo
    })
  }

  function selecionarPorCargo(cargoNome: string) {
    if (!cargoNome) return
    setSelecionados((s) => {
      const novo = new Set(s)
      usuarios.filter((u) => u.cargo === cargoNome && u.status === 'ativo').forEach((u) => novo.add(u.email))
      return novo
    })
  }

  function aplicarModelo(id: string) {
    setModeloSelecionado(id)
    const modelo = modelos.find((m) => m.id === id)
    if (modelo) {
      setAssunto(modelo.assunto)
      setCorpo(modelo.corpo)
    }
  }

  async function handleAnexos(files: FileList | null) {
    if (!files) return
    const novos: Anexo[] = []
    for (const file of Array.from(files)) {
      const dataUrl = await blobParaDataUrl(file)
      novos.push({ id: crypto.randomUUID(), nome: file.name, dataUrl })
    }
    setAnexos((a) => [...a, ...novos])
  }

  const destinatariosFinais = useMemo(() => Array.from(new Set([...selecionados, ...destinatariosManuais])), [selecionados, destinatariosManuais])

  async function montarAnexosParaEnvio(): Promise<{ nome: string }[]> {
    const lista = anexos.map((a) => ({ nome: a.nome }))
    if (anexarPdf && formulario) {
      lista.push({ nome: nomeArquivoPdf(formulario) })
    }
    if (anexarImagens && formulario) {
      formulario.imagens.forEach((img) => lista.push({ nome: img.nome }))
    }
    return lista
  }

  async function enviarEmail() {
    if (destinatariosFinais.length === 0) {
      toast({ variant: 'warning', title: 'Selecione ao menos um destinatário' })
      return
    }
    if (!assunto.trim()) {
      toast({ variant: 'warning', title: 'Informe o assunto' })
      return
    }
    setEnviando(true)
    try {
      const anexosFinais = await montarAnexosParaEnvio()
      await enviar(
        {
          destinatarios: destinatariosFinais,
          cc,
          cco,
          assunto,
          corpo,
          anexos: anexosFinais,
          formularioId: formularioId ?? undefined,
          enviadoPorId: usuarioLogado?.id ?? '',
          enviadoPorNome: usuarioLogado?.nome ?? '',
        },
        usuarioLogado,
      )
      toast({ variant: 'success', title: 'E-mail enviado com sucesso' })
      setPreviaAberta(false)
      setSelecionados(new Set())
      setDestinatariosManuais([])
      setCc([])
      setCco([])
      setAssunto('')
      setCorpo('')
      setAnexos([])
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-ink">E-mails</h2>
          <p className="text-sm text-ink-muted">Componha e envie e-mails para usuários do sistema.</p>
        </div>
        <Link to="/emails/modelos">
          <Button variant="outline">Gerenciar modelos</Button>
        </Link>
      </div>

      {formulario && (
        <Card>
          <CardContent className="flex items-center gap-2 p-4 text-sm text-ink-muted">
            <Badge tone="brand">Vinculado</Badge>
            Formulário: {formulario.infoGerais.localAtividade || 'Atividade sem nome'} · Nº {formulario.infoGerais.numeroSolicitacao || '—'}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Destinatários</CardTitle>
            <CardDescription>Pesquise, filtre por cargo ou selecione individualmente.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
            <Input placeholder="Pesquisar usuários por nome ou e-mail" value={buscaUsuario} onChange={(e) => setBuscaUsuario(e.target.value)} />
            <Select
              value={filtroCargo}
              onChange={(e) => {
                setFiltroCargo(e.target.value)
                selecionarPorCargo(e.target.value)
              }}
            >
              <option value="">Selecionar por cargo</option>
              {cargos.map((c) => (
                <option key={c.id} value={c.nome}>
                  {c.nome}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
            <Checkbox checked={todosSelecionados} onChange={selecionarTodos} label="Selecionar todos" />
            <span className="text-xs text-ink-subtle">{selecionados.size} usuário(s) selecionado(s)</span>
          </div>

          <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-border p-1.5">
            {usuariosFiltrados.length === 0 ? (
              <p className="p-3 text-sm text-ink-muted">Nenhum usuário encontrado.</p>
            ) : (
              usuariosFiltrados.map((u) => (
                <label key={u.id} className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 hover:bg-surface-2">
                  <Checkbox checked={selecionados.has(u.email)} onChange={() => alternarUsuario(u.email)} label={`${u.nome} · ${u.email}`} />
                  <Badge tone="outline">{u.cargo || '—'}</Badge>
                </label>
              ))
            )}
          </div>

          <ChipsEmail
            label="Adicionar destinatário manualmente"
            valores={destinatariosManuais}
            onChange={setDestinatariosManuais}
            placeholder="email@exemplo.com e pressione Enter"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
          <ChipsEmail label="CC" valores={cc} onChange={setCc} placeholder="email@exemplo.com" />
          <ChipsEmail label="CCO" valores={cco} onChange={setCco} placeholder="email@exemplo.com" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mensagem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {modelos.length > 0 && (
            <Select label="Utilizar modelo de e-mail" value={modeloSelecionado} onChange={(e) => aplicarModelo(e.target.value)}>
              <option value="">Nenhum modelo</option>
              {modelos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </Select>
          )}
          <Input label="Assunto" required value={assunto} onChange={(e) => setAssunto(e.target.value)} />
          <Textarea label="Mensagem" value={corpo} onChange={(e) => setCorpo(e.target.value)} className="min-h-48" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Anexos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" size="sm" type="button" onClick={() => anexoInputRef.current?.click()}>
            Anexar arquivos
          </Button>
          <input ref={anexoInputRef} type="file" multiple className="hidden" onChange={(e) => handleAnexos(e.target.files)} />

          {anexos.length > 0 && (
            <ul className="space-y-1.5">
              {anexos.map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-1.5 text-sm text-ink-muted">
                  {a.nome}
                  <button type="button" onClick={() => setAnexos((list) => list.filter((x) => x.id !== a.id))} aria-label={`Remover ${a.nome}`}>
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          {formulario && (
            <div className="space-y-2 border-t border-border pt-3">
              <Checkbox checked={anexarPdf} onChange={setAnexarPdf} label={`Anexar automaticamente o PDF do formulário (${nomeArquivoPdf(formulario)})`} />
              <Checkbox
                checked={anexarImagens}
                onChange={setAnexarImagens}
                label={`Anexar automaticamente as imagens do formulário (${formulario.imagens.length})`}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setPreviaAberta(true)}>
          Visualizar prévia
        </Button>
        <Button size="lg" onClick={enviarEmail} loading={enviando}>
          Enviar
        </Button>
      </div>

      {enviados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de envios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {enviados.slice(0, 6).map((e) => (
              <div key={e.id} className="rounded-xl border border-border p-3 text-sm">
                <p className="font-medium text-ink">{e.assunto}</p>
                <p className="text-xs text-ink-subtle">
                  Para: {e.destinatarios.join(', ')} · {new Date(e.criadoEm).toLocaleString('pt-BR')}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog
        open={previaAberta}
        onClose={() => setPreviaAberta(false)}
        title="Prévia do e-mail"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPreviaAberta(false)}>
              Fechar
            </Button>
            <Button onClick={enviarEmail} loading={enviando}>
              Confirmar e enviar
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <p>
            <span className="font-semibold text-ink">Para:</span> <span className="text-ink-muted">{destinatariosFinais.join(', ') || '—'}</span>
          </p>
          {cc.length > 0 && (
            <p>
              <span className="font-semibold text-ink">CC:</span> <span className="text-ink-muted">{cc.join(', ')}</span>
            </p>
          )}
          {cco.length > 0 && (
            <p>
              <span className="font-semibold text-ink">CCO:</span> <span className="text-ink-muted">{cco.join(', ')}</span>
            </p>
          )}
          <p>
            <span className="font-semibold text-ink">Assunto:</span> <span className="text-ink-muted">{assunto || '—'}</span>
          </p>
          <div className="rounded-xl border border-border bg-surface-2 p-3 whitespace-pre-wrap text-ink-muted">{corpo || '—'}</div>
          {(anexos.length > 0 || anexarPdf || anexarImagens) && (
            <p className="text-xs text-ink-subtle">
              Anexos: {anexos.map((a) => a.nome).join(', ')}
              {anexarPdf && formulario ? `${anexos.length > 0 ? ', ' : ''}${nomeArquivoPdf(formulario)}` : ''}
              {anexarImagens && formulario ? ` +${formulario.imagens.length} imagem(ns)` : ''}
            </p>
          )}
        </div>
      </Dialog>
    </div>
  )
}
