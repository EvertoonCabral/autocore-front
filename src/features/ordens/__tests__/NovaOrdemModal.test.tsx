import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { Routes, Route } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { NovaOrdemModal } from '../routes/NovaOrdemModal'

const API = 'http://localhost:5206'

function setup() {
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
        dados: [{ id: 10, nome: 'João Silva', telefone: '44999990000', ativo: true }],
        total: 1,
        pagina: 1,
        porPagina: 50,
      }),
    ),
    http.get(`${API}/api/clientes/10/veiculos`, () => HttpResponse.json({ dados: [] })),
    http.get(`${API}/api/clientes/10/resumo`, () =>
      HttpResponse.json({
        dados: {
          clienteId: 10,
          clienteNome: 'João Silva',
          saldoEmAberto: 350.5,
          osAbertas: 2,
          osConcluidasNaoPagas: 1,
          ultimas: [
            {
              id: 1,
              numero: 'OS-2026-0001',
              clienteId: 10,
              status: 1,
              abertaEm: '2026-08-01T10:00:00Z',
              totalGeral: 400,
              saldoDevedor: 200,
            },
          ],
        },
      }),
    ),
  )
}

beforeEach(() => server.resetHandlers())

function renderModal() {
  return renderWithProviders(
    <Routes>
      <Route path="/ordens" element={<div>Lista de ordens</div>} />
      <Route path="/ordens/nova" element={<NovaOrdemModal />} />
    </Routes>,
    { routerProps: { initialEntries: ['/ordens/nova'] } },
  )
}

describe('NovaOrdemModal', () => {
  it('mostra o card de saldo do cliente ao selecioná-lo', async () => {
    setup()
    const user = userEvent.setup()
    renderModal()

    // Antes de escolher, o card pede a seleção de um cliente.
    expect(screen.getByText(/selecione um cliente para ver o saldo/i)).toBeInTheDocument()

    // Seleciona o cliente (primeiro combobox).
    const clienteTrigger = screen.getAllByRole('combobox')[0]!
    await user.click(clienteTrigger)
    const opcao = await screen.findByRole('option', { name: /João Silva/i })
    await user.click(opcao)

    // O card de resumo aparece com o saldo em aberto e a última OS.
    await waitFor(() => expect(screen.getByText(/saldo em aberto/i)).toBeInTheDocument())
    expect(screen.getByText(/R\$\s*350,50/)).toBeInTheDocument()
    expect(screen.getByText(/2 OS aberta/i)).toBeInTheDocument()
    expect(screen.getByText('OS-2026-0001')).toBeInTheDocument()
  })
})
