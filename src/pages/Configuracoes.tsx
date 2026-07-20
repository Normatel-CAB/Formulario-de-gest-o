import { useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Input } from '../components/ui/Field'
import { Button } from '../components/ui/Button'
import { useSettingsStore } from '../store/settingsStore'
import { isSupabaseConfigured } from '../lib/supabase'
import { toast } from '../store/toastStore'

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function Configuracoes() {
  const { logoDataUrl, empresaNome, setLogo, setEmpresaNome } = useSettingsStore()
  const [nome, setNome] = useState(empresaNome)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await fileToDataUrl(file)
    await setLogo(dataUrl)
    toast({ variant: 'success', title: 'Logo atualizada' })
  }

  async function salvarNome(e: React.FormEvent) {
    e.preventDefault()
    await setEmpresaNome(nome)
    toast({ variant: 'success', title: 'Nome da empresa atualizado' })
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h2 className="text-xl font-bold text-ink">Configurações</h2>
        <p className="text-sm text-ink-muted">Personalize a identidade visual e veja o status da integração com o banco de dados.</p>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Identidade da empresa</CardTitle>
            <CardDescription>Logo e nome exibidos no cabeçalho do sistema.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-border-light bg-surface-2"
            >
              {logoDataUrl ? (
                <img src={logoDataUrl} alt="Logo da empresa" className="h-full w-full object-contain" />
              ) : (
                <svg className="h-6 w-6 text-ink-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 16.5V19a2 2 0 002 2h12a2 2 0 002-2v-2.5M7 9l5-5 5 5M12 4v13" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <div>
              <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                Alterar logo
              </Button>
              <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
            </div>
          </div>

          <form onSubmit={salvarNome} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Input label="Nome da empresa" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Minha Empresa Ltda." className="flex-1" />
            <Button type="submit">Salvar</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integração com o banco de dados</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-ink-muted">
            Status do Supabase:{' '}
            <span className={isSupabaseConfigured ? 'font-semibold text-brand-400' : 'font-semibold text-amber-400'}>
              {isSupabaseConfigured ? 'Conectado' : 'Não configurado (modo offline local)'}
            </span>
          </p>
          <p className="mt-1 text-xs text-ink-subtle">
            Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para sincronizar os formulários com a nuvem.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
