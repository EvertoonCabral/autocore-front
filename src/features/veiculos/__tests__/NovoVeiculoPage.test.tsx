import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { NovoVeiculoPage } from '../routes/NovoVeiculoPage'

const API = 'http://localhost:5206'

const clientes = [
  { id: 5, nome: 'Maria Souza', telefone: '44999990000', ativo: true },
]

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
    // Veículos do cliente (habilita o VeiculoSelect quando o cliente é escolhido).
    http.get(`${API}/api/clientes/5/veiculos`, () => HttpResponse.json({ dados: [] })),
    http.post(`${API}/api/veiculos`, async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>
      return onPost(body)
    }),
  )
}

describe('NovoVeiculoPage — fluxo de transferência (HTTP 409)', () => {
  it('409 abre o diálogo, e ao confirmar reenvia com confirmarSubstituicao + motivo', async () => {
    const bodies: Record<string, unknown>[] = []
    setup((body) => {
      bodies.push(body)
      if (bodies.length === 1) {
        // Primeira tentativa: placa já cadastrada em outro cliente.
        return HttpResponse.json(
          {
            erro: 'Placa já cadastrada para outro cliente.',
            conflito: { veiculoId: 42, placa: 'ABC1234', clienteId: 9, clienteNome: 'João Dono' },
          },
          { status: 409 },
        )
      }
      // Segunda tentativa (confirmada): sucesso.
      return HttpResponse.json({ dados: { id: 99 } }, { status: 201 })
    })

    const user = userEvent.setup()
    renderWithProviders(<NovoVeiculoPage />, { routerProps: { initialEntries: ['/veiculos/novo'] } })

    // Placa
    await user.type(screen.getByLabelText(/placa/i), 'abc1234')

    // Seleciona o cliente (primeiro combobox).
    const clienteTrigger = screen.getAllByRole('combobox')[0]!
    await user.click(clienteTrigger)
    const opcaoCliente = await screen.findByRole('option', { name: /Maria Souza/i })
    await user.click(opcaoCliente)

    // Envia — dispara o 409.
    await user.click(screen.getByRole('button', { name: /cadastrar/i }))

    // Diálogo de transferência aparece com o dono atual.
    expect(await screen.findByText(/placa já cadastrada/i)).toBeInTheDocument()
    expect(screen.getByText(/João Dono/)).toBeInTheDocument()
    await waitFor(() => expect(bodies).toHaveLength(1))

    // Preenche o motivo (obrigatório) e confirma.
    await user.type(screen.getByLabelText(/motivo/i), 'Veículo vendido')
    await user.click(screen.getByRole('button', { name: /confirmar transferência/i }))

    // Reenvio com os campos de substituição.
    await waitFor(() => expect(bodies).toHaveLength(2))
    expect(bodies[1]).toMatchObject({
      placa: 'ABC1234',
      clienteId: 5,
      confirmarSubstituicao: true,
      motivoDesativacaoAnterior: 'Veículo vendido',
    })
  })
})
