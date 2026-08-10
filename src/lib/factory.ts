import type {
  Equipamentos,
  FormularioAvaliacao,
  NecessidadesExecucao,
} from './types'
import { EQUIPAMENTO_CHAVES } from './types'

export function criarEquipamentosVazios(): Equipamentos {
  return {
    caminhaoCesto: { necessario: false },
    caminhaoMunck: { necessario: false },
    drone: { necessario: false },
    pemt: { necessario: false },
    retroescavadeira: { necessario: false },
  }
}

export function criarNecessidadesVazias(): NecessidadesExecucao {
  return {
    equipamentos: criarEquipamentosVazios(),
    limpezaArea: { necessario: false },
    comunicacoesOperantes: { necessario: false },
    visitaTecnica: { necessario: false },
    montagemAndaime: { necessario: false },
    visitaSMS: { necessario: false, tecnicoId: '', tecnicoNome: '', tecnicoEmail: '', hora: '', observacoes: '' },
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
      lotacao: '',
      localAtividade: '',
    },
    necessidades: criarNecessidadesVazias(),
    descricaoApoio: '',
    observacoes: '',
    imagens: [],
  }
}

/**
 * Traz uma ficha gravada antes do bloco "Equipamentos" para o formato atual.
 *
 * O PEMT era um campo de dias e o caminhão munck um agendamento, cada um num
 * bloco diferente. Agora os dois vivem em `necessidades.equipamentos` junto com
 * cesto, drone e retroescavadeira. Sem esta normalização, um rascunho antigo
 * abriria com o bloco de equipamentos indefinido e quebraria a tela.
 */
export function normalizarFormulario(f: FormularioAvaliacao): FormularioAvaliacao {
  const base = criarFormularioVazio()
  const necessidades = (f.necessidades ?? {}) as NecessidadesExecucao
  const equipamentos: Equipamentos = { ...criarEquipamentosVazios(), ...(necessidades.equipamentos ?? {}) }

  if (necessidades.pemt?.necessario && !equipamentos.pemt.necessario) {
    equipamentos.pemt = { necessario: true, dias: necessidades.pemt.dias }
  }
  if (necessidades.caminhaoMunck?.necessario && !equipamentos.caminhaoMunck.necessario) {
    equipamentos.caminhaoMunck = { necessario: true, data: necessidades.caminhaoMunck.data }
  }

  // Garante que toda chave nova exista, mesmo em fichas antigas.
  for (const chave of EQUIPAMENTO_CHAVES) {
    equipamentos[chave] = equipamentos[chave] ?? { necessario: false }
  }

  const { pemt: _pemt, caminhaoMunck: _munck, ...resto } = necessidades

  return {
    ...f,
    infoGerais: { ...base.infoGerais, ...(f.infoGerais ?? {}) },
    necessidades: { ...base.necessidades, ...resto, equipamentos },
    imagens: f.imagens ?? [],
  }
}

export function formularioTemConteudo(f: FormularioAvaliacao): boolean {
  const info = f.infoGerais
  if (
    info.responsavel ||
    info.tempoEstimadoExecucao ||
    info.numeroSolicitacao ||
    info.equipeNecessaria ||
    info.lotacao ||
    info.localAtividade
  )
    return true
  if (f.descricaoApoio.trim() || f.observacoes.trim()) return true
  if (f.imagens.length > 0 || f.localizacao || f.assinaturaDataUrl) return true
  const n = f.necessidades
  if (n.necessidadesAdicionais?.trim()) return true
  if (Object.values(n.equipamentos ?? {}).some((e) => e?.necessario)) return true
  for (const valor of Object.values(n)) {
    if (valor && typeof valor === 'object' && 'necessario' in valor && (valor as { necessario?: boolean }).necessario) return true
  }
  return false
}
