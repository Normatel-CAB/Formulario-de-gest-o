import type { FormularioAvaliacao, NecessidadesExecucao } from './types'

export function criarNecessidadesVazias(): NecessidadesExecucao {
  return {
    pemt: { necessario: false },
    limpezaArea: { necessario: false },
    comunicacoesOperantes: { necessario: false },
    visitaTecnica: { necessario: false },
    montagemAndaime: { necessario: false },
    visitaSMS: { necessario: false, tecnicoId: '', tecnicoNome: '', tecnicoEmail: '', hora: '', observacoes: '' },
    caminhaoMunck: { necessario: false },
    veiculo: { necessario: false },
    libra: { necessario: false },
    ar2: { necessario: false },
    desligamentoEletrico: { necessario: false },
    desligamentoSDAI: { necessario: false },
    desligamentoFM200: { necessario: false },
    remanejamentoMobiliario: { necessario: false },
    materialEspecifico: { necessario: false },
    locacaoMaquinas: { necessario: false },
    apoioOutraEquipe: { necessario: false },
    necessidadesAdicionais: '',
  }
}

export function criarFormularioVazio(): FormularioAvaliacao {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    status: 'rascunho',
    projeto: '',
    infoGerais: {
      responsavel: '',
      dataAvaliacao: new Date().toISOString().slice(0, 10),
      tempoEstimadoExecucao: '',
      numeroSolicitacao: '',
      equipeNecessaria: '',
      localAtividade: '',
    },
    necessidades: criarNecessidadesVazias(),
    descricaoApoio: '',
    observacoes: '',
    imagens: [],
  }
}

export function formularioTemConteudo(f: FormularioAvaliacao): boolean {
  const info = f.infoGerais
  if (info.responsavel || info.tempoEstimadoExecucao || info.numeroSolicitacao || info.equipeNecessaria || info.localAtividade) return true
  if (f.descricaoApoio.trim() || f.observacoes.trim()) return true
  if (f.imagens.length > 0 || f.localizacao || f.assinaturaDataUrl) return true
  const n = f.necessidades
  if (n.necessidadesAdicionais?.trim()) return true
  for (const valor of Object.values(n)) {
    if (valor && typeof valor === 'object' && 'necessario' in valor && (valor as { necessario?: boolean }).necessario) return true
  }
  return false
}
