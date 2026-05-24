import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { server } from '@/test/msw/server'
import { TimelineOrdem } from '../components/TimelineOrdem'

const API = 'http://localhost:5206'

beforeEach(() => server.resetHandlers())

function renderWith(ordemId: number) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
  return render(<TimelineOrdem ordemId={ordemId} />, { wrapper: Wrapper })
}

describe('<TimelineOrdem>', () => {
  it('lista vazia → não renderiza nada', async () => {
    server.use(
      http.get(`${API}/api/ordens/1/timeline`, () =>
        HttpResponse.json({ dados: [] }),
      ),
    )
    const { container } = renderWith(1)
    // Aguarda a query terminar (não renderiza skeleton para sempre)
    await screen.findByText((_, el) => !el || el.children.length === 0, { exact: false }).catch(() => null)
    // O componente retorna null quando data === [] — esperamos só os filhos do wrapper sem nada
    await new Promise((r) => setTimeout(r, 30))
    expect(container.querySelector('ol')).toBeNull()
  })

  it('renderiza pagamento com valor e forma de pagamento', async () => {
    server.use(
      http.get(`${API}/api/ordens/1/timeline`, () =>
        HttpResponse.json({
          dados: [
            {
              tipo: 2, // Pagamento
              ocorridoEm: '2026-05-22T10:00:00Z',
              titulo: 'Pagamento registrado',
              descricao: 'Pagamento parcial',
              usuarioId: 1,
              usuarioNome: 'Operador X',
              valor: 50,
              formaPagamento: 2, // Pix
              cobrancaSucesso: null,
            },
          ],
        }),
      ),
    )

    renderWith(1)

    expect(await screen.findByText('Pagamento registrado')).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*50,00/)).toBeInTheDocument()
    expect(screen.getByText(/Pix/)).toBeInTheDocument()
    expect(screen.getByText(/por Operador X/)).toBeInTheDocument()
  })

  it('renderiza item de serviço adicionado', async () => {
    server.use(
      http.get(`${API}/api/ordens/1/timeline`, () =>
        HttpResponse.json({
          dados: [
            {
              tipo: 3, // ItemServicoAdicionado
              ocorridoEm: '2026-05-22T11:00:00Z',
              titulo: 'Serviço adicionado: Troca de óleo (x1)',
              descricao: null,
              usuarioId: 1,
              usuarioNome: 'Ana',
              valor: 80,
              formaPagamento: null,
              cobrancaSucesso: null,
            },
          ],
        }),
      ),
    )

    renderWith(1)

    expect(
      await screen.findByText(/Serviço adicionado: Troca de óleo/),
    ).toBeInTheDocument()
  })

  it('renderiza cobrança com falha em destaque', async () => {
    server.use(
      http.get(`${API}/api/ordens/1/timeline`, () =>
        HttpResponse.json({
          dados: [
            {
              tipo: 5, // Cobranca
              ocorridoEm: '2026-05-22T12:00:00Z',
              titulo: 'Falha no envio de cobrança',
              descricao: 'timeout',
              usuarioId: null,
              usuarioNome: null,
              valor: null,
              formaPagamento: null,
              cobrancaSucesso: false,
            },
          ],
        }),
      ),
    )

    renderWith(1)

    expect(await screen.findByText('Falha no envio de cobrança')).toBeInTheDocument()
    expect(screen.getByText(/timeout/)).toBeInTheDocument()
    expect(screen.getByText(/\(sistema\)/)).toBeInTheDocument()
  })

  it('quando endpoint falha → mostra mensagem de erro', async () => {
    server.use(
      http.get(`${API}/api/ordens/1/timeline`, () =>
        HttpResponse.json({ erro: 'oops' }, { status: 500 }),
      ),
    )

    renderWith(1)

    expect(
      await screen.findByText(/não foi possível carregar/i),
    ).toBeInTheDocument()
  })
})
