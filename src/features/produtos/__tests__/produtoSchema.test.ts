import { describe, expect, it } from 'vitest'
import { produtoSchema, ajustarEstoqueSchema } from '../helpers/produtoSchema'

const valido = {
  nome: 'Bateria Moura',
  referencia: 'M60GD',
  precoCusto: 380,
  precoVenda: 520,
  quantidadeEstoque: 5,
  estoqueMinimo: 2,
}

describe('produtoSchema', () => {
  it('aceita produto válido', () => {
    expect(produtoSchema.safeParse(valido).success).toBe(true)
  })

  it.each(['', 'A'])('rejeita nome com menos de 2 caracteres (%s)', (nome) => {
    expect(produtoSchema.safeParse({ ...valido, nome }).success).toBe(false)
  })

  it('rejeita preço de custo negativo', () => {
    expect(produtoSchema.safeParse({ ...valido, precoCusto: -1 }).success).toBe(false)
  })

  it('rejeita preço de venda negativo', () => {
    expect(produtoSchema.safeParse({ ...valido, precoVenda: -0.5 }).success).toBe(false)
  })

  it('rejeita quantidade não inteira', () => {
    expect(produtoSchema.safeParse({ ...valido, quantidadeEstoque: 1.5 }).success).toBe(false)
  })

  it('rejeita estoque mínimo negativo', () => {
    expect(produtoSchema.safeParse({ ...valido, estoqueMinimo: -1 }).success).toBe(false)
  })

  it('aceita estoque zero', () => {
    expect(
      produtoSchema.safeParse({ ...valido, quantidadeEstoque: 0, estoqueMinimo: 0 }).success,
    ).toBe(true)
  })

  it('transforma referência vazia em null', () => {
    expect(produtoSchema.parse({ ...valido, referencia: '' }).referencia).toBeNull()
  })

  it('coage números enviados como string (input number do form)', () => {
    const r = produtoSchema.parse({
      ...valido,
      precoCusto: '380' as unknown as number,
      quantidadeEstoque: '5' as unknown as number,
    })
    expect(r.precoCusto).toBe(380)
    expect(r.quantidadeEstoque).toBe(5)
  })
})

describe('ajustarEstoqueSchema', () => {
  it('aceita valor positivo', () => {
    expect(ajustarEstoqueSchema.safeParse({ quantidade: 10 }).success).toBe(true)
  })

  it('aceita valor negativo', () => {
    expect(ajustarEstoqueSchema.safeParse({ quantidade: -3 }).success).toBe(true)
  })

  it('rejeita zero', () => {
    expect(ajustarEstoqueSchema.safeParse({ quantidade: 0 }).success).toBe(false)
  })

  it('rejeita valor não inteiro', () => {
    expect(ajustarEstoqueSchema.safeParse({ quantidade: 2.5 }).success).toBe(false)
  })
})
