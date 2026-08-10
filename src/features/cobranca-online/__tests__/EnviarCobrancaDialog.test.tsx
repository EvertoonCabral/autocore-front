import { describe, expect, it, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { EnviarCobrancaDialog } from '../components/EnviarCobrancaDialog'

const API = 'http://localhost:5206'

beforeEach(() => server.resetHandlers())

describe('<EnviarCobrancaDialog>', () => {
  it('bloqueia quando o cliente não tem CPF/CNPJ', () => {
    renderWithProviders(
      <EnviarCobrancaDialog ordemId={7} numero="OS-2026-0007" clienteTemDocumento={false} />,
      { withAuth: false },
    )
    expect(screen.getByRole('button', { name: /enviar cobrança/i })).toBeDisabled()
  })

  it('envia a cobrança e mostra sucesso', async () => {
    server.use(
      http.post(`${API}/api/cobrancas/enviar-documento/:id`, () =>
        HttpResponse.json({
          dados: {
            status: 'Enviada',
            mensagem: 'Cobrança enviada por WhatsApp com o documento em anexo.',
            intencaoPagamentoId: 99,
            canalUsado: 'WhatsApp',
            erroEnvio: null,
          },
        }),
      ),
    )

    renderWithProviders(
      <EnviarCobrancaDialog ordemId={7} numero="OS-2026-0007" clienteTemDocumento />,
      { withAuth: false },
    )

    await userEvent.click(screen.getByRole('button', { name: /enviar cobrança/i }))
    // dentro do dialog há o botão "Enviar"
    await userEvent.click(screen.getByRole('button', { name: /^enviar$/i }))

    // dialog fecha ao enviar com sucesso → o gatilho volta a ser o único visível
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /^enviar$/i })).not.toBeInTheDocument(),
    )
  })

  it('permite escolher o meio Link', async () => {
    renderWithProviders(
      <EnviarCobrancaDialog ordemId={7} numero="OS-2026-0007" clienteTemDocumento />,
      { withAuth: false },
    )
    await userEvent.click(screen.getByRole('button', { name: /enviar cobrança/i }))
    const tabLink = screen.getByRole('tab', { name: /link de pagamento/i })
    await userEvent.click(tabLink)
    await waitFor(() => expect(tabLink).toHaveAttribute('aria-selected', 'true'))
  })
})
