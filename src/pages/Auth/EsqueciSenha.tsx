import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from './AuthLayout'
import { Input } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { Stepper } from '../../components/ui/Stepper'
import { toast } from '../../store/toastStore'
import { redefinirSenha, solicitarRecuperacaoSenha, validarCodigoRecuperacao } from '../../lib/auth'
import { validarSenhaForte } from '../../lib/validation'

const STEPS = [{ label: 'E-mail' }, { label: 'Código' }, { label: 'Nova senha' }]

export function EsqueciSenha() {
  const navigate = useNavigate()
  const [etapa, setEtapa] = useState(0)
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function enviarCodigo(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      const codigoGerado = await solicitarRecuperacaoSenha(email)
      toast({
        variant: 'info',
        title: 'Código de verificação enviado',
        description: `Ambiente local: use o código ${codigoGerado}`,
      })
      setEtapa(1)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível enviar o código.')
    } finally {
      setCarregando(false)
    }
  }

  async function validarCodigo(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      await validarCodigoRecuperacao(email, codigo)
      setEtapa(2)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Código inválido.')
    } finally {
      setCarregando(false)
    }
  }

  async function finalizar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!validarSenhaForte(novaSenha)) {
      setErro('A senha deve ter ao menos 6 caracteres.')
      return
    }
    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }
    setCarregando(true)
    try {
      await redefinirSenha(email, codigo, novaSenha)
      toast({ variant: 'success', title: 'Senha redefinida com sucesso' })
      navigate('/login', { replace: true })
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível redefinir a senha.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <AuthLayout title="Recuperar senha" subtitle="Siga as etapas para redefinir sua senha">
      <div className="mb-6">
        <Stepper steps={STEPS} current={etapa} />
      </div>

      {erro && (
        <p className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300" role="alert">
          {erro}
        </p>
      )}

      {etapa === 0 && (
        <form onSubmit={enviarCodigo} className="space-y-4" noValidate>
          <Input
            label="E-mail"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seuemail@empresa.com"
          />
          <Button type="submit" className="w-full" size="lg" loading={carregando}>
            Enviar código
          </Button>
        </form>
      )}

      {etapa === 1 && (
        <form onSubmit={validarCodigo} className="space-y-4" noValidate>
          <Input
            label="Código de verificação"
            required
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="000000"
            inputMode="numeric"
            maxLength={6}
          />
          <Button type="submit" className="w-full" size="lg" loading={carregando}>
            Validar código
          </Button>
        </form>
      )}

      {etapa === 2 && (
        <form onSubmit={finalizar} className="space-y-4" noValidate>
          <Input
            label="Nova senha"
            type="password"
            required
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
          <Input
            label="Confirmar senha"
            type="password"
            required
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            placeholder="Repita a senha"
          />
          <Button type="submit" className="w-full" size="lg" loading={carregando}>
            Finalizar
          </Button>
        </form>
      )}

      <p className="mt-5 text-center text-sm text-ink-muted">
        <Link to="/login" className="font-medium text-brand-400 hover:text-brand-300">
          Voltar para Login
        </Link>
      </p>
    </AuthLayout>
  )
}
