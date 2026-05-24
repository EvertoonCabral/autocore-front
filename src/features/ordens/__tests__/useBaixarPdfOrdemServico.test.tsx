import { describe, expect, it, beforeEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { server } from '@/test/msw/server'
import { useBaixarPdfOrdemServico } from '../hooks/useBaixarPdfOrdemServico'

const API = 'http://localhost:5206'

// jsdom não implementa URL.createObjectURL/revokeObjectURL; instalamos stubs
// que podem ser sobrescritos via spyOn em cada teste.
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

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

/**
 * Hook chama um endpoint que retorna `application/pdf` direto (não envelope).
 * Em sucesso, abre uma nova aba via `window.open`. Em erro, lê `erro` do
 * body JSON (formato ApiErrorResponse do back) e joga `Error` com a mensagem.
 */
describe('useBaixarPdfOrdemServico', () => {
  it('200 com PDF → abre nova aba e revoga URL depois', async () => {
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]) // "%PDF"
    server.use(
      http.get(`${API}/api/ordens/1/pdf`, () =>
        HttpResponse.arrayBuffer(pdfBytes.buffer, {
          headers: { 'Content-Type': 'application/pdf' },
        }),
      ),
    )

    const createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:fake-url')
    const open = vi.spyOn(window, 'open').mockReturnValue(null)

    const { result } = renderHook(() => useBaixarPdfOrdemServico(), {
      wrapper: makeWrapper(),
    })

    await result.current.mutateAsync({ id: 1, tipo: 'orcamento' })

    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(open).toHaveBeenCalledWith('blob:fake-url', '_blank', 'noopener,noreferrer')
  })

  it('400 com { erro } → throw com mensagem do back', async () => {
    server.use(
      http.get(`${API}/api/ordens/1/pdf`, () =>
        HttpResponse.json({ erro: 'Orçamento só em OS aberta.' }, { status: 400 }),
      ),
    )

    const { result } = renderHook(() => useBaixarPdfOrdemServico(), {
      wrapper: makeWrapper(),
    })

    await waitFor(async () => {
      await expect(
        result.current.mutateAsync({ id: 1, tipo: 'orcamento' }),
      ).rejects.toThrow('Orçamento só em OS aberta.')
    })
  })

  it('500 sem JSON → throw com mensagem padrão por HTTP', async () => {
    server.use(
      http.get(`${API}/api/ordens/1/pdf`, () =>
        HttpResponse.text('boom', { status: 500 }),
      ),
    )

    const { result } = renderHook(() => useBaixarPdfOrdemServico(), {
      wrapper: makeWrapper(),
    })

    await waitFor(async () => {
      await expect(
        result.current.mutateAsync({ id: 1, tipo: 'orcamento' }),
      ).rejects.toThrow(/HTTP 500/)
    })
  })
})
