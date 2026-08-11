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

/** Alterna para a visão semanal (o padrão da página é mensal). */
async function irParaSemana(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('tab', { name: 'Semana' }))
}

beforeEach(() => server.resetHandlers())

describe('AgendaPage — visão semanal', () => {
  it('renderiza as OS agendadas nas colunas dos dias corretos', async () => {
    // Datas relativas à semana atual → caem na semana exibida.
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

    const user = userEvent.setup()
    renderWithProviders(<AgendaPage />)
    await irParaSemana(user)

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
    await irParaSemana(user)

    // Consulta usa a segunda-feira da semana atual.
    await waitFor(() => expect(capturado.de).toBe(format(inicio, 'yyyy-MM-dd')))

    await user.click(screen.getByRole('button', { name: /próxima semana/i }))

    await waitFor(() =>
      expect(capturado.de).toBe(format(addWeeks(inicio, 1), 'yyyy-MM-dd')),
    )
  })
})

describe('AgendaPage — visão mensal', () => {
  it('abre o painel lateral com as OS do dia ao clicar na célula', async () => {
    const hoje = new Date()
    const meio = new Date(hoje.getFullYear(), hoje.getMonth(), 15, 10, 0, 0)

    server.use(
      meHandler(),
      http.get(`${API}/api/ordens/agenda`, () =>
        HttpResponse.json({
          dados: [
            {
              id: 7,
              numero: 'OS-2026-0007',
              clienteId: 30,
              clienteNome: 'Carlos Dias',
              veiculoDescricao: 'Onix 2020',
              status: 1,
              dataAgendamentoInicio: meio.toISOString(),
            },
          ],
        }),
      ),
    )

    const user = userEvent.setup()
    renderWithProviders(<AgendaPage />)

    // Padrão é mensal; a OS aparece como chip na célula do dia 15.
    await screen.findByText('Carlos Dias')

    const labelDia = format(meio, "EEEE, d 'de' MMMM", { locale: ptBR })
    await user.click(screen.getByRole('button', { name: labelDia }))

    // Painel lateral (dialog) abre com o card completo.
    const painel = await screen.findByRole('dialog')
    expect(within(painel).getByText('Carlos Dias')).toBeInTheDocument()
    expect(within(painel).getByText('Onix 2020')).toBeInTheDocument()
  })

  it('o seletor de mês salta a consulta para outro mês', async () => {
    let capturado: { de: string | null } = { de: null }

    server.use(
      meHandler(),
      http.get(`${API}/api/ordens/agenda`, ({ request }) => {
        capturado = { de: new URL(request.url).searchParams.get('de') }
        return HttpResponse.json({ dados: [] })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<AgendaPage />)

    await waitFor(() => expect(capturado.de).not.toBeNull())

    // Seleciona Janeiro → a janela consultada passa a começar em dez/jan.
    await user.click(screen.getByRole('combobox', { name: 'Mês' }))
    await user.click(await screen.findByRole('option', { name: /janeiro/i }))

    await waitFor(() => expect(capturado.de).toMatch(/-(12|01)-/))
  })
})
