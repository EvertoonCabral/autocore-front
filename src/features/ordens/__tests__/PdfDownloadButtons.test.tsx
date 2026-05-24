import { describe, expect, it, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { Toaster } from 'sonner'
import { server } from '@/test/msw/server'
import { PdfDownloadButtons } from '../components/PdfDownloadButtons'
import type { StatusOrdem } from '@/shared/enums/statusOrdem'

const API = 'http://localhost:5206'

// jsdom não implementa URL.createObjectURL/revokeObjectURL
if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = () => 'blob:stub'
}
if (typeof URL.revokeObjectURL === 'undefined') {
  URL.revokeObjectURL = () => {}
}

beforeEach(() => {
  server.resetHandlers()
  vi.restoreAllMocks()
})

function renderWith(
  props: { ordemId: number; status: StatusOrdem; totalGeral: number; totalPago: number },
) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        {children}
        <Toaster />
      </QueryClientProvider>
    )
  }
  return render(<PdfDownloadButtons {...props} />, { wrapper: Wrapper })
}

describe('<PdfDownloadButtons>', () => {
  it('OS Aberta (status=1) → mostra só "Imprimir orçamento"', () => {
    renderWith({ ordemId: 1, status: 1 as StatusOrdem, totalGeral: 100, totalPago: 0 })
    expect(screen.getByRole('button', { name: /imprimir orçamento/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /imprimir recibo/i })).not.toBeInTheDocument()
  })

  it('OS EmAndamento (status=2) → mostra "Imprimir orçamento"', () => {
    renderWith({ ordemId: 1, status: 2 as StatusOrdem, totalGeral: 100, totalPago: 0 })
    expect(screen.getByRole('button', { name: /imprimir orçamento/i })).toBeInTheDocument()
  })

  it('OS AguardandoProduto (status=3) → mostra "Imprimir orçamento"', () => {
    renderWith({ ordemId: 1, status: 3 as StatusOrdem, totalGeral: 100, totalPago: 0 })
    expect(screen.getByRole('button', { name: /imprimir orçamento/i })).toBeInTheDocument()
  })

  it('OS Concluida + totalmente paga → mostra só "Imprimir recibo"', () => {
    renderWith({ ordemId: 1, status: 4 as StatusOrdem, totalGeral: 100, totalPago: 100 })
    expect(screen.getByRole('button', { name: /imprimir recibo/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /imprimir orçamento/i })).not.toBeInTheDocument()
  })

  it('OS Concluida com saldo devedor → não mostra nenhum botão de impressão', () => {
    renderWith({
      ordemId: 1,
      status: 4 as StatusOrdem,
      totalGeral: 100,
      totalPago: 50,
    })
    expect(screen.queryByRole('button', { name: /imprimir orçamento/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /imprimir recibo/i })).not.toBeInTheDocument()
  })

  it('OS Cancelada (status=5) → não mostra nenhum botão de impressão', () => {
    renderWith({
      ordemId: 1,
      status: 5 as StatusOrdem,
      totalGeral: 100,
      totalPago: 100,
    })
    expect(screen.queryByRole('button', { name: /imprimir orçamento/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /imprimir recibo/i })).not.toBeInTheDocument()
  })

  it('clicar em "Imprimir orçamento" chama o endpoint com tipo=orcamento', async () => {
    let urlChamada: string | null = null
    server.use(
      http.get(`${API}/api/ordens/:id/pdf`, ({ request }) => {
        urlChamada = request.url
        return HttpResponse.arrayBuffer(new Uint8Array([0x25, 0x50, 0x44, 0x46]).buffer, {
          headers: { 'Content-Type': 'application/pdf' },
        })
      }),
    )
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake')
    vi.spyOn(window, 'open').mockReturnValue(null)

    renderWith({ ordemId: 42, status: 1 as StatusOrdem, totalGeral: 100, totalPago: 0 })

    await userEvent.click(screen.getByRole('button', { name: /imprimir orçamento/i }))

    // Aguarda a request acontecer
    await vi.waitFor(() => {
      expect(urlChamada).toContain('/api/ordens/42/pdf')
      expect(urlChamada).toContain('tipo=orcamento')
    })
  })
})
