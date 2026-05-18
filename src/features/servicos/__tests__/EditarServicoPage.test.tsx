import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { Routes, Route } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { EditarServicoPage } from '../routes/EditarServicoPage'

const API = 'http://localhost:5206'

const servico = {
  id: 9,
  nome: 'Alinhamento',
  descricao: 'Geometria de direção',
  preco: 80,
  ehMaoDeObraPadrao: false,
  ativo: true,
  criadoEm: '2026-05-01T10:00:00Z',
}

function setup(role: 'Admin' | 'Operador') {
  let atualizou = false
  let bodyEnviado: Record<string, unknown> | null = null
  server.use(
    http.get(`${API}/api/auth/me`, () =>
      HttpResponse.json({
        dados: {
          id: role === 'Admin' ? 1 : 2,
          nomeCompleto: role === 'Admin' ? 'Administrador' : 'Operador',
          email: role === 'Admin' ? 'admin@autocore.com' : 'op@autocore.com',
          role,
          ativo: true,
          podeVerAuditoria: false,
        },
      }),
    ),
    http.get(`${API}/api/servicos/9`, () => HttpResponse.json({ dados: servico })),
    http.put(`${API}/api/servicos/9`, async ({ request }) => {
      atualizou = true
      bodyEnviado = (await request.json()) as Record<string, unknown>
      return new HttpResponse(null, { status: 204 })
    }),
  )
  return {
    foiAtualizado: () => atualizou,
    getBody: () => bodyEnviado,
  }
}

beforeEach(() => server.resetHandlers())

describe('EditarServicoPage', () => {
  it('Admin carrega defaults via useObterServico', async () => {
    setup('Admin')
    renderWithProviders(
      <Routes>
        <Route path="/servicos/:id/editar" element={<EditarServicoPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/servicos/9/editar'] } },
    )
    await waitFor(() =>
      expect(screen.getByLabelText(/^Nome/)).toHaveValue('Alinhamento'),
    )
    expect(screen.getByLabelText(/Preço/)).toHaveValue(80)
  })

  it('Admin submete e dispara useAtualizarServico', async () => {
    const tracker = setup('Admin')
    const user = userEvent.setup()
    renderWithProviders(
      <Routes>
        <Route path="/servicos/:id/editar" element={<EditarServicoPage />} />
        <Route path="/servicos/:id" element={<div>Detalhe stub</div>} />
      </Routes>,
      { routerProps: { initialEntries: ['/servicos/9/editar'] } },
    )
    await waitFor(() =>
      expect(screen.getByLabelText(/^Nome/)).toHaveValue('Alinhamento'),
    )
    await user.clear(screen.getByLabelText(/^Nome/))
    await user.type(screen.getByLabelText(/^Nome/), 'Alinhamento + balanceamento')
    await user.click(screen.getByRole('button', { name: /salvar/i }))
    await waitFor(() => expect(tracker.foiAtualizado()).toBe(true))
  })

  it('Operador sem servicos.atualizarPreco vê campo Preço desabilitado', async () => {
    setup('Operador')
    renderWithProviders(
      <Routes>
        <Route path="/servicos/:id/editar" element={<EditarServicoPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/servicos/9/editar'] } },
    )
    await waitFor(() =>
      expect(screen.getByLabelText(/^Nome/)).toHaveValue('Alinhamento'),
    )
    expect(screen.getByLabelText(/Preço/)).toBeDisabled()
  })
})
