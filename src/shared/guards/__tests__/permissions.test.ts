import { describe, expect, it } from 'vitest'
import { canPerform } from '../permissions'

describe('canPerform', () => {
  it('Admin pode tudo', () => {
    expect(canPerform('Admin', 'clientes.desativar')).toBe(true)
    expect(canPerform('Admin', 'configuracoes.atualizar')).toBe(true)
    expect(canPerform('Admin', 'cobrancas.disparar')).toBe(true)
  })

  it('Operador é bloqueado em ações administrativas', () => {
    expect(canPerform('Operador', 'clientes.desativar')).toBe(false)
    expect(canPerform('Operador', 'pagamentos.estornar')).toBe(false)
    expect(canPerform('Operador', 'servicos.atualizarPreco')).toBe(false)
  })

  it('sem role autenticada nada é permitido', () => {
    expect(canPerform(undefined, 'clientes.desativar')).toBe(false)
  })

  it('auditoria.ver: Admin sempre passa, Operador depende da flag', () => {
    expect(canPerform('Admin', 'auditoria.ver')).toBe(true)
    expect(canPerform('Operador', 'auditoria.ver')).toBe(false)
    expect(canPerform('Operador', 'auditoria.ver', { podeVerAuditoria: false })).toBe(false)
    expect(canPerform('Operador', 'auditoria.ver', { podeVerAuditoria: true })).toBe(true)
    expect(canPerform(undefined, 'auditoria.ver', { podeVerAuditoria: true })).toBe(false)
  })
})
