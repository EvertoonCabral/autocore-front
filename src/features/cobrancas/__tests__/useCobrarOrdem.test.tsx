import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { server } from '@/test/msw/server'
import { useCobrarOrdem } from '../hooks/useCobrarOrdem'

const API = 'http://localhost:5206'

beforeEach(() => server.resetHandlers())

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

/**
 * O endpoint POST /api/cobrancas/disparar/{id} retorna o mesmo envelope
 * { dados: { status, mensagem?, erroEnvio? } } em três códigos HTTP:
 *
 *   - 200 OK            (status: Enviada | JaEnviadaHoje)
 *   - 400 Bad Request   (status: OsInvalida — regra de negócio)
 *   - 502 Bad Gateway   (status: Falha — Evolution API indisponível)
 *
 * O hook precisa normalizar todos os três códigos para retornar o objeto
 * discriminado ao caller, em vez de jogar no catch. O CobrarOrdemButton
 * depende disso para mostrar a mensagem certa (toast.success / toast.info /
 * toast.error) baseado em r.status.
 */
describe('useCobrarOrdem', () => {
  it('200 Enviada → retorna dados.status="Enviada"', async () => {
    server.use(
      http.post(`${API}/api/cobrancas/disparar/:id`, () =>
        HttpResponse.json({
          dados: { status: 'Enviada', mensagem: null, erroEnvio: null },
        }),
      ),
    )

    const { result } = renderHook(() => useCobrarOrdem(), { wrapper: makeWrapper() })
    const r = await result.current.mutateAsync(1)
    expect(r.status).toBe('Enviada')
  })

  it('200 JaEnviadaHoje → retorna dados.status="JaEnviadaHoje"', async () => {
    server.use(
      http.post(`${API}/api/cobrancas/disparar/:id`, () =>
        HttpResponse.json({
          dados: { status: 'JaEnviadaHoje', mensagem: 'Já enviada hoje.', erroEnvio: null },
        }),
      ),
    )

    const { result } = renderHook(() => useCobrarOrdem(), { wrapper: makeWrapper() })
    const r = await result.current.mutateAsync(1)
    expect(r.status).toBe('JaEnviadaHoje')
    expect(r.mensagem).toBe('Já enviada hoje.')
  })

  it('400 OsInvalida → preserva discriminador (não joga no catch)', async () => {
    server.use(
      http.post(`${API}/api/cobrancas/disparar/:id`, () =>
        HttpResponse.json(
          { dados: { status: 'OsInvalida', mensagem: 'OS não pode receber cobrança.', erroEnvio: null } },
          { status: 400 },
        ),
      ),
    )

    const { result } = renderHook(() => useCobrarOrdem(), { wrapper: makeWrapper() })
    const r = await result.current.mutateAsync(1)
    expect(r.status).toBe('OsInvalida')
    expect(r.mensagem).toBe('OS não pode receber cobrança.')
  })

  it('502 Falha → preserva discriminador com erroEnvio', async () => {
    server.use(
      http.post(`${API}/api/cobrancas/disparar/:id`, () =>
        HttpResponse.json(
          {
            dados: {
              status: 'Falha',
              mensagem: 'Falha ao enviar cobrança.',
              erroEnvio: 'Nenhuma conexão pôde ser feita.',
            },
          },
          { status: 502 },
        ),
      ),
    )

    const { result } = renderHook(() => useCobrarOrdem(), { wrapper: makeWrapper() })
    const r = await result.current.mutateAsync(1)
    expect(r.status).toBe('Falha')
    expect(r.erroEnvio).toBe('Nenhuma conexão pôde ser feita.')
  })

  it('erro sem discriminador (ex.: 500 inesperado) → throw ApiError', async () => {
    server.use(
      http.post(`${API}/api/cobrancas/disparar/:id`, () =>
        HttpResponse.json({ erro: 'Erro inesperado.' }, { status: 500 }),
      ),
    )

    const { result } = renderHook(() => useCobrarOrdem(), { wrapper: makeWrapper() })
    await waitFor(async () => {
      await expect(result.current.mutateAsync(1)).rejects.toBeTruthy()
    })
  })
})
