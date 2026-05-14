import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { Routes, Route } from 'react-router-dom'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { HistoricoCobrancaPage } from '../routes/HistoricoCobrancaPage'

const API = 'http://localhost:5206'

function mockHistorico() {
  server.use(
    http.get(`${API}/api/cobrancas/historico`, () =>
      HttpResponse.json({
        dados: [
          {
            id: 1,
            ordemServicoId: 7,
            ordemNumero: 'OS-0007',
            telefoneDestino: '5544999990000',
            enviadoEm: '2026-05-14T08:00:00Z',
            sucesso: true,
            erroMensagem: null,
          },
        ],
        total: 1,
        pagina: 1,
        porPagina: 20,
      }),
    ),
  )
}

function setupAdmin() {
  server.use(
    http.get(`${API}/api/auth/me`, () =>
      HttpResponse.json({
        dados: {
          id: 1,
          nomeCompleto: 'Administrador',
          email: 'admin@autocore.com',
          role: 'Admin',
          ativo: true,
        },
      }),
    ),
  )
  mockHistorico()
}

function setupOperador() {
  server.use(
    http.get(`${API}/api/auth/me`, () =>
      HttpResponse.json({
        dados: {
          id: 2,
          nomeCompleto: 'Operador',
          email: 'op@autocore.com',
          role: 'Operador',
          ativo: true,
        },
      }),
    ),
  )
  mockHistorico()
}

beforeEach(() => server.resetHandlers())

describe('HistoricoCobrancaPage — gating Admin no disparo manual', () => {
  it('Admin enxerga o botão "Disparar agora"', async () => {
    setupAdmin()
    renderWithProviders(
      <Routes>
        <Route path="/cobrancas" element={<HistoricoCobrancaPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/cobrancas'] } },
    )
    // findByRole espera o GET /me carregar antes do botão renderizar
    expect(
      await screen.findByRole('button', { name: /disparar agora/i }),
    ).toBeInTheDocument()
  })

  it('Operador NÃO enxerga o botão "Disparar agora"', async () => {
    setupOperador()
    renderWithProviders(
      <Routes>
        <Route path="/cobrancas" element={<HistoricoCobrancaPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/cobrancas'] } },
    )
    // Espera a página renderizar
    await waitFor(() =>
      expect(screen.getByText('Cobranças via WhatsApp')).toBeInTheDocument(),
    )
    // Pequena espera adicional para garantir que o user já foi propagado pelo AuthProvider
    await new Promise((r) => setTimeout(r, 100))
    expect(screen.queryByRole('button', { name: /disparar agora/i })).not.toBeInTheDocument()
  })
})
