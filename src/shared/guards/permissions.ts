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

export type Role = 'Admin' | 'Operador'

export function canPerform(role: Role | undefined, permission: AdminOnlyPermission): boolean {
  if (!role) return false
  if (role === 'Admin') return true
  return !ADMIN_ONLY_PERMISSIONS.includes(permission)
}
