import { describe, expect, it } from 'vitest'
import { servicoSchema, precoSchema } from '../helpers/servicoSchema'

describe('servicoSchema', () => {
  const valido = { nome: 'Troca de bateria', descricao: '', preco: 120, ehMaoDeObraPadrao: false }

  it('aceita serviço válido', () => {
    expect(servicoSchema.safeParse(valido).success).toBe(true)
  })

  it.each(['', 'Ab'])('rejeita nome com menos de 3 caracteres (%s)', (nome) => {
    expect(servicoSchema.safeParse({ ...valido, nome }).success).toBe(false)
  })

  it('rejeita preço negativo', () => {
    expect(servicoSchema.safeParse({ ...valido, preco: -1 }).success).toBe(false)
  })

  it('aceita preço zero', () => {
    expect(servicoSchema.safeParse({ ...valido, preco: 0 }).success).toBe(true)
  })

  it('rejeita descrição com mais de 500 caracteres', () => {
    expect(
      servicoSchema.safeParse({ ...valido, descricao: 'a'.repeat(501) }).success,
    ).toBe(false)
  })

  it('transforma descrição vazia em null', () => {
    expect(servicoSchema.parse(valido).descricao).toBeNull()
  })

  it('coage preço enviado como string (input number do form)', () => {
    const r = servicoSchema.parse({ ...valido, preco: '99.90' as unknown as number })
    expect(r.preco).toBe(99.9)
  })
})

describe('precoSchema', () => {
  it('aceita preço >= 0', () => {
    expect(precoSchema.safeParse({ preco: 0 }).success).toBe(true)
    expect(precoSchema.safeParse({ preco: 199.99 }).success).toBe(true)
  })
  it('rejeita preço negativo', () => {
    expect(precoSchema.safeParse({ preco: -0.01 }).success).toBe(false)
  })
})
