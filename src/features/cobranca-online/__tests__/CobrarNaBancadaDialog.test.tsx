import { describe, expect, it, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { CobrarNaBancadaDialog } from '../components/CobrarNaBancadaDialog'

const API = 'http://localhost:5206'

function intencao(over: Record<string, unknown> = {}) {
  return {
    id: 99,
    ordemServicoId: 7,
    tipo: 1,
    modalidade: 1,
    origem: 1,
    status: 1,
    valorBase: 100,
    taxaPercentualAplicada: 0.99,
    valorAcrescimo: 1,
    valorCobrado: 101,
    pixCopiaECola: '00020126STUB-CODE-PIX6304ABCD',
    urlCheckout: null,
    expiraEm: new Date(Date.now() + 30 * 60_000).toISOString(),
    pagamentoId: null,
    formaDetectada: null,
    motivoRecusa: null,
    criadoEm: new Date().toISOString(),
    ...over,
  }
}

function mockSimular() {
  server.use(
    http.get(`${API}/api/cobranca-online/simular`, () =>
      HttpResponse.json({
        dados: {
          valorBase: 100,
          taxaPercentual: 0.99,
          valorAcrescimo: 1,
          valorCobrado: 101,
          repasseAtivo: true,
        },
      }),
    ),
  )
}

beforeEach(() => server.resetHandlers())

describe('<CobrarNaBancadaDialog>', () => {
  it('bloqueia e orienta quando o cliente não tem CPF/CNPJ', async () => {
    renderWithProviders(
      <CobrarNaBancadaDialog
        ordemId={7}
        numero="OS-2026-0007"
        saldoDevedor={100}
        podeRegistrar
        clienteTemDocumento={false}
      />,
      { withAuth: false },
    )

    const trigger = screen.getByRole('button', { name: /cobrar na bancada/i })
    expect(trigger).toBeDisabled()
  })

  it('gera o QR e reflete a aprovação via polling', async () => {
    mockSimular()
    server.use(
      http.post(`${API}/api/cobranca-online/pix`, () =>
        HttpResponse.json({ dados: intencao() }),
      ),
    )
    // 1ª leitura pendente; a partir da 2ª, aprovado.
    let chamadas = 0
    server.use(
      http.get(`${API}/api/cobranca-online/:id`, () => {
        chamadas += 1
        return HttpResponse.json({
          dados: chamadas >= 2 ? intencao({ status: 2, pagamentoId: 55 }) : intencao(),
        })
      }),
    )

    renderWithProviders(
      <CobrarNaBancadaDialog
        ordemId={7}
        numero="OS-2026-0007"
        saldoDevedor={100}
        podeRegistrar
        clienteTemDocumento
      />,
      { withAuth: false },
    )

    await userEvent.click(screen.getByRole('button', { name: /cobrar na bancada/i }))
    // resumo do valor (via /simular)
    await waitFor(() => expect(screen.getByText(/total a cobrar/i)).toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: /gerar qr pix/i }))

    // O polling reflete a aprovação (registrada na OS pelo back).
    await waitFor(() => expect(screen.getByText(/pagamento aprovado/i)).toBeInTheDocument(), {
      timeout: 6000,
    })
  })

  it('mostra estado expirado quando o QR já venceu', async () => {
    mockSimular()
    const expirada = intencao({ expiraEm: new Date(Date.now() - 1000).toISOString() })
    server.use(
      http.post(`${API}/api/cobranca-online/pix`, () => HttpResponse.json({ dados: expirada })),
      http.get(`${API}/api/cobranca-online/:id`, () => HttpResponse.json({ dados: expirada })),
    )

    renderWithProviders(
      <CobrarNaBancadaDialog
        ordemId={7}
        numero="OS-2026-0007"
        saldoDevedor={100}
        podeRegistrar
        clienteTemDocumento
      />,
      { withAuth: false },
    )

    await userEvent.click(screen.getByRole('button', { name: /cobrar na bancada/i }))
    await waitFor(() => expect(screen.getByText(/total a cobrar/i)).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: /gerar qr pix/i }))

    await waitFor(() => expect(screen.getByText(/qr pix expirado/i)).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /gerar novo qr/i })).toBeInTheDocument()
  })
})
