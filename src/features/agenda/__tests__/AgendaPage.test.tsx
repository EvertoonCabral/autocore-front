import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { addDays, addWeeks, format, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor, within } from '@/test/render'
import { server } from '@/test/msw/server'
import { AgendaPage } from '../routes/AgendaPage'

const API = 'http://localhost:5206'
const WEEK_OPTS = { weekStartsOn: 1 } as const

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

describe('AgendaPage', () => {
  it('renderiza as OS agendadas nas colunas dos dias corretos', async () => {
    // Datas relativas à semana atual → caem na semana exibida por padrão.
    const inicio = startOfWeek(new Date(), WEEK_OPTS)
    const segunda = new Date(inicio)
    segunda.setHours(9, 0, 0, 0)
    const quarta = addDays(inicio, 2)
    quarta.setHours(14, 30, 0, 0)

    server.use(
      meHandler(),
      http.get(`${API}/api/ordens/agenda`, () =>
        HttpResponse.json({
          dados: [
            {
              id: 1,
              numero: 'OS-2026-0001',
              clienteId: 10,
              clienteNome: 'João Silva',
              veiculoDescricao: 'Gol 2015',
              status: 1,
              dataAgendamentoInicio: segunda.toISOString(),
            },
            {
              id: 2,
              numero: 'OS-2026-0002',
              clienteId: 20,
              clienteNome: 'Maria Souza',
              veiculoDescricao: null,
              status: 2,
              dataAgendamentoInicio: quarta.toISOString(),
            },
          ],
        }),
      ),
    )

    renderWithProviders(<AgendaPage />)

    const labelSegunda = format(inicio, "EEEE, d 'de' MMMM", { locale: ptBR })
    const labelQuarta = format(addDays(inicio, 2), "EEEE, d 'de' MMMM", { locale: ptBR })

    // Espera a query resolver (cards substituem o skeleton).
    await screen.findByText('João Silva')

    // Cada OS aparece na coluna do seu dia com hora + cliente.
    const colSegunda = screen.getByLabelText(labelSegunda)
    expect(within(colSegunda).getByText('João Silva')).toBeInTheDocument()
    expect(within(colSegunda).getByText('09:00')).toBeInTheDocument()

    const colQuarta = screen.getByLabelText(labelQuarta)
    expect(within(colQuarta).getByText('Maria Souza')).toBeInTheDocument()
    expect(within(colQuarta).getByText('14:30')).toBeInTheDocument()
  })

  it('avança a semana e atualiza de/ate na consulta', async () => {
    const inicio = startOfWeek(new Date(), WEEK_OPTS)
    let capturado: { de: string | null; ate: string | null } = { de: null, ate: null }

    server.use(
      meHandler(),
      http.get(`${API}/api/ordens/agenda`, ({ request }) => {
        const url = new URL(request.url)
        capturado = { de: url.searchParams.get('de'), ate: url.searchParams.get('ate') }
        return HttpResponse.json({ dados: [] })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<AgendaPage />)

    // Consulta inicial usa a segunda-feira da semana atual.
    await waitFor(() => expect(capturado.de).toBe(format(inicio, 'yyyy-MM-dd')))

    await user.click(screen.getByRole('button', { name: /próxima semana/i }))

    await waitFor(() =>
      expect(capturado.de).toBe(format(addWeeks(inicio, 1), 'yyyy-MM-dd')),
    )
  })
})
