import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { server } from '@/test/msw/server'
import { useFaturamentoMensal } from '../hooks/useFaturamentoMensal'

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

describe('useFaturamentoMensal', () => {
  it('passa o query param meses corretamente e retorna os dados', async () => {
    let url: URL | null = null
    server.use(
      http.get(`${API}/api/dashboard/faturamento`, ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json({
          dados: [
            { mes: 5, ano: 2026, mesLabel: 'mai/26', total: 1500 },
          ],
        })
      }),
    )

    const { result } = renderHook(() => useFaturamentoMensal(6), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(url).not.toBeNull()
    expect(url!.searchParams.get('meses')).toBe('6')
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0]).toMatchObject({
      mesLabel: 'mai/26',
      total: 1500,
    })
  })

  it('propaga 400 quando o back rejeita o parâmetro', async () => {
    server.use(
      http.get(`${API}/api/dashboard/faturamento`, () =>
        HttpResponse.json({ erro: 'meses inválido' }, { status: 400 }),
      ),
    )

    const { result } = renderHook(() => useFaturamentoMensal(99), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeDefined()
  })
})
