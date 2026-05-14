import { describe, expect, it } from 'vitest'
import {
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
