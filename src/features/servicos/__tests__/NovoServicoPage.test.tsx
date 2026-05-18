import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { Routes, Route } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { NovoServicoPage } from '../routes/NovoServicoPage'

const API = 'http://localhost:5206'

function setup({ comPadrao = false } = {}) {
  let criou = false
  server.use(
    http.get(`${API}/api/auth/me`, () =>
      HttpResponse.json({
        dados: {
          id: 1,
          nomeCompleto: 'Administrador',
          email: 'admin@autocore.com',
          role: 'Admin',
          ativo: true,
          podeVerAuditoria: true,
        },
      }),
    ),
    http.get(`${API}/api/servicos`, () =>
      HttpResponse.json({
        dados: comPadrao
          ? [
              {
                id: 1,
                nome: 'Mão de obra padrão atual',
                preco: 100,
                ehMaoDeObraPadrao: true,
                ativo: true,
              },
            ]
          : [],
      }),
    ),
    http.post(`${API}/api/servicos`, async () => {
      criou = true
      return HttpResponse.json({ dados: { id: 42 } }, { status: 201 })
    }),
  )
  return { foiCriado: () => criou }
}

beforeEach(() => server.resetHandlers())

describe('NovoServicoPage', () => {
  it('renderiza o formulário vazio', async () => {
    setup()
    renderWithProviders(
      <Routes>
        <Route path="/servicos/novo" element={<NovoServicoPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/servicos/novo'] } },
    )
    await waitFor(() => expect(screen.getByLabelText(/^Nome/)).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /cadastrar/i })).toBeInTheDocument()
  })

  it('submit válido chama mutation', async () => {
    const tracker = setup()
    const user = userEvent.setup()
    renderWithProviders(
      <Routes>
        <Route path="/servicos/novo" element={<NovoServicoPage />} />
        <Route path="/servicos/:id" element={<div>Detalhe stub</div>} />
      </Routes>,
      { routerProps: { initialEntries: ['/servicos/novo'] } },
    )
    await waitFor(() => expect(screen.getByLabelText(/^Nome/)).toBeInTheDocument())

    await user.type(screen.getByLabelText(/^Nome/), 'Diagnóstico elétrico')
    await user.clear(screen.getByLabelText(/Preço/))
    await user.type(screen.getByLabelText(/Preço/), '150')
    await user.click(screen.getByRole('button', { name: /cadastrar/i }))

    await waitFor(() => expect(tracker.foiCriado()).toBe(true))
  })
})
