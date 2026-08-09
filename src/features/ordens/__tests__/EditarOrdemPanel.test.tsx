import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { format } from 'date-fns'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { EditarOrdemPanel } from '../components/EditarOrdemPanel'

const API = 'http://localhost:5206'

function meHandler() {
  return http.get(`${API}/api/auth/me`, () =>
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
  )
}

beforeEach(() => server.resetHandlers())

describe('EditarOrdemPanel — quilometragem de entrada', () => {
  it('pré-preenche e reenvia a quilometragem de entrada ao salvar', async () => {
    let corpo: Record<string, unknown> | null = null
    server.use(
      meHandler(),
      http.get(`${API}/api/clientes/10/veiculos`, () => HttpResponse.json({ dados: [] })),
      http.put(`${API}/api/ordens/5`, async ({ request }) => {
        corpo = (await request.json()) as Record<string, unknown>
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()

    renderWithProviders(
      <EditarOrdemPanel
        ordemId={5}
        status={1}
        clienteId={10}
        veiculoId={null}
        quilometragemEntrada={45000}
        descricaoProblema="Motor falhando"
        observacoes={null}
      />,
    )

    const km = screen.getByLabelText(/Quilometragem de entrada/i)
    await waitFor(() => expect(km).toHaveValue(45000))

    await user.clear(km)
    await user.type(km, '46000')
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    await waitFor(() => expect(corpo).not.toBeNull())
    expect(corpo).toMatchObject({ id: 5, quilometragemEntrada: 46000, status: 1 })
  })
})

describe('EditarOrdemPanel — agendamento', () => {
  it('pré-preenche o toggle + datetime a partir de dataAgendamentoInicio (UTC → local)', async () => {
    const iso = new Date('2026-08-20T14:30').toISOString()
    server.use(
      meHandler(),
      http.get(`${API}/api/clientes/10/veiculos`, () => HttpResponse.json({ dados: [] })),
    )

    renderWithProviders(
      <EditarOrdemPanel
        ordemId={5}
        status={1}
        clienteId={10}
        veiculoId={null}
        quilometragemEntrada={null}
        descricaoProblema={null}
        observacoes={null}
        dataAgendamentoInicio={iso}
      />,
    )

    // Toggle ligado + input com o wall-clock local correspondente ao ISO.
    const toggle = screen.getByRole('switch', { name: /os agendada/i })
    await waitFor(() => expect(toggle).toBeChecked())
    const input = screen.getByLabelText(/data e hora do agendamento/i)
    expect(input).toHaveValue(format(new Date(iso), "yyyy-MM-dd'T'HH:mm"))
  })
})
