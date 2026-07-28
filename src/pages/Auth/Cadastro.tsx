import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from './AuthLayout'
import { Input, Select } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { useAuthStore } from '../../store/authStore'
import { useCargosStore } from '../../store/cargosStore'
import { toast } from '../../store/toastStore'
import { formatarCPF, validarCPF, validarEmail, validarSenhaForte } from '../../lib/validation'
import { PROJETOS_PADRAO } from '../../lib/types'

export function Cadastro() {
  const cadastrar = useAuthStore((s) => s.cadastrar)
  const { cargos, carregar } = useCargosStore()
  const navigate = useNavigate()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [cpf, setCpf] = useState('')
  const [matricula, setMatricula] = useState('')
  const [cargo, setCargo] = useState('')
  const [projeto, setProjeto] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erros, setErros] = useState<Record<string, string>>({})
  const [erroGeral, setErroGeral] = useState('')
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    void carregar()
  }, [carregar])

  function validar() {
    const novosErros: Record<string, string> = {}
    if (!nome.trim()) novosErros.nome = 'Informe o nome completo.'
    if (!validarEmail(email)) novosErros.email = 'Informe um e-mail válido.'
    if (!validarCPF(cpf)) novosErros.cpf = 'Informe um CPF válido.'
    if (!matricula.trim()) novosErros.matricula = 'Informe a matrícula.'
    if (!cargo) novosErros.cargo = 'Selecione o cargo.'
    if (!projeto) novosErros.projeto = 'Selecione o projeto.'
    if (!validarSenhaForte(senha)) novosErros.senha = 'A senha deve ter ao menos 6 caracteres.'
    if (confirmarSenha !== senha) novosErros.confirmarSenha = 'As senhas não coincidem.'
    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErroGeral('')
    if (!validar()) return
    setCarregando(true)
    try {
      await cadastrar({ nome, email, cpf, matricula, cargo, projeto, senha })
      toast({ variant: 'success', title: 'Conta criada com sucesso' })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setErroGeral(err instanceof Error ? err.message : 'Não foi possível criar a conta.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <AuthLayout title="Criar conta" subtitle="Preencha seus dados para acessar o sistema">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input label="Nome" required value={nome} onChange={(e) => setNome(e.target.value)} error={erros.nome} placeholder="Nome completo" />
        <Input
          label="E-mail"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={erros.email}
          placeholder="seuemail@empresa.com"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="CPF"
            required
            value={cpf}
            onChange={(e) => setCpf(formatarCPF(e.target.value))}
            error={erros.cpf}
            placeholder="000.000.000-00"
            inputMode="numeric"
          />
          <Input
            label="Matrícula"
            required
            value={matricula}
            onChange={(e) => setMatricula(e.target.value)}
            error={erros.matricula}
            placeholder="Ex.: 00123"
          />
        </div>
        <Select label="Cargo" required value={cargo} onChange={(e) => setCargo(e.target.value)} error={erros.cargo}>
          <option value="">Selecione um cargo</option>
          {cargos
            .filter((c) => c.status === 'ativo')
            .map((c) => (
              <option key={c.id} value={c.nome}>
                {c.nome}
              </option>
            ))}
        </Select>
        <Select label="Projeto" required value={projeto} onChange={(e) => setProjeto(e.target.value)} error={erros.projeto}>
          <option value="">Selecione um projeto</option>
          {PROJETOS_PADRAO.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Senha"
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            error={erros.senha}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
          />
          <Input
            label="Confirmar senha"
            type="password"
            required
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            error={erros.confirmarSenha}
            placeholder="Repita a senha"
            autoComplete="new-password"
          />
        </div>

        {erroGeral && (
          <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300" role="alert">
            {erroGeral}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" loading={carregando}>
          Criar conta
        </Button>

        <p className="text-center text-sm text-ink-muted">
          Já possui uma conta?{' '}
          <Link to="/login" className="font-medium text-brand-400 hover:text-brand-300">
            Voltar para Login
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
