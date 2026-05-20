import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { FaturamentoChart } from '../components/FaturamentoChart'

const API = 'http://localhost:5206'

interface MesMock {
  mes: number
  ano: number
  mesLabel: string
  total: number
}

function mockFaturamento(setupHandler: (mesesParam: string) => MesMock[]) {
  server.use(
    http.get(`${API}/api/dashboard/faturamento`, ({ request }) => {
      const url = new URL(request.url)
      const m = url.searchParams.get('meses') ?? ''
      return HttpResponse.json({ dados: setupHandler(m) })
    }),
  )
}

describe('<FaturamentoChart>', () => {
  it('renderiza barras com os dados retornados', async () => {
    mockFaturamento(() => [
      { mes: 3, ano: 2026, mesLabel: 'mar/26', total: 1000 },
      { mes: 4, ano: 2026, mesLabel: 'abr/26', total: 2200 },
      { mes: 5, ano: 2026, mesLabel: 'mai/26', total: 1750 },
    ])

    const { container } = renderWithProviders(<FaturamentoChart />, {
      withAuth: false,
    })

    // Aguarda o gráfico renderizar (Recharts gera <svg> dentro do container)
    await waitFor(() => {
      expect(container.querySelector('svg')).toBeTruthy()
    })

    // 3 barras renderizadas (uma por mês) — selector estável v3
    await waitFor(() => {
      const bars = container.querySelectorAll('.recharts-bar .recharts-rectangle')
      expect(bars.length).toBe(3)
    })
  })

  it('mostra skeleton enquanto carrega', () => {
    server.use(
      http.get(`${API}/api/dashboard/faturamento`, async () => {
        await new Promise(() => {}) // nunca resolve no escopo do teste
        return HttpResponse.json({ dados: [] })
      }),
    )

    const { container } = renderWithProviders(<FaturamentoChart />, {
      withAuth: false,
    })

    expect(container.querySelector('.animate-pulse')).toBeTruthy()
  })

  it('muda os meses no select e refaz a request', async () => {
    let lastMeses = ''
    server.use(
      http.get(`${API}/api/dashboard/faturamento`, ({ request }) => {
        const url = new URL(request.url)
        lastMeses = url.searchParams.get('meses') ?? ''
        return HttpResponse.json({ dados: [] })
      }),
    )

    renderWithProviders(<FaturamentoChart />, { withAuth: false })

    // Primeira chamada — default 6
    await waitFor(() => expect(lastMeses).toBe('6'))

    const trigger = screen.getByRole('combobox', { name: /período/i })
    await userEvent.click(trigger)
    const opcao12 = await screen.findByRole('option', { name: '12 meses' })
    await userEvent.click(opcao12)

    await waitFor(() => expect(lastMeses).toBe('12'))
  })
})
