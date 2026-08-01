import { describe, expect, it } from 'vitest'
import { veiculoSchema } from '../helpers/veiculoSchema'

describe('veiculoSchema', () => {
  const valido = {
    clienteId: 1,
    placa: 'ABC1234',
    marca: '',
    modelo: '',
    cor: '',
    chassi: '',
    renavam: '',
    observacoes: '',
  }

  it('aceita cliente + placa antiga e demais vazios', () => {
    const r = veiculoSchema.safeParse(valido)
    expect(r.success).toBe(true)
  })

  it('aceita placa Mercosul (ABC1D23)', () => {
    const r = veiculoSchema.safeParse({ ...valido, placa: 'ABC1D23' })
    expect(r.success).toBe(true)
  })

  it('exige clienteId positivo', () => {
    const r = veiculoSchema.safeParse({ ...valido, clienteId: 0 })
    expect(r.success).toBe(false)
  })

  it.each(['', 'AB1234', 'ABCD123', 'ABC12E4', '123ABCD'])(
    'rejeita placa inválida (%s)',
    (placa) => {
      const r = veiculoSchema.safeParse({ ...valido, placa })
      expect(r.success).toBe(false)
    },
  )

  it('normaliza placa com hífen e minúsculas para canônica MAIÚSCULA', () => {
    const r = veiculoSchema.parse({ ...valido, placa: 'abc-1234' })
    expect(r.placa).toBe('ABC1234')
  })

  it('normaliza placa Mercosul minúscula com separadores', () => {
    const r = veiculoSchema.parse({ ...valido, placa: 'abc 1d23' })
    expect(r.placa).toBe('ABC1D23')
  })

  it('transforma campos texto vazios em null', () => {
    const r = veiculoSchema.parse(valido)
    expect(r.marca).toBeNull()
    expect(r.modelo).toBeNull()
    expect(r.cor).toBeNull()
    expect(r.chassi).toBeNull()
    expect(r.renavam).toBeNull()
    expect(r.observacoes).toBeNull()
  })

  it('trata ano vazio como null (não vira 0)', () => {
    const r = veiculoSchema.parse({ ...valido, anoFabricacao: '', anoModelo: '' })
    expect(r.anoFabricacao).toBeNull()
    expect(r.anoModelo).toBeNull()
  })

  it('coage ano numérico válido', () => {
    const r = veiculoSchema.parse({ ...valido, anoModelo: '2021' })
    expect(r.anoModelo).toBe(2021)
  })

  it.each([1899, 2101])('rejeita ano fora de 1900..2100 (%s)', (ano) => {
    const r = veiculoSchema.safeParse({ ...valido, anoModelo: ano })
    expect(r.success).toBe(false)
  })

  it('aceita chassi com 17 alfanuméricos', () => {
    const r = veiculoSchema.safeParse({ ...valido, chassi: '9BWZZZ377VT004251' })
    expect(r.success).toBe(true)
  })

  it.each(['1234567890123456', 'ABC-123', '9BWZZZ377VT00425!'])(
    'rejeita chassi inválido (%s)',
    (chassi) => {
      const r = veiculoSchema.safeParse({ ...valido, chassi })
      expect(r.success).toBe(false)
    },
  )

  it.each(['123456789', '12345678901'])('aceita renavam de 9 a 11 dígitos (%s)', (renavam) => {
    const r = veiculoSchema.safeParse({ ...valido, renavam })
    expect(r.success).toBe(true)
  })

  it.each(['12345678', '123456789012', 'abcdefghi'])(
    'rejeita renavam inválido (%s)',
    (renavam) => {
      const r = veiculoSchema.safeParse({ ...valido, renavam })
      expect(r.success).toBe(false)
    },
  )

  it('rejeita marca acima de 50 caracteres', () => {
    const r = veiculoSchema.safeParse({ ...valido, marca: 'a'.repeat(51) })
    expect(r.success).toBe(false)
  })

  it('rejeita modelo acima de 80 caracteres', () => {
    const r = veiculoSchema.safeParse({ ...valido, modelo: 'a'.repeat(81) })
    expect(r.success).toBe(false)
  })
})
