import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  diasDesde,
  formatCnpj,
  formatCpf,
  formatCpfCnpj,
  formatTelefone,
  maskTelefoneInput,
  onlyDigits,
} from '../format'

describe('formatCpf', () => {
  it('formata 11 dígitos', () => {
    expect(formatCpf('12345678901')).toBe('123.456.789-01')
  })

  it('devolve vazio para null/undefined', () => {
    expect(formatCpf(null)).toBe('')
    expect(formatCpf(undefined)).toBe('')
  })
})

describe('formatCnpj', () => {
  it('formata 14 dígitos', () => {
    expect(formatCnpj('12345678000190')).toBe('12.345.678/0001-90')
  })
})

describe('formatCpfCnpj', () => {
  it('detecta CPF (11 dígitos)', () => {
    expect(formatCpfCnpj('12345678901')).toBe('123.456.789-01')
  })

  it('detecta CNPJ (14 dígitos)', () => {
    expect(formatCpfCnpj('12345678000190')).toBe('12.345.678/0001-90')
  })

  it.each([
    ['1', '1'],
    ['123', '123'],
    ['1234', '123.4'],
    ['1234567', '123.456.7'],
    ['1234567890', '123.456.789-0'],
    ['12345678901', '123.456.789-01'],
    ['123456789012', '12.345.678/9012'],
    ['1234567890123', '12.345.678/9012-3'],
    ['12345678901234', '12.345.678/9012-34'],
  ])('aplica máscara progressiva: "%s" → "%s"', (entrada, esperado) => {
    expect(formatCpfCnpj(entrada)).toBe(esperado)
  })

  it('trunca em 14 dígitos', () => {
    expect(formatCpfCnpj('123456789012345')).toBe('12.345.678/9012-34')
  })
})

describe('maskTelefoneInput', () => {
  it.each([
    ['4', '(4'],
    ['44', '(44'],
    ['449', '(44) 9'],
    ['4499999', '(44) 9999-9'],
    ['4499990000', '(44) 9999-0000'],
    ['44999990000', '(44) 99999-0000'],
  ])('aplica máscara progressiva: "%s" → "%s"', (entrada, esperado) => {
    expect(maskTelefoneInput(entrada)).toBe(esperado)
  })

  it('descarta DDI 55 quando presente', () => {
    expect(maskTelefoneInput('5544999990000')).toBe('(44) 99999-0000')
  })

  it('trunca em 11 dígitos locais', () => {
    expect(maskTelefoneInput('449999900001234')).toBe('(44) 99999-0000')
  })
})

describe('formatTelefone (display)', () => {
  it('formata 11 dígitos com DDD', () => {
    expect(formatTelefone('44999990000')).toBe('(44) 99999-0000')
  })

  it('aceita 12-13 dígitos com DDI 55', () => {
    expect(formatTelefone('5544999990000')).toBe('(44) 99999-0000')
  })
})

describe('onlyDigits', () => {
  it('remove máscara', () => {
    expect(onlyDigits('(44) 99999-0000')).toBe('44999990000')
    expect(onlyDigits('123.456.789-01')).toBe('12345678901')
    expect(onlyDigits('12.345.678/9012-34')).toBe('12345678901234')
  })
})

describe('diasDesde', () => {
  // Congela "hoje" para 2026-06-15 UTC — testes determinísticos
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('retorna null quando data é vazia ou inválida', () => {
    expect(diasDesde(null)).toBeNull()
    expect(diasDesde(undefined)).toBeNull()
    expect(diasDesde('')).toBeNull()
    expect(diasDesde('texto-invalido')).toBeNull()
  })

  it('retorna 0 quando data é hoje', () => {
    expect(diasDesde('2026-06-15T00:00:00Z')).toBe(0)
    expect(diasDesde('2026-06-15T23:59:59Z')).toBe(0)
  })

  it('retorna positivo quando data já passou', () => {
    expect(diasDesde('2026-06-14T00:00:00Z')).toBe(1)
    expect(diasDesde('2026-06-01T00:00:00Z')).toBe(14)
    expect(diasDesde('2026-05-16T00:00:00Z')).toBe(30)
    expect(diasDesde('2026-05-15T00:00:00Z')).toBe(31)
  })

  it('retorna negativo quando data é futura', () => {
    expect(diasDesde('2026-06-16T00:00:00Z')).toBe(-1)
    expect(diasDesde('2026-07-15T00:00:00Z')).toBe(-30)
  })

  it('ignora hora do dia — compara em UTC truncado', () => {
    // mesmo dia, horas diferentes → 0
    expect(diasDesde('2026-06-15T03:00:00Z')).toBe(0)
    expect(diasDesde('2026-06-15T22:00:00Z')).toBe(0)
  })
})
