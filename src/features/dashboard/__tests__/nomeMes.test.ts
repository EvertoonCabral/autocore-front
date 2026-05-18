import { describe, expect, it } from 'vitest'
import { nomeMesPtBr } from '../helpers/nomeMes'

describe('nomeMesPtBr', () => {
  it.each([
    [1, 'janeiro'],
    [2, 'fevereiro'],
    [3, 'março'],
    [4, 'abril'],
    [5, 'maio'],
    [6, 'junho'],
    [7, 'julho'],
    [8, 'agosto'],
    [9, 'setembro'],
    [10, 'outubro'],
    [11, 'novembro'],
    [12, 'dezembro'],
  ])('retorna nome correto para mes=%i', (mes, esperado) => {
    expect(nomeMesPtBr(mes)).toBe(esperado)
  })

  it('retorna "este mês" para undefined', () => {
    expect(nomeMesPtBr(undefined)).toBe('este mês')
  })

  it('retorna "este mês" para 0', () => {
    expect(nomeMesPtBr(0)).toBe('este mês')
  })

  it('retorna "este mês" fora do range', () => {
    expect(nomeMesPtBr(13)).toBe('este mês')
    expect(nomeMesPtBr(-1)).toBe('este mês')
  })
})
