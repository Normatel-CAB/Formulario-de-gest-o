import type { AcaoAuditoria, Usuario } from './types'
import { registrarAuditoriaLocal } from './db'

export async function registrarAuditoria(params: {
  acao: AcaoAuditoria
  entidade: string
  entidadeNome: string
  detalhes: string
  usuario: Usuario | null
}) {
  await registrarAuditoriaLocal({
    id: crypto.randomUUID(),
    acao: params.acao,
    entidade: params.entidade,
    entidadeNome: params.entidadeNome,
    detalhes: params.detalhes,
    usuarioId: params.usuario?.id ?? 'sistema',
    usuarioNome: params.usuario?.nome ?? 'Sistema',
    criadoEm: new Date().toISOString(),
  })
}
