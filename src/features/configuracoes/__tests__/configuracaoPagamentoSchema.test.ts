import { describe, expect, it } from 'vitest'
import {
  configuracaoPagamentoSchema,
  type ConfiguracaoPagamentoFormValues,
} from '../helpers/configuracaoPagamentoSchema'

const baseValido: ConfiguracaoPagamentoFormValues = {
  accessToken: '',
  webhookSecret: '',
  publicKey: '',
  ambiente: 1,
  usarStub: true,
  baseUrlPublica: '',
  emailFallbackPagador: '',
  pixExpiraMinutosBancada: 30,
  pixExpiraMinutosRemoto: 30,
  repassarTaxa: true,
  taxaPixPercentual: 0.99,
  taxaCartaoPercentual: 4.98,
  jurosParcelamentoAoCliente: true,
  parcelasMaximas: 12,
  boletoHabilitado: false,
}

describe('configuracaoPagamentoSchema', () => {
  it('aceita valores válidos com segredos vazios', () => {
    expect(configuracaoPagamentoSchema.safeParse(baseValido).success).toBe(true)
  })

  it('aceita ambiente Produção (2)', () => {
    expect(configuracaoPagamentoSchema.safeParse({ ...baseValido, ambiente: 2 }).success).toBe(true)
  })

  it('rejeita ambiente fora de 1..2', () => {
    expect(
      configuracaoPagamentoSchema.safeParse({ ...baseValido, ambiente: 3 as 1 | 2 }).success,
    ).toBe(false)
  })

  it('aceita baseUrlPublica vazia (modo stub)', () => {
    expect(
      configuracaoPagamentoSchema.safeParse({ ...baseValido, baseUrlPublica: '' }).success,
    ).toBe(true)
  })

  it('aceita baseUrlPublica https válida', () => {
    expect(
      configuracaoPagamentoSchema.safeParse({
        ...baseValido,
        baseUrlPublica: 'https://autocore.exemplo.com.br',
      }).success,
    ).toBe(true)
  })

  it('rejeita baseUrlPublica não-URL', () => {
    expect(
      configuracaoPagamentoSchema.safeParse({ ...baseValido, baseUrlPublica: 'nao-eh-url' })
        .success,
    ).toBe(false)
  })

  it('rejeita e-mail de fallback inválido', () => {
    expect(
      configuracaoPagamentoSchema.safeParse({ ...baseValido, emailFallbackPagador: 'xyz' }).success,
    ).toBe(false)
  })

  it('aceita e-mail de fallback válido', () => {
    expect(
      configuracaoPagamentoSchema.safeParse({
        ...baseValido,
        emailFallbackPagador: 'pagamentos@exemplo.com',
      }).success,
    ).toBe(true)
  })

  it('rejeita validade de Pix da bancada menor que 1', () => {
    expect(
      configuracaoPagamentoSchema.safeParse({ ...baseValido, pixExpiraMinutosBancada: 0 }).success,
    ).toBe(false)
  })

  it('rejeita validade de Pix remoto acima de 4320', () => {
    expect(
      configuracaoPagamentoSchema.safeParse({ ...baseValido, pixExpiraMinutosRemoto: 5000 })
        .success,
    ).toBe(false)
  })

  it('rejeita taxa negativa', () => {
    expect(
      configuracaoPagamentoSchema.safeParse({ ...baseValido, taxaPixPercentual: -1 }).success,
    ).toBe(false)
  })

  it('rejeita taxa >= 100', () => {
    expect(
      configuracaoPagamentoSchema.safeParse({ ...baseValido, taxaCartaoPercentual: 100 }).success,
    ).toBe(false)
  })

  it('coage taxa vinda como string (input number)', () => {
    const r = configuracaoPagamentoSchema.safeParse({
      ...baseValido,
      taxaPixPercentual: '0.99' as unknown as number,
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.taxaPixPercentual).toBe(0.99)
  })

  it('rejeita parcelas fora de 1..24', () => {
    expect(
      configuracaoPagamentoSchema.safeParse({ ...baseValido, parcelasMaximas: 0 }).success,
    ).toBe(false)
    expect(
      configuracaoPagamentoSchema.safeParse({ ...baseValido, parcelasMaximas: 25 }).success,
    ).toBe(false)
  })

  it('faz trim na publicKey', () => {
    const r = configuracaoPagamentoSchema.safeParse({ ...baseValido, publicKey: '  APP-123  ' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.publicKey).toBe('APP-123')
  })

  it('rejeita access token acima de 500 chars', () => {
    expect(
      configuracaoPagamentoSchema.safeParse({ ...baseValido, accessToken: 'a'.repeat(501) })
        .success,
    ).toBe(false)
  })
})
