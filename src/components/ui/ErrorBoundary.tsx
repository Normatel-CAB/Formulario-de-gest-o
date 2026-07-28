import { Component, type ReactNode } from 'react'
import { Button } from './Button'

interface Props {
  children: ReactNode
}

interface State {
  erro: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { erro: null }

  static getDerivedStateFromError(erro: Error): State {
    return { erro }
  }

  componentDidCatch(erro: Error) {
    console.error('Erro de renderização capturado:', erro)
  }

  private recarregar = () => {
    this.setState({ erro: null })
  }

  render() {
    if (this.state.erro) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="max-w-md space-y-2">
            <h2 className="text-lg font-bold text-ink">Algo deu errado ao carregar esta página</h2>
            <p className="text-sm text-ink-muted">Tente novamente. Se o problema persistir, recarregue o aplicativo.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={this.recarregar}>
              Tentar novamente
            </Button>
            <Button onClick={() => window.location.reload()}>Recarregar</Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
