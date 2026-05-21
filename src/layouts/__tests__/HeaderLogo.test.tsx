import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { HeaderLogo } from '../components/HeaderLogo'

const API = 'http://localhost:5206'

beforeEach(() => server.resetHandlers())

describe('<HeaderLogo>', () => {
  it('renderiza nome da empresa como texto quando não há logoHash', async () => {
    server.use(
      http.get(`${API}/api/configuracoes/empresa`, () =>
        HttpResponse.json({
          dados: {
            nomeEmpresa: 'Auto Elétrica Central',
            logoHash: null,
            logoMimeType: null,
          },
        }),
      ),
    )

    renderWithProviders(<HeaderLogo />, { withAuth: false })

    await waitFor(() =>
      expect(screen.getByText('Auto Elétrica Central')).toBeInTheDocument(),
    )
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('renderiza <img> apontando para o endpoint com ?v={hash} quando há logoHash', async () => {
    server.use(
      http.get(`${API}/api/configuracoes/empresa`, () =>
        HttpResponse.json({
          dados: {
            nomeEmpresa: 'Auto X',
            logoHash: 'abc123',
            logoMimeType: 'image/png',
          },
        }),
      ),
    )

    renderWithProviders(<HeaderLogo />, { withAuth: false })

    const img = (await screen.findByRole('img', { name: /auto x/i })) as HTMLImageElement
    expect(img.src).toContain('/api/configuracoes/empresa/logo')
    expect(img.src).toContain('v=abc123')
    expect(img.crossOrigin).toBe('use-credentials')
  })

  it('fallback "AutoCore" quando a query ainda não respondeu', () => {
    // Sem handler: a query fica pending. Como retry=false e gcTime=0, a UI
    // exibe o fallback enquanto isLoading é true.
    server.use(
      http.get(`${API}/api/configuracoes/empresa`, () =>
        HttpResponse.json({ erro: 'Erro' }, { status: 500 }),
      ),
    )

    renderWithProviders(<HeaderLogo />, { withAuth: false })
    expect(screen.getByText('AutoCore')).toBeInTheDocument()
  })
})
