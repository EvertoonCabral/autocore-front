import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Routes, Route } from 'react-router-dom'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { VeiculoFormDrawer } from '../components/VeiculoFormDrawer'

const API = 'http://localhost:5206'

const clientes = [{ id: 5, nome: 'Maria Souza', telefone: '44999990000', ativo: true }]

function setup(onPost: (body: Record<string, unknown>) => Response | Promise<Response>) {
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
      HttpResponse.json({ dados: clientes, total: clientes.length, pagina: 1, porPagina: 50 }),
    ),
    http.get(`${API}/api/clientes/5/veiculos`, () => HttpResponse.json({ dados: [] })),
    http.post(`${API}/api/veiculos`, async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>
      return onPost(body)
    }),
  )
}

function renderCriar() {
  return renderWithProviders(
    <Routes>
      <Route path="/veiculos" element={<div>Lista de veículos</div>} />
      <Route path="/veiculos/novo" element={<VeiculoFormDrawer mode="criar" />} />
      <Route path="/veiculos/:id" element={<div>Detalhe stub</div>} />
    </Routes>,
    { routerProps: { initialEntries: ['/veiculos/novo'] } },
  )
}

describe('VeiculoFormDrawer — criar (fluxo de transferência 409)', () => {
  it('409 abre o diálogo, e ao confirmar reenvia com confirmarSubstituicao + motivo', async () => {
    const bodies: Record<string, unknown>[] = []
    setup((body) => {
      bodies.push(body)
      if (bodies.length === 1) {
        return HttpResponse.json(
          {
            erro: 'Placa já cadastrada para outro cliente.',
            conflito: { veiculoId: 42, placa: 'ABC1234', clienteId: 9, clienteNome: 'João Dono' },
          },
          { status: 409 },
        )
      }
      return HttpResponse.json({ dados: { id: 99 } }, { status: 201 })
    })

    const user = userEvent.setup()
    renderCriar()

    await user.type(screen.getByLabelText(/placa/i), 'abc1234')

    const clienteTrigger = screen.getAllByRole('combobox')[0]!
    await user.click(clienteTrigger)
    const opcaoCliente = await screen.findByRole('option', { name: /Maria Souza/i })
    await user.click(opcaoCliente)

    await user.click(screen.getByRole('button', { name: /cadastrar/i }))

    expect(await screen.findByText(/placa já cadastrada/i)).toBeInTheDocument()
    expect(screen.getByText(/João Dono/)).toBeInTheDocument()
    await waitFor(() => expect(bodies).toHaveLength(1))

    await user.type(screen.getByLabelText(/motivo/i), 'Veículo vendido')
    await user.click(screen.getByRole('button', { name: /confirmar transferência/i }))

    await waitFor(() => expect(bodies).toHaveLength(2))
    expect(bodies[1]).toMatchObject({
      placa: 'ABC1234',
      clienteId: 5,
      confirmarSubstituicao: true,
      motivoDesativacaoAnterior: 'Veículo vendido',
    })
  })
})
