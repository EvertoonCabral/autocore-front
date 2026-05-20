import { describe, expect, it } from 'vitest'
import { renderWithProviders, screen } from '@/test/render'
import { KpiCard } from '../components/KpiCard'

describe('<KpiCard>', () => {
  it('mostra título e valor quando não está carregando', () => {
    renderWithProviders(
      <KpiCard title="OS abertas" value={7} sub="atualmente" />,
      { withAuth: false },
    )

    expect(screen.getByText('OS abertas')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('atualmente')).toBeInTheDocument()
  })

  it('renderiza Skeleton em vez do valor quando loading=true', () => {
    const { container } = renderWithProviders(
      <KpiCard title="OS abertas" value={99} loading />,
      { withAuth: false },
    )

    expect(screen.getByText('OS abertas')).toBeInTheDocument()
    expect(screen.queryByText('99')).not.toBeInTheDocument()
    // Skeleton aparece como div com classe animate-pulse
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
  })

  it('renderiza placeholder "-" quando value é undefined', () => {
    renderWithProviders(<KpiCard title="Vazio" />, { withAuth: false })
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('renderiza ícone opcional no header', () => {
    renderWithProviders(
      <KpiCard
        title="Com ícone"
        value={1}
        icon={<svg data-testid="kpi-icon" aria-hidden="true" />}
      />,
      { withAuth: false },
    )

    expect(screen.getByTestId('kpi-icon')).toBeInTheDocument()
  })
})
