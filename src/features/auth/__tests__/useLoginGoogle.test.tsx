import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { server } from '@/test/msw/server'
import { AuthProvider } from '../auth-context'
import { useLoginGoogle } from '../hooks/useLoginGoogle'

const API = 'http://localhost:5206'

beforeEach(() => server.resetHandlers())

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    )
  }
}

describe('useLoginGoogle', () => {
  it('POSTa o idToken para /api/auth/login/google e devolve o LoginResultDto', async () => {
    let corpoRecebido: unknown
    server.use(
      http.post(`${API}/api/auth/login/google`, async ({ request }) => {
        corpoRecebido = await request.json()
        return HttpResponse.json({
          dados: {
            token: 'jwt-google',
            email: 'user@gmail.com',
            nomeCompleto: 'Usuário Google',
            role: 'Operador',
            expiraEm: new Date(Date.now() + 3600_000).toISOString(),
          },
        })
      }),
    )

    const { result } = renderHook(() => useLoginGoogle(), { wrapper: makeWrapper() })
    const dados = await result.current.mutateAsync({ idToken: 'fake-id-token' })

    expect(corpoRecebido).toEqual({ idToken: 'fake-id-token' })
    expect(dados.token).toBe('jwt-google')
  })

  it('propaga erro quando o back rejeita a conta Google (401)', async () => {
    server.use(
      http.post(`${API}/api/auth/login/google`, () =>
        HttpResponse.json({ erro: 'Conta não autorizada.' }, { status: 401 }),
      ),
    )

    const { result } = renderHook(() => useLoginGoogle(), { wrapper: makeWrapper() })
    await waitFor(async () => {
      await expect(result.current.mutateAsync({ idToken: 'x' })).rejects.toMatchObject({
        status: 401,
      })
    })
  })
})
