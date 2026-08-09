import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { Routes, Route } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { ClientesListPage } from '../routes/ClientesListPage'
import { ClienteFormDrawer } from '../components/ClienteFormDrawer'

const API = 'http://localhost:5206'

function setup() {
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
    http.get(`${API}/api/clientes`, () =>
      HttpResponse.json({
        dados: [{ id: 7, nome: 'Cliente Existente', telefone: '44988887777', ativo: true }],
        total: 1,
        pagina: 1,
        porPagina: 20,
      }),
    ),
    http.post(`${API}/api/clientes`, async () => {
      criou = true
      return HttpResponse.json({ dados: { id: 55 } }, { status: 201 })
    }),
  )
  return { foiCriado: () => criou }
}

beforeEach(() => server.resetHandlers())

function renderNovo() {
  return renderWithProviders(
    <Routes>
      <Route path="/clientes" element={<ClientesListPage />}>
        <Route path="novo" element={<ClienteFormDrawer mode="criar" />} />
      </Route>
    </Routes>,
    { routerProps: { initialEntries: ['/clientes/novo'] } },
  )
}

describe('ClienteFormDrawer', () => {
  it('/clientes/novo mostra a lista atrás e o drawer aberto', async () => {
    setup()
    renderNovo()

    // Lista montada atrás (título da página + linha existente).
    await waitFor(() => expect(screen.getByText('Cliente Existente')).toBeInTheDocument())
    // Drawer aberto com o formulário.
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Nome/)).toBeInTheDocument()
  })

  it('submeter cria o cliente e fecha o drawer', async () => {
    const tracker = setup()
    const user = userEvent.setup()
    renderNovo()

    await waitFor(() => expect(screen.getByLabelText(/^Nome/)).toBeInTheDocument())

    await user.type(screen.getByLabelText(/^Nome/), 'João da Silva')
    await user.type(screen.getByLabelText(/Telefone/), '44999990000')
    await user.click(screen.getByRole('button', { name: /cadastrar/i }))

    await waitFor(() => expect(tracker.foiCriado()).toBe(true))
    // Drawer fechou: não há mais dialog na tela.
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
