import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { server } from '@/test/msw/server'
import { useListarAuditoria } from '../hooks/useListarAuditoria'

const API = 'http://localhost:5206'

beforeEach(() => server.resetHandlers())

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

describe('useListarAuditoria', () => {
  it('repassa todos os filtros como query params', async () => {
    let url: URL | null = null
    server.use(
      http.get(`${API}/api/auditoria`, ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json({
          dados: [],
          total: 0,
          pagina: 1,
          porPagina: 20,
        })
      }),
    )

    const { result } = renderHook(
      () =>
        useListarAuditoria({
          pagina: 1,
          porPagina: 20,
          usuarioId: 7,
          tipoEntidade: 'OrdemServico',
          operacao: 'Fechar',
          de: '2026-05-01',
          ate: '2026-05-31',
        }),
      { wrapper: makeWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(url).not.toBeNull()
    const params = url!.searchParams
    expect(params.get('pagina')).toBe('1')
    expect(params.get('porPagina')).toBe('20')
    expect(params.get('usuarioId')).toBe('7')
    expect(params.get('tipoEntidade')).toBe('OrdemServico')
    expect(params.get('operacao')).toBe('Fechar')
    expect(params.get('de')).toBe('2026-05-01')
    expect(params.get('ate')).toBe('2026-05-31')
  })

  it('omite filtros vazios/undefined', async () => {
    let url: URL | null = null
    server.use(
      http.get(`${API}/api/auditoria`, ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json({ dados: [], total: 0, pagina: 1, porPagina: 20 })
      }),
    )

    const { result } = renderHook(
      () => useListarAuditoria({ pagina: 1, porPagina: 20 }),
      { wrapper: makeWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const params = url!.searchParams
    expect(params.get('usuarioId')).toBeNull()
    expect(params.get('tipoEntidade')).toBeNull()
    expect(params.get('operacao')).toBeNull()
    expect(params.get('de')).toBeNull()
    expect(params.get('ate')).toBeNull()
  })
})
