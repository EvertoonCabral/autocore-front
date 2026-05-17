import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { server } from '@/test/msw/server'
import { useListarOperacoesEntidade } from '../hooks/useListarOperacoesEntidade'

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

describe('useListarOperacoesEntidade', () => {
  it('chama o endpoint correto e retorna a lista', async () => {
    let chamado = ''
    server.use(
      http.get(`${API}/api/auditoria/:tipo/:id`, ({ params }) => {
        chamado = `${params['tipo']}/${params['id']}`
        return HttpResponse.json({
          dados: [
            {
              id: 1,
              ocorridoEm: '2026-05-14T10:00:00Z',
              tipoEntidade: 'Cliente',
              entidadeId: 42,
              operacao: 'Criar',
              descricao: null,
              usuarioId: null,
              usuarioNome: null,
            },
          ],
        })
      }),
    )

    const { result } = renderHook(() => useListarOperacoesEntidade('Cliente', 42), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(chamado).toBe('Cliente/42')
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0]?.operacao).toBe('Criar')
  })

  it('respeita enabled=false e não dispara request', async () => {
    let called = false
    server.use(
      http.get(`${API}/api/auditoria/:tipo/:id`, () => {
        called = true
        return HttpResponse.json({ dados: [] })
      }),
    )

    const { result } = renderHook(
      () => useListarOperacoesEntidade('Cliente', 42, { enabled: false }),
      { wrapper: makeWrapper() },
    )

    // pequena espera para garantir que nada disparou
    await new Promise((r) => setTimeout(r, 30))
    expect(called).toBe(false)
    expect(result.current.isFetching).toBe(false)
  })
})
