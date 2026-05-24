import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { type ReactNode } from 'react'
import { server } from '@/test/msw/server'
import { BadgeNotificacoes } from '../components/BadgeNotificacoes'

const API = 'http://localhost:5206'

beforeEach(() => server.resetHandlers())

function renderBadge() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    )
  }
  return render(<BadgeNotificacoes />, { wrapper: Wrapper })
}

describe('<BadgeNotificacoes>', () => {
  it('sem pendências → sino sem badge', async () => {
    server.use(
      http.get(`${API}/api/dashboard/pendencias`, () =>
        HttpResponse.json({
          dados: { pendenciasVencidas: 0, ossAguardandoProdutoHa7Dias: 0 },
        }),
      ),
    )

    renderBadge()
    // Aguarda a query terminar
    await screen.findByRole('button', { name: /^notificações$/i })
    // Não há texto "X" indicando contagem.
    expect(screen.queryByText('5')).not.toBeInTheDocument()
  })

  it('com pendências → mostra contagem total no badge e aria-label', async () => {
    server.use(
      http.get(`${API}/api/dashboard/pendencias`, () =>
        HttpResponse.json({
          dados: { pendenciasVencidas: 3, ossAguardandoProdutoHa7Dias: 2 },
        }),
      ),
    )

    renderBadge()

    // Total = 3 + 2 = 5 no aria-label e visível no badge
    expect(
      await screen.findByRole('button', { name: /notificações \(5\)/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('mais de 99 → mostra "99+"', async () => {
    server.use(
      http.get(`${API}/api/dashboard/pendencias`, () =>
        HttpResponse.json({
          dados: { pendenciasVencidas: 100, ossAguardandoProdutoHa7Dias: 50 },
        }),
      ),
    )

    renderBadge()
    expect(await screen.findByText('99+')).toBeInTheDocument()
  })

  it('abrir dropdown sem pendências → mostra "Tudo em dia"', async () => {
    server.use(
      http.get(`${API}/api/dashboard/pendencias`, () =>
        HttpResponse.json({
          dados: { pendenciasVencidas: 0, ossAguardandoProdutoHa7Dias: 0 },
        }),
      ),
    )

    renderBadge()
    const sino = await screen.findByRole('button', { name: /notificações/i })
    await userEvent.click(sino)
    expect(await screen.findByText(/tudo em dia/i)).toBeInTheDocument()
  })

  it('abrir dropdown com pendências → mostra itens com links', async () => {
    server.use(
      http.get(`${API}/api/dashboard/pendencias`, () =>
        HttpResponse.json({
          dados: { pendenciasVencidas: 3, ossAguardandoProdutoHa7Dias: 1 },
        }),
      ),
    )

    renderBadge()
    const sino = await screen.findByRole('button', { name: /notificações \(4\)/i })
    await userEvent.click(sino)

    expect(await screen.findByText(/3 OSs vencidas/i)).toBeInTheDocument()
    expect(screen.getByText(/1 OS aguardando produto/i)).toBeInTheDocument()
  })
})
