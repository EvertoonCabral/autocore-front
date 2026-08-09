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

  // ─── Enriquecimento (Fase F): garantia, tempo estimado, categoria ────

  it('aceita garantia/tempo/categoria preenchidos e coage números', () => {
    const r = servicoSchema.parse({
      ...valido,
      garantiaDias: '90' as unknown as number,
      tempoEstimadoMinutos: '60' as unknown as number,
      categoria: 'Elétrica',
    })
    expect(r.garantiaDias).toBe(90)
    expect(r.tempoEstimadoMinutos).toBe(60)
    expect(r.categoria).toBe('Elétrica')
  })

  it('normaliza garantia/tempo/categoria vazios para null', () => {
    const r = servicoSchema.parse({
      ...valido,
      garantiaDias: '' as unknown as number,
      tempoEstimadoMinutos: '' as unknown as number,
      categoria: '',
    })
    expect(r.garantiaDias).toBeNull()
    expect(r.tempoEstimadoMinutos).toBeNull()
    expect(r.categoria).toBeNull()
  })

  it('aceita garantia/tempo ausentes (undefined)', () => {
    expect(servicoSchema.safeParse(valido).success).toBe(true)
  })

  it.each([-1, 1.5])('rejeita garantia inválida (%s)', (garantiaDias) => {
    expect(
      servicoSchema.safeParse({ ...valido, garantiaDias: garantiaDias as unknown as number })
        .success,
    ).toBe(false)
  })

  it('rejeita tempo estimado negativo', () => {
    expect(
      servicoSchema.safeParse({ ...valido, tempoEstimadoMinutos: -5 as unknown as number })
        .success,
    ).toBe(false)
  })

  it('rejeita categoria acima de 80 caracteres', () => {
    expect(servicoSchema.safeParse({ ...valido, categoria: 'a'.repeat(81) }).success).toBe(false)
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
