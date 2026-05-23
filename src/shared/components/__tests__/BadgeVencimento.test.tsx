import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BadgeVencimento } from '../BadgeVencimento'

/**
 * Congela "hoje" para 2026-06-15 — testes determinísticos.
 * Datas usadas:
 *   - 2026-06-20 → futura (5 dias adiante)
 *   - 2026-06-15 → hoje
 *   - 2026-06-10 → 5 dias atrás (vencida, 1-30d)
 *   - 2026-05-01 → 45 dias atrás (atrasada >30d)
 */
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-06-15T12:00:00Z'))
})
afterEach(() => vi.useRealTimers())

describe('<BadgeVencimento>', () => {
  it('não renderiza nada quando dataVencimento é vazia', () => {
    const { container } = render(<BadgeVencimento dataVencimento={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('sem vencida=true: mostra data sem badge', () => {
    render(<BadgeVencimento dataVencimento="2026-06-20T00:00:00Z" vencida={false} />)
    expect(screen.queryByText(/vencida/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/atrasada/i)).not.toBeInTheDocument()
  })

  it('vencida há 5 dias: mostra badge "Vencida" (variant destructive padrão)', () => {
    render(<BadgeVencimento dataVencimento="2026-06-10T00:00:00Z" vencida={true} />)
    const badge = screen.getByText('Vencida')
    expect(badge).toBeInTheDocument()
    // tooltip nativo com contagem de dias
    expect(badge.closest('[title]')?.getAttribute('title')).toBe('Vencida há 5 dias')
    expect(screen.queryByText(/atrasada/i)).not.toBeInTheDocument()
  })

  it('vencida há 1 dia: singular ("1 dia") no title', () => {
    render(<BadgeVencimento dataVencimento="2026-06-14T00:00:00Z" vencida={true} />)
    const badge = screen.getByText('Vencida')
    expect(badge.closest('[title]')?.getAttribute('title')).toBe('Vencida há 1 dia')
  })

  it('vencida há 45 dias: mostra badge ESCALADA "Atrasada >30d"', () => {
    render(<BadgeVencimento dataVencimento="2026-05-01T00:00:00Z" vencida={true} />)
    expect(screen.getByText('Atrasada >30d')).toBeInTheDocument()
    expect(screen.queryByText('Vencida')).not.toBeInTheDocument()
    // título com contagem
    const badge = screen.getByText('Atrasada >30d')
    expect(badge.closest('[title]')?.getAttribute('title')).toBe('Vencida há 45 dias')
  })

  it('limiarAtrasada customizado: respeita o threshold passado', () => {
    // Atrasada >7d — qualquer coisa acima de 7 dias entra na escalada
    render(
      <BadgeVencimento
        dataVencimento="2026-06-05T00:00:00Z"
        vencida={true}
        limiarAtrasada={7}
      />,
    )
    expect(screen.getByText('Atrasada >7d')).toBeInTheDocument()
  })

  it('comData=false: omite a data formatada acima do badge', () => {
    render(
      <BadgeVencimento
        dataVencimento="2026-06-10T00:00:00Z"
        vencida={true}
        comData={false}
      />,
    )
    expect(screen.getByText('Vencida')).toBeInTheDocument()
    // 10/06/2026 não aparece
    expect(screen.queryByText('10/06/2026')).not.toBeInTheDocument()
  })
})
