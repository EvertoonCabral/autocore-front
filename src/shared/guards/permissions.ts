/**
 * Mapa de ações permitidas apenas para Admin (espelha
 * `docs/regras-negocio/autenticacao.md` no backend).
 *
 * Front é só UX — o back é a fonte de verdade. Hide/disable aqui evita
 * disparar requests destinadas a serem rejeitadas.
 */

export const ADMIN_ONLY_PERMISSIONS = [
  'auth.usuarios.criar',
  'auth.usuarios.atualizar',
  'clientes.desativar',
  'servicos.atualizarPreco',
  'servicos.desativar',
  'produtos.desativar',
  'pagamentos.estornar',
  'cobrancas.disparar',
  'configuracoes.ler',
  'configuracoes.atualizar',
] as const

export type AdminOnlyPermission = (typeof ADMIN_ONLY_PERMISSIONS)[number]

/**
 * Permissões cuja autorização depende de uma flag do usuário, não só da
 * role. Operadores podem receber a flag via Admin nas configurações.
 * Admin sempre passa.
 */
export const FLAG_PERMISSIONS = ['auditoria.ver', 'relatorios.ver'] as const
export type FlagPermission = (typeof FLAG_PERMISSIONS)[number]

export type Permission = AdminOnlyPermission | FlagPermission

export type Role = 'Admin' | 'Operador'

/** Flags por usuário que afetam permissões. Espelha campos de `UsuarioDto`. */
export interface UserFlags {
  podeVerAuditoria?: boolean | null | undefined
  podeVerRelatorios?: boolean | null | undefined
}

function isFlagPermission(p: Permission): p is FlagPermission {
  return (FLAG_PERMISSIONS as readonly string[]).includes(p)
}

export function canPerform(
  role: Role | undefined,
  permission: Permission,
  flags: UserFlags = {},
): boolean {
  if (!role) return false
  if (role === 'Admin') return true
  if (isFlagPermission(permission)) {
    if (permission === 'auditoria.ver') return flags.podeVerAuditoria === true
    if (permission === 'relatorios.ver') return flags.podeVerRelatorios === true
    return false
  }
  return !(ADMIN_ONLY_PERMISSIONS as readonly string[]).includes(permission)
}
