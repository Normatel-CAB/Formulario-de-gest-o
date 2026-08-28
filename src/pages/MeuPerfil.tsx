import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Input } from '../components/ui/Field'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { useAuthStore } from '../store/authStore'
import { salvarUsuarioLocal } from '../lib/db'
import { alterarSenha, AuthError } from '../lib/auth'
import { toast } from '../store/toastStore'
import { PAPEL_LABELS } from '../lib/types'
import { formatarDataHora } from '../lib/format'
import { validarSenhaForte } from '../lib/validation'

export function MeuPerfil() {
  const { usuario, definirUsuario } = useAuthStore()
  const [nome, setNome] = useState(usuario?.nome ?? '')
  const [salvandoPerfil, setSalvandoPerfil] = useState(false)

  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erroSenha, setErroSenha] = useState('')
  const [alterandoSenha, setAlterandoSenha] = useState(false)

  if (!usuario) return null

  async function salvarPerfil(e: React.FormEvent) {
    e.preventDefault()
    if (!usuario) return
    setSalvandoPerfil(true)
    try {
      const atualizado = { ...usuario, nome }
      await salvarUsuarioLocal(atualizado)
      definirUsuario(atualizado)
      toast({ variant: 'success', title: 'Perfil atualizado' })
    } finally {
      setSalvandoPerfil(false)
    }
  }

  async function trocarSenha(e: React.FormEvent) {
    e.preventDefault()
    if (!usuario) return
    setErroSenha('')
    if (!validarSenhaForte(novaSenha)) {
      setErroSenha('A nova senha deve ter ao menos 6 caracteres.')
      return
    }
    if (novaSenha !== confirmarSenha) {
      setErroSenha('As senhas não coincidem.')
      return
    }
    setAlterandoSenha(true)
    try {
      await alterarSenha(usuario.id, senhaAtual, novaSenha)
      toast({ variant: 'success', title: 'Senha alterada com sucesso' })
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
    } catch (err) {
      setErroSenha(err instanceof AuthError ? err.message : 'Não foi possível alterar a senha.')
    } finally {
      setAlterandoSenha(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h2 className="text-[22px] font-bold tracking-[-0.025em] text-txt sm:text-[27px]">Meu Perfil</h2>
        <p className="text-[13px] text-txt-dim">Gerencie suas informações pessoais e credenciais de acesso.</p>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Dados pessoais</CardTitle>
            <CardDescription>Informações associadas à sua conta.</CardDescription>
          </div>
          <Badge tone="brand">{usuario.cargoNome || PAPEL_LABELS[usuario.papel]}</Badge>
        </CardHeader>
        <CardContent>
          <form onSubmit={salvarPerfil} className="grid gap-4 sm:grid-cols-2">
            <Input label="Nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
            <Input label="E-mail" value={usuario.email} disabled />
            <Input label="CPF" value={usuario.cpf || 'Não informado'} disabled />
            <Input label="Matrícula" value={usuario.matricula || 'Não informada'} disabled />
            <Input label="Cargo" value={usuario.cargoNome || usuario.cargo || 'Não informado'} disabled />
            <Input label="Último acesso" value={usuario.ultimoAcesso ? formatarDataHora(usuario.ultimoAcesso) : 'Nunca acessou'} disabled />
            <div className="sm:col-span-2">
              <Button type="submit" loading={salvandoPerfil}>
                Salvar alterações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alterar senha</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={trocarSenha} className="grid gap-4 md:grid-cols-3">
            <Input
              label="Senha atual"
              type="password"
              required
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
            />
            <Input label="Nova senha" type="password" required value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
            <Input
              label="Confirmar nova senha"
              type="password"
              required
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
            />
            {erroSenha && (
              <p className="rounded-lg border border-viz-red/30 bg-viz-red/10 px-3 py-2 text-sm text-viz-red sm:col-span-3" role="alert">
                {erroSenha}
              </p>
            )}
            <div className="sm:col-span-3">
              <Button type="submit" variant="outline" loading={alterandoSenha}>
                Atualizar senha
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
