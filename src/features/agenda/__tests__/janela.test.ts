import { describe, expect, it } from 'vitest'
import { janelaMes, janelaSemana, porHora } from '../helpers/janela'

describe('janelaSemana', () => {
  it('cobre seg…dom da semana que contém a referência', () => {
    // Quarta, 2026-08-12 → semana seg 10/08 … dom 16/08.
    const ref = new Date(2026, 7, 12)
    const { de, ate, dias } = janelaSemana(ref)
    expect(de).toBe('2026-08-10')
    expect(ate).toBe('2026-08-16')
    expect(dias).toHaveLength(7)
  })
})

describe('janelaMes', () => {
  it('cobre do início da 1ª semana ao fim da última semana do mês', () => {
    // Agosto/2026: 1º é sábado → grade começa na seg 27/07; 31 é seg → termina dom 06/09.
    const ref = new Date(2026, 7, 15)
    const { de, ate, dias } = janelaMes(ref)
    expect(de).toBe('2026-07-27')
    expect(ate).toBe('2026-09-06')
    // Sempre múltiplo de 7.
    expect(dias.length % 7).toBe(0)
  })
})

describe('porHora', () => {
  it('ordena por dataAgendamentoInicio crescente', () => {
    const arr = [
      { dataAgendamentoInicio: '2026-08-12T14:00:00Z' },
      { dataAgendamentoInicio: '2026-08-12T09:00:00Z' },
    ]
    const ordenado = [...arr].sort(porHora)
    expect(ordenado[0]?.dataAgendamentoInicio).toBe('2026-08-12T09:00:00Z')
  })
})
