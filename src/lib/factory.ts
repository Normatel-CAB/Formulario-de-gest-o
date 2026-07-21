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
