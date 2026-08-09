import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen, waitFor, within } from '@/test/render'
import { server } from '@/test/msw/server'
import { QuadroOrdens } from '../components/QuadroOrdens'
import type { ListaOrdensServicoDto, OrdemServicoResumoDto } from '@/api/types'
import type { StatusOrdem } from '@/shared/enums/statusOrdem'

const API = 'http://localhost:5206'

function os(id: number, status: StatusOrdem, nome: string): OrdemServicoResumoDto {
  return {
    id,
    numero: `OS-2026-${String(id).padStart(4, '0')}`,
    clienteId: id,
    clienteNome: nome,
    status,
    abertaEm: '2026-08-01T10:00:00Z',
    totalGeral: 100,
    saldoDevedor: id === 1 ? 50 : 0,
    veiculoId: null,
    veiculoDescricao: null,
  }
}

function lista(dados: OrdemServicoResumoDto[]): ListaOrdensServicoDto {
  return {
    dados,
    total: dados.length,
    pagina: 1,
    porPagina: 50,
    somaTotalGeral: 0,
    somaSaldoDevedor: 0,
  }
}

/** Responde por status: 1→2 cards, 2→1 card, resto vazio. */
function mockPorStatus() {
  server.use(
    http.get(`${API}/api/ordens`, ({ request }) => {
      const status = new URL(request.url).searchParams.get('status')
      if (status === '1') return HttpResponse.json(lista([os(1, 1, 'João'), os(2, 1, 'Ana')]))
      if (status === '2') return HttpResponse.json(lista([os(3, 2, 'Maria')]))
      return HttpResponse.json(lista([]))
    }),
  )
}

beforeEach(() => server.resetHandlers())

describe('<QuadroOrdens>', () => {
  it('renderiza as 4 colunas com contagem e mensagens de vazio', async () => {
    mockPorStatus()
    renderWithProviders(<QuadroOrdens />)

    await waitFor(() => expect(screen.getByText('João')).toBeInTheDocument())

    const aberta = within(screen.getByRole('region', { name: /coluna aberta/i }))
    expect(aberta.getByText('João')).toBeInTheDocument()
    expect(aberta.getByText('Ana')).toBeInTheDocument()
    expect(aberta.getByText('2')).toBeInTheDocument() // contagem

    const andamento = within(screen.getByRole('region', { name: /coluna em andamento/i }))
    expect(andamento.getByText('Maria')).toBeInTheDocument()

    // Colunas vazias mostram mensagem específica, nunca "0".
    const aguardando = within(
      screen.getByRole('region', { name: /coluna aguardando produto/i }),
    )
    expect(aguardando.getByText(/nenhum veículo na bancada/i)).toBeInTheDocument()

    const concluida = within(screen.getByRole('region', { name: /coluna concluída/i }))
    expect(concluida.getByText(/nada concluído/i)).toBeInTheDocument()
  })

  it('limita a 3 cards e revela o resto com "Mostrar mais"', async () => {
    const muitas = Array.from({ length: 5 }, (_, i) => os(i + 1, 1, `Cliente ${i + 1}`))
    server.use(
      http.get(`${API}/api/ordens`, ({ request }) => {
        const status = new URL(request.url).searchParams.get('status')
        return HttpResponse.json(lista(status === '1' ? muitas : []))
      }),
    )
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderWithProviders(<QuadroOrdens />)

    await waitFor(() => expect(screen.getByText('Cliente 1')).toBeInTheDocument())

    const aberta = within(screen.getByRole('region', { name: /coluna aberta/i }))
    // Apenas 3 visíveis inicialmente.
    expect(aberta.getByText('Cliente 3')).toBeInTheDocument()
    expect(aberta.queryByText('Cliente 4')).not.toBeInTheDocument()

    await user.click(aberta.getByRole('button', { name: /mostrar mais 2/i }))
    expect(aberta.getByText('Cliente 4')).toBeInTheDocument()
    expect(aberta.getByText('Cliente 5')).toBeInTheDocument()
  })
})
