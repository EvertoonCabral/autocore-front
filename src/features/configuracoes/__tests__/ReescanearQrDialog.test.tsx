import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse, delay } from 'msw'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { ReescanearQrDialog } from '../components/ReescanearQrDialog'

const API = 'http://localhost:5206'

// Base64 mínimo válido (1x1 PNG transparente).
const FAKE_QR_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

beforeEach(() => server.resetHandlers())

describe('<ReescanearQrDialog>', () => {
  it('mostra skeleton de loading ao montar', async () => {
    server.use(
      http.post(`${API}/api/configuracoes/cobranca/reescanear-qr`, async () => {
        await delay(200)
        return HttpResponse.json({
          dados: { qrCodeBase64: FAKE_QR_BASE64, consultadoEm: '2026-05-17T10:00:00Z' },
        })
      }),
    )

    renderWithProviders(<ReescanearQrDialog open={true} onOpenChange={() => {}} />, {
      withAuth: false,
    })

    // O mutate roda dentro de useEffect — espera o estado de loading aparecer.
    expect(await screen.findByText(/gerando qr code/i)).toBeInTheDocument()
  })

  it('renderiza <img> com src base64 + prefixo data:image/png ao receber sucesso', async () => {
    server.use(
      http.post(`${API}/api/configuracoes/cobranca/reescanear-qr`, () =>
        HttpResponse.json({
          dados: { qrCodeBase64: FAKE_QR_BASE64, consultadoEm: '2026-05-17T10:00:00Z' },
        }),
      ),
    )

    renderWithProviders(<ReescanearQrDialog open={true} onOpenChange={() => {}} />, {
      withAuth: false,
    })

    const img = await screen.findByRole('img', { name: /qr code da evolution/i })
    expect(img).toHaveAttribute('src', `data:image/png;base64,${FAKE_QR_BASE64}`)
  })

  it('renderiza erroMensagem do back + botão "Tentar novamente"', async () => {
    server.use(
      http.post(`${API}/api/configuracoes/cobranca/reescanear-qr`, () =>
        HttpResponse.json({
          dados: {
            erroMensagem: 'Desligue o modo stub para reescanear',
            consultadoEm: '2026-05-17T10:00:00Z',
          },
        }),
      ),
    )

    renderWithProviders(<ReescanearQrDialog open={true} onOpenChange={() => {}} />, {
      withAuth: false,
    })

    await waitFor(() =>
      expect(
        screen.getByText(/desligue o modo stub para reescanear/i),
      ).toBeInTheDocument(),
    )
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument()
  })

  it('botão "Tentar novamente" refaz a mutation', async () => {
    let chamadas = 0
    server.use(
      http.post(`${API}/api/configuracoes/cobranca/reescanear-qr`, () => {
        chamadas += 1
        if (chamadas === 1) {
          return HttpResponse.json({
            dados: {
              erroMensagem: 'Falha temporária',
              consultadoEm: '2026-05-17T10:00:00Z',
            },
          })
        }
        return HttpResponse.json({
          dados: { qrCodeBase64: FAKE_QR_BASE64, consultadoEm: '2026-05-17T10:00:01Z' },
        })
      }),
    )

    renderWithProviders(<ReescanearQrDialog open={true} onOpenChange={() => {}} />, {
      withAuth: false,
    })

    await waitFor(() => expect(screen.getByText(/falha temporária/i)).toBeInTheDocument())

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /tentar novamente/i }))

    const img = await screen.findByRole('img', { name: /qr code da evolution/i })
    expect(img).toBeInTheDocument()
    expect(chamadas).toBe(2)
  })
})
