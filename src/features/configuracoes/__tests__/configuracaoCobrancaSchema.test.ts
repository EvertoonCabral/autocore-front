import { describe, expect, it } from 'vitest'
import {
  configuracaoCobrancaSchema,
  type ConfiguracaoCobrancaFormValues,
} from '../helpers/configuracaoCobrancaSchema'

const baseValido: ConfiguracaoCobrancaFormValues = {
  baseUrl: 'http://localhost:8080',
  apiKey: '',
  instancia: 'autocore',
  usarStub: false,
}

describe('configuracaoCobrancaSchema', () => {
  it('aceita valores válidos com apiKey vazia', () => {
    expect(configuracaoCobrancaSchema.safeParse(baseValido).success).toBe(true)
  })

  it('aceita apiKey preenchida', () => {
    const r = configuracaoCobrancaSchema.safeParse({
      ...baseValido,
      apiKey: 'chave-super-secreta',
    })
    expect(r.success).toBe(true)
  })

  it('rejeita baseUrl vazia', () => {
    expect(
      configuracaoCobrancaSchema.safeParse({ ...baseValido, baseUrl: '' }).success,
    ).toBe(false)
  })

  it('rejeita baseUrl inválida (não é URL)', () => {
    expect(
      configuracaoCobrancaSchema.safeParse({ ...baseValido, baseUrl: 'nao-eh-url' }).success,
    ).toBe(false)
  })

  it('rejeita baseUrl com mais de 500 caracteres', () => {
    const longa = 'http://example.com/' + 'a'.repeat(600)
    expect(
      configuracaoCobrancaSchema.safeParse({ ...baseValido, baseUrl: longa }).success,
    ).toBe(false)
  })

  it('faz trim em instancia', () => {
    const r = configuracaoCobrancaSchema.safeParse({
      ...baseValido,
      instancia: '  autocore  ',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.instancia).toBe('autocore')
  })

  it('rejeita instancia vazia', () => {
    expect(
      configuracaoCobrancaSchema.safeParse({ ...baseValido, instancia: '' }).success,
    ).toBe(false)
  })

  it('rejeita instancia só com espaços (após trim fica vazia)', () => {
    expect(
      configuracaoCobrancaSchema.safeParse({ ...baseValido, instancia: '   ' }).success,
    ).toBe(false)
  })

  it('rejeita instancia com mais de 100 caracteres', () => {
    expect(
      configuracaoCobrancaSchema.safeParse({
        ...baseValido,
        instancia: 'a'.repeat(101),
      }).success,
    ).toBe(false)
  })

  it('rejeita apiKey com mais de 500 caracteres', () => {
    expect(
      configuracaoCobrancaSchema.safeParse({
        ...baseValido,
        apiKey: 'a'.repeat(501),
      }).success,
    ).toBe(false)
  })

  it('aceita usarStub true e false', () => {
    expect(
      configuracaoCobrancaSchema.safeParse({ ...baseValido, usarStub: true }).success,
    ).toBe(true)
    expect(
      configuracaoCobrancaSchema.safeParse({ ...baseValido, usarStub: false }).success,
    ).toBe(true)
  })

  it('rejeita usarStub não-booleano', () => {
    expect(
      configuracaoCobrancaSchema.safeParse({
        ...baseValido,
        usarStub: 'sim' as unknown as boolean,
      }).success,
    ).toBe(false)
  })
})
