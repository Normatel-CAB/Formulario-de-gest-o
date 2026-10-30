import { podeDecidirFicha, podeProgramar, temPermissao, type FormStatus, type Usuario } from './types'

export interface Transicao {
  para: FormStatus
  rotulo: string
  variante: 'primary' | 'outline' | 'danger'
}

/**
 * Botões de status que a pessoa vê numa ficha.
 *
 * Supervisor avalia: análise, aprova, reprova ou manda pra compras. Quando o
 * material chega é ele quem aprova, por isso Em Compras volta pra mão dele.
 * Planejador só entra depois de aprovada, pra programar.
 *
 * O banco confere de novo (migração 011): isto aqui só decide o que mostrar.
 */
export function transicoesPossiveis(usuario: Usuario | null, atual: FormStatus): Transicao[] {
  const lista: Transicao[] = []

  if (podeDecidirFicha(usuario)) {
    if (atual === 'enviado') lista.push({ para: 'em_analise', rotulo: 'Em Análise', variante: 'outline' })
    if (['enviado', 'em_analise', 'em_compras'].includes(atual)) {
      if (temPermissao(usuario, 'formularios.aprovar')) lista.push({ para: 'aprovado', rotulo: 'Aprovar', variante: 'primary' })
      if (atual !== 'em_compras' && temPermissao(usuario, 'formularios.em.compras'))
        lista.push({ para: 'em_compras', rotulo: 'Em Compras', variante: 'outline' })
      if (temPermissao(usuario, 'formularios.reprovar')) lista.push({ para: 'reprovado', rotulo: 'Reprovar', variante: 'danger' })
    }
    if (['aprovado', 'reprovado', 'programado'].includes(atual) && temPermissao(usuario, 'formularios.reabrir')) {
      lista.push({ para: 'em_analise', rotulo: 'Reabrir', variante: 'outline' })
    }
  }

  if (podeProgramar(usuario)) {
    if (atual === 'aprovado') lista.push({ para: 'programado', rotulo: 'Programar', variante: 'primary' })
    if (atual === 'programado') lista.push({ para: 'aprovado', rotulo: 'Desfazer programação', variante: 'outline' })
  }

  const vistos = new Set<FormStatus>()
  return lista.filter((t) => t.para !== atual && !vistos.has(t.para) && vistos.add(t.para))
}
