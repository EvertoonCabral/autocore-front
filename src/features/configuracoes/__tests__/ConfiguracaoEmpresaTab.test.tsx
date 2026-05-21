import { describe, expect, it, beforeEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { ConfiguracaoEmpresaTab } from '../components/ConfiguracaoEmpresaTab'

const API = 'http://localhost:5206'

beforeEach(() => {
  server.resetHandlers()
  if (typeof URL.createObjectURL !== 'function') {
    ;(URL as unknown as { createObjectURL: (b: Blob) => string }).createObjectURL = vi
      .fn()
      .mockReturnValue('blob:mock-url')
  }
  if (typeof URL.revokeObjectURL !== 'function') {
    ;(URL as unknown as { revokeObjectURL: (u: string) => void }).revokeObjectURL = vi.fn()
  }
})

describe('<ConfiguracaoEmpresaTab>', () => {
  it('renderiza skeleton enquanto carrega e depois as duas seções', async () => {
    server.use(
      http.get(`${API}/api/configuracoes/empresa`, () =>
        HttpResponse.json({
          dados: {
            nomeEmpresa: 'Auto Elétrica Central',
            logoHash: 'h1',
            logoMimeType: 'image/png',
            atualizadoEm: '2026-05-19T12:00:00Z',
            atualizadoPorUsuarioNome: 'Admin Teste',
          },
        }),
      ),
    )

    renderWithProviders(<ConfiguracaoEmpresaTab />, { withAuth: false })

    // Pelo menos uma seção aparece após o load
    await waitFor(() =>
      expect(screen.getByText(/logo da empresa/i)).toBeInTheDocument(),
    )
    expect(screen.getByText(/identidade da empresa/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nome da empresa/i)).toHaveValue('Auto Elétrica Central')
    // AuditoriaInfo
    expect(screen.getByText(/admin teste/i)).toBeInTheDocument()
  })

  it('mostra empty state quando a query falha', async () => {
    server.use(
      http.get(`${API}/api/configuracoes/empresa`, () =>
        HttpResponse.json({ erro: 'Erro' }, { status: 500 }),
      ),
    )

    renderWithProviders(<ConfiguracaoEmpresaTab />, { withAuth: false })

    await waitFor(() =>
      expect(screen.getByText(/não foi possível carregar a configuração/i)).toBeInTheDocument(),
    )
  })
})
