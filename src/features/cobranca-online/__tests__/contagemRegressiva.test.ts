import { describe, expect, it } from 'vitest'
import { formatarTempoRestante, estaExpirado } from '../helpers/contagemRegressiva'

describe('contagemRegressiva', () => {
  const agora = Date.parse('2026-08-10T12:00:00Z')

  it('retorna null quando não há prazo', () => {
    expect(formatarTempoRestante(null, agora)).toBeNull()
    expect(formatarTempoRestante(undefined, agora)).toBeNull()
  })

  it('formata mm:ss para prazo futuro', () => {
    const expira = new Date(agora + 90_000).toISOString() // +1min30s
    expect(formatarTempoRestante(expira, agora)).toBe('01:30')
  })

  it('mostra 00:00 quando já venceu', () => {
    const expira = new Date(agora - 1000).toISOString()
    expect(formatarTempoRestante(expira, agora)).toBe('00:00')
  })

  it('preenche zeros à esquerda', () => {
    const expira = new Date(agora + 5000).toISOString()
    expect(formatarTempoRestante(expira, agora)).toBe('00:05')
  })

  it('estaExpirado reflete o prazo', () => {
    expect(estaExpirado(new Date(agora + 1000).toISOString(), agora)).toBe(false)
    expect(estaExpirado(new Date(agora - 1000).toISOString(), agora)).toBe(true)
    expect(estaExpirado(null, agora)).toBe(false)
  })
})
