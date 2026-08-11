import { describe, expect, it, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { ReembolsarIntencaoButton } from '../components/ReembolsarIntencaoButton'
import type { IntencaoPagamentoDto } from '../hooks/useCobrancaOnlineKeys'

const API = 'http://localhost:5206'

const intencaoAprovada: IntencaoPagamentoDto = {
  id: 42,
  ordemServicoId: 7,
  tipo: 1,
  modalidade: 1,
  origem: 1,
  status: 2,
  valorBase: 100,
  taxaPercentualAplicada: 0.99,
  valorAcrescimo: 1,
  valorCobrado: 101,
  pixCopiaECola: null,
  urlCheckout: null,
  expiraEm: null,
  pagamentoId: 55,
  formaDetectada: 2,
  motivoRecusa: null,
  criadoEm: new Date().toISOString(),
}

function mockRole(role: 'Admin' | 'Operador') {
  server.use(
    http.get(`${API}/api/auth/me`, () =>
      HttpResponse.json({
        dados: { id: 1, nomeCompleto: 'U', email: 'u@a.com', role, ativo: true },
      }),
    ),
  )
}

beforeEach(() => server.resetHandlers())

describe('<ReembolsarIntencaoButton>', () => {
  it('não renderiza para Operador', async () => {
    mockRole('Operador')
    renderWithProviders(<ReembolsarIntencaoButton ordemId={7} intencao={intencaoAprovada} />)
    // dá tempo do auth resolver
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /reembolsar/i })).not.toBeInTheDocument()
    })
  })

  it('Admin reembolsa (total) e chama o endpoint', async () => {
    mockRole('Admin')
    let chamado = false
    server.use(
      http.post(`${API}/api/cobranca-online/:id/reembolso`, async ({ request }) => {
        chamado = true
        const body = (await request.json()) as { valor: number | null }
        expect(body.valor).toBeNull()
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderWithProviders(<ReembolsarIntencaoButton ordemId={7} intencao={intencaoAprovada} />)

    const trigger = await screen.findByRole('button', { name: /reembolsar/i })
    await userEvent.click(trigger)
    // botão de confirmação dentro do dialog (destructive)
    const confirmar = screen.getAllByRole('button', { name: /reembolsar/i }).at(-1)!
    await userEvent.click(confirmar)

    await waitFor(() => expect(chamado).toBe(true))
  })
})
