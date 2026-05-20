import { describe, expect, it } from 'vitest'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { DistribuicaoStatusChart } from '../components/DistribuicaoStatusChart'

describe('<DistribuicaoStatusChart>', () => {
  it('renderiza com dados e mostra labels dos status', async () => {
    const { container } = renderWithProviders(
      <DistribuicaoStatusChart
        statusOsAbertas={[
          { status: 1, statusLabel: 'Aberta', quantidade: 5 },
          { status: 2, statusLabel: 'Em andamento', quantidade: 3 },
          { status: 3, statusLabel: 'Aguardando produto', quantidade: 2 },
        ]}
      />,
      { withAuth: false },
    )

    expect(screen.getByText('Aberta')).toBeInTheDocument()
    expect(screen.getByText('Em andamento')).toBeInTheDocument()
    expect(screen.getByText('Aguardando produto')).toBeInTheDocument()

    // 3 setores no donut (renderiza async via ResizeObserver)
    await waitFor(() => {
      expect(container.querySelectorAll('.recharts-pie-sector').length).toBe(3)
    })

    // Total no centro do donut (5 + 3 + 2 = 10)
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('exibe empty state quando o array é vazio', () => {
    renderWithProviders(<DistribuicaoStatusChart statusOsAbertas={[]} />, {
      withAuth: false,
    })
    expect(
      screen.getByText(/nenhuma os em aberto no momento/i),
    ).toBeInTheDocument()
  })
})
