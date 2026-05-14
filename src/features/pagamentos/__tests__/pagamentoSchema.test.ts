import { describe, expect, it } from 'vitest'
import {
  pagamentoBaseSchema,
  pagamentoSchemaComSaldo,
} from '../helpers/pagamentoSchema'

describe('pagamentoBaseSchema', () => {
  const valido = { valor: 100, forma: 2, observacao: '' }

  it('aceita valor positivo + forma válida', () => {
    expect(pagamentoBaseSchema.safeParse(valido).success).toBe(true)
  })

  it.each([0, -10, -0.01])('rejeita valor <= 0 (%s)', (valor) => {
    expect(pagamentoBaseSchema.safeParse({ ...valido, valor }).success).toBe(false)
  })

  it.each([0, 5, 99])('rejeita forma fora de 1..4 (%s)', (forma) => {
    expect(pagamentoBaseSchema.safeParse({ ...valido, forma }).success).toBe(false)
  })

  it.each([1, 2, 3, 4])('aceita forma %s', (forma) => {
    expect(pagamentoBaseSchema.safeParse({ ...valido, forma }).success).toBe(true)
  })

  it('rejeita observação com mais de 300 caracteres', () => {
    expect(
      pagamentoBaseSchema.safeParse({ ...valido, observacao: 'a'.repeat(301) }).success,
    ).toBe(false)
  })

  it('transforma observação vazia em null', () => {
    expect(pagamentoBaseSchema.parse(valido).observacao).toBeNull()
  })

  it('coage valor enviado como string (input number)', () => {
    const r = pagamentoBaseSchema.parse({ ...valido, valor: '50.5' as unknown as number })
    expect(r.valor).toBe(50.5)
  })
})

describe('pagamentoSchemaComSaldo — regra crítica do front', () => {
  it('aceita valor igual ao saldo (quitação total)', () => {
    const schema = pagamentoSchemaComSaldo(150)
    expect(schema.safeParse({ valor: 150, forma: 2, observacao: '' }).success).toBe(true)
  })

  it('aceita valor menor que o saldo (parcial)', () => {
    const schema = pagamentoSchemaComSaldo(150)
    expect(schema.safeParse({ valor: 50, forma: 2, observacao: '' }).success).toBe(true)
  })

  it('rejeita valor que excede o saldo', () => {
    const schema = pagamentoSchemaComSaldo(150)
    const r = schema.safeParse({ valor: 200, forma: 2, observacao: '' })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => /excede o saldo/i.test(i.message))).toBe(true)
    }
  })

  it('aceita pequena diferença de arredondamento (até 0.001)', () => {
    const schema = pagamentoSchemaComSaldo(99.99)
    expect(schema.safeParse({ valor: 99.99, forma: 2, observacao: '' }).success).toBe(true)
  })
})
