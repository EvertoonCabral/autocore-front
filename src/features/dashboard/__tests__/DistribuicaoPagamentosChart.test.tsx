import { describe, expect, it } from 'vitest'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { DistribuicaoPagamentosChart } from '../components/DistribuicaoPagamentosChart'

describe('<DistribuicaoPagamentosChart>', () => {
  it('renderiza donut + legenda com 4 formas e cores distintas', async () => {
    const { container } = renderWithProviders(
      <DistribuicaoPagamentosChart
        pagamentos={[
          { forma: 1, formaLabel: 'Dinheiro', valor: 1000, quantidade: 5 },
          { forma: 2, formaLabel: 'Pix', valor: 2500, quantidade: 12 },
          { forma: 3, formaLabel: 'Cartão', valor: 1500, quantidade: 8 },
          { forma: 4, formaLabel: 'Transferência', valor: 500, quantidade: 2 },
        ]}
      />,
      { withAuth: false },
    )

    // Labels da legenda aparecem
    expect(screen.getByText('Dinheiro')).toBeInTheDocument()
    expect(screen.getByText('Pix')).toBeInTheDocument()
    expect(screen.getByText('Cartão')).toBeInTheDocument()
    expect(screen.getByText('Transferência')).toBeInTheDocument()

    // 4 setores no donut (renderiza async via ResizeObserver)
    await waitFor(() => {
      expect(container.querySelectorAll('.recharts-pie-sector').length).toBe(4)
    })

    // Cada setor traz fill na sua <path> interna (.recharts-sector dentro de .recharts-shape)
    const sectorPaths = container.querySelectorAll('.recharts-pie-sector path')
    const fills = new Set(
      Array.from(sectorPaths)
        .map((p) => p.getAttribute('fill'))
        .filter((f): f is string => Boolean(f)),
    )
    // Esperamos as 4 cores fixas do mapa
    expect(fills.has('#10b981')).toBe(true) // Dinheiro
    expect(fills.has('#3b82f6')).toBe(true) // Pix
    expect(fills.has('#f59e0b')).toBe(true) // Cartão
    expect(fills.has('#8b5cf6')).toBe(true) // Transferência
  })

  it('exibe empty state quando o array é vazio', () => {
    renderWithProviders(<DistribuicaoPagamentosChart pagamentos={[]} />, {
      withAuth: false,
    })
    expect(
      screen.getByText(/nenhum pagamento registrado este mês/i),
    ).toBeInTheDocument()
  })

  it('mostra skeleton enquanto loading', () => {
    const { container } = renderWithProviders(
      <DistribuicaoPagamentosChart pagamentos={[]} loading />,
      { withAuth: false },
    )
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
  })
})
